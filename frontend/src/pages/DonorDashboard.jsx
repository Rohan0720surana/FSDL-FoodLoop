import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CountdownTimer from "../components/CountdownTimer";
import FoodTypeBadge from "../components/FoodTypeBadge";
import packingPhoto from "../assets/kitchen-packing.webp";
import { myListings, donorStats } from "../mockdata/listings";
import { urgencyFromDeadline } from "../mockdata/offers";
import { donorOrgs, recipientOrgs } from "../mockdata/orgs";
import { trip } from "../utils/geo";

const kitchen = donorOrgs[0]; // St. Xavier's College Canteen
const accepted = myListings.find((l) => l.status === "ACCEPTED");
const coming = recipientOrgs.find((r) => r.name === accepted.heldBy);
const comingTrip = trip(coming, kitchen);

const activity = [
  { tone: "", text: "Sneh Sadan accepted the paneer trays. Their van left at 9:21 pm.", when: "Today, 9:21 pm" },
  { tone: "muted", text: "Asha Deep passed on the paneer trays, so they moved to Sneh Sadan.", when: "Today, 9:08 pm" },
  { tone: "gold", text: "You posted Paneer tikka trays, 22 meals.", when: "Today, 9:02 pm" },
  { tone: "", text: "Sneh Sadan collected 40 meals of lunch surplus.", when: "Today, 3:12 pm" },
];

const week = [
  { d: "Fri", m: 42, ok: true }, { d: "Sat", m: 118, ok: true }, { d: "Sun", m: 96, ok: true },
  { d: "Mon", m: 0, ok: null }, { d: "Tue", m: 55, ok: false }, { d: "Wed", m: 64, ok: true },
  { d: "Thu", m: 40, ok: true, today: true },
];

function OfferStatus({ l }) {
  if (l.status === "ACCEPTED") {
    return <span className="fl-accepted"><i className="bi bi-truck" aria-hidden="true" />Accepted, van on the way</span>;
  }
  if (l.offersDispatched === 0) {
    return <div className="fl-cascade"><i /><i /><i /><span>Ranking…</span></div>;
  }
  const sent = l.offersDispatched;
  return (
    <div className="fl-cascade" aria-label={`Offer sent to ${sent} recipient${sent === 1 ? "" : "s"} so far`}>
      {[1, 2, 3].map((n) => <i key={n} className={n < sent ? "declined" : n === sent ? "live" : ""} />)}
      <span>{["1st", "2nd", "3rd"][sent - 1]} choice</span>
    </div>
  );
}

