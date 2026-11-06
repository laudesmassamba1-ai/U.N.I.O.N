import type { ArticleBlock } from '../types';

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div className="article-body">
      {blocks.map((block) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={block.id}>{block.text}</p>;
          case 'heading':
            return <h2 key={block.id}>{block.text}</h2>;
          case 'quote':
            return (
              <blockquote key={block.id}>
                <p>{block.text}</p>
                {block.attribution ? <cite>{block.attribution}</cite> : null}
              </blockquote>
            );
          case 'list':
            return (
              <ul key={block.id}>
                {block.items.map((item, index) => (
                  <li key={`${block.id}-${index}`}>{item}</li>
                ))}
              </ul>
            );
          case 'image':
            return (
              <figure key={block.id}>
                <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
                <figcaption>
                  <span>{block.caption}</span>
                  {block.credit ? <span className="credit">Crédit : {block.credit}</span> : null}
                </figcaption>
              </figure>
            );
          case 'separator':
            return <hr key={block.id} className="article-separator" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
