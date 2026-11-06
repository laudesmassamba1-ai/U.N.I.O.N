import { PageHeader } from '../components/Layout';
import { Container, Section } from '../components/ui';
import { faq } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Faq() {
  useRouteTitle('Questions fréquentes');
  return (
    <>
      <PageHeader
        eyebrow={faq.eyebrow}
        title={faq.title}
        intro={faq.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Questions fréquentes' }]}
      />
      <Section className="faq" motion="faq">
        <Container>
          <div className="faq__list">
            {faq.items.map((item) => (
              <details key={item.q} data-reveal>
                <summary>
                  <span>{item.q}</span>
                  <span className="faq__mark" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
