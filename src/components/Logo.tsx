import logoPath from '../../assets/logo-union.jpg';
import type { CSSProperties } from 'react';

interface LogoProps {
  size?: number;
  onDark?: boolean;
  className?: string;
  eager?: boolean;
}

export function Logo({ size = 56, onDark = false, className = '', eager = false }: LogoProps) {
  const style = {
    '--logo-size': `${size}px`,
  } as CSSProperties;
  return (
    <span
      className={`logo ${onDark ? 'logo--plate' : ''} ${className}`.trim()}
      style={style}
    >
      <img
        className="logo__img"
        src={logoPath}
        alt="U.N.I.O.N, Union Nationale pour l'Unité"
        width={1280}
        height={1280}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
      />
    </span>
  );
}