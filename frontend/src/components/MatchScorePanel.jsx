import FoodTypeBadge from "./FoodTypeBadge";
import CountdownTimer from "./CountdownTimer";
import { urgencyFromDeadline } from "../mockdata/offers";

const WEIGHTS = { urgency: 0.35, proximity: 0.25, capacity: 0.2, typeMatch: 0.1, reliability: 0.1 };
const LABELS = { urgency: "Time", proximity: "Distance", capacity: "Capacity", typeMatch: "Food type", reliability: "Reliability" };

function score(subscores) {
  return Math.round(
    Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + (subscores[k] ?? 0) * w, 0) * 100
  );
}

function reasons(subscores) {
  const list = [];
  if (subscores.urgency > 0.45) list.push("Time feasible");
  if (subscores.capacity > 0.55) list.push("Fits your capacity");
  if (subscores.typeMatch >= 0.6) list.push("Food type you accept");
  if (subscores.reliability > 0.65) list.push("Reliable donor");
  return list.length ? list : ["Feasible, lower priority"];
}

function ScoreRing({ value }) {
  const r = 33;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#1fa97e" : value >= 55 ? "#c9a24a" : "#8c948d";
  return (
    <div className="fl-ring" role="img" aria-label={`Match score ${value} out of 100`}>
      <svg width="78" height="78" viewBox="0 0 78 78">
        <circle cx="39" cy="39" r={r} fill="none" stroke="#e8dfca" strokeWidth="6" />
        <circle cx="39" cy="39" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="val">{value}<small>match</small></div>
    </div>
  );
}

export default function MatchScorePanel({ offer, actions, rank }) {
  const s = score(offer.subscores);
  const urgency = urgencyFromDeadline(offer.listing.pickupDeadline);
  const eta = offer.etaMin ?? Math.round(offer.distanceKm * 4.5);

  return (
    <article className={`fl-offer ${urgency}`}>
      <div className="main">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <span className="rankno">
            {(rank ?? offer.rank) === 1 ? "Best match for you" : `Match #${rank ?? offer.rank}`}
          </span>
          <CountdownTimer deadline={offer.listing.pickupDeadline} />
        </div>
        <h3>{offer.listing.quantity} meals <span>· {offer.listing.description.split(",")[0]}</span></h3>
        <div className="meta d-flex flex-wrap align-items-center gap-2">
          <FoodTypeBadge foodType={offer.listing.foodType} />
          <span>{offer.listing.donorOrgName}, {offer.listing.donorLocality}</span>
        </div>
        <div className="meta text-muted-fl mt-1">{offer.distanceKm} km away · about {eta} min by road</div>
        <div className="why">
          {reasons(offer.subscores).map((r) => <span key={r}>{r}</span>)}
        </div>
        {actions && <div className="acts">{actions}</div>}
      </div>

      <div className="side">
        <ScoreRing value={s} />
        <div className="fl-subs" aria-label="Score breakdown">
          {Object.keys(WEIGHTS).map((k) => (
            <div className="r" key={k}>
              <span>{LABELS[k]}</span>
              <span className="b"><span style={{ width: `${Math.round((offer.subscores[k] ?? 0) * 100)}%` }} /></span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
