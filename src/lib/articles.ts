import type { Article } from '../types';
import { formatWeekRange } from './dates';

export function publishedArticles(articles: Article[]): Article[] {
  return articles
    .filter((article) => article.status === 'published' && !article.deletedAt)
    .sort((a, b) => {
      const first = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const second = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return second - first;
    });
}

export function visibleArticles(articles: Article[]): Article[] {
  return articles.filter((article) => !article.deletedAt);
}

export interface Edition {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  articles: Article[];
  featured: Article | null;
}

export function groupEditions(articles: Article[]): Edition[] {
  const published = publishedArticles(articles);
  const map = new Map<string, Article[]>();
  published.forEach((article) => {
    const key = article.weekStart || article.publishedAt?.slice(0, 10) || 'sans-semaine';
    const list = map.get(key) ?? [];
    list.push(article);
    map.set(key, list);
  });
  return Array.from(map.entries())
    .map(([weekStart, list]) => {
      const featured = list.find((article) => article.featured) ?? list[0] ?? null;
      return {
        weekStart,
        weekEnd: list[0]?.weekEnd ?? weekStart,
        weekNumber: list[0]?.weekNumber ?? 0,
        articles: list,
        featured,
      };
    })
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
}

export function findArticle(articles: Article[], slug: string): Article | null {
  return (
    publishedArticles(articles).find((article) => article.slug === slug) ?? null
  );
}

export function editionLabel(edition: Pick<Edition, 'weekNumber' | 'weekStart' | 'weekEnd'>): string {
  if (!edition.weekStart) return 'Édition à venir';
  return `Édition n° ${edition.weekNumber}, semaine du ${formatWeekRange(edition.weekStart, edition.weekEnd)}`;
}

export function articlePath(article: Article): string {
  return `/journal/${article.slug}`;
}

/** Nom d’élément partagé entre la carte du journal et le titre de l’article. */
export function articleViewTransitionName(slug: string): string {
  return `article-${slug.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
}

export function nextFeature(
  articles: Article[],
  weekStart: string,
  excludeId: string,
): string | null {
  const candidates = publishedArticles(articles).filter(
    (article) => article.weekStart === weekStart && article.id !== excludeId,
  );
  return candidates[0]?.id ?? null;
}
