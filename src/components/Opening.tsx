import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const SEEN_KEY = 'union.opening.seen.v1';

export function Opening({
  motionAllowed,
  onFinish,
}: {
  motionAllowed: boolean;
  onFinish: () => void;
}) {
  const [visible, setVisible] = useState(() => {
    if (!motionAllowed) return false;
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!motionAllowed) {
      onFinish();
      return;
    }
    if (!visible) {
      onFinish();
      return;
    }
    document.body.classList.add('opening-active');
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Ignore storage failure.
      }
      setVisible(false);
      onFinish();
    }, 2700);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove('opening-active');
    };
  }, [motionAllowed, onFinish, visible]);

  if (!visible) return null;

  const skip = () => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Ignore storage failure.
    }
    setVisible(false);
    onFinish();
  };

  return (
    <div className="opening" data-motion="opening" role="presentation">
      <div className="opening__half opening__half--left" aria-hidden="true" />
      <div className="opening__half opening__half--right" aria-hidden="true" />
      <div className="opening__gap" aria-hidden="true" />
      <div className="opening__seal">
        <Logo size={132} eager />
      </div>
      <p className="opening__word" aria-hidden="true">
        U.N.I.O.N
      </p>
      <button className="opening__skip" type="button" onClick={skip}>
        Passer
      </button>
    </div>
  );
}
