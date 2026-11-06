import type { Article } from '../types';
import { formatDate } from '../lib/dates';
import { articlePath } from '../lib/articles';
import { articleNatures, journalPage } from '../content/fr';
import { Link } from './Link';
import { NatureBadge } from './ui';

function natureLabel(nature: Article['nature']): string {
  return articleNatures.find((item) => item.value === nature)?.label ?? 'Info';
}

export function ArticleCard({
  article,
  variant = 'grid',
}: {
  article: Article;
  variant?: 'lead' | 'grid' | 'list';
}) {
  const nature = natureLabel(article.nature);
  const date = article.publishedAt ? formatDate(article.publishedAt) : '';
  return (
    <article className={`article-card article-card--${variant}`} data-reveal>
      <Link to={articlePath(article)} className="article-card__media-link" ariaCurrent={false}>
        {article.leadImage ? (
          <img
            className="article-card__image"
            src={article.leadImage.src}
            alt={article.leadImage.alt}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="article-card__typographic" aria-hidden="true">
            <span>{article.category || 'Journal'}</span>
            <strong>{article.title.slice(0, 1).toUpperCase()}</strong>
          </span>
        )}
      </Link>
      <div className="article-card__body">
        <div className="article-card__meta">
          <NatureBadge label={nature} />
          {article.category ? <span>{article.category}</span> : null}
          {date ? <time dateTime={article.publishedAt ?? undefined}>{date}</time> : null}
        </div>
        <h3 className="article-card__title">
          <Link to={articlePath(article)}>{article.title}</Link>
        </h3>
        {article.standfirst ? (
          <p className="article-card__standfirst">{article.standfirst}</p>
        ) : null}
        <p className="article-card__footer">
          <span>{journalPage.editor}</span>
          <Link to={articlePath(article)} className="text-link">
            {journalPage.readArticle}
          </Link>
        </p>
      </div>
    </article>
  );
}
