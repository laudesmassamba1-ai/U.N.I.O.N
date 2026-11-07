import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArticleBody } from '../components/ArticleBody';
import { Link } from '../components/Link';
import { Logo } from '../components/Logo';
import { StatusBadge, StatusStamp } from '../components/ui';
import {
  articleNatures,
  departments,
  journalPage,
  studioContent,
} from '../content/fr';
import { editionLabel } from '../lib/articles';
import type { EditionDocument } from '../lib/edition';
import {
  buildPublicEdition,
  downloadEdition,
  EDITION_PATH,
  serialiseEdition,
} from '../lib/edition';
import { formatDate, formatDateTime, nowIso, weekBounds } from '../lib/dates';
import { createId, uniqueSlug } from '../lib/id';
import { statusTone } from '../lib/suggestions';
import {
  articleFromDraft,
  dbStore,
  getStudioSession,
  refreshSuggestionStatuses,
  setStudioSession,
} from '../lib/store';
import { api } from '../lib/api';
import type { StudioUser } from '../lib/api';
import { useDatabase, useRouteTitle } from '../lib/hooks';
import type {
  Article,
  ArticleBlock,
  Suggestion,
  SuggestionSettings,
} from '../types';

type StudioTab = 'journal' | 'moderation' | 'settings' | 'edition';

function errorText(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'L’opération a échoué. Réessayez.';
}

function storeServerArticle(article: Article): void {
  const current = dbStore.getSnapshot();
  const exists = current.articles.some((item) => item.id === article.id);
  dbStore.replace({
    ...current,
    articles: exists
      ? current.articles.map((item) => (item.id === article.id ? article : item))
      : [article, ...current.articles],
  });
}

async function refreshStudioFromServer(): Promise<void> {
  const [articles, suggestions, settings, audit] = await Promise.all([
    api.studioGetArticles(),
    api.studioGetSuggestions(),
    api.studioGetSettings(),
    api.studioGetAudit(),
  ]);
  dbStore.replace({
    ...dbStore.getSnapshot(),
    articles: articles.articles,
    suggestions: suggestions.suggestions,
    settings: settings.settings,
    audit: audit.audit,
  });
}

function makeBlock(type: ArticleBlock['type']): ArticleBlock {
  const id = createId('block');
  switch (type) {
    case 'paragraph':
      return { id, type, text: '' };
    case 'heading':
      return { id, type, text: '' };
    case 'quote':
      return { id, type, text: '', attribution: '' };
    case 'list':
      return { id, type, items: [''] };
    case 'image':
      return { id, type, src: '', alt: '', caption: '', credit: '' };
    case 'separator':
      return { id, type };
  }
}

function StudioGate({ onOpen }: { onOpen: (user: StudioUser) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api.studioLogin(code.trim());
      setStudioSession(true);
      onOpen(result.user);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="studio-gate">
      <div className="studio-gate__panel">
        <Logo size={92} eager />
        <p className="eyebrow">{studioContent.title}</p>
        <h1>{studioContent.gateTitle}</h1>
        <p>{studioContent.gateText}</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="studio-code">{studioContent.codeLabel}</label>
            <input
              id="studio-code"
              type="password"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                if (error) setError('');
              }}
              autoComplete="current-password"
              required
            />
          </div>
          <div aria-live="polite">{error ? <p className="form-error">{error}</p> : null}</div>
          <button type="submit" className="button button--solid" disabled={busy}>
            {busy ? 'Vérification…' : studioContent.enter}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        </form>
        <p className="note">
          L’accès est vérifié par le serveur. La session est signée, limitée à deux heures et
          conservée dans un cookie HttpOnly.
        </p>
        <p>
          <Link to="/" className="text-link">
            Retour au site public
          </Link>
        </p>
      </div>
    </div>
  );
}

function StudioBar({ onLogout, user }: { onLogout: () => void; user: StudioUser | null }) {
  return (
    <header className="studio-bar">
      <Link to="/studio" className="studio-bar__brand">
        <Logo size={44} />
        <span>
          <strong>{studioContent.title}</strong>
          <small>{user ? `${studioContent.subtitle} · ${user.username}` : studioContent.subtitle}</small>
        </span>
      </Link>
      <div className="studio-bar__actions">
        <Link to="/" className="text-link">
          Retour au site
        </Link>
        <button type="button" className="button button--quiet" onClick={onLogout}>
          {studioContent.logout}
        </button>
      </div>
    </header>
  );
}

async function resizeImage(file: File): Promise<string> {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error(studioContent.imageTooLarge);
  }
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(studioContent.imageTooLarge);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const webp = canvas.toDataURL('image/webp', 0.82);
  if (webp.startsWith('data:image/webp')) return webp;
  return canvas.toDataURL('image/jpeg', 0.84);
}

