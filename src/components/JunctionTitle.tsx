import { useRef, useState } from 'react';
import { home, site } from '../content/fr';
import { useElementScrollProgress } from '../lib/hooks';
import { Logo } from './Logo';
import { ButtonLink } from './ui';

export function JunctionTitle({ motionAllowed }: { motionAllowed: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(motionAllowed ? 0 : 1);
  useElementScrollProgress(ref, (value) => {
    if (!motionAllowed) return;
    setProgress(value);
  });

  const p = motionAllowed ? progress : 1;
  const oldOpacity = Math.max(0, 1 - Math.max(0, (p - 0.45) / 0.24));
  const newOpacity = Math.min(1, Math.max(0, (p - 0.52) / 0.22));
  const gap = Math.max(0, 1 - p);
  const tilt = Math.max(0, 1 - p);

  return (
    <section
      ref={ref}
      className="hero"
      data-motion="junction"
      aria-labelledby="hero-title"
      style={{ ['--p' as string]: p }}
    >
      <div className="hero__sticky">
        <div className="hero__masthead" data-reveal>
          <Logo size={92} eager />
          <p className="eyebrow">{home.eyebrow}</p>
        </div>

        <h1 id="hero-title" className="sr-only">
          {site.motto}
        </h1>

        <div className="junction" aria-hidden="true">
          <span className="junction__top">{home.titleTop}</span>
          <span className="junction__bottom">
            <span className="junction__old" style={{ opacity: oldOpacity }}>
              <span
                className="junction__piece junction__piece--first"
                style={{ transform: `translate(${gap * 0.12}em, ${tilt * 0.13}em)` }}
              >
                divisé
              </span>
              <span className="junction__crack" style={{ opacity: tilt }}>
                <svg viewBox="0 0 32 120" width="32" height="120" aria-hidden="true">
                  <path d="M17 0 L11 18 L21 33 L9 51 L19 67 L10 84 L18 102 L14 120" />
                </svg>
              </span>
              <span
                className="junction__piece junction__piece--second"
                style={{ transform: `translate(${-gap * 0.12}em, ${-tilt * 0.13}em)` }}
              >
                mendie.
              </span>
            </span>
            <span className="junction__new" style={{ opacity: newOpacity }}>
              <span className="junction__seam" aria-hidden="true" />
              uni travaille.
            </span>
          </span>
        </div>

        <p className="hero__intro" data-reveal>
          {home.intro}
        </p>

        <div className="hero__actions" data-reveal>
          <ButtonLink href="/charte">{home.primaryCta}</ButtonLink>
          <ButtonLink href="/suggestions" variant="outline">
            {home.suggestionsCta}
          </ButtonLink>
        </div>

        <p className="hero__scroll" aria-hidden="true">
          <span className="hero__scroll-line" />
          Faites défiler pour réunir les deux moitiés
        </p>
      </div>
    </section>
  );
}
