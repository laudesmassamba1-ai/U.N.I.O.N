import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead } from '../components/ui';
import { engagements } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Engagements() {
  useRouteTitle('Les engagements');
  return (
    <>
      <PageHeader
        eyebrow={engagements.eyebrow}
        title={engagements.title}
        intro={engagements.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Les engagements' }]}
      />

      <Section className="engagements" motion="engagements">
        <Container>
          <div className="engagements__list">
            {engagements.items.map((item, index) => (
              <article key={item.key} className="engagement" data-reveal>
                <div className="engagement__index" aria-hidden="true">
                  {index + 1}
                </div>
                <div className="engagement__body">
                  <p className="eyebrow">{item.lead}</p>
                  <h2>{item.name}</h2>
                  {item.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <Link to={item.href} className="text-link">
                    {item.action}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="engagements-note band band--paper" motion="engagements-note">
        <Container>
          <SectionHead
            eyebrow="Le cadre"
            title="La Charte fait foi"
            intro="Les engagements sont une mise en œuvre des quatre articles de la Charte. Le texte de la Charte reste le document de référence."
          />
          <p data-reveal>
            <Link to="/charte" className="text-link">
              Lire la Charte
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
