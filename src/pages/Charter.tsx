import { PageHeader } from '../components/Layout';
import { ButtonLink, Container, Section, StatusStamp } from '../components/ui';
import { charter } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function CharterPage() {
  useRouteTitle('La Charte');
  return (
    <>
      <PageHeader
        eyebrow={charter.eyebrow}
        title={charter.title}
        intro={charter.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'La Charte' }]}
      >
        <div className="page-header__actions">
          <StatusStamp label="Projet soumis à validation" tone="attention" />
          <ButtonLink variant="outline" onClick={() => window.print()}>
            {charter.printLabel}
          </ButtonLink>
        </div>
      </PageHeader>

      <Section className="charter" motion="charte">
        <Container>
          <div className="charter__layout">
            <nav className="charter__rail" aria-label="Articles de la Charte">
              <ol>
                {charter.articles.map((article) => (
                  <li key={article.number}>
                    <a href={`#article-${article.number}`}>
                      <span>Article {article.number}</span>
                      <span>{article.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="charter__articles">
              {charter.articles.map((article) => (
                <article
                  key={article.number}
                  id={`article-${article.number}`}
                  className="charter-article"
                  data-reveal
                >
                  <div className="charter-article__halves" aria-hidden="true">
                    <span />
                    <span />
                  </div>
                  <p className="charter-article__number">Article {article.number}</p>
                  <h2>{article.title}</h2>
                  {article.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              ))}
            </div>
          </div>

          <div className="print-only print-footer">
            <p>U.N.I.O.N, Union Nationale pour l’Unité</p>
            <p>{charter.subtitle}</p>
            <p>Un Congo uni travaille. Un Congo divisé mendie.</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
