import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MatchScorePanel from "../components/MatchScorePanel";
import PickupTicket from "../components/PickupTicket";
import { mockOffers } from "../mockdata/offers";
import { recipientImpact } from "../mockdata/impact";
import vanPhoto from "../assets/van-dusk.webp";
import { myListings } from "../mockdata/listings";
import { donorOrgs, recipientOrgs } from "../mockdata/orgs";
import { trip } from "../utils/geo";

const USED = 32;
const CAPACITY = 80;
// Tonight's accepted pickup: St. Xavier's paneer trays (same listing the donor sees as "coming to you")
const pickup = myListings.find((l) => l.status === "ACCEPTED");
const pickupTrip = trip(recipientOrgs.find((r) => r.id === "r2"), donorOrgs[0]);

const tonight = [
  { tone: "", text: "Dinner service for 64 children", when: "7:30 pm · kitchen" },
  { tone: "gold", text: "Van left for St. Xavier's, Dhobi Talao", when: "9:21 pm · Ramesh driving" },
  { tone: "muted", text: "Expected back with 22 meals", when: "around 10:30 pm" },
];

export default function RecipientDashboard() {
  const pending = mockOffers.slice(0, 2);
  const lit = Math.round((USED / CAPACITY) * 16);

  return (
    <div>
      <Navbar role="recipient" />

      <header className="fl-page-header">
        <div className="fl-container">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-4">
            <div>
              <div className="fl-kicker"><b>Thursday evening</b> · Dadar</div>
              <h1 className="fl-text-2xl mb-2">Good evening, <em>Sneh Sadan.</em></h1>
              <p className="sub mb-0">Four offers are waiting. The bakery one closes in under an hour.</p>
            </div>
            <div className="fl-capacity">
              <div className="d-flex justify-content-between align-items-baseline mb-3">
                <div className="big">{CAPACITY - USED}<small>meals of room left today</small></div>
              </div>
              <div className="fl-seg" aria-label={`${USED} of ${CAPACITY} meals of capacity used`}>
                {Array.from({ length: 16 }, (_, i) => <i key={i} className={i < lit ? "on" : ""} />)}
              </div>
              <div className="fl-text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>{USED} of {CAPACITY} used · offers above your room are never sent</div>
            </div>
          </div>

          <div className="fl-hstats">
            <div><div className="v">{recipientImpact.mealsRedistributed}<small>meals</small></div><div className="l">received in September</div></div>
            <div><div className="v">{recipientImpact.completionRate}<small>%</small></div><div className="l">pickups made on time</div></div>
            <div><div className="v">{recipientImpact.avgPickupDistanceKm}<small>km</small></div><div className="l">typical drive to a kitchen</div></div>
          </div>
        </div>
      </header>

      <main className="fl-page-body">
        <div className="fl-container py-5">
          <div className="row g-5">
            <div className="col-lg-8">
              <div className="d-flex justify-content-between align-items-end mb-3">
                <h2 className="fl-h2">Waiting for <em>your answer</em></h2>
                <Link to="/recipient/offers" className="fl-text-sm" style={{ color: "var(--primary-hover)", fontWeight: 600 }}>
                  All 4 offers <i className="bi bi-arrow-right" />
                </Link>
              </div>
              {pending.map((o, i) => (
                <MatchScorePanel
                  key={o.id}
                  offer={o}
                  rank={i + 1}
                  actions={
                    <>
                      <button type="button" className="btn btn-primary btn-sm px-3">Accept &amp; send staff</button>
                      <button type="button" className="btn btn-outline-secondary btn-sm px-3">Pass</button>
                    </>
                  }
                />
              ))}
              <p className="fl-text-xs text-muted-fl mt-2 mb-0">
                Passing costs you nothing. The offer simply moves to the next kitchen on the list.
              </p>
            </div>

            <div className="col-lg-4">
              <h2 className="fl-text-sm mb-3" style={{ fontWeight: 600 }}>On the road now</h2>
              <PickupTicket
                from="St. Xavier's College Canteen, Dhobi Talao"
                to="Sneh Sadan Balgram, Dadar"
                food="paneer tikka trays"
                meals={pickup.quantity}
                deadline={pickup.pickupDeadline}
                distanceKm={pickupTrip.km}
                etaMin={pickupTrip.min}
                code={pickup.handoverCode}
              >
                <Link to="/recipient/map" className="btn btn-outline-secondary btn-sm"><i className="bi bi-map" aria-hidden="true" />Route</Link>
              </PickupTicket>

              <h2 className="fl-text-sm mt-5 mb-3" style={{ fontWeight: 600 }}>Tonight at Sneh Sadan</h2>
              <ul className="fl-tl">
                {tonight.map((t) => (
                  <li key={t.text} className={t.tone}>{t.text}<span className="when">{t.when}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---- photo band: collecting well ---- */}
          <div className="fl-photo-band mt-5">
            <img src={vanPhoto} alt="Two community-kitchen volunteers loading crates of sealed meal containers into a van outside a restaurant at dusk" loading="lazy" />
            <div className="body">
              <h2 className="fl-h2 mb-2">Collecting like the <em>kitchens expect</em></h2>
              <p className="fl-text-sm text-secondary-fl mb-3">
                Donors rank reliable recipients higher next time. These three habits are what they notice.
              </p>
              <ol className="fl-tips mb-4">
                <li><span><b>Bring your own crates.</b> Kitchens hand over sealed containers, not their serving trays.</span></li>
                <li><span><b>Show the handover code</b> at the door, so the kitchen knows exactly who you are.</span></li>
                <li><span><b>Confirm collection before you drive off.</b> It closes the listing and tells the donor it&apos;s safe.</span></li>
              </ol>
              <div className="d-flex justify-content-between align-items-baseline mb-2">
                <span className="fl-text-sm" style={{ fontWeight: 600 }}>Your pickups this week</span>
                <span className="fl-text-xs text-muted-fl">6 of 6 on time</span>
              </div>
              <div className="fl-week">
                {[["Fri", 36], ["Sat", 48], ["Sun", 0], ["Mon", 30], ["Tue", 42], ["Wed", 25], ["Thu", 40]].map(([d, m], i) => (
                  <div key={d} className={i === 6 ? "today" : ""}>
                    <div className="d">{d}</div>
                    <div className="m">{m || "–"}</div>
                    {m > 0 && <div className="ok" title="Collected on time" />}
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
