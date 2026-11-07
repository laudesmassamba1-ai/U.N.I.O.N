import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead, StatusStamp } from '../components/ui';
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
                  0{index + 1}
                </div>
                <div className="engagement__body">
                  <div className="engagement__header">
                    <p className="eyebrow">{item.lead}</p>
                    <StatusStamp label={`Responsable : ${item.responsible}`} tone="neutral" />
                  </div>
                  <h2>{item.name}</h2>

                  <div className="engagement__clauses">
                    <div className="engagement__clause engagement__clause--promise">
                      <h3>Ce que le mouvement promet</h3>
                      <p>{item.promise}</p>
                    </div>

                    <div className="engagement__clause engagement__clause--notyet">
                      <h3>Ce qu’il ne promet pas encore</h3>
                      <p>{item.notYet}</p>
                    </div>
                  </div>

                  <div className="engagement__action">
                    <Link to={item.href} className="text-link">
                      {item.action}
                    </Link>
                  </div>
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
              Lire la Charte complète
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
