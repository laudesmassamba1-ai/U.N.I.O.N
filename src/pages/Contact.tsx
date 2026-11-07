import { PageHeader } from '../components/Layout';
import { ButtonLink, Container, Section } from '../components/ui';
import { contactPage, site } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Contact() {
  useRouteTitle('Contact');
  return (
    <>
      <PageHeader
        eyebrow={contactPage.eyebrow}
        title={contactPage.title}
        intro={contactPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Contact' }]}
      />
      <Section className="contact" motion="contact">
        <Container>
          <div className="contact__grid">
            <div data-reveal>
              <h2>Le groupe WhatsApp</h2>
              <p>
                Le groupe WhatsApp est le canal du mouvement. Vous y posez vos questions et suivez les annonces.
              </p>
              {site.whatsappUrl ? (
                <ButtonLink href={site.whatsappUrl} external>
                  {contactPage.whatsapp}
                </ButtonLink>
              ) : (
                <p className="note">{contactPage.unavailable}</p>
              )}
            </div>

            {site.unionEmail ? (
              <div data-reveal>
                <h2>{contactPage.emailTitle}</h2>
                <p>{contactPage.emailText}</p>
                <p className="contact-email">
                  <a href={`mailto:${site.unionEmail}`} className="text-link">
                    {site.unionEmail}
                  </a>
                </p>
              </div>
            ) : null}

            <div data-reveal>
              <h2>{contactPage.mediaTitle}</h2>
              <p>{contactPage.mediaText}</p>
            </div>

            <div data-reveal>
              <h2>Données personnelles</h2>
              <p>{contactPage.noForm}</p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
