import { useEffect, useState } from 'react';
import { ArticleBody } from '../components/ArticleBody';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, NatureBadge, Section } from '../components/ui';
import { WhatsAppCardModal } from '../components/WhatsAppCardModal';
import { articleNatures, journalPage, site } from '../content/fr';
import { findArticle } from '../lib/articles';
import { formatDate, formatDateTime } from '../lib/dates';
import { useDatabase, useRouteTitle } from '../lib/hooks';
import NotFound from './NotFound';

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function ArticlePage({ slug }: { slug: string }) {
  const database = useDatabase();
  const article = findArticle(database.articles, slug);
  useRouteTitle(article?.title ?? 'Article introuvable');

  const [showWhatsAppCard, setShowWhatsAppCard] = useState(false);

  useEffect(() => {
    if (!article) return;
    const description = article.standfirst || site.motto;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', article.title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'article');
    if (article.leadImage?.src) {
      upsertMeta('property', 'og:image', new URL(article.leadImage.src, window.location.origin).href);
    }
    upsertMeta('property', 'article:published_time', article.publishedAt ?? '');
    upsertMeta('property', 'article:modified_time', article.updatedAt);
  }, [article]);

  if (!article) return <NotFound />;

  const nature =
    articleNatures.find((item) => item.value === article.nature)?.label ?? journalPage.natureLabels.info;
  const published = article.publishedAt ? formatDate(article.publishedAt) : '';
  const modifiedAt = new Date(article.updatedAt).getTime();
  const publishedAt = article.publishedAt ? new Date(article.publishedAt).getTime() : 0;
  const modified = article.publishedAt && modifiedAt - publishedAt > 60 * 1000;

  const share = () => {
    const shareUrl = `${window.location.origin}/p/${encodeURIComponent(slug)}`;
    const text = `${article.title}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const cacheOffline = () => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.active?.postMessage({ type: 'CACHE_EDITION', url: window.location.href });
      })
      .catch(() => {
        // The offline copy is optional.
      });
  };

  return (
    <>
      <PageHeader
        eyebrow={journalPage.title}
        title={article.title}
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Le journal', href: '/journal' },
          { label: article.title },
        ]}
      >
        <div className="article-meta">
          <NatureBadge label={nature} />
          {article.category ? <span>{article.category}</span> : null}
          {article.department ? <span>{article.department}</span> : null}
          {published ? (
            <span>
              {journalPage.published}{' '}
              <time dateTime={article.publishedAt ?? undefined}>{published}</time>
            </span>
          ) : null}
          {modified ? <span>{`${journalPage.modified} ${formatDateTime(article.updatedAt)}`}</span> : null}
        </div>
        <p className="article-meta__editor">{journalPage.editor}</p>
        {article.standfirst ? <p className="article-standfirst">{article.standfirst}</p> : null}
        <div className="article-actions">
          <button type="button" className="button button--outline" onClick={share}>
            {journalPage.share}
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </button>
          <button
            type="button"
            className="button button--outline"
            onClick={() => setShowWhatsAppCard(true)}
          >
            Carte statut WhatsApp (1080 × 1350)
            <span className="arrow" aria-hidden="true">
              ↓
            </span>
          </button>
          <button type="button" className="button button--quiet" onClick={cacheOffline}>
            Garder cette page hors ligne
          </button>
        </div>
      </PageHeader>

      <Section className="article" motion="article">
        <Container>
          <div className="article__layout">
            <article className="article__main">
              {article.leadImage ? (
                <figure className="article__lead-image" data-reveal>
                  <img
                    src={article.leadImage.src}
                    alt={article.leadImage.alt}
                    loading="eager"
                    decoding="async"
                  />
                  <figcaption>
                    <span>{article.leadImage.caption}</span>
                    {article.leadImage.credit ? (
                      <span className="credit">Crédit : {article.leadImage.credit}</span>
                    ) : null}
                  </figcaption>
                </figure>
              ) : null}

              <ArticleBody blocks={article.body} />

              {article.sources.length > 0 ? (
                <section className="article__sources" aria-labelledby="sources-titre">
                  <h2 id="sources-titre">{journalPage.sources}</h2>
                  <ul>
                    {article.sources.map((source) => (
                      <li key={source}>{source}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <footer className="article__footer">
                <p>{journalPage.editor}</p>
                <p>{journalPage.correction}</p>
                <p>
                  <Link to="/journal" className="text-link">
                    Revenir au journal
                  </Link>
                </p>
              </footer>
            </article>

            <aside className="article__aside" aria-label="À propos de cet article">
              <p className="eyebrow">Le journal</p>
              <p>{journalPage.notice}</p>
              <p className="note">
                Le journal est alimenté par UNION Studio. Chaque article publié apparaît dans
                l’édition de sa semaine.
              </p>
            </aside>
          </div>
        </Container>
      </Section>

      {showWhatsAppCard ? (
        <WhatsAppCardModal
          title={article.title}
          standfirst={article.standfirst}
          category={article.category}
          date={published}
          onClose={() => setShowWhatsAppCard(false)}
        />
      ) : null}
    </>
  );
}
