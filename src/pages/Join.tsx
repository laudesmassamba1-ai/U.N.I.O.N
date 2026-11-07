import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { ButtonLink, Container, Section } from '../components/ui';
import { joinPage, memberCardPage, site } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Join() {
  useRouteTitle('Rejoindre');
  return (
    <>
      <PageHeader
        eyebrow={joinPage.eyebrow}
        title={joinPage.title}
        intro={joinPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Rejoindre' }]}
      />

      <Section className="join" motion="rejoindre">
        <Container>
          <div className="join__grid">
            <div className="join__primary" data-reveal>
              <h2>{joinPage.primaryTitle}</h2>
              <p>{joinPage.primaryText}</p>
              {site.whatsappUrl ? (
                <ButtonLink href={site.whatsappUrl} external>
                  {joinPage.whatsapp}
                </ButtonLink>
              ) : (
                <p className="note">{joinPage.unavailable}</p>
              )}
            </div>

            <div data-reveal>
              <h2>{memberCardPage.eyebrow}</h2>
              <p>{memberCardPage.intro}</p>
              <Link to="/carte" className="text-link">
                {memberCardPage.title}
              </Link>
            </div>

            <div data-reveal>
              <h2>{joinPage.privacyTitle}</h2>
              <p>{joinPage.privacyText}</p>
              <p>
                <Link to="/vie-privee" className="text-link">
                  Lire la page Vie privée
                </Link>
              </p>
            </div>

            <div data-reveal>
              <h2>{joinPage.commitmentTitle}</h2>
              <p>{joinPage.commitmentText}</p>
              <p>
                <Link to="/charte" className="text-link">
                  Consulter la Charte
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
