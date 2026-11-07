import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead, StatusStamp, StatusBadge } from '../components/ui';
import { VoteBar } from '../components/VoteBar';
import {
  departments,
  site,
  suggestionCategories,
  suggestionsPage,
} from '../content/fr';
import { formatDate } from '../lib/dates';
import { hashVoteToken, proofOfWork } from '../lib/crypto';
import {
  canSubmit,
  recordAttempt,
  statusTone,
  SUGGESTION_MAX,
  SUGGESTION_MIN,
} from '../lib/suggestions';
import {
  analyseSuggestion,
  moderationMessage,
} from '../lib/moderation';
import {
  addReport,
  dbStore,
  getVoterToken,
  readSuggestionAttempts,
  refreshSuggestionStatuses,
  setVoteState,
  writeSuggestionAttempts,
} from '../lib/store';
import { api } from '../lib/api';
import { useDatabase, useRouteTitle } from '../lib/hooks';
import type { Suggestion, VoteValue } from '../types';

const PUBLIC_STATUSES: Suggestion['status'][] = [
  'discussion',
  'retained',
  'adapted',
  'integrated',
  'expired',
];

const VOTABLE_STATUSES: Suggestion['status'][] = [
  'discussion',
  'retained',
  'adapted',
  'integrated',
];

const DRAFT_KEY = 'union.suggestion.draft.v1';

function readDraft(): { text: string; category: string; department: string } {
  if (typeof window === 'undefined') return { text: '', category: '', department: '' };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null') as Record<
      string,
      unknown
    > | null;
    return {
      text: typeof parsed?.text === 'string' ? parsed.text : '',
      category: typeof parsed?.category === 'string' ? parsed.category : '',
      department: typeof parsed?.department === 'string' ? parsed.department : '',
    };
  } catch {
    return { text: '', category: '', department: '' };
  }
}

function statusLabel(status: Suggestion['status']): string {
  return suggestionsPage.statusLabels[status];
}

function statusDescription(status: Suggestion['status']): string {
  return suggestionsPage.statusDescriptions[status];
}

