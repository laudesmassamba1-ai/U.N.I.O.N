import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, StatusStamp } from '../components/ui';
import { departments, memberCardPage } from '../content/fr';
import { api } from '../lib/api';
import { useRouteTitle } from '../lib/hooks';

interface CardResult {
  cardSent: boolean;
  memberNumber: string;
  message?: string;
}

export default function MemberCard() {
  useRouteTitle('Carte de membre');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CardResult | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError(memberCardPage.errors.name);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email.trim())) {
      setError(memberCardPage.errors.email);
      return;
    }
    if (!consent) {
      setError(memberCardPage.errors.consent);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.requestMemberCard({
        fullName: fullName.trim(),
        email: email.trim(),
        department: department || null,
        consent: true,
      });
      setResult(response);
      setFullName('');
      setEmail('');
      setDepartment('');
      setConsent(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : memberCardPage.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={memberCardPage.eyebrow}
        title={memberCardPage.title}
        intro={memberCardPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Rejoindre', href: '/rejoindre' }, { label: 'Carte de membre' }]}
      />

      <Section className="join" motion="carte-de-membre">
        <Container>
          <div className="join__grid">
            <div className="join__primary" data-reveal>
              {result ? (
                <div role="status" aria-live="polite">
                  <StatusStamp
                    label={result.cardSent ? memberCardPage.sentTitle : memberCardPage.sentNoCardTitle}
                    tone={result.cardSent ? 'validated' : 'attention'}
                  />
                  <h2>{result.cardSent ? memberCardPage.sentTitle : memberCardPage.sentNoCardTitle}</h2>
                  <p>{result.message ?? (result.cardSent ? memberCardPage.sentText : memberCardPage.sentNoCardText)}</p>
                  <p className="note">
                    {memberCardPage.numberLabel} : <strong>{result.memberNumber}</strong>
                  </p>
                  <button type="button" className="text-link" onClick={() => setResult(null)}>
                    {memberCardPage.again}
                  </button>
                </div>
              ) : (
                <>
                  <h2>{memberCardPage.formTitle}</h2>
                  <p>{memberCardPage.formHelp}</p>
                  <form onSubmit={submit} noValidate>
                    <div className="field">
                      <label htmlFor="carte-nom">{memberCardPage.nameLabel}</label>
                      <input
                        id="carte-nom"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(event) => {
                          setFullName(event.target.value);
                          if (error) setError('');
                        }}
                        placeholder={memberCardPage.namePlaceholder}
                        maxLength={80}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="carte-email">{memberCardPage.emailLabel}</label>
                      <input
                        id="carte-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (error) setError('');
                        }}
                        placeholder={memberCardPage.emailPlaceholder}
                        maxLength={160}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="carte-departement">{memberCardPage.departmentLabel}</label>
                      <select
                        id="carte-departement"
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                      >
                        <option value="">{memberCardPage.departmentNone}</option>
                        {departments.map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field field--check">
                      <input
                        id="carte-accord"
                        name="consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          if (error) setError('');
                        }}
                        required
                      />
                      <label htmlFor="carte-accord">{memberCardPage.consentLabel}</label>
                    </div>

                    <div aria-live="polite">
                      {error ? <p className="form-error">{error}</p> : null}
                    </div>

                    <button type="submit" className="button button--solid" disabled={submitting}>
                      {submitting ? memberCardPage.submitting : memberCardPage.submit}
                    </button>
                  </form>
                </>
              )}
            </div>

            <div data-reveal>
              <h2>{memberCardPage.privacyTitle}</h2>
              <p>{memberCardPage.privacyNote}</p>
              <p>
                <Link to="/vie-privee" className="text-link">
                  Lire la page Vie privée
                </Link>
              </p>
              <p>
                <Link to="/rejoindre" className="text-link">
                  Rejoindre le mouvement
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
