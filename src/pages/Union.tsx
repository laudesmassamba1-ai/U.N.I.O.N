import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead, StatusStamp } from '../components/ui';
import { unionPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Union() {
  useRouteTitle('L’U.N.I.O.N');
  return (
    <>
      <PageHeader
        eyebrow={unionPage.eyebrow}
        title={unionPage.title}
        intro={unionPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'L’U.N.I.O.N' }]}
      >
        <StatusStamp label="Mouvement en cours de constitution" tone="attention" />
      </PageHeader>

      <Section className="sigle" motion="sigle">
        <Container>
          <SectionHead eyebrow="Le nom" title={unionPage.sigleTitle} />
          <div className="sigle__grid" data-reveal>
            {unionPage.sigle.map((item) => (
              <div key={item.letter} className="sigle__item">
                <span className="sigle__letter">{item.letter}</span>
                <span className="sigle__word">{item.word}</span>
              </div>
            ))}
          </div>
          <p className="note" data-reveal>
            {unionPage.sigleNote}
          </p>
        </Container>
      </Section>

      <Section className="two-columns" motion="but">
        <Container>
          <div className="two-columns__grid">
            <div data-reveal>
              <p className="eyebrow">Notre but</p>
              <h2>{unionPage.butTitle}</h2>
              <p className="lead">{unionPage.butText}</p>
            </div>
            <div data-reveal>
              <p className="eyebrow">Un mot précis</p>
              <h2>{unionPage.tribalismeTitle}</h2>
              <p className="lead">{unionPage.tribalismeText}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="reasons-list band band--paper" motion="trois-raisons">
        <Container>
          <SectionHead eyebrow="Trois raisons" title={unionPage.raisonsTitle} />
          <ol className="reasons-list__items">
            {unionPage.raisons.map((reason) => (
              <li key={reason.word} data-reveal>
                <span className="reasons-list__word">{reason.word}</span>
                <p>{reason.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="union-status" motion="statut">
        <Container>
          <div className="split">
            <div data-reveal>
              <p className="eyebrow">{unionPage.ambitionTitle}</p>
              <h2>{unionPage.ambitionText}</h2>
            </div>
            <div data-reveal>
              <p className="eyebrow">{unionPage.statusTitle}</p>
              <p className="lead">{unionPage.statusText}</p>
              <p>
                <Link to="/bureau" className="text-link">
                  Voir les cinq postes du Bureau
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
