import { PageHeader } from '../components/Layout';
import { Container, Section, SectionHead, StatusBadge, StatusStamp } from '../components/ui';
import { board } from '../content/fr';
import { useRouteTitle } from '../lib/hooks';

export default function Board() {
  useRouteTitle('Le Bureau');
  return (
    <>
      <PageHeader
        eyebrow={board.eyebrow}
        title={board.title}
        intro={board.intro}
        breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Le Bureau' }]}
      >
        <StatusStamp label="Postes à confirmer" tone="attention" />
      </PageHeader>

      <Section className="board" motion="bureau">
        <Container>
          <div className="board-diagram" data-reveal>
            <div className="board-diagram__president">
              <span className="board-diagram__role">Président National</span>
              <span className="board-diagram__detail">Président-Fondateur, représentant légal</span>
              <StatusBadge label={board.vacant} tone="neutral" />
            </div>
            <div className="board-diagram__line" aria-hidden="true" />
            <div className="board-diagram__vps">
              <div>
                <span className="board-diagram__role">Vice-Président Nord</span>
                <span className="board-diagram__detail">Mobilisation des départements du Nord</span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
              <div>
                <span className="board-diagram__role">Vice-Président Sud</span>
                <span className="board-diagram__detail">Mobilisation des départements du Sud</span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
            </div>
            <div className="board-diagram__line" aria-hidden="true" />
            <div className="board-diagram__others">
              <div>
                <span className="board-diagram__role">Secrétaire Général</span>
                <span className="board-diagram__detail">
                  Administration, procès-verbaux, dossier au ministère
                </span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
              <div>
                <span className="board-diagram__role">Trésorier Général</span>
                <span className="board-diagram__detail">
                  Cotisations et financement du programme
                </span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
            </div>
          </div>

          <div className="golden-rule" data-reveal>
            <p className="eyebrow">{board.goldenRuleTitle}</p>
            <p className="golden-rule__text">{board.goldenRule}</p>
          </div>
        </Container>
      </Section>

      <Section className="board-posts band band--paper" motion="bureau-postes">
        <Container>
          <SectionHead eyebrow="Les postes" title="Cinq responsabilités" />
          <div className="board-posts__list">
            {board.posts.map((post) => (
              <article key={post.key} className="board-post" data-reveal>
                <div className="board-post__head">
                  <h3>{post.title}</h3>
                  <StatusBadge label={board.vacant} tone="neutral" />
                </div>
                <p className="board-post__detail">{post.detail}</p>
                <p>{post.mission}</p>
              </article>
            ))}
          </div>
          <p className="note" data-reveal>
            {board.note}
          </p>
        </Container>
      </Section>
    </>
  );
}
