import { lazy, Suspense, useEffect, useState } from 'react';
import { Footer, Header } from './components/Layout';
import { InkFilter } from './components/InkFilter';
import { Opening } from './components/Opening';
import { useDatabase, useDisplayPreferences, useEditionSync, useRevealOnScroll, useRoute, useScrollToTopOnRoute } from './lib/hooks';
import { countByStatus } from './lib/store';
import Home from './pages/Home';
import Union from './pages/Union';
import CharterPage from './pages/Charter';
import Board from './pages/Board';
import Engagements from './pages/Engagements';
import Journal from './pages/Journal';
import ArticlePage from './pages/ArticlePage';
import Suggestions from './pages/Suggestions';
import Join from './pages/Join';
import Documents from './pages/Documents';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import Privacy from './pages/Privacy';
import Accessibility from './pages/Accessibility';
import NotFound from './pages/NotFound';

const Departments = lazy(() => import('./pages/Departments'));
const Studio = lazy(() => import('./pages/Studio'));

declare global {
  interface Window {
    unionReport?: () => void;
  }
}

function RouteView({ path, motionAllowed }: { path: string; motionAllowed: boolean }) {
  if (path === '/') return <Home motionAllowed={motionAllowed} />;
  if (path === '/union') return <Union />;
  if (path === '/charte') return <CharterPage />;
  if (path === '/bureau') return <Board />;
  if (path === '/engagements') return <Engagements />;
  if (path === '/departements') return <Departments />;
  if (path === '/journal') return <Journal />;
  if (path.startsWith('/journal/')) {
    const slug = decodeURIComponent(path.split('/')[2] ?? '');
    return <ArticlePage slug={slug} />;
  }
  if (path === '/suggestions') return <Suggestions />;
  if (path === '/rejoindre') return <Join />;
  if (path === '/documents') return <Documents />;
  if (path === '/faq') return <Faq />;
  if (path === '/contact') return <Contact />;
  if (path === '/mentions-legales') return <Legal />;
  if (path === '/vie-privee') return <Privacy />;
  if (path === '/accessibilite') return <Accessibility />;
  return <NotFound />;
}

export default function App() {
  const route = useRoute();
  const preferences = useDisplayPreferences();
  useEditionSync();
  useRevealOnScroll(route.path);
  useScrollToTopOnRoute(route.path);
  const database = useDatabase();
  const [openingDone, setOpeningDone] = useState(() => route.path !== '/');

  const isHome = route.path === '/';
  const isStudio = route.path === '/studio' || route.path.startsWith('/studio/');

  useEffect(() => {
    if (!isHome) setOpeningDone(true);
  }, [isHome]);

  useEffect(() => {
    window.unionReport = () => {
      const sections = document.querySelectorAll('section');
      const motionSections = document.querySelectorAll('section[data-motion]');
      const scrollScenes = document.querySelectorAll(
        '[data-motion="junction"], [data-motion="raisons"], [data-motion="carte"]',
      );
      const svgPaths = document.querySelectorAll('svg path');
      const published = database.articles.filter(
        (article) => article.status === 'published' && !article.deletedAt,
      ).length;
      const statuses = countByStatus(database);
      console.group('U.N.I.O.N');
      console.table({
        sections: sections.length,
        sectionsAvecMotion: motionSections.length,
        scenesPiloteesParDefilement: scrollScenes.length,
        tracesSvg: svgPaths.length,
        articlesPublies: published,
        suggestionsEnAttente: statuses.pending ?? 0,
        suggestionsPubliees:
          (statuses.discussion ?? 0) +
          (statuses.retained ?? 0) +
          (statuses.adapted ?? 0) +
          (statuses.integrated ?? 0),
        suggestionsArchivees: statuses.archived ?? 0,
        suggestionsExpirees: statuses.expired ?? 0,
      });
      console.groupEnd();
    };
    return () => {
      delete window.unionReport;
    };
  }, [database]);

  if (isStudio) {
    return (
      <>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<p className="loading">Chargement du Studio.</p>}>
            <Studio />
          </Suspense>
        </main>
        <InkFilter />
      </>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<p className="loading">Chargement de la page.</p>}>
          <RouteView path={route.path} motionAllowed={preferences.motionAllowed} />
        </Suspense>
      </main>
      <Footer preferences={preferences} />
      <InkFilter />
      {isHome && !openingDone ? (
        <Opening motionAllowed={preferences.motionAllowed} onFinish={() => setOpeningDone(true)} />
      ) : null}
    </div>
  );
}
