import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { dbStore } from './store';
import {
  fetchRemoteEdition,
  getAppliedEditionRevision,
  mergeEdition,
  setAppliedEditionRevision,
} from './edition';
import type { DatabaseShape } from '../types';

export function useDatabase(): DatabaseShape {
  return useSyncExternalStore(dbStore.subscribe, dbStore.getSnapshot, dbStore.getSnapshot);
}

export function useEditionSync(): void {
  useEffect(() => {
    let cancelled = false;
    fetchRemoteEdition()
      .then((document) => {
        if (cancelled || !document) return;
        if (document.revision <= getAppliedEditionRevision()) return;
        dbStore.replace(mergeEdition(dbStore.getSnapshot(), document));
        setAppliedEditionRevision(document.revision);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
}

export interface RouteState {
  path: string;
  query: URLSearchParams;
  hash: string;
}

function readRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { path: '/', query: new URLSearchParams(), hash: '' };
  }
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return {
    path: path.replace(/\/+$/, '') || '/',
    query: new URLSearchParams(queryPart),
    hash: raw,
  };
}

export function useRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(to: string, options?: { replace?: boolean }): void {
  if (typeof window === 'undefined') return;
  const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
  if (options?.replace) {
    const url = `${window.location.pathname}${window.location.search}${target}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash === target) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  } else {
    window.location.hash = target;
  }
}

export function useRouteTitle(title: string): void {
  useEffect(() => {
    const base = 'U.N.I.O.N';
    document.title = title ? `${title} | ${base}` : base;
  }, [title]);
}

export function useScrollToTopOnRoute(path: string): void {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [path]);
}

export interface DisplayPreferences {
  reducedMotion: boolean;
  dataSaver: boolean;
  motionAllowed: boolean;
  theme: 'light' | 'dark';
  toggleDataSaver: () => void;
  toggleTheme: () => void;
}

export function useDisplayPreferences(): DisplayPreferences {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [dataSaver, setDataSaver] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = window.localStorage.getItem('union.dataSaver');
      if (saved === 'on') return true;
      if (saved === 'off') return false;
    } catch {
      // ignore
    }
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    return Boolean(connection?.saveData);
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = window.localStorage.getItem('union.theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('js');
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('data-saver', dataSaver);
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    try {
      window.localStorage.setItem('union.theme', theme);
      window.localStorage.setItem('union.dataSaver', dataSaver ? 'on' : 'off');
    } catch {
      // ignore
    }
  }, [theme, dataSaver, reducedMotion]);

  return useMemo(
    () => ({
      reducedMotion,
      dataSaver,
      motionAllowed: !reducedMotion && !dataSaver,
      theme,
      toggleDataSaver: () => setDataSaver((value) => !value),
      toggleTheme: () => setTheme((value) => (value === 'light' ? 'dark' : 'light')),
    }),
    [reducedMotion, dataSaver, theme],
  );
}

export function useRevealOnScroll(path: string): void {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    const observe = (element: HTMLElement) => {
      if (!element.classList.contains('is-visible')) observer.observe(element);
    };
    elements.forEach((element) => observe(element));
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches('[data-reveal]')) observe(node);
          node.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => observe(element));
        });
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [path]);
}

export function useElementScrollProgress(
  ref: RefObject<HTMLElement | null>,
  onChange: (progress: number) => void,
): void {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const consumed = clamp01(-rect.top / total);
      callbackRef.current(consumed);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function useNow(intervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