function ImageField({
  value,
  alt,
  caption,
  credit,
  onChange,
  label,
}: {
  value: string;
  alt: string;
  caption: string;
  credit: string;
  onChange: (next: { src?: string; alt?: string; caption?: string; credit?: string }) => void;
  label: string;
}) {
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const src = await resizeImage(file);
      onChange({ src });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : studioContent.imageTooLarge);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="image-field">
      <p className="field__label">{label}</p>
      {value ? (
        <img src={value} alt={alt || 'Aperçu'} className="image-field__preview" />
      ) : null}
      <div className="field">
        <label>
          Adresse de l’image
          <input
            value={value.startsWith('data:') ? '' : value}
            onChange={(event) => {
              const src = event.target.value;
              if (!src) {
                onChange({ src: '', alt: '', caption: '', credit: '' });
                return;
              }
              onChange({ src });
            }}
            placeholder="/assets/photo.jpg"
          />
        </label>
      </div>
      {value.startsWith('data:') ? (
        <p className="note">
          Image intégrée au fichier JSON. Pour alléger l’édition, utilisez une adresse.
        </p>
      ) : null}
      <div className="image-field__row">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={upload}
          aria-label={studioContent.upload}
        />
        {value ? (
          <button
            type="button"
            className="button button--quiet"
            onClick={() => onChange({ src: '', alt: '', caption: '', credit: '' })}
          >
            Retirer l’image
          </button>
        ) : null}
      </div>
      <p className="note">{studioContent.uploadNote}</p>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="field-row">
        <div className="field">
          <label>
            Texte alternatif
            <input value={alt} onChange={(event) => onChange({ alt: event.target.value })} required />
          </label>
        </div>
        <div className="field">
          <label>
            Crédit
            <input
              value={credit}
              onChange={(event) => onChange({ credit: event.target.value })}
              required
            />
          </label>
        </div>
      </div>
      <div className="field">
        <label>
          Légende
          <input
            value={caption}
            onChange={(event) => onChange({ caption: event.target.value })}
            required
          />
        </label>
      </div>
    </div>
  );
}

function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}) {
  const patch = (id: string, value: Record<string, unknown>) => {
    onChange(
      blocks.map((block) =>
        block.id === id ? ({ ...block, ...value } as ArticleBlock) : block,
      ),
    );
  };
  const remove = (id: string) => onChange(blocks.filter((block) => block.id !== id));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChange(copy);
  };
  const add = (type: ArticleBlock['type']) => onChange([...blocks, makeBlock(type)]);

  return (
    <div className="block-editor">
      <div className="block-editor__add">
        <button type="button" onClick={() => add('paragraph')}>{studioContent.blocks.addParagraph}</button>
        <button type="button" onClick={() => add('heading')}>{studioContent.blocks.addHeading}</button>
        <button type="button" onClick={() => add('quote')}>{studioContent.blocks.addQuote}</button>
        <button type="button" onClick={() => add('list')}>{studioContent.blocks.addList}</button>
        <button type="button" onClick={() => add('image')}>{studioContent.blocks.addImage}</button>
        <button type="button" onClick={() => add('separator')}>{studioContent.blocks.addSeparator}</button>
      </div>

      {blocks.length === 0 ? (
        <p className="empty-line">Le corps de l’article est vide.</p>
      ) : null}

      {blocks.map((block, index) => (
        <div key={block.id} className="block-editor__block">
          <div className="block-editor__head">
            <span>{studioContent.blocks[block.type]}</span>
            <div>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>
                {studioContent.blocks.up}
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === blocks.length - 1}
              >
                {studioContent.blocks.down}
              </button>
              <button type="button" onClick={() => remove(block.id)}>
                {studioContent.blocks.remove}
              </button>
            </div>
          </div>

          {block.type === 'paragraph' || block.type === 'heading' ? (
            <textarea
              value={block.text}
              onChange={(event) => patch(block.id, { text: event.target.value })}
              rows={block.type === 'heading' ? 2 : 5}
              aria-label={
                block.type === 'heading'
                  ? studioContent.blocks.heading
                  : studioContent.blocks.paragraph
              }
            />
          ) : null}

          {block.type === 'quote' ? (
            <>
              <textarea
                value={block.text}
                onChange={(event) => patch(block.id, { text: event.target.value })}
                rows={4}
                aria-label={studioContent.blocks.quote}
              />
              <input
                value={block.attribution ?? ''}
                onChange={(event) => patch(block.id, { attribution: event.target.value })}
                placeholder="Attribution (facultatif)"
              />
            </>
          ) : null}

          {block.type === 'list' ? (
            <textarea
              value={block.items.join('\n')}
              onChange={(event) => patch(block.id, { items: event.target.value.split('\n') })}
              rows={5}
              placeholder={studioContent.blocks.listPlaceholder}
              aria-label={studioContent.blocks.list}
            />
          ) : null}

          {block.type === 'image' ? (
            <ImageField
              value={block.src}
              alt={block.alt}
              caption={block.caption}
              credit={block.credit}
              label={studioContent.blocks.image}
              onChange={(next) => patch(block.id, next)}
            />
          ) : null}

          {block.type === 'separator' ? <hr className="rule" /> : null}
        </div>
      ))}
    </div>
  );
}

