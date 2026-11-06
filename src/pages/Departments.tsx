import { lazy, Suspense } from 'react';
import { Link } from '../components/Link';
import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead } from '../components/ui';
import { departments, departmentsPage } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

const DepartmentMap = lazy(() =>
  import('../components/DepartmentMap').then((module) => ({ default: module.DepartmentMap })),
);

export default function Departments() {
  useRouteTitle('Les 12 départements');
  return (
    <>
      <PageHeader
        eyebrow={departmentsPage.eyebrow}
        title={departmentsPage.title}
        intro={departmentsPage.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Les 12 départements' }]}
      />

      <Section className="departments" motion="carte-page">
        <Container>
          <Suspense
            fallback={
              <p className="map-loading" aria-live="polite">
                Chargement de la carte.
              </p>
            }
          >
            <DepartmentMap />
          </Suspense>
        </Container>
      </Section>

      <Section className="departments-list band band--paper" motion="departements-liste">
        <Container>
          <SectionHead
            eyebrow="La règle"
            title="Six départements au moins"
            intro="Pour être candidat de l’U.N.I.O.N à une élection, il faut avoir mené au moins une action dans 6 départements différents sur 12."
          />
          <ul className="departments-grid" data-reveal>
            {departments.map((department) => (
              <li key={department.name}>
                <span>{department.name}</span>
                <span className="departments-grid__kind">{department.kind}</span>
              </li>
            ))}
          </ul>
          <p className="note" data-reveal>
            Le classement officiel des départements en grands ensembles sera publié quand le
            bureau l’aura fourni. Il n’est pas déduit sur ce site.
          </p>
          <p data-reveal>
            <Link to="/charte" className="text-link">
              Lire l’article 2 de la Charte
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
