import { useRef, useState } from 'react';
import { home } from '../content/fr';
import { departmentsGeo } from '../data/departments-geo';
import { clamp01, useElementScrollProgress } from '../lib/hooks';
import { SectionHead } from './ui';

function useSceneProgress(motionAllowed: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(motionAllowed ? 0 : 1);
  useElementScrollProgress(ref, (value) => {
    if (motionAllowed) setProgress(value);
  });
  return { ref, progress: motionAllowed ? progress : 1 };
}

function GuerirVisual({ t }: { t: number }) {
  const stitches = [0.28, 0.4, 0.52, 0.64, 0.76];
  return (
    <svg viewBox="0 0 620 320" className="scene-svg" role="img" aria-label="Une fissure se referme, retenue par des points de suture.">
      <path className="scene-line-ghost" d="M18 170 C110 130 170 205 250 160 C330 115 390 200 470 150 C530 112 570 142 602 128" />
      <path
        className="scene-line scene-line--crack"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1 - clamp01(t * 1.3) }}
        d="M18 170 L86 156 L118 192 L156 148 L196 188 L232 152 L270 190 L306 152 L342 190 L382 150 L420 188 L458 148 L500 182 L540 146 L602 164"
      />
      {stitches.map((at, index) => (
        <g
          key={at}
          className="scene-stitch"
          style={{ opacity: clamp01((t - 0.45 - index * 0.06) * 4) }}
        >
          <line x1={at * 620 - 14} y1={150} x2={at * 620 + 14} y2={190} />
          <line x1={at * 620 - 14} y1={190} x2={at * 620 + 14} y2={150} />
        </g>
      ))}
      <text x="18" y="292" className="scene-label">
        La fissure se referme.
      </text>
    </svg>
  );
}

function ProuverVisual({ t }: { t: number }) {
  const points = [
    { x: 815, y: 245, label: 'Nord' },
    { x: 330, y: 1040, label: 'Sud' },
    { x: 112, y: 948, label: 'Ouest' },
  ];
  return (
    <svg viewBox="0 0 1000 1164" className="scene-svg scene-svg--map" role="img" aria-label="Trois points du Congo se relient en triangle.">
      <g className="scene-country">
        {departmentsGeo.departments.map((department) => (
          <path key={department.name} d={department.path} />
        ))}
      </g>
      <g className="scene-triangle" style={{ opacity: clamp01((t - 0.15) * 2) }}>
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          return (
            <line
              key={`${point.label}-${next.label}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - clamp01((t - 0.2) * 2) }}
            />
          );
        })}
      </g>
      {points.map((point, index) => (
        <g key={point.label} style={{ opacity: clamp01((t - index * 0.12) * 5) }}>
          <circle cx={point.x} cy={point.y} r="18" className="scene-dot" />
          <circle cx={point.x} cy={point.y} r="6" className="scene-dot-core" />
          <text x={point.x + 28} y={point.y + 8} className="scene-label scene-label--dark">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/*
 * Deux pièces réellement différentes, dont les contours se complètent au pixel.
 * À gauche une plaque chanfreinée portant deux tenons de profondeurs inégales
 * (46 puis 38) ; à droite une pièce plus large, à bord droit incliné et encoche
 * en V, creusée de deux mortaises de même profondeur. Les deux tracés partagent
 * exactement la même ligne de joint : à l'arrivée, aucun jour, aucun recouvrement.
 */
const PIECE_LEFT =
  'M92 70 L56 106 L56 250 L310 250 L310 212 L348 212 L348 168 L310 168 L310 140 L356 140 L356 96 L310 96 L310 70 Z';
const PIECE_RIGHT =
  'M310 86 L462 86 L502 130 L542 86 L588 86 L566 250 L310 250 L310 212 L348 212 L348 168 L310 168 L310 140 L356 140 L356 96 L310 96 Z';
const PIECE_JOINT =
  'M310 86 L310 96 L356 96 L356 140 L310 140 L310 168 L348 168 L348 212 L310 212 L310 250';

function TravaillerVisual({ t }: { t: number }) {
  const offset = (1 - t) * 130;
  return (
    <svg
      viewBox="0 0 620 320"
      className="scene-svg"
      role="img"
      aria-label="Une plaque à deux tenons et une pièce à deux mortaises, de formes différentes, s’emboîtent exactement."
    >
      <defs>
        <pattern
          id="union-piece-hatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" className="scene-piece-hatch-line" />
        </pattern>
      </defs>
      <g style={{ transform: `translateX(${-offset}px)` }}>
        <path className="scene-piece scene-piece--a" d={PIECE_LEFT} />
      </g>
      <g style={{ transform: `translateX(${offset}px)` }}>
        <path className="scene-piece scene-piece--b" d={PIECE_RIGHT} />
        <path className="scene-piece-hatch" d={PIECE_RIGHT} fill="url(#union-piece-hatch)" />
      </g>
      <path
        className="scene-seam"
        d={PIECE_JOINT}
        pathLength={1}
        style={{
          opacity: clamp01((t - 0.66) * 5),
          strokeDasharray: 1,
          strokeDashoffset: 1 - clamp01((t - 0.66) * 4),
        }}
      />
      <text x="56" y="292" className="scene-label">
        Deux pièces, un seul ouvrage.
      </text>
    </svg>
  );
}

const visuals = [GuerirVisual, ProuverVisual, TravaillerVisual];

export function ThreeScenes({ motionAllowed }: { motionAllowed: boolean }) {
  const { ref, progress } = useSceneProgress(motionAllowed);
  const active = Math.min(2, Math.floor(progress * 3.0001));
  const local = clamp01(progress * 3 - active);

  return (
    <section className="scenes" data-motion="raisons" aria-labelledby="raisons-title">
      <div className="container">
        <SectionHead
          id="raisons-title"
          eyebrow="Pourquoi l’U.N.I.O.N"
          title="Guérir. Prouver. Travailler."
          intro="Trois raisons, trois gestes. La fissure se referme, trois points se relient, deux pièces s’emboîtent."
        />
      </div>

      {motionAllowed ? (
        <div className="scenes__scroll" ref={ref}>
          <div className="scenes__sticky">
            <div className="container scenes__layout">
              <div className="scenes__stage" aria-live="polite">
                {home.reasons.map((reason, index) => {
                  return (
                    <div
                      key={reason.key}
                      className={`scenes__scene${index === active ? ' is-active' : ''}`}
                      aria-hidden={index !== active}
                    >
                      <p className="scenes__word">{reason.word}</p>
                      <h3>{reason.title}</h3>
                      <p>{reason.text}</p>
                    </div>
                  );
                })}
              </div>
              <div className="scenes__visual">
                {home.reasons.map((reason, index) => {
                  const Visual = visuals[index];
                  return (
                    <div
                      key={reason.key}
                      className={`scenes__drawing${index === active ? ' is-active' : ''}`}
                      aria-hidden="true"
                    >
                      <Visual t={index === active ? local : index < active ? 1 : 0} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="container scenes__rail" aria-hidden="true">
              {home.reasons.map((reason, index) => (
                <span
                  key={reason.key}
                  className={index === active ? 'is-active' : index < active ? 'is-done' : ''}
                >
                  <span className="scenes__rail-line" />
                  {reason.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="container scenes__static">
          {home.reasons.map((reason, index) => {
            const Visual = visuals[index];
            return (
              <article key={reason.key} className="scenes__static-item">
                <div className="scenes__visual scenes__visual--static">
                  <Visual t={1} />
                </div>
                <div>
                  <p className="scenes__word">{reason.word}</p>
                  <h3>{reason.title}</h3>
                  <p>{reason.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
