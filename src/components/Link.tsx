import type { MouseEvent, ReactNode } from 'react';
import { navigate } from '../lib/hooks';

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaCurrent?: 'page' | 'step' | 'location' | boolean;
  title?: string;
}

export function Link({ to, children, className, onClick, ariaCurrent, title }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onClick?.();
    navigate(to);
  };
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={handleClick}
      aria-current={ariaCurrent}
      title={title}
    >
      {children}
    </a>
  );
}
