import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import {
  ButtonLink,
  Container,
  Section,
  SectionHead,
  StatusStamp,
  StatusBadge,
} from '../components/ui';
import { departments, site } from '../content/fr';
import { formatDate } from '../lib/dates';
import {
  canRegisterMember,
  createMemberRegistration,
  MEMBER_REGISTRATION_LIMIT,
  MEMBER_REGISTRATION_LIMIT_MS,
  recordRegistrationAttempt,
  sendMemberDossier,
} from '../lib/members';
import { dbStore, readSuggestionAttempts, writeSuggestionAttempts } from '../lib/store';
import { useDatabase, useRouteTitle } from '../lib/hooks';

export default function Adhesion() {
  useRouteTitle('Adhésion à l’U.N.I.O.N');
  const database = useDatabase();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fromLocal] = useState<{ attempts: number[] }>({ attempts: readSuggestionAttempts() });

  useEffect(() => {
    if (database.audit.length === 0) return;
    let alive = true;
    dbStore.update((current) =>
      current.audit.slice(0, 300),
    );
    return () => {
      alive = false;
    };
  }, [database.audit.length]);

  const registrations = useMemo(() => {
    return database.suggestions.filter((suggestion) => suggestion.status !== 'archived');
  }, [database.suggestions]);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setDone(false);
    const attempts = fromLocal.attempts;
    const now = Date.now();
    if (!canRegisterMember(attempts, now)) {
      setError(`Il faut attendre ${Math.ceil(MEMBER_REGISTRATION_LIMIT_MS / (60 * 60 * 1000))} heure(s) entre deux dossiers.`);
      return;
    }
    if (!text.trim()) {
      setError('Veuillez écrire le contenu de votre dossier.');
      return;
    }
    if (!category) {
      setError('Veuillez choisir une catégorie.');
      return;
    }
    setSubmitting(true);
    try {
      const created = createMemberRegistration({
        text,
        category,
        department: department || null,
      });
      dbStore.update((current) =>
        created.registration
          ? { ...current, suggestions: [created.registration, ...current.suggestions] }
          : current,
      );
      writeSuggestionAttempts(recordRegistrationAttempt(attempts, now));
      setText('');
      setCategory('');
      setDepartment('');
      setDone(true);
      const sent = sendMemberDossier(created.registration);
      if (!sent.sent) {
        setError('Impossible d’envoyer le dossier. Veuillez contacter le bureau directement.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>(['Lutte contre le tribalisme', 'Jeunesse et emploi', 'Éducation et formation', 'Départements et services', 'Transparence et justice']);
    registrations.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [registrations]);

  const t = (label: string): string => {
    switch (label) {
      case 'pending':
        return 'En attente de validation';
      case 'discussion':
        return 'En discussion';
      case 'retained':
        return 'Retenue';
      case 'adapted':
        return 'Adaptée';
      case 'integrated':
        return 'Intégrée';
      case 'archived':
        return 'Archivée';
      case 'expired':
        return 'Expirée';
      default:
        return label;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Adhésion"
        title="Devenir membre de l’U.N.I.O.N"
        intro="Le groupe WhatsApp est le canal principal. Les dossiers sont transmis au bureau par e-mail."
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Adhésion' }]}
      />

      <Section className="join" motion="adhesion">
        <Container>
          <div className="join__grid">
            <div className="join__primary" data-reveal>
              <h2>Formulaire de dossier</h2>
              <p>
                Rédigez un dossier pour rejoindre le mouvement. Il sera envoyé à l’Union et à Kichub, puis validé par le bureau.
              </p>
              {site.whatsappUrl ? (
                <ButtonLink href={site.whatsappUrl} external>
                  Rejoindre le groupe WhatsApp
                </ButtonLink>
              ) : (
                <p className="note">Le lien d’invitation sera publié après validation par le bureau.</p>
              )}
              <p className="note">
                Conseil au bureau : activez l’approbation des nouveaux participants dans WhatsApp pour limiter le spam.
              </p>
              {error ? <p className="form-error">{error}</p> : null}
            </div>

            <div className="join__secondary" data-reveal>
              <h2>Vos données</h2>
              <p className="note">
                Le site ne demande aucun nom, aucun e-mail, aucun numéro. Le dossier est transmis aux adresses
                conservées dans l’environnement du site.
              </p>
              <p>
                <Link to="/vie-privee" className="text-link">
                  Lire la page Vie privée
                </Link>
              </p>

              <h2>Dossiers déjà reçus</h2>
              {registrations.length === 0 ? (
                <p className="note">Aucun dossier reçu pour l’instant.</p>
              ) : (
                <ul className="suggestion-items">
                  {registrations.map((item) => (
                    <li key={item.id} className="suggestion-item" data-reveal>
                      <div className="suggestion-item__head">
                        <StatusStamp label={t(item.status)} tone="attention" />
                        <span className="suggestion-item__category">{item.category}</span>
                        {item.department ? (
                          <span className="suggestion-item__department">{item.department}</span>
                        ) : null}
                        <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                      </div>
                      <p className="suggestion-item__text">{item.text}</p>
                      <p className="suggestion-item__status">{t(item.status)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="suggestions" motion="adhesion-formulaire">
        <Container>
          <div className="suggestion-layout">
            <div className={`suggestion-form${done ? ' is-received' : ''}`} data-reveal>
              <div className="suggestion-form__box">
                {done ? (
                  <div className="suggestion-received" role="status" aria-live="polite">
                    <StatusStamp label="Dossier envoyé" tone="validated" />
                    <div>
                      <h3>Dossier transmis</h3>
                      <p>
                        Votre dossier a été envoyé. Il sera traité par le bureau. Il vous sera bonni
                        lorsque le bureau validera votre adhésion.
                      </p>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setDone(false)}
                      >
                        Envoyer un nouveau dossier
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={register} noValidate>
                    <div className="field">
                      <label htmlFor="adhesion-texte">Votre dossier</label>
                      <textarea
                        id="adhesion-texte"
                        name="adhesion"
                        value={text}
                        onChange={(event) => {
                          setText(event.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Décrivez ce que vous souhaitez apporter au mouvement. 20 caractères minimum."
                        minLength={20}
                        maxLength={600}
                        rows={7}
                        aria-describedby="adhesion-compteur adhesion-erreur"
                        required
                      />
                      <p id="adhesion-compteur" className="field__counter">
                        {text.trim().length >= 20 ? `${text.trim().length} caractères` : `${20 - text.trim().length} caractères restants`}
                      </p>
                    </div>

                    <div className="field">
                      <label htmlFor="adhesion-categorie">Catégorie</label>
                      <select
                        id="adhesion-categorie"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        required
                      >
                        <option value="">Choisir une catégorie</option>
                        {['Lutte contre le tribalisme', 'Jeunesse et emploi', 'Éducation et formation', 'Départements et services', 'Transparence et justice'].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="adhesion-departement">Département (facultatif)</label>
                      <select
                        id="adhesion-departement"
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                      >
                        <option value="">Ne pas préciser</option>
                        {departments.map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div id="adhesion-erreur" aria-live="polite">
                      {error ? <p className="form-error">{error}</p> : null}
                    </div>

                    <button
                      type="submit"
                      className="button button--solid"
                      disabled={submitting}
                    >
                      {submitting ? 'Envoi en cours' : 'Envoyer le dossier'}
                    </button>
                  </form>
                )}
              </div>
              <p className="note">
                Le dossier sera envoyé à l’Union et à Kichub. Les modifications du site public ne
                sont visibles par les autres que lorsque le bureau publie une édition.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