export default function DonorDashboard() {
  const sorted = [...myListings].sort((a, b) => a.pickupDeadline - b.pickupDeadline);
  const next = sorted.find((l) => l.status !== "ACCEPTED");

  return (
    <div>
      <Navbar role="donor" />

      <header className="fl-page-header">
        <div className="fl-container">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-4">
            <div>
              <div className="fl-kicker"><b>Thursday evening</b> · Dhobi Talao</div>
              <h1 className="fl-text-2xl mb-2">Good evening, <em>St. Xavier&apos;s Canteen.</em></h1>
              <p className="sub mb-0">Four listings are live. One is being collected, and one runs out in minutes.</p>
            </div>
            <Link to="/donor/listings/new" className="btn btn-primary btn-lg-touch px-4">
              <i className="bi bi-plus-lg" aria-hidden="true" />Post surplus food
            </Link>
          </div>

          <div className="fl-hstats">
            <div><div className="v">{donorStats.activeListings}</div><div className="l">listings live now</div></div>
            <div><div className="v">{donorStats.mealsThisMonth}<small>meals</small></div><div className="l">handed over in September</div></div>
            <div><div className="v">{donorStats.completionRate}<small>%</small></div><div className="l">collected before deadline</div></div>
            <div><div className="v">8.4<small>min</small></div><div className="l">typical wait for a match</div></div>
          </div>
        </div>
      </header>

      <main className="fl-page-body">
        <div className="fl-container py-5">
          <div className="row g-4 align-items-start">
            {/* ---- tonight's board ---- */}
            <div className="col-lg-8">
              <div className="d-flex justify-content-between align-items-end mb-3">
                <h2 className="fl-h2">Tonight&apos;s <em>board</em></h2>
                <span className="fl-text-sm text-muted-fl">Soonest deadline first</span>
              </div>
              <div className="fl-board">
                <div className="fl-board-head">
                  <span>Time left</span><span>Qty</span><span>Food</span><span>Offer status</span><span />
                </div>
                {sorted.map((l) => {
                  const u = urgencyFromDeadline(l.pickupDeadline);
                  return (
                    <div key={l.id} className={`fl-board-row ${u}`}>
                      <CountdownTimer deadline={l.pickupDeadline} />
                      <div className="qty">{l.quantity}<small>meals</small></div>
                      <div style={{ minWidth: 0 }}>
                        <div className="fl-text-base" style={{ fontWeight: 600, lineHeight: 1.3 }}>{l.description.split(",")[0]}</div>
                        <div className="mt-1"><FoodTypeBadge foodType={l.foodType} /></div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <OfferStatus l={l} />
                        <div className="fl-text-sm text-muted-fl mt-1 text-truncate" title={l.heldBy ?? ""}>
                          {l.heldBy ? l.heldBy.replace(" Community Kitchen", "").replace(" Foundation Food Bank", " Foundation") : "Finding recipients"}
                        </div>
                      </div>
                      <button type="button" className="btn btn-outline-secondary btn-sm d-none d-lg-inline-flex">View</button>
                    </div>
                  );
                })}
              </div>
              <p className="fl-text-sm text-muted-fl mt-3 mb-0">
                <span className="fl-cascade d-inline-flex me-1" style={{ verticalAlign: "middle" }}><i className="declined" /></span> passed
                <span className="fl-cascade d-inline-flex ms-3 me-1" style={{ verticalAlign: "middle" }}><i className="live" /></span> deciding now. If they pass, the next ranked kitchen gets it automatically.
              </p>
            </div>

            {/* ---- right column ---- */}
            <div className="col-lg-4">
              <div className="fl-next fl-map-texture mb-4">
                <div className="fl-serif mb-2" style={{ fontSize: 21, fontStyle: "italic", color: "#e7c77a" }}>Next to expire</div>
                <CountdownTimer deadline={next.pickupDeadline} />
                <div className="mt-3 fl-text-base" style={{ fontWeight: 600 }}>{next.quantity} meals · {next.description.split(",")[0]}</div>
                <div className="muted mt-1" style={{ fontSize: 15 }}>
                  With {next.heldBy}, the {["first", "second", "third"][next.offersDispatched - 1]} organisation on the list.
                </div>
                <div className="d-flex gap-2 mt-4">
                  <button type="button" className="btn btn-light btn-sm px-3">Extend 30 min</button>
                  <button type="button" className="btn btn-outline-light btn-sm px-3">Call them</button>
                </div>
              </div>

              <div className="fl-coming">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fl-text-sm text-muted-fl">Coming to you</span>
                  <CountdownTimer deadline={accepted.pickupDeadline} />
                </div>
                <div className="who">{coming.name}</div>
                <div className="fl-text-sm text-secondary-fl mt-1">
                  For {accepted.quantity} meals of paneer trays · {comingTrip.km} km, about {comingTrip.min} min away
                </div>
                <div className="d-flex justify-content-between align-items-end mt-3 pt-3" style={{ borderTop: "1px dashed var(--sand-deep)" }}>
                  <div>
                    <div className="fl-text-xs text-muted-fl">Ask for handover code</div>
                    <div className="fl-code" style={{ fontSize: 22 }}>{accepted.handoverCode}</div>
                  </div>
                  <Link to="/donor/map" className="btn btn-outline-secondary btn-sm"><i className="bi bi-map" aria-hidden="true" />Track</Link>
                </div>
              </div>
            </div>
          </div>

          {/* ---- what happened today: full width ---- */}
          <div className="mt-5">
            <div className="fl-rule-head">
              <h2 className="fl-h2">What happened <em>today</em></h2>
              <span className="fl-text-sm text-muted-fl">Most recent first</span>
            </div>
            <ol className="fl-activity">
              {activity.map((a) => (
                <li key={a.text} className={a.tone}>{a.text}<span className="when">{a.when}</span></li>
              ))}
            </ol>
          </div>

          {/* ---- photo band: packing + week ---- */}
          <div className="fl-photo-band mt-5">
            <img src={packingPhoto} alt="Kitchen staff packing labelled containers of surplus biryani and dal at closing time" loading="lazy" />
            <div className="body">
              <h2 className="fl-h2 mb-2">Packing for a <em>clean handover</em></h2>
              <p className="fl-text-base text-secondary-fl mb-3">
                The kitchens with the best collection rates all do the same three things before the recipient arrives.
              </p>
              <ol className="fl-tips mb-4">
                <li><span><b>Label every container</b> with the dish and the time it was cooked.</span></li>
                <li><span><b>Keep veg and non-veg apart</b>, in separate boxes, so a recipient can accept one without the other.</span></li>
                <li><span><b>Pack before you post.</b> A tray still on the stove makes the deadline a guess.</span></li>
              </ol>
              <div className="d-flex justify-content-between align-items-baseline mb-2">
                <span className="fl-text-base" style={{ fontWeight: 600 }}>Your last seven days</span>
                <span className="fl-text-sm text-muted-fl">415 meals · 1 missed pickup</span>
              </div>
              <div className="fl-week">
                {week.map((w) => (
                  <div key={w.d} className={w.today ? "today" : ""}>
                    <div className="d">{w.d}</div>
                    <div className="m">{w.m || "–"}</div>
                    {w.ok !== null && <div className={`ok ${w.ok ? "" : "miss"}`} title={w.ok ? "Collected on time" : "Recipient missed the pickup"} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