export default function Suggestions() {
  useRouteTitle('Boîte à suggestions');
  const database = useDatabase();
  const [draft] = useState(readDraft);
  const [text, setText] = useState(draft.text);
  const [category, setCategory] = useState(draft.category);
  const [department, setDepartment] = useState(draft.department);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [received, setReceived] = useState(false);
  const [voterHash, setVoterHash] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const refreshed = useRef(false);
  const warmRequested = useRef(false);

  /* Le texte saisi reste sur cet appareil, même si le serveur est indisponible. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, category, department }));
    } catch {
      // Stockage plein : le texte reste à l’écran.
    }
  }, [text, category, department]);

  /* Réveil à l’intention : une seule fois, dès qu’une saisie réelle existe. */
  useEffect(() => {
    const trimmed = text.trim();
    if (warmRequested.current || trimmed.length < 40) return;
    warmRequested.current = true;
    let cancelled = false;
    proofOfWork(trimmed, 2).then((pow) => {
      if (!cancelled) void api.warm(trimmed, String(pow.nonce));
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  useEffect(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    dbStore.update((current) => refreshSuggestionStatuses(current));
  }, []);

  useEffect(() => {
    let alive = true;
    hashVoteToken(getVoterToken()).then((hash) => {
      if (alive) setVoterHash(hash);
    });
    return () => {
      alive = false;
    };
  }, []);

  const publicSuggestions = useMemo(
    () =>
      database.suggestions
        .filter((suggestion) => PUBLIC_STATUSES.includes(suggestion.status))
        .sort((a, b) => {
          const rank = (status: Suggestion['status']) =>
            status === 'integrated'
              ? 0
              : status === 'adapted'
                ? 1
                : status === 'retained'
                  ? 2
                  : status === 'discussion'
                    ? 3
                    : 4;
          const difference = rank(a.status) - rank(b.status);
          if (difference !== 0) return difference;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [database.suggestions],
  );

  const voteFor = async (suggestion: Suggestion, value: VoteValue) => {
    if (!voterHash || !VOTABLE_STATUSES.includes(suggestion.status)) return;
    setActionError('');
    setActionMessage('');
    try {
      const token = getVoterToken();
      const result = await api.submitVote(suggestion.id, value, token);
      dbStore.update((current) =>
        setVoteState(
          current,
          suggestion.id,
          voterHash,
          result.myVote,
          { useful: result.votesUseful, notUseful: result.votesNotUseful },
          result.status,
        ),
      );
      setActionMessage(suggestionsPage.voteRecorded);
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : 'Votre vote n’a pas été transmis. Réessayez.',
      );
    }
  };

  const hasVoted = (suggestion: Suggestion) =>
    database.votes.some(
      (vote) => vote.suggestionId === suggestion.id && vote.voterHash === voterHash,
    );

  const currentVote = (suggestion: Suggestion): VoteValue | null =>
    database.votes.find(
      (vote) => vote.suggestionId === suggestion.id && vote.voterHash === voterHash,
    )?.value ?? null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setReceived(false);
    const attempts = readSuggestionAttempts();
    const now = Date.now();
    if (!canSubmit(attempts, now)) {
      setError(suggestionsPage.rateLimit);
      return;
    }
    const duplicateTexts = database.suggestions
      .filter((suggestion) => suggestion.status !== 'archived')
      .map((suggestion) => suggestion.text);
    const result = analyseSuggestion({
      text,
      category,
      existingTexts: duplicateTexts,
    });
    if (!result.ok && result.code) {
      setError(moderationMessage(result.code));
      return;
    }
    setSubmitting(true);
    try {
      const pow = await proofOfWork(text.trim(), 2);
      let res;
      try {
        res = await api.submitSuggestion({
          text,
          category,
          department: department || null,
          proof: String(pow.nonce),
        });
      } catch (apiErr: any) {
        setError(apiErr.message || 'Impossible d’enregistrer la suggestion.');
        return;
      }
      writeSuggestionAttempts(recordAttempt(attempts, now));
      setText('');
      setCategory('');
      setDepartment('');
      setReceived(true);
      setActionMessage(res?.message || 'Suggestion reçue. Elle sera examinée par le bureau.');
    } catch {
      setError('Erreur lors du traitement de la suggestion.');
    } finally {
      setSubmitting(false);
    }
  };

  const report = async (suggestion: Suggestion) => {
    setActionError('');
    setActionMessage('');
    try {
      await api.submitReport(suggestion.id, 'Signalement depuis la page publique');
      dbStore.update((current) =>
        addReport(current, suggestion.id, 'Signalement depuis la page publique'),
      );
      setActionMessage('Signalement transmis au bureau.');
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : 'Le signalement n’a pas été transmis. Réessayez.',
      );
    }
  };

  const remaining = SUGGESTION_MAX - text.length;
  const validLength = text.trim().length >= SUGGESTION_MIN && text.length <= SUGGESTION_MAX;

  return (
    <>
      <PageHeader
        eyebrow={suggestionsPage.eyebrow}
        title={suggestionsPage.title}
        intro={suggestionsPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Boîte à suggestions' }]}
      >
        <p className="suggestion-intro-note">{suggestionsPage.voteIndicative}</p>
      </PageHeader>

      <Section className="suggestions" motion="suggestions">
        <Container>
          <div className="suggestion-layout">
            <div className={`suggestion-form${received ? ' is-received' : ''}`} data-reveal>
              <div className="suggestion-form__box">
                <h2>{suggestionsPage.formTitle}</h2>
                <p className="suggestion-form__help">{suggestionsPage.formHelp}</p>

                {received ? (
                  <div className="suggestion-received" role="status" aria-live="polite">
                    <StatusStamp label={suggestionsPage.received} tone="validated" />
                    <div>
                      <h3>{suggestionsPage.receivedTitle}</h3>
                      <p>{suggestionsPage.receivedText}</p>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setReceived(false)}
                      >
                        Déposer une autre suggestion
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate>
                    <div className="field">
                      <label htmlFor="suggestion-texte">{suggestionsPage.textLabel}</label>
                      <textarea
                        id="suggestion-texte"
                        name="suggestion"
                        value={text}
                        onChange={(event) => {
                          setText(event.target.value);
                          if (error) setError('');
                        }}
                        placeholder={suggestionsPage.textPlaceholder}
                        minLength={SUGGESTION_MIN}
                        maxLength={SUGGESTION_MAX}
                        rows={7}
                        aria-describedby="suggestion-compteur suggestion-erreur"
                        required
                      />
                      <p id="suggestion-compteur" className="field__counter">
                        {validLength ? `${text.trim().length} caractères` : `${remaining} caractères restants`}
                      </p>
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="suggestion-categorie">{suggestionsPage.categoryLabel}</label>
                        <select
                          id="suggestion-categorie"
                          value={category}
                          onChange={(event) => setCategory(event.target.value)}
                          required
                        >
                          <option value="">Choisir une catégorie</option>
                          {suggestionCategories.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="suggestion-departement">
                          {suggestionsPage.departmentLabel}
                        </label>
                        <select
                          id="suggestion-departement"
                          value={department}
                          onChange={(event) => setDepartment(event.target.value)}
                        >
                          <option value="">{suggestionsPage.departmentNone}</option>
                          {departments.map((item) => (
                            <option key={item.name} value={item.name}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div id="suggestion-erreur" aria-live="polite">
                      {error ? <p className="form-error">{error}</p> : null}
                    </div>

                    <button type="submit" className="button button--solid" disabled={submitting}>
                      {submitting ? suggestionsPage.submitting : suggestionsPage.submit}
                      <span className="arrow" aria-hidden="true">
                        →
                      </span>
                    </button>
                  </form>
                )}
              </div>
              <p className="note">{suggestionsPage.moderationNote}</p>
            </div>

            <aside className="suggestion-rules" data-reveal>
              <h2>{suggestionsPage.thresholdsTitle}</h2>
              <p>{suggestionsPage.thresholdsNote}</p>
              <ul>
                {suggestionsPage.thresholds.map((threshold) => (
                  <li key={threshold}>{threshold}</li>
                ))}
              </ul>
              <div className="privacy-note">
                <p className="eyebrow">Vie privée</p>
                <p>{site.privacyShort}</p>
              </div>
              <p className="note">{suggestionsPage.localNote}</p>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="suggestions-list band band--paper" motion="suggestions-liste">
        <Container>
          <SectionHead
            eyebrow="Les suggestions"
            title={suggestionsPage.listTitle}
            intro={suggestionsPage.voteIndicative}
          />
          <div aria-live="polite">
            {actionMessage ? <p className="note">{actionMessage}</p> : null}
          </div>
          <div aria-live="assertive">
            {actionError ? <p className="form-error">{actionError}</p> : null}
          </div>
          {publicSuggestions.length === 0 ? (
            <p className="empty-line">{suggestionsPage.emptyList}</p>
          ) : (
            <ul className="suggestion-items">
              {publicSuggestions.map((suggestion) => {
                const voted = hasVoted(suggestion);
                const vote = currentVote(suggestion);
                const votable = VOTABLE_STATUSES.includes(suggestion.status);
                return (
                  <li key={suggestion.id} className="suggestion-item" data-reveal>
                    <div className="suggestion-item__head">
                      <StatusStamp
                        label={statusLabel(suggestion.status)}
                        tone={statusTone(suggestion.status)}
                      />
                      <span className="suggestion-item__category">{suggestion.category}</span>
                      {suggestion.department ? (
                        <span className="suggestion-item__department">{suggestion.department}</span>
                      ) : null}
                      <time dateTime={suggestion.createdAt}>{formatDate(suggestion.createdAt)}</time>
                    </div>
                    <p className="suggestion-item__text">{suggestion.text}</p>
                    <p className="suggestion-item__status">{statusDescription(suggestion.status)}</p>

                    {suggestion.response ? (
                      <div className="suggestion-response">
                        <p className="eyebrow">Réponse du bureau</p>
                        <p>{suggestion.response.text}</p>
                        <time dateTime={suggestion.response.createdAt}>
                          {formatDate(suggestion.response.createdAt)}
                        </time>
                      </div>
                    ) : null}

                    <div className="suggestion-item__votes">
                      {votable ? (
                        <div className="vote-buttons" role="group" aria-label="Votre vote">
                          <button
                            type="button"
                            className={`vote-button vote-button--useful${vote === 'useful' ? ' is-active' : ''}`}
                            aria-pressed={vote === 'useful'}
                            onClick={() => voteFor(suggestion, 'useful')}
                          >
                            <span className="vote-button__icon" aria-hidden="true">
                              ↑
                            </span>
                            {suggestionsPage.voteUseful}
                          </button>
                          <button
                            type="button"
                            className={`vote-button vote-button--not-useful${vote === 'not_useful' ? ' is-active' : ''}`}
                            aria-pressed={vote === 'not_useful'}
                            onClick={() => voteFor(suggestion, 'not_useful')}
                          >
                            <span className="vote-button__icon" aria-hidden="true">
                              ↓
                            </span>
                            {suggestionsPage.voteNotUseful}
                          </button>
                        </div>
                      ) : (
                        <StatusBadge label={statusLabel(suggestion.status)} tone={statusTone(suggestion.status)} />
                      )}
                      <VoteBar
                        useful={suggestion.votesUseful}
                        notUseful={suggestion.votesNotUseful}
                        revealed={voted || !votable}
                      />
                    </div>

                    <div className="suggestion-item__footer">
                      <button type="button" className="text-link" onClick={() => report(suggestion)}>
                        Signaler
                      </button>
                      {voted ? <span>{suggestionsPage.alreadyVoted}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="suggestions-list__privacy">{suggestionsPage.localNote}</p>
          <p>
            <Link to="/vie-privee" className="text-link">
              Lire la page Vie privée
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
