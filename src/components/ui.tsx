import type { ReactNode } from 'react';
import { Link } from './Link';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container ${className}`.trim()}>{children}</div>;
}

export function Section({
  children,
  className = '',
  motion,
  labelledBy,
  id,
}: {
  children: ReactNode;
  className?: string;
  motion?: string;
  labelledBy?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      data-motion={motion}
      aria-labelledby={labelledBy}
      className={`section ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  intro,
  id,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  id?: string;
  align?: 'left' | 'center';
}) {
  return (
    <header className={`section-head section-head--${align}`} data-reveal>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {intro ? <p className="section-intro">{intro}</p> : null}
    </header>
  );
}

export function Rule({ className = '' }: { className?: string }) {
  return <hr className={`rule ${className}`.trim()} />;
}

export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      →
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'solid',
  external = false,
  onClick,
  disabled = false,
}: {
  href?: string;
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'quiet';
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = `button button--${variant}${disabled ? ' is-disabled' : ''}`;
  if (external && href) {
    return (
      <a className={className} href={href} rel="noreferrer noopener" target="_blank">
        {children}
        <Arrow />
      </a>
    );
  }
  if (href && !disabled) {
    return (
      <Link className={className} to={href}>
        {children}
        <Arrow />
      </Link>
    );
  }
  return (
    <button className={className} type="button" onClick={onClick} disabled={disabled}>
      {children}
      <Arrow />
    </button>
  );
}

export function StatusStamp({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'validated' | 'attention' | 'closed';
}) {
  return (
    <span className={`stamp stamp--${tone}`} data-stamp="true" data-reveal>
      {label}
    </span>
  );
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: string }) {
  return <span className={`badge badge--${tone}`}>{label}</span>;
}

export function NatureBadge({ label }: { label: string }) {
  return <span className="nature">{label}</span>;
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="Fil d’Ariane">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link to={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state" data-reveal>
      <span className="empty-state__mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__text">{text}</p>
    </div>
  );
}
