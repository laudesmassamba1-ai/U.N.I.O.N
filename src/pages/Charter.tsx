import { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { PageHeader } from '../components/Layout';
import { ButtonLink, Container, Section, StatusStamp } from '../components/ui';
import { charter, site } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function CharterPage() {
  useRouteTitle('La Charte');
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) return;
      const current = Math.min(100, Math.max(0, Math.round((el.scrollTop / total) * 100)));
      setReadProgress(current);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const target = document.getElementById(`article-${e.key}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          target.focus({ preventScroll: true });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
          <ButtonLink variant="outline" onClick={() => window.print()}>
            Affiche de réunion (A3)
          </ButtonLink>
        </div>
      </PageHeader>

      <div className="charter-progress-bar" role="progressbar" aria-valuenow={readProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de lecture de la Charte">
        <div className="charter-progress-bar__fill" style={{ width: `${readProgress}%` }} />
      </div>

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
                  tabIndex={-1}
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

          {/* Printable A3 Poster Layout for Meetings */}
          <div className="print-only a3-poster">
            <header className="a3-poster__header">
              <Logo size={80} eager />
              <p className="a3-poster__title">CHARTE DE L’U.N.I.O.N</p>
              <p className="a3-poster__subtitle">{charter.subtitle}</p>
              <p className="a3-poster__motto">« {site.motto} »</p>
            </header>

            <div className="a3-poster__articles">
              {charter.articles.map((article) => (
                <div key={article.number} className="a3-poster__article">
                  <h2>Article {article.number} · {article.title}</h2>
                  {article.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              ))}
            </div>

            <footer className="a3-poster__footer">
              <p>Union Nationale pour l’Unité · Document officiel d’affichage en réunion</p>
            </footer>
          </div>

          <div className="print-only print-footer">
            <p>U.N.I.O.N, Union Nationale pour l’Unité</p>
            <p>{charter.subtitle}</p>
            <p>{site.motto}</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
