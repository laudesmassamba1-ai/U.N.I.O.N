import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { ButtonLink, Container, Section } from '../components/ui';
import { joinPage, site } from '../content/fr';
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
              <h2>Le groupe WhatsApp</h2>
              <p>
                Le lien d’invitation est fourni par le fondateur. Il est conservé dans une
                variable d’environnement du site.
              </p>
              {site.whatsappUrl ? (
                <ButtonLink href={site.whatsappUrl} external>
                  {joinPage.whatsapp}
                </ButtonLink>
              ) : (
                <p className="note">{joinPage.unavailable}</p>
              )}
              <p className="note">{joinPage.approvalNote}</p>
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
              <h2>{joinPage.minimalTitle}</h2>
              <p>{joinPage.minimalText}</p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
