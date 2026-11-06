import { PageHeader } from '../components/Layout';
import { Container, Section } from '../components/ui';
import { legalPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Legal() {
  useRouteTitle('Mentions légales');
  return (
    <>
      <PageHeader
        eyebrow={legalPage.eyebrow}
        title={legalPage.title}
        intro={legalPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Mentions légales' }]}
      />
      <Section className="legal-page" motion="mentions">
        <Container>
          <div className="legal-sections">
            {legalPage.sections.map((section) => (
              <section key={section.title} data-reveal>
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
