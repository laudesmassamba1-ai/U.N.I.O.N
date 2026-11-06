import { ArticleCard } from '../components/ArticleCard';
import { JunctionTitle } from '../components/JunctionTitle';
import { Link } from '../components/Link';
import { ThreeScenes } from '../components/ThreeScenes';
import {
  ButtonLink,
  Container,
  EmptyState,
  Section,
  SectionHead,
  StatusBadge,
  StatusStamp,
} from '../components/ui';
import {
  board,
  charter,
  departments,
  departmentsPage,
  engagements,
  home,
  journalPage,
  site,
  suggestionsPage,
} from '../content/fr';
import { editionLabel, groupEditions } from '../lib/articles';
import { useDatabase } from '../lib/hooks';

export default function Home({ motionAllowed }: { motionAllowed: boolean }) {
  const database = useDatabase();
  const editions = groupEditions(database.articles);
  const latest = editions[0] ?? null;

  return (
    <>
      <JunctionTitle motionAllowed={motionAllowed} />

      <Section className="facts" motion="chiffres">
        <Container>
          <div className="facts__grid" data-reveal>
            <div>
              <span className="facts__number">12</span>
              <span className="facts__label">départements</span>
            </div>
            <div>
              <span className="facts__number">5</span>
              <span className="facts__label">postes au bureau national</span>
            </div>
            <div>
              <span className="facts__number">4</span>
              <span className="facts__label">articles dans la Charte</span>
            </div>
            <div>
              <span className="facts__number">1</span>
              <span className="facts__label">devise, deux moitiés à réunir</span>
            </div>
          </div>
          <div className="facts__note" data-reveal>
            <StatusStamp label="Mouvement en cours de constitution" tone="attention" />
            <p>
              Le mouvement est en cours de constitution. Le dépôt du dossier est prévu, à
              confirmer par le bureau.
            </p>
          </div>
        </Container>
      </Section>

      <ThreeScenes motionAllowed={motionAllowed} />

      <Section className="band band--ink" motion="devise">
        <Container>
          <blockquote className="motto-band" data-reveal>
            <p>« {site.motto} »</p>
            <cite>Devise de l’U.N.I.O.N</cite>
          </blockquote>
        </Container>
      </Section>

      <Section className="home-charter" motion="charte-apercu">
        <Container>
          <SectionHead
            eyebrow="La Charte"
            title="Quatre articles pour tenir l’unité"
            intro={charter.subtitle}
          />
          <div className="charter-preview" data-reveal>
            {charter.articles.map((article) => (
              <article key={article.number} className="charter-preview__item">
                <span className="charter-preview__number">Article {article.number}</span>
                <h3>{article.title}</h3>
                <p>{article.paragraphs[0]}</p>
              </article>
            ))}
          </div>
          <div className="section-actions" data-reveal>
            <ButtonLink href="/charte">Lire la Charte</ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="home-board" motion="bureau-apercu">
        <Container>
          <SectionHead
            eyebrow="Le Bureau"
            title="Cinq postes, une règle d’or"
            intro={board.intro}
          />
          <div className="board-diagram board-diagram--compact" data-reveal>
            <div className="board-diagram__president">
              <span className="board-diagram__label">Président National</span>
              <StatusBadge label={board.vacant} tone="neutral" />
            </div>
            <div className="board-diagram__line" aria-hidden="true" />
            <div className="board-diagram__vps">
              <div>
                <span className="board-diagram__label">Vice-Président Nord</span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
              <div>
                <span className="board-diagram__label">Vice-Président Sud</span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
            </div>
            <div className="board-diagram__line" aria-hidden="true" />
            <div className="board-diagram__others">
              <div>
                <span className="board-diagram__label">Secrétaire Général</span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
              <div>
                <span className="board-diagram__label">Trésorier Général</span>
                <StatusBadge label={board.vacant} tone="neutral" />
              </div>
            </div>
          </div>
          <div className="golden-rule" data-reveal>
            <p className="eyebrow">{board.goldenRuleTitle}</p>
            <p>{board.goldenRule}</p>
            <p className="note">{board.note}</p>
          </div>
          <div className="section-actions" data-reveal>
            <ButtonLink href="/bureau" variant="outline">
              Voir le Bureau
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="home-journal" motion="journal-apercu">
        <Container>
          <SectionHead
            eyebrow="Le journal"
            title={journalPage.title}
            intro={journalPage.notice}
          />
          {latest ? (
            <>
              <p className="edition-label" data-reveal>
                {editionLabel(latest)}
              </p>
              <div className="journal-lead">
                {latest.featured ? (
                  <ArticleCard article={latest.featured} variant="lead" />
                ) : null}
                <div className="journal-lead__side">
                  {latest.articles
                    .filter((article) => article.id !== latest.featured?.id)
                    .slice(0, 3)
                    .map((article) => (
                      <ArticleCard key={article.id} article={article} variant="list" />
                    ))}
                </div>
              </div>
            </>
          ) : (
            <EmptyState title={journalPage.empty} text={journalPage.emptyNote} />
          )}
          <div className="section-actions" data-reveal>
            <ButtonLink href="/journal" variant="outline">
              {home.journalCta}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="home-departments" motion="departements-apercu">
        <Container>
          <div className="split">
            <div>
              <SectionHead
                eyebrow="Le territoire"
                title="Les 12 départements"
                intro={departmentsPage.intro}
              />
              <div className="section-actions" data-reveal>
                <ButtonLink href="/departements">Voir la carte</ButtonLink>
              </div>
            </div>
            <ul className="department-chips" data-reveal>
              {departments.map((department) => (
                <li key={department.name}>
                  <Link to="/departements">{department.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="home-engagements" motion="engagements-apercu">
        <Container>
          <SectionHead
            eyebrow="Les engagements"
            title={engagements.title}
            intro={engagements.intro}
          />
          <div className="engagement-preview" data-reveal>
            {engagements.items.map((item) => (
              <article key={item.key}>
                <p className="eyebrow">{item.lead}</p>
                <h3>{item.name}</h3>
                <p>{item.body[0]}</p>
                <Link to={item.href} className="text-link">
                  {item.action}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="home-suggestions" motion="suggestions-apercu">
        <Container>
          <div className="split split--bordered">
            <div>
              <SectionHead
                eyebrow="Boîte à suggestions"
                title="Une idée pour le Congo ?"
                intro={suggestionsPage.intro}
              />
            </div>
            <div className="suggestions-teaser" data-reveal>
              <p>{suggestionsPage.moderationNote}</p>
              <p className="note">{suggestionsPage.localNote}</p>
              <div className="section-actions">
                <ButtonLink href="/suggestions">{home.suggestionsCta}</ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="home-join band band--paper" motion="rejoindre-apercu">
        <Container>
          <div className="join-block" data-reveal>
            <div>
              <SectionHead eyebrow="Rejoindre" title={home.joinTitle} intro={home.joinText} />
            </div>
            <div className="join-block__actions">
              {site.whatsappUrl ? (
                <ButtonLink href={site.whatsappUrl} external>
                  {home.secondaryCta}
                </ButtonLink>
              ) : (
                <ButtonLink href="/rejoindre" variant="outline">
                  {home.secondaryCta}
                </ButtonLink>
              )}
              <Link to="/rejoindre" className="text-link">
                Lire les conditions de participation
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
