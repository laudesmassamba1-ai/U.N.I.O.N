import { useEffect, useRef } from 'react';

/**
 * Filet de lecture fixé sous le bord du papier. La largeur suit la position de
 * défilement, sans animation temporelle : rien ne bouge tout seul.
 */
export function ReadProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 40 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      element.style.setProperty('--read', value.toFixed(4));
      element.dataset.active = value > 0.004 && value < 0.999 ? 'true' : 'false';
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="read-progress" aria-hidden="true">
      <span className="read-progress__fill" />
    </div>
  );
}
