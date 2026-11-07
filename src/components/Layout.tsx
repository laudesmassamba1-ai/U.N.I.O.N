import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { footerNav, site } from '../content/fr';
import type { DisplayPreferences } from '../lib/hooks';
import { useRoute } from '../lib/hooks';
import { Logo } from './Logo';
import { Link } from './Link';
import { Breadcrumb, Container } from './ui';

const primary = [
  { href: '/', label: 'Accueil' },
  { href: '/journal', label: 'Le journal' },
  { href: '/suggestions', label: 'Suggestions' },
  { href: '/carte', label: 'Carte de membre' },
] as const;

const movementLinks = [
  { href: '/union', label: 'L’U.N.I.O.N' },
  { href: '/charte', label: 'La Charte' },
  { href: '/bureau', label: 'Le Bureau' },
  { href: '/engagements', label: 'Les engagements' },
  { href: '/departements', label: 'Les 12 départements' },
] as const;

const allLinks = [
  { href: '/', label: 'Accueil' },
  ...movementLinks,
  { href: '/journal', label: 'Infos de la semaine au Congo' },
  { href: '/suggestions', label: 'Boîte à suggestions' },
  { href: '/rejoindre', label: 'Rejoindre' },
  { href: '/documents', label: 'Documents' },
  { href: '/faq', label: 'Questions fréquentes' },
  { href: '/contact', label: 'Contact' },
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/vie-privee', label: 'Vie privée' },
  { href: '/accessibilite', label: 'Accessibilité' },
] as const;

function isActive(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}

export function Header() {
  const { path } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setMovementOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('menu-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <Container className="site-header__inner">
        <Link to="/" className="brand" ariaCurrent={path === '/' ? 'page' : undefined}>
          <Logo size={52} eager />
          <span className="brand__text">
            <span className="brand__name">U.N.I.O.N</span>
            <span className="brand__sub">Union Nationale pour l’Unité</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Navigation principale">
          <ul>
            {primary.slice(0, 1).map((item) => (
              <li key={item.href}>
                <Link to={item.href} ariaCurrent={path === item.href ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="nav-dropdown">
              <button
                type="button"
                aria-expanded={movementOpen}
                onClick={() => setMovementOpen((value) => !value)}
              >
                Le mouvement
                <span className="nav-caret" aria-hidden="true">
                  ▾
                </span>
              </button>
              {movementOpen ? (
                <ul className="nav-dropdown__panel">
                  {movementLinks.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        ariaCurrent={isActive(path, item.href) ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
            {primary.slice(1).map((item) => (
              <li key={item.href}>
                <Link to={item.href} ariaCurrent={isActive(path, item.href) ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/rejoindre"
                className="nav-join"
                ariaCurrent={isActive(path, '/rejoindre') ? 'page' : undefined}
              >
                Rejoindre
              </Link>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="menu-panel"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="menu-button__line" />
          <span className="menu-button__line" />
          <span className="menu-button__text">{menuOpen ? 'Fermer' : 'Menu'}</span>
        </button>
      </Container>

      <div
        id="menu-panel"
        className={`menu-panel${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
      >
        <nav aria-label="Toutes les pages">
          <ul>
            {allLinks.map((item) => (
              <li key={item.href}>
                <Link to={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/studio" onClick={() => setMenuOpen(false)}>
                UNION Studio (réservé)
              </Link>
            </li>
          </ul>
        </nav>
        <p className="menu-panel__status">{site.status}</p>
      </div>
    </header>
  );
}

export function Footer({ preferences }: { preferences: DisplayPreferences }) {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-top">
          <div className="footer-brand">
            <Logo size={84} onDark />
            <p className="footer-brand__name">U.N.I.O.N</p>
            <p className="footer-brand__long">Union Nationale pour l’Unité</p>
            <p className="footer-brand__motto">{site.motto}</p>
            <p className="footer-brand__status">{site.status}</p>
          </div>
          <div className="footer-nav">
            {footerNav.map((column) => (
              <div key={column.title}>
                <p className="footer-nav__title">{column.title}</p>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-controls">
          <button
            type="button"
            onClick={preferences.toggleDataSaver}
            aria-pressed={preferences.dataSaver}
          >
            Mode économie de données {preferences.dataSaver ? 'activé' : 'désactivé'}
          </button>
          <button
            type="button"
            onClick={preferences.toggleTheme}
            aria-pressed={preferences.theme === 'dark'}
          >
            {preferences.theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
          </button>
          <Link to="/studio" className="footer-studio">
            UNION Studio (réservé)
          </Link>
        </div>

        <div className="footer-legal">
          <p>
            U.N.I.O.N, Union Nationale pour l’Unité. Mouvement en cours de constitution.
            Aucun statut officiel n’est affirmé sur ce site.
          </p>
          <p>
            Aucun traceur. Aucun cookie d’analyse. Les dates sont affichées au fuseau
            Africa/Brazzaville.
          </p>
          <p>
            Contours des départements : geoBoundaries ADM1, République du Congo, licence CC BY
            4.0.
          </p>
          <p className="footer-legal__bottom">
            <span>© {new Date().getFullYear()} U.N.I.O.N</span>
            <span>
              <Link to="/mentions-legales">Mentions légales</Link>
              <Link to="/vie-privee">Vie privée</Link>
              <Link to="/accessibilite">Accessibilité</Link>
            </span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  breadcrumb,
  children,
  titleStyle,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: ReactNode;
  titleStyle?: CSSProperties;
}) {
  return (
    <header className="page-header">
      <Container>
        {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 style={titleStyle}>{title}</h1>
        {intro ? <p className="page-intro">{intro}</p> : null}
        {children}
      </Container>
    </header>
  );
}
