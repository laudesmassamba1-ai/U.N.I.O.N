import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section } from '../components/ui';
import { notFoundPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function NotFound() {
  useRouteTitle('Page introuvable');
  return (
    <>
      <PageHeader
        eyebrow={notFoundPage.eyebrow}
        title={notFoundPage.title}
        intro={notFoundPage.text}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Page introuvable' }]}
      />
      <Section className="not-found" motion="introuvable">
        <Container>
          <p>
            <Link to="/" className="text-link">
              {notFoundPage.home}
            </Link>
            <span className="not-found__sep" aria-hidden="true">
              ·
            </span>
            <Link to="/journal" className="text-link">
              {notFoundPage.journal}
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
