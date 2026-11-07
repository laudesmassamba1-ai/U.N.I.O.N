import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { departments, departmentsPage, departmentActions } from '../content/fr';
import { departmentsGeo } from '../data/departments-geo';

const labelPositions: Record<string, { x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = {
  Bouenza: { x: 324, y: 1035, anchor: 'middle' },
  Brazzaville: { x: 648, y: 1016, anchor: 'start' },
  Cuvette: { x: 660, y: 566, anchor: 'start' },
  'Cuvette-Ouest': { x: 466, y: 472, anchor: 'middle' },
  Kouilou: { x: 92, y: 1004, anchor: 'start' },
  Likouala: { x: 841, y: 226, anchor: 'middle' },
  Lékoumou: { x: 315, y: 898, anchor: 'middle' },
  Niari: { x: 178, y: 900, anchor: 'middle' },
  Plateaux: { x: 567, y: 766, anchor: 'middle' },
  'Pointe-Noire': { x: 208, y: 1128, anchor: 'start' },
  Pool: { x: 448, y: 950, anchor: 'end' },
  Sangha: { x: 566, y: 300, anchor: 'middle' },
};

const leaderLines: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  Brazzaville: { x1: 586, y1: 1016, x2: 640, y2: 1012 },
  'Pointe-Noire': { x1: 118, y1: 1128, x2: 200, y2: 1124 },
  Pool: { x1: 486, y1: 960, x2: 456, y2: 954 },
  Kouilou: { x1: 120, y1: 1040, x2: 100, y2: 1012 },
};

export function DepartmentMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [bourse, setBourse] = useState(false);

  const current = hovered ?? selected;
  const currentInfo = departments.find((department) => department.name === current);
  const currentActions = current ? departmentActions[current] ?? [] : [];

  const activeCount = useMemo(
    () => departments.filter((d) => (departmentActions[d.name]?.length ?? 0) > 0).length,
    [],
  );

  const network = useMemo(() => {
    if (!bourse) return [];
    const centroids = departmentsGeo.departments.map((department) => ({
      name: department.name,
      x: department.cx,
      y: department.cy,
    }));
    return centroids.map((point, index) => {
      const next = centroids[(index + 1) % centroids.length];
      return { from: point, to: next };
    });
  }, [bourse]);

  return (
    <section className="map-section" data-motion="carte" aria-labelledby="carte-titre">
      <div className="map-summary-bar" data-reveal>
        <span className="map-summary-badge">
          <strong>{activeCount} / 12</strong> départements avec action consignée
        </span>
        <span className="map-summary-rule">
          Règle de l’article 2 : action requise dans au moins 6 départements pour une candidature
        </span>
      </div>

      <div className="map-layout">
        <div className="map-canvas" data-reveal>
          <svg
            viewBox={departmentsGeo.viewBox}
            className="department-map"
            role="img"
            aria-label={departmentsPage.mapLabel}
          >
            <g className="map-regions">
              {departmentsGeo.departments.map((department, index) => {
                const isActive = current === department.name;
                const hasActions = (departmentActions[department.name]?.length ?? 0) > 0;
                return (
                  <path
                    key={department.name}
                    d={department.path}
                    className={`map-region${isActive ? ' is-active' : ''}${hasActions ? ' has-actions' : ''}`}
                    style={{ ['--i' as string]: index } as CSSProperties}
                    pathLength={1}
                    onMouseEnter={() => setHovered(department.name)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(department.name)}
                  >
                    <title>{department.name}</title>
                  </path>
                );
              })}
            </g>

            {bourse ? (
              <g className="map-network" aria-hidden="true">
                {network.map((line, index) => (
                  <line
                    key={index}
                    className="map-network-line"
                    x1={line.from.x}
                    y1={line.from.y}
                    x2={line.to.x}
                    y2={line.to.y}
                  />
                ))}
              </g>
            ) : null}

            <g className="map-labels" aria-hidden="true">
              {departmentsGeo.departments.map((department) => {
                const position = labelPositions[department.name];
                if (!position) return null;
                const leader = leaderLines[department.name];
                return (
                  <g key={department.name}>
                    {leader ? (
                      <line
                        className="map-leader"
                        x1={leader.x1}
                        y1={leader.y1}
                        x2={leader.x2}
                        y2={leader.y2}
                      />
                    ) : null}
                    <text
                      x={position.x}
                      y={position.y}
                      textAnchor={position.anchor}
                      className={current === department.name ? 'map-label is-active' : 'map-label'}
                    >
                      {department.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <p className="map-attribution">{departmentsPage.attribution}</p>
          <p className="map-source">{departmentsGeo.source}</p>
        </div>

        <aside className="map-panel" aria-label="Détail des départements">
          <div className="map-panel__detail" aria-live="polite">
            {currentInfo ? (
              <>
                <p className="eyebrow">Département</p>
                <h3>{currentInfo.name}</h3>
                <p className="map-panel__kind">{currentInfo.kind}</p>
                <p className="map-panel__actions-title">{departmentsPage.actionsTitle}</p>
                {currentActions.length > 0 ? (
                  <ul>
                    {currentActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="map-panel__none">{departmentsPage.none}</p>
                )}
              </>
            ) : (
              <>
                <p className="eyebrow">La carte du terrain</p>
                <p className="map-panel__hint">
                  Sélectionnez un département sur la carte ou dans la liste pour consulter les actions.
                </p>
              </>
            )}
          </div>

          <div className="map-toggle">
            <label>
              <input
                type="checkbox"
                checked={bourse}
                onChange={(event) => setBourse(event.target.checked)}
              />
              <span>{departmentsPage.bourseToggle}</span>
            </label>
            <p>{departmentsPage.bourseNote}</p>
          </div>

          <div className="map-list">
            <p className="eyebrow">{departmentsPage.listTitle}</p>
            <ul>
              {departments.map((department) => (
                <li key={department.name}>
                  <button
                    type="button"
                    className={selected === department.name ? 'is-active' : ''}
                    onClick={() => setSelected(department.name)}
                    onFocus={() => setHovered(department.name)}
                    onBlur={() => setHovered(null)}
                    aria-pressed={selected === department.name}
                  >
                    <span>{department.name}</span>
                    <span className="map-list__kind">{department.kind}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
