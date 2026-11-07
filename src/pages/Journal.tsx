import { useMemo, useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, EmptyState, Section } from '../components/ui';
import { WhatsAppCardModal } from '../components/WhatsAppCardModal';
import { departments, journalPage, site } from '../content/fr';
import { editionLabel, groupEditions } from '../lib/articles';
import { useDatabase, useRouteTitle } from '../lib/hooks';

export default function Journal() {
  useRouteTitle(journalPage.title);
  const database = useDatabase();
  const editions = useMemo(() => groupEditions(database.articles), [database.articles]);
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [showWhatsAppCard, setShowWhatsAppCard] = useState(false);

  const allPublished = editions.flatMap((edition) => edition.articles);
  const categories = useMemo(() => {
    const set = new Set<string>(journalPage.categories);
    allPublished.forEach((article) => {
      if (article.category) set.add(article.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [allPublished]);

  const filtered = allPublished.filter((article) => {
    if (category && article.category !== category) return false;
    if (department && article.department !== department) return false;
    return true;
  });
  const filtering = Boolean(category || department);
  const latest = editions[0] ?? null;

  return (
    <>
      <PageHeader
        eyebrow={journalPage.eyebrow}
        title={journalPage.title}
        intro={journalPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Infos de la semaine au Congo' }]}
      >
        <div className="page-header__actions">
          {latest ? (
            <>
              <button
                type="button"
                className="button button--outline"
                onClick={() => window.print()}
              >
                Imprimer La Une (format A4)
                <span className="arrow" aria-hidden="true">
                  ↓
                </span>
              </button>
              <button
                type="button"
                className="button button--outline"
                onClick={() => setShowWhatsAppCard(true)}
              >
                Carte de l’édition (1080 × 1350)
                <span className="arrow" aria-hidden="true">
                  ↓
                </span>
              </button>
            </>
          ) : null}
        </div>
        <p className="journal-notice">{journalPage.notice}</p>
      </PageHeader>

      {editions.length === 0 ? (
        <Section className="journal-empty" motion="journal-vide">
          <Container>
            <EmptyState title={journalPage.empty} text={journalPage.emptyNote} />
            <div className="journal-empty__note" data-reveal>
              <p>
                Le journal est alimenté par le Studio du bureau. Quand un article est publié, il
                apparaît ici à la semaine correspondante.
              </p>
              <p>
                <Link to="/studio" className="text-link">
                  Ouvrir UNION Studio
                </Link>
              </p>
            </div>
          </Container>
        </Section>
      ) : (
        <Section className="journal" motion="journal">
          <Container>
            <div className="journal-toolbar" data-reveal>
              <div className="field">
                <label htmlFor="filtre-categorie">{journalPage.filters.category}</label>
                <select
                  id="filtre-categorie"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">{journalPage.filters.allCategories}</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="filtre-departement">{journalPage.filters.department}</label>
                <select
                  id="filtre-departement"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                >
                  <option value="">{journalPage.filters.allDepartments}</option>
                  {departments.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              {filtering ? (
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => {
                    setCategory('');
                    setDepartment('');
                  }}
                >
                  {journalPage.filters.reset}
                </button>
              ) : null}
            </div>

            {filtering ? (
              <>
                <p className="journal-count" aria-live="polite">
                  {filtered.length} article{filtered.length > 1 ? 's' : ''} correspondant aux
                  filtres.
                </p>
                <div className="journal-grid">
                  {filtered.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                {filtered.length === 0 ? (
                  <EmptyState
                    title="Aucun article ne correspond"
                    text="Modifiez les filtres ou effacez-les pour lire l’édition complète."
                  />
                ) : null}
              </>
            ) : latest ? (
              <>
                <header className="edition-head" data-reveal>
                  <p className="eyebrow">{journalPage.edition}</p>
                  <h2>{editionLabel(latest)}</h2>
                </header>

                <div className="journal-front">
                  {latest.featured ? (
                    <ArticleCard article={latest.featured} variant="lead" />
                  ) : null}
                  <div className="journal-front__side">
                    {latest.articles
                      .filter((article) => article.id !== latest.featured?.id)
                      .slice(0, 3)
                      .map((article) => (
                        <ArticleCard key={article.id} article={article} variant="list" />
                      ))}
                  </div>
                </div>

                {latest.articles.length > 4 ? (
                  <div className="journal-more" data-reveal>
                    <h3>Autres infos de la semaine</h3>
                    <ul>
                      {latest.articles.slice(4).map((article) => (
                        <li key={article.id}>
                          <Link to={`/journal/${article.slug}`}>{article.title}</Link>
                          <span>{article.category}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="journal-archive" data-reveal>
                  <h3>Archive par semaine</h3>
                  <ol>
                    {editions.map((edition) => (
                      <li key={edition.weekStart}>
                        <span>{editionLabel(edition)}</span>
                        <span>
                          {edition.articles.length} article
                          {edition.articles.length > 1 ? 's' : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : null}

            <div className="journal-correction" data-reveal>
              <h2>Politique de correction</h2>
              <p>{journalPage.correction}</p>
              <p>
                Une erreur signalée est corrigée dans l’article. La date de modification reste
                visible et l’historique des versions est conservé dans le Studio.
              </p>
            </div>
          </Container>

          {/* Printable A4 Une layout for neighborhood posting */}
          <div className="print-only a4-une">
            <header className="a4-une__masthead">
              <p className="a4-une__title">INFOS DE LA SEMAINE AU CONGO</p>
              <p className="a4-une__subtitle">
                U.N.I.O.N · {latest ? editionLabel(latest) : 'Édition spéciale'} · Format d’affichage public
              </p>
              <p className="a4-une__motto">« Un Congo uni travaille. Un Congo divisé mendie. »</p>
            </header>

            {latest?.featured ? (
              <article className="a4-une__lead">
                <h2>{latest.featured.title}</h2>
                <p className="a4-une__standfirst">{latest.featured.standfirst}</p>
              </article>
            ) : null}

            <div className="a4-une__grid">
              {latest?.articles
                .filter((a) => a.id !== latest.featured?.id)
                .slice(0, 4)
                .map((art) => (
                  <article key={art.id} className="a4-une__item">
                    <h3>{art.title}</h3>
                    <p>{art.standfirst}</p>
                  </article>
                ))}
            </div>

            <footer className="a4-une__footer">
              <p>Édition pour affichage de quartier et lecture collective · Mouvement U.N.I.O.N</p>
            </footer>
          </div>
        </Section>
      )}

      {showWhatsAppCard ? (
        <WhatsAppCardModal
          title={latest ? editionLabel(latest) : journalPage.title}
          standfirst={latest?.featured?.title || 'Édition hebdomadaire d’information au Congo.'}
          category="Journal"
          editionLabel={latest ? `Édition n°${latest.weekNumber}` : undefined}
          onClose={() => setShowWhatsAppCard(false)}
        />
      ) : null}
    </>
  );
}
