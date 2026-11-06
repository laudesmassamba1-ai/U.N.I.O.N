import { PageHeader } from '../components/Layout';
import { Container, Section } from '../components/ui';
import { accessibilityPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Accessibility() {
  useRouteTitle('Accessibilité');
  return (
    <>
      <PageHeader
        eyebrow={accessibilityPage.eyebrow}
        title={accessibilityPage.title}
        intro={accessibilityPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Accessibilité' }]}
      />
      <Section className="legal-page" motion="accessibilite">
        <Container>
          <div className="legal-sections">
            {accessibilityPage.sections.map((section) => (
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