function ArticlePreview({ article }: { article: Article }) {
  return (
    <div className="article-preview">
      <p className="eyebrow">{article.category || 'Sans catégorie'}</p>
      <h1>{article.title || 'Sans titre'}</h1>
      {article.standfirst ? <p className="article-standfirst">{article.standfirst}</p> : null}
      {article.leadImage ? (
        <figure>
          <img src={article.leadImage.src} alt={article.leadImage.alt} />
          <figcaption>
            <span>{article.leadImage.caption}</span>
            <span className="credit">Crédit : {article.leadImage.credit}</span>
          </figcaption>
        </figure>
      ) : null}
      <ArticleBody blocks={article.body} />
      {article.sources.length > 0 ? (
        <section className="article__sources">
          <h2>{journalPage.sources}</h2>
          <ul>
            {article.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ArticleEditor({ article, onClose }: { article: Article; onClose: () => void }) {
  const database = useDatabase();
  const [draft, setDraft] = useState<Article>(article);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(article.updatedAt);
  const [errors, setErrors] = useState<string[]>([]);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sourcesText, setSourcesText] = useState(article.sources.join('\n'));

  useEffect(() => {
    setDraft(article);
    setSourcesText(article.sources.join('\n'));
    setDirty(false);
    setSavedAt(article.updatedAt);
    setErrors([]);
    setSyncError('');
  }, [article.id]);

  const update = (patch: Partial<Article>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(async () => {
      const next = {
        ...draft,
        sources: sourcesText.split('\n').filter(Boolean),
      };
      setSyncing(true);
      try {
        const result = await api.studioSaveArticle({ ...next, recordRevision: false });
        const saved = result.article ?? next;
        storeServerArticle(saved);
        setSavedAt(saved.updatedAt);
        setSyncError('');
        if (JSON.stringify(draftRef.current) === JSON.stringify(next)) setDirty(false);
      } catch (reason) {
        setSyncError(errorText(reason));
      } finally {
        setSyncing(false);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, sourcesText]);

  const validate = (): string[] => {
    const problems: string[] = [];
    if (!draft.title.trim()) problems.push('Le titre est obligatoire.');
    if (!draft.standfirst.trim()) problems.push('Le chapô est obligatoire.');
    if (!draft.category) problems.push('La catégorie est obligatoire.');
    if (draft.body.length === 0) problems.push('Le corps de l’article est vide.');
    if (draft.leadImage) {
      if (!draft.leadImage.alt.trim()) problems.push('Le texte alternatif de l’image de une est obligatoire.');
      if (!draft.leadImage.caption.trim()) problems.push('La légende de l’image de une est obligatoire.');
      if (!draft.leadImage.credit.trim()) problems.push('Le crédit de l’image de une est obligatoire.');
    }
    draft.body.forEach((block) => {
      if (block.type === 'image') {
        if (!block.alt.trim()) problems.push('Une image du corps n’a pas de texte alternatif.');
        if (!block.caption.trim()) problems.push('Une image du corps n’a pas de légende.');
        if (!block.credit.trim()) problems.push('Une image du corps n’a pas de crédit.');
      }
      if (
        (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote') &&
        !block.text.trim()
      ) {
        problems.push('Un bloc de texte est vide.');
      }
    });
    return Array.from(new Set(problems));
  };

  const persist = async (next: Article, summary: string): Promise<Article> => {
    setSyncing(true);
    setSyncError('');
    try {
      const result = await api.studioSaveArticle({ ...next, revisionSummary: summary });
      const saved = result.article ?? next;
      storeServerArticle(saved);
      setDraft(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      return saved;
    } catch (reason) {
      const message = errorText(reason);
      setSyncError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  };

  const saveManual = async () => {
    const next = { ...draft, sources: sourcesText.split('\n').filter(Boolean) };
    try {
      await persist(next, 'Brouillon sauvegardé');
      setErrors([]);
    } catch {
      // Message déjà affiché.
    }
  };

  const publish = async () => {
    const problems = validate();
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    const slug = draft.slug || uniqueSlug(draft.title, database.articles.map((item) => item.slug));
    const bounds = draft.weekStart ? null : weekBounds();
    const next: Article = {
      ...draft,
      slug,
      status: 'published',
      sources: sourcesText.split('\n').filter(Boolean),
      weekNumber: draft.weekNumber || bounds?.weekNumber || weekBounds().weekNumber,
      weekStart: draft.weekStart || bounds?.weekStart || weekBounds().weekStart,
      weekEnd: draft.weekEnd || bounds?.weekEnd || weekBounds().weekEnd,
      publishedAt: draft.publishedAt ?? nowIso(),
      archivedAt: null,
      deletedAt: null,
    };
    try {
      await persist(next, next.status === 'published' ? 'Publication' : 'Mise à jour');
      setErrors([]);
    } catch (reason) {
      setErrors([errorText(reason)]);
    }
  };

  const unpublish = async () => {
    try {
      await persist({ ...draft, status: 'draft', archivedAt: null, deletedAt: null }, 'Dépublication');
    } catch {
      // Message déjà affiché.
    }
  };

  const archive = async () => {
    if (!window.confirm('Archiver cet article ?')) return;
    try {
      await persist(
        { ...draft, status: 'archived', archivedAt: nowIso(), deletedAt: null },
        'Archivage',
      );
      onClose();
    } catch {
      // Message déjà affiché.
    }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer cet article ? La suppression est douce et réversible.')) return;
    try {
      await persist(
        { ...draft, status: 'archived', archivedAt: draft.archivedAt ?? nowIso(), deletedAt: nowIso() },
        'Suppression douce',
      );
      await refreshStudioFromServer();
      onClose();
    } catch {
      // Message déjà affiché.
    }
  };

  const restore = async () => {
    try {
      await persist(
        { ...draft, status: 'draft', archivedAt: null, deletedAt: null },
        'Restauration',
      );
    } catch {
      // Message déjà affiché.
    }
  };

  const restoreRevision = async (revisionId: string) => {
    const revision = draft.revisions.find((item) => item.id === revisionId);
    if (!revision) return;
    if (!window.confirm('Revenir à cette version ? La version actuelle sera conservée dans l’historique.')) {
      return;
    }
    const next: Article = {
      ...draft,
      title: revision.title,
      standfirst: revision.standfirst,
      body: revision.body,
      leadImage: revision.leadImage,
      sources: revision.sources,
    };
    try {
      const saved = await persist(next, 'Version restaurée');
      setSourcesText(saved.sources.join('\n'));
    } catch {
      // Message déjà affiché.
    }
  };

  return (
    <div className="editor">
      <div className="editor__head">
        <div>
          <p className="eyebrow">{studioContent.tabs.journal}</p>
          <h1>{draft.title || studioContent.newArticle}</h1>
          <p className={`note${syncError ? ' form-error' : ''}`} role={syncError ? 'alert' : undefined}>
            {syncError
              ? syncError
              : syncing
                ? 'Synchronisation avec le serveur…'
                : dirty
                  ? 'Modifications en attente.'
                  : savedAt
                    ? `${studioContent.autoSaved} ${formatDateTime(savedAt)}`
                    : ''}
          </p>
        </div>
        <div className="editor__head-actions">
          <button type="button" className="button button--quiet" onClick={onClose}>
            {studioContent.close}
          </button>
          <button type="button" className="button button--outline" onClick={saveManual} disabled={syncing}>
            {studioContent.save}
          </button>
          <button type="button" className="button button--solid" onClick={publish} disabled={syncing}>
            {draft.status === 'published' ? 'Mettre à jour' : studioContent.saveAndPublish}
          </button>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="editor__errors" role="alert">
          <p>Publication impossible :</p>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="editor__layout">
        <div className="editor__form">
          <div className="field">
            <label htmlFor="article-titre">{studioContent.articleFields.title}</label>
            <input
              id="article-titre"
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="article-chapo">{studioContent.articleFields.standfirst}</label>
            <textarea
              id="article-chapo"
              value={draft.standfirst}
              onChange={(event) => update({ standfirst: event.target.value })}
              rows={3}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="article-categorie">{studioContent.articleFields.category}</label>
              <select
                id="article-categorie"
                value={draft.category}
                onChange={(event) => update({ category: event.target.value })}
              >
                <option value="">Choisir</option>
                {journalPage.categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="article-departement">{studioContent.articleFields.department}</label>
              <select
                id="article-departement"
                value={draft.department ?? ''}
                onChange={(event) => update({ department: event.target.value || null })}
              >
                <option value="">Aucun</option>
                {departments.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="article-nature">{studioContent.articleFields.nature}</label>
              <select
                id="article-nature"
                value={draft.nature}
                onChange={(event) => update({ nature: event.target.value as Article['nature'] })}
              >
                {articleNatures.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ImageField
            label={studioContent.articleFields.leadImage}
            value={draft.leadImage?.src ?? ''}
            alt={draft.leadImage?.alt ?? ''}
            caption={draft.leadImage?.caption ?? ''}
            credit={draft.leadImage?.credit ?? ''}
            onChange={(next) => {
              const src = next.src ?? draft.leadImage?.src ?? '';
              if (!src) {
                update({ leadImage: null });
                return;
              }
              update({
                leadImage: {
                  src,
                  alt: next.alt ?? draft.leadImage?.alt ?? '',
                  caption: next.caption ?? draft.leadImage?.caption ?? '',
                  credit: next.credit ?? draft.leadImage?.credit ?? '',
                },
              });
            }}
          />

          <div className="field">
            <p className="field__label">{studioContent.articleFields.body}</p>
            <BlockEditor blocks={draft.body} onChange={(body) => update({ body })} />
          </div>

          <div className="field">
            <label htmlFor="article-sources">{studioContent.articleFields.sources}</label>
            <textarea
              id="article-sources"
              value={sourcesText}
              onChange={(event) => {
                setSourcesText(event.target.value);
                setDirty(true);
              }}
              rows={3}
              placeholder="Une source par ligne"
            />
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => update({ featured: event.target.checked })}
            />
            <span>{studioContent.articleFields.featured}</span>
          </label>

          <div className="editor__status-actions">
            {draft.status === 'published' ? (
              <button type="button" className="button button--quiet" onClick={unpublish}>
                {studioContent.unpublish}
              </button>
            ) : null}
            {draft.status !== 'archived' && !draft.deletedAt ? (
              <button type="button" className="button button--quiet" onClick={archive}>
                {studioContent.archive}
              </button>
            ) : null}
            {draft.deletedAt ? (
              <button type="button" className="button button--quiet" onClick={restore}>
                {studioContent.restore}
              </button>
            ) : (
              <button type="button" className="button button--quiet" onClick={remove}>
                {studioContent.delete}
              </button>
            )}
            {draft.status === 'published' && draft.slug ? (
              <Link to={`/journal/${draft.slug}`} className="text-link">
                Voir sur le site public
              </Link>
            ) : null}
          </div>

          <div className="editor__revisions">
            <h2>{studioContent.revisions}</h2>
            {draft.revisions.length === 0 ? (
              <p className="note">Aucune version antérieure.</p>
            ) : (
              <ul>
                {draft.revisions.map((revision) => (
                  <li key={revision.id}>
                    <span>{`${studioContent.revisionAt} ${formatDateTime(revision.savedAt)}`}</span>
                    <span>{revision.title || 'Sans titre'}</span>
                    <button type="button" className="text-link" onClick={() => restoreRevision(revision.id)}>
                      {studioContent.restoreRevision}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={`editor__preview${showPreview ? ' is-open' : ''}`}>
          <div className="editor__preview-head">
            <h2>{studioContent.preview}</h2>
            <button type="button" className="text-link" onClick={() => setShowPreview((value) => !value)}>
              {showPreview ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {showPreview ? <ArticlePreview article={draft} /> : null}
        </div>
      </div>
    </div>
  );
}

function ArticlesPanel() {
  const database = useDatabase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const editing = database.articles.find((article) => article.id === editingId) ?? null;
  const articles = [...database.articles].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (editing) {
    return <ArticleEditor article={editing} onClose={() => setEditingId(null)} />;
  }

  const create = async () => {
    setError('');
    setCreating(true);
    const draft = articleFromDraft();
    try {
      const result = await api.studioSaveArticle(draft);
      const saved = result.article ?? draft;
      storeServerArticle(saved);
      setEditingId(saved.id);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="studio-panel">
      <div className="studio-panel__head">
        <div>
          <p className="eyebrow">{studioContent.tabs.journal}</p>
          <h1>Articles</h1>
        </div>
        <button type="button" className="button button--solid" onClick={create} disabled={creating}>
          {creating ? 'Création…' : studioContent.newArticle}
          <span className="arrow" aria-hidden="true">
            +
          </span>
        </button>
      </div>
      <div aria-live="assertive">{error ? <p className="form-error">{error}</p> : null}</div>

      {articles.length === 0 ? (
        <p className="empty-line">{studioContent.emptyArticles}</p>
      ) : (
        <ul className="studio-articles">
          {articles.map((article) => (
            <li key={article.id} className="studio-article">
              <div>
                <div className="studio-article__meta">
                  <StatusBadge
                    label={studioContent.status[article.status]}
                    tone={article.status === 'published' ? 'validated' : article.status === 'archived' ? 'closed' : 'attention'}
                  />
                  {article.deletedAt ? <StatusBadge label="Supprimé" tone="closed" /> : null}
                  {article.featured ? <StatusBadge label="Une" tone="validated" /> : null}
                  <span>{article.category || 'Sans catégorie'}</span>
                  <span>{formatDate(article.updatedAt)}</span>
                </div>
                <h2>{article.title || 'Sans titre'}</h2>
                <p className="note">
                  {article.weekStart
                    ? editionLabel({
                        weekNumber: article.weekNumber,
                        weekStart: article.weekStart,
                        weekEnd: article.weekEnd,
                      })
                    : 'Pas encore affecté à une semaine'}
                </p>
              </div>
              <div className="studio-article__actions">
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => setEditingId(article.id)}
                >
                  {studioContent.edit}
                </button>
                {article.status === 'published' && article.slug ? (
                  <Link to={`/journal/${article.slug}`} className="text-link">
                    Voir
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResponseForm({ suggestion }: { suggestion: Suggestion }) {
  const [text, setText] = useState(suggestion.response?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    setSaved('');
    try {
      await api.studioModerateSuggestion(suggestion.id, 'response', { response: text });
      await refreshStudioFromServer();
      setSaved('Réponse publiée sur la page publique.');
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="response-form" onSubmit={submit}>
      <label htmlFor={`response-${suggestion.id}`}>{studioContent.moderation.response}</label>
      <textarea
        id={`response-${suggestion.id}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder={studioContent.moderation.responsePlaceholder}
      />
      <button type="submit" className="button button--outline" disabled={busy}>
        {busy ? 'Publication…' : studioContent.moderation.saveResponse}
      </button>
      <div aria-live="polite">{saved ? <p className="note">{saved}</p> : null}</div>
      <div aria-live="assertive">{error ? <p className="form-error">{error}</p> : null}</div>
    </form>
  );
}

function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await refreshStudioFromServer();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };

  const approve = () =>
    run(() => api.studioModerateSuggestion(suggestion.id, 'approve'));
  const hide = () => {
    if (!window.confirm('Masquer cette suggestion de la liste publique ?')) return;
    return run(() => api.studioModerateSuggestion(suggestion.id, 'archive'));
  };
  const restore = () =>
    run(() => api.studioModerateSuggestion(suggestion.id, 'status', { status: 'discussion' }));
  const mark = (status: Suggestion['status']) =>
    run(() => api.studioModerateSuggestion(suggestion.id, 'status', { status }));
  const merge = () => {
    const target = window.prompt(studioContent.moderation.mergePrompt);
    if (!target || target === suggestion.id) return;
    return run(() =>
      api.studioModerateSuggestion(suggestion.id, 'merge', { duplicateOf: target }),
    );
  };

  return (
    <li className="moderation-item">
      <div className="moderation-item__head">
        <StatusStamp
          label={
            suggestion.status === 'pending'
              ? studioContent.moderation.pending
              : suggestion.status === 'archived'
                ? studioContent.moderation.archived
                : 'Publiée'
          }
          tone={statusTone(suggestion.status)}
        />
        <span>{suggestion.category}</span>
        {suggestion.department ? <span>{suggestion.department}</span> : null}
        <time dateTime={suggestion.createdAt}>
          {`${studioContent.moderation.created} ${formatDate(suggestion.createdAt)}`}
        </time>
      </div>
      <p className="moderation-item__text">{suggestion.text}</p>
      <div className="moderation-item__stats">
        <span>{`${studioContent.moderation.upvotes} : ${suggestion.votesUseful}`}</span>
        <span>{`${studioContent.moderation.downvotes} : ${suggestion.votesNotUseful}`}</span>
        <span>{`${studioContent.moderation.reports} : ${suggestion.reportCount}`}</span>
        <span>{suggestion.status}</span>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="moderation-item__actions">
        {suggestion.status === 'pending' ? (
          <button type="button" className="button button--solid" onClick={approve} disabled={busy}>
            {studioContent.moderation.approve}
          </button>
        ) : null}
        {suggestion.status !== 'archived' ? (
          <button type="button" className="button button--quiet" onClick={hide} disabled={busy}>
            {studioContent.moderation.hide}
          </button>
        ) : (
          <button type="button" className="button button--quiet" onClick={restore} disabled={busy}>
            {studioContent.moderation.restore}
          </button>
        )}
        {suggestion.status === 'retained' || suggestion.status === 'discussion' ? (
          <>
            <button type="button" className="button button--quiet" onClick={() => mark('adapted')} disabled={busy}>
              {studioContent.moderation.setAdapted}
            </button>
            <button type="button" className="button button--quiet" onClick={() => mark('integrated')} disabled={busy}>
              {studioContent.moderation.setIntegrated}
            </button>
            <button type="button" className="button button--quiet" onClick={merge} disabled={busy}>
              {studioContent.moderation.merge}
            </button>
          </>
        ) : null}
        {suggestion.status === 'adapted' ? (
          <button type="button" className="button button--quiet" onClick={() => mark('integrated')} disabled={busy}>
            {studioContent.moderation.setIntegrated}
          </button>
        ) : null}
      </div>

      <ResponseForm suggestion={suggestion} />
    </li>
  );
}

function ModerationPanel() {
  const database = useDatabase();
  const [tab, setTab] = useState<'pending' | 'published' | 'archived'>('pending');
  const pending = database.suggestions.filter((suggestion) => suggestion.status === 'pending');
  const archived = database.suggestions.filter((suggestion) => suggestion.status === 'archived');
  const published = database.suggestions.filter((suggestion) =>
    ['discussion', 'retained', 'adapted', 'integrated', 'expired'].includes(suggestion.status),
  );
  const list = tab === 'pending' ? pending : tab === 'archived' ? archived : published;

  return (
    <div className="studio-panel">
      <div className="studio-panel__head">
        <div>
          <p className="eyebrow">{studioContent.tabs.moderation}</p>
          <h1>{studioContent.moderation.title}</h1>
        </div>
      </div>
      <p className="note">{studioContent.moderation.retentionNote}</p>
      <div className="studio-subtabs" role="tablist" aria-label="Files de modération">
        {(
          [
            ['pending', studioContent.moderation.pending, pending.length],
            ['published', studioContent.moderation.published, published.length],
            ['archived', studioContent.moderation.archived, archived.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-active' : ''}
            onClick={() => setTab(key)}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="empty-line">{studioContent.moderation.noItems}</p>
      ) : (
        <ul className="moderation-list">
          {list.map((suggestion) => (
            <SuggestionRow key={suggestion.id} suggestion={suggestion} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SettingsPanel() {
  const database = useDatabase();
  const [settings, setSettings] = useState<SuggestionSettings>(database.settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setSettings(database.settings);
  }, [database.settings]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    const next: SuggestionSettings = {
      retainedVotes: Number(settings.retainedVotes),
      retainedShare: Number(settings.retainedShare),
      archivedVotes: Number(settings.archivedVotes),
      archivedShare: Number(settings.archivedShare),
      expiryDays: Number(settings.expiryDays),
      retentionDays: Number(settings.retentionDays),
    };
    try {
      await api.studioSaveSettings(next);
      await refreshStudioFromServer();
      dbStore.update((current) => refreshSuggestionStatuses(current));
      setMessage(studioContent.settings.saved);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="studio-panel">
      <div className="studio-panel__head">
        <div>
          <p className="eyebrow">{studioContent.tabs.settings}</p>
          <h1>{studioContent.settings.title}</h1>
        </div>
      </div>
      <form className="settings-form" onSubmit={save}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="retained-votes">{studioContent.settings.retainedVotes}</label>
            <input
              id="retained-votes"
              type="number"
              min={1}
              value={settings.retainedVotes}
              onChange={(event) => setSettings({ ...settings, retainedVotes: Number(event.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="retained-share">{studioContent.settings.retainedShare}</label>
            <input
              id="retained-share"
              type="number"
              min={1}
              max={100}
              value={settings.retainedShare}
              onChange={(event) => setSettings({ ...settings, retainedShare: Number(event.target.value) })}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="archived-votes">{studioContent.settings.archivedVotes}</label>
            <input
              id="archived-votes"
              type="number"
              min={1}
              value={settings.archivedVotes}
              onChange={(event) => setSettings({ ...settings, archivedVotes: Number(event.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="archived-share">{studioContent.settings.archivedShare}</label>
            <input
              id="archived-share"
              type="number"
              min={1}
              max={100}
              value={settings.archivedShare}
              onChange={(event) => setSettings({ ...settings, archivedShare: Number(event.target.value) })}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="expiry-days">{studioContent.settings.expiryDays}</label>
            <input
              id="expiry-days"
              type="number"
              min={1}
              value={settings.expiryDays}
              onChange={(event) => setSettings({ ...settings, expiryDays: Number(event.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="retention-days">{studioContent.settings.retentionDays}</label>
            <input
              id="retention-days"
              type="number"
              min={1}
              value={settings.retentionDays}
              onChange={(event) => setSettings({ ...settings, retentionDays: Number(event.target.value) })}
            />
          </div>
        </div>
        <button type="submit" className="button button--solid" disabled={busy}>
          {studioContent.settings.save}
        </button>
        <div aria-live="polite">{message ? <p className="note">{message}</p> : null}</div>
        <div aria-live="assertive">{error ? <p className="form-error">{error}</p> : null}</div>
      </form>

      <div className="privacy-note">
        <p className="eyebrow">{studioContent.privacy.title}</p>
        {studioContent.privacy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="audit-log">
        <h2>Journal d’audit</h2>
        {database.audit.length === 0 ? (
          <p className="note">Aucune action consignée.</p>
        ) : (
          <ol>
            {database.audit.slice(0, 30).map((entry) => (
              <li key={entry.id}>
                <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                <span>{entry.action}</span>
                <span>{entry.target}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function EditionPanel() {
  const database = useDatabase();
  const [backup, setBackup] = useState<EditionDocument | null>(null);
  const [backupError, setBackupError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const publicEdition = useMemo(() => buildPublicEdition(database), [database]);
  const publicSize = useMemo(
    () => new Blob([serialiseEdition(publicEdition)]).size,
    [publicEdition],
  );
  const backupSize = useMemo(
    () => (backup ? new Blob([serialiseEdition(backup)]).size : 0),
    [backup],
  );

  useEffect(() => {
    let cancelled = false;
    api.studioGetBackup()
      .then((document) => {
        if (cancelled) return;
        setBackup(document);
        setBackupError('');
      })
      .catch((reason) => {
        if (cancelled) return;
        setBackupError(errorText(reason));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const download = (document: EditionDocument, label: string) => {
    downloadEdition(document);
    setError('');
    setMessage(`${label} : ${studioContent.edition.downloadDone}`);
  };

  return (
    <div className="studio-panel">
      <div className="studio-panel__head">
        <div>
          <p className="eyebrow">{studioContent.tabs.edition}</p>
          <h1>{studioContent.edition.title}</h1>
        </div>
      </div>
      <p className="note">{studioContent.edition.intro}</p>
      <ol className="edition-steps">
        {studioContent.edition.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="edition-grid">
        <section className="edition-card">
          <h2>{studioContent.edition.publicTitle}</h2>
          <p>{studioContent.edition.publicText}</p>
          <p className="note">{formatBytes(publicSize)}</p>
          <button
            type="button"
            className="button button--solid"
            onClick={() => download(publicEdition, studioContent.edition.downloadPublic)}
          >
            {studioContent.edition.downloadPublic}
          </button>
        </section>
        <section className="edition-card">
          <h2>{studioContent.edition.backupTitle}</h2>
          <p>{studioContent.edition.backupText}</p>
          <p className="note">
            {backup ? formatBytes(backupSize) : studioContent.edition.backupLoading}
          </p>
          <button
            type="button"
            className="button button--outline"
            onClick={() => backup && download(backup, studioContent.edition.downloadBackup)}
            disabled={!backup}
          >
            {studioContent.edition.downloadBackup}
          </button>
          {backupError ? <p className="form-error">{backupError}</p> : null}
        </section>
      </div>

      <div className="edition-status">
        {backup ? (
          <p>{`${studioContent.edition.backupRevision} : ${backup.revision} · ${formatDateTime(backup.updatedAt)}`}</p>
        ) : null}
        <p>
          {studioContent.edition.path} : <code>{EDITION_PATH}</code>
        </p>
      </div>

      <div aria-live="polite">
        {message ? <p className="edition-message">{message}</p> : null}
      </div>
      <div aria-live="assertive">
        {error ? <p className="form-error">{error}</p> : null}
      </div>

      <div className="privacy-note">
        <p>{studioContent.edition.warning}</p>
        <p>{studioContent.edition.localOnly}</p>
      </div>
    </div>
  );
}

export default function Studio() {
  useRouteTitle(studioContent.title);
  const [open, setOpen] = useState(() => getStudioSession());
  const [user, setUser] = useState<StudioUser | null>(null);
  const [checking, setChecking] = useState(() => getStudioSession());
  const [tab, setTab] = useState<StudioTab>('journal');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setChecking(true);
    api.studioGetMe()
      .then((result) => {
        if (!alive) return;
        setUser(result.user);
        return refreshStudioFromServer();
      })
      .catch(() => {
        if (!alive) return;
        setStudioSession(false);
        setUser(null);
        setOpen(false);
      })
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    dbStore.update((current) => refreshSuggestionStatuses(current));
  }, [open]);

  if (!open) {
    return (
      <StudioGate
        onOpen={(nextUser) => {
          setUser(nextUser);
          setOpen(true);
        }}
      />
    );
  }

  if (checking && !user) {
    return <p className="loading">Vérification de la session.</p>;
  }

  const logout = async () => {
    try {
      await api.studioLogout();
    } catch {
      // La session locale est fermée même si le serveur est indisponible.
    }
    setStudioSession(false);
    setUser(null);
    setOpen(false);
  };

  return (
    <div className="studio">
      <StudioBar onLogout={logout} user={user} />
      <div className="studio-tabs" role="tablist" aria-label="Sections du Studio">
        {(
          [
            ['journal', studioContent.tabs.journal],
            ['moderation', studioContent.tabs.moderation],
            ['settings', studioContent.tabs.settings],
            ['edition', studioContent.tabs.edition],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <main className="studio-main">
        {tab === 'journal' ? <ArticlesPanel /> : null}
        {tab === 'moderation' ? <ModerationPanel /> : null}
        {tab === 'settings' ? <SettingsPanel /> : null}
        {tab === 'edition' ? <EditionPanel /> : null}
      </main>
    </div>
  );
}
