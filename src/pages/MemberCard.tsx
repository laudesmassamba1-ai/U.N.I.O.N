import { useMemo, useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead, StatusStamp } from '../components/ui';
import { departments, memberCardPage } from '../content/fr';
import { api } from '../lib/api';
import { useRouteTitle } from '../lib/hooks';
import { buildDossierMailto, dossierRecipients } from '../lib/member-mail';

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
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [documentsConsent, setDocumentsConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [result, setResult] = useState<CardResult | null>(null);

  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieValueError, setSelfieValueError] = useState<string | null>(null);
  const selfieRef = useRef<HTMLInputElement | null>(null);

  const [identity, setIdentity] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [identityValueError, setIdentityValueError] = useState<string | null>(null);
  const identityInputRef = useRef<HTMLInputElement | null>(null);

  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const recipients = useMemo(() => dossierRecipients(), []);
  const mailto = useMemo(
    () => buildDossierMailto(recipients, { fullName: fullName.trim(), department: department || null, phone: phone.trim() || null }),
    [recipients, fullName, department, phone],
  );

  const startCamera = async () => {
    if (!cameraRef.current) return;
    if (streamRef.current) {
      stopCamera();
      return;
    }
    try {
      setSelfieValueError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 800 }, height: { ideal: 800 } },
        audio: false,
      });
      streamRef.current = stream;
      cameraRef.current.srcObject = stream;
      await cameraRef.current.play();
    } catch (caught) {
      setSelfieValueError(memberCardPage.errors.cameraUnavailable);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }
  };

  const captureSelfie = async () => {
    if (!cameraRef.current || !cameraRef.current.readyState) {
      setSelfieValueError(memberCardPage.errors.cameraUnavailable);
      return;
    }
    const width = cameraRef.current.videoWidth || 800;
    const height = cameraRef.current.videoHeight || 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      setSelfieValueError(memberCardPage.errors.cameraUnavailable);
      return;
    }
    context.drawImage(cameraRef.current, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((image) => resolve(image), 'image/jpeg', 0.85);
    });
    if (!blob || blob.size === 0) {
      setSelfieValueError(memberCardPage.errors.selfie);
      return;
    }
    stopCamera();
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
    setSelfie(file);
    setSelfiePreview(URL.createObjectURL(file));
    setSelfieValueError(null);
  };

  const removeSelfie = () => {
    stopCamera();
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
      setSelfiePreview(null);
    }
    setSelfie(null);
    setSelfieValueError(null);
    if (selfieRef.current) selfieRef.current.value = '';
  };

  const handleIdentityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setIdentity(null);
      if (identityPreview) {
        URL.revokeObjectURL(identityPreview);
        setIdentityPreview(null);
      }
      setIdentityValueError(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setIdentityValueError(memberCardPage.errors.identity);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIdentityValueError(memberCardPage.errors.identity);
      return;
    }
    if (identityPreview) URL.revokeObjectURL(identityPreview);
    setIdentity(file);
    setIdentityPreview(URL.createObjectURL(file));
    setIdentityValueError(null);
  };

  const removeIdentity = () => {
    if (identityPreview) {
      URL.revokeObjectURL(identityPreview);
      setIdentityPreview(null);
    }
    setIdentity(null);
    setIdentityValueError(null);
    if (identityInputRef.current) identityInputRef.current.value = '';
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setUnavailable(false);
    setSelfieValueError(null);
    setIdentityValueError(null);

    if (fullName.trim().length < 2) {
      setError(memberCardPage.errors.name);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email.trim())) {
      setError(memberCardPage.errors.email);
      return;
    }
    if (phone.trim() && !/^[+0-9][0-9 \-()]{5,120}$/.test(phone.trim())) {
      setError(memberCardPage.errors.phone);
      return;
    }
    if (!consent) {
      setError(memberCardPage.errors.consent);
      return;
    }
    if (!documentsConsent) {
      setError(memberCardPage.errors.documentsConsent);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.requestMemberCard({
        fullName: fullName.trim(),
        email: email.trim(),
        department: department || null,
        phone: phone.trim() || null,
        consent: true,
        documentsConsent: true,
        selfie,
        identity,
      });
      setResult(response);
      setFullName('');
      setEmail('');
      setDepartment('');
      setPhone('');
      setConsent(false);
      setDocumentsConsent(false);
      removeSelfie();
      removeIdentity();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(message || memberCardPage.errors.network);
      if (/HTTP (404|503)|fetch|network|réseau/i.test(message)) setUnavailable(true);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      if (identityPreview) URL.revokeObjectURL(identityPreview);
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow={memberCardPage.eyebrow}
        title={memberCardPage.title}
        intro={memberCardPage.intro}
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Rejoindre', href: '/rejoindre' },
          { label: 'Carte de membre' },
        ]}
      />

      <Section className="home-roadmap" motion="carte-etapes">
        <Container>
          <SectionHead eyebrow={memberCardPage.eyebrow} title={memberCardPage.stepsTitle} />
          <div className="roadmap-grid" data-reveal>
            {memberCardPage.steps.map((step, index) => (
              <div key={step.title} className="roadmap-step">
                <div className="roadmap-step__header">
                  <span className="roadmap-step__num">0{index + 1}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

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
                      <label htmlFor="carte-telephone">{memberCardPage.phoneLabel}</label>
                      <input
                        id="carte-telephone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(event) => {
                          setPhone(event.target.value);
                          if (error) setError('');
                        }}
                        placeholder={memberCardPage.phonePlaceholder}
                        maxLength={120}
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

                    <div className="field">
                      <span className="field-label">{memberCardPage.selfieLabel}</span>
                      <div className="file-upload">
                        <input
                          ref={selfieRef}
                          id="carte-selfie"
                          name="selfie"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleIdentityChange}
                          className="visually-hidden"
                        />
                        {selfiePreview ? (
                          <div className="file-preview">
                            <img src={selfiePreview} alt="Selfie prévisualisé" />
                            <button
                              type="button"
                              className="button button--quiet"
                              onClick={removeSelfie}
                              aria-label={memberCardPage.selfieRemove}
                            >
                              {memberCardPage.selfieRemove}
                            </button>
                          </div>
                        ) : streamRef.current ? (
                          <div className="camera-view">
                            <video
                              ref={cameraRef}
                              autoPlay
                              playsInline
                              muted
                              onClick={captureSelfie}
                              className="camera-preview"
                            />
                            <button
                              type="button"
                              className="button button--solid"
                              onClick={captureSelfie}
                            >
                              {memberCardPage.selfieCapture}
                            </button>
                            <button
                              type="button"
                              className="button button--quiet"
                              onClick={stopCamera}
                            >
                              {memberCardPage.selfieRemove}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button button--outline"
                            onClick={startCamera}
                          >
                            {memberCardPage.selfieCapture}
                          </button>
                        )}
                        {selfieValueError ? (
                          <p className="form-error">{selfieValueError}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="field">
                      <span className="field-label">{memberCardPage.identityLabel}</span>
                      <div className="file-upload">
                        <input
                          ref={identityInputRef}
                          id="carte-identite"
                          name="identity"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleIdentityChange}
                          className="visually-hidden"
                        />
                        {identityPreview ? (
                          <div className="file-preview">
                            <img src={identityPreview} alt="Pièce d’identité prévisualisée" />
                            <button
                              type="button"
                              className="button button--quiet"
                              onClick={removeIdentity}
                              aria-label={memberCardPage.identityRemove}
                            >
                              {memberCardPage.identityRemove}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button button--outline"
                            onClick={() => identityInputRef.current?.click()}
                          >
                            {memberCardPage.identityPlaceholder}
                          </button>
                        )}
                        {identityValueError ? (
                          <p className="form-error">{identityValueError}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="field field--check">
                      <input
                        id="carte-documents-accord"
                        name="documentsConsent"
                        type="checkbox"
                        checked={documentsConsent}
                        onChange={(event) => {
                          setDocumentsConsent(event.target.checked);
                          if (error) setError('');
                        }}
                        required
                      />
                      <label htmlFor="carte-documents-accord">{memberCardPage.documentsConsentLabel}</label>
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
                      {unavailable ? <p className="note">{memberCardPage.serverUnavailable}</p> : null}
                    </div>

                    <button type="submit" className="button button--solid" disabled={submitting}>
                      {submitting ? memberCardPage.submitting : memberCardPage.submit}
                    </button>
                  </form>
                </>
              )}
            </div>

            <div data-reveal>
              <h2>{memberCardPage.mailTitle}</h2>
              <p>{memberCardPage.mailText}</p>
              {mailto ? (
                <a className="button button--outline" href={mailto}>
                  {memberCardPage.mailAction}
                </a>
              ) : (
                <p className="note">{memberCardPage.mailUnavailable}</p>
              )}
              <p className="note">{memberCardPage.mailNote}</p>

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
