import { PageHeader } from '../components/Layout';
import { Container, Section } from '../components/ui';
import { privacyPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Privacy() {
  useRouteTitle('Vie privée');
  return (
    <>
      <PageHeader
        eyebrow={privacyPage.eyebrow}
        title={privacyPage.title}
        intro={privacyPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Vie privée' }]}
      />
      <Section className="legal-page" motion="vie-privee">
        <Container>
          <div className="legal-sections">
            {privacyPage.sections.map((section) => (
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
