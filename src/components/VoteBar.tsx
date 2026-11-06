import { votePercent } from '../lib/suggestions';
import { suggestionsPage } from '../content/fr';

export function VoteBar({
  useful,
  notUseful,
  revealed,
}: {
  useful: number;
  notUseful: number;
  revealed: boolean;
}) {
  const total = useful + notUseful;
  const percent = votePercent(useful, notUseful);
  if (!revealed) {
    return (
      <p className="vote-hidden">
        <span className="vote-hidden__mark" aria-hidden="true" />
        {suggestionsPage.voteHint}
      </p>
    );
  }
  return (
    <div className="vote-result" aria-live="polite">
      <div
        className="vote-bar"
        role="img"
        aria-label={`${percent} % des votes sont « Utile », ${100 - percent} % « Pas utile », sur ${total} votes.`}
      >
        <span className="vote-bar__useful" style={{ width: `${percent}%` }} />
        <span className="vote-bar__not-useful" style={{ width: `${100 - percent}%` }} />
        <span className="vote-bar__contact" style={{ left: `${percent}%` }} aria-hidden="true" />
      </div>
      <div className="vote-legend">
        <span>
          <span className="legend-dot legend-dot--useful" aria-hidden="true" />
          {suggestionsPage.voteUseful} <strong>{useful}</strong>
        </span>
        <span>
          <span className="legend-dot legend-dot--not-useful" aria-hidden="true" />
          {suggestionsPage.voteNotUseful} <strong>{notUseful}</strong>
        </span>
        <span className="vote-legend__percent">{percent} %</span>
      </div>
    </div>
  );
}
