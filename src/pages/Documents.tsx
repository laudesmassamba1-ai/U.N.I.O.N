import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section } from '../components/ui';
import { documentsPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Documents() {
  useRouteTitle('Documents');
  return (
    <>
      <PageHeader
        eyebrow={documentsPage.eyebrow}
        title={documentsPage.title}
        intro={documentsPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Documents' }]}
      />
      <Section className="documents" motion="documents">
        <Container>
          <ul className="document-list">
            {documentsPage.items.map((item) => (
              <li key={item.title} data-reveal>
                <div>
                  <h2>{item.title}</h2>
                  <p className="document-list__status">{item.status}</p>
                </div>
                {item.href && item.action ? (
                  <Link to={item.href} className="text-link">
                    {item.action}
                  </Link>
                ) : (
                  <span className="document-list__pending">À fournir</span>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
