import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CountdownTimer from "../components/CountdownTimer";
import FoodTypeBadge from "../components/FoodTypeBadge";
import { foodTypeMeta } from "../mockdata/offers";
import { donorOrgs, recipientOrgs } from "../mockdata/orgs";
import { trip } from "../utils/geo";

function toLocalInput(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function relativePreview(value) {
  if (!value) return "Pick a deadline to see how long recipients will have";
  const diffMin = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  if (Number.isNaN(diffMin)) return "Pick a deadline";
  if (diffMin <= 0) return "That's already in the past — pick a later time";
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return h > 0 ? `${h} h ${m} min from now` : `${m} min from now`;
}

// Recipients around the canteen: what they accept and how much room they have left tonight.
const KITCHEN = donorOrgs[0];
const ACCEPTS = {
  r1: { room: 60, takes: ["VEG", "NON_VEG", "VEGAN"] },
  r2: { room: 48, takes: ["VEG", "NON_VEG", "BAKERY", "PACKAGED"] },
  r3: { room: 90, takes: ["VEG", "NON_VEG", "PACKAGED"] },
  r4: { room: 120, takes: ["VEG", "NON_VEG", "PACKAGED", "BAKERY"] },
  r5: { room: 25, takes: ["VEG", "VEGAN"] },
};
const nearby = recipientOrgs
  .map((r) => ({ ...r, ...ACCEPTS[r.id], t: trip(r, KITCHEN) }))
  .sort((x, y) => x.t.min - y.t.min);

export default function CreateListing() {
  const [desc, setDesc] = useState("Veg biryani + dal");
  const [foodType, setFoodType] = useState("VEG");
  const [qty, setQty] = useState(48);
  const [deadline, setDeadline] = useState(() => toLocalInput(Date.now() + 2 * 60 * 60 * 1000));
  const [posted, setPosted] = useState(false);

  const deadlineMs = new Date(deadline).getTime();
  const minsLeft = Number.isNaN(deadlineMs) ? 0 : (deadlineMs - Date.now()) / 60000;
  const why = (r) => {
    if (!r.takes.includes(foodType)) return "Doesn't take this";
    if (r.room < Number(qty || 0)) return "Not enough room";
    if (r.t.min > minsLeft) return "Can't arrive in time";
    return null;
  };
  const fits = useMemo(() => nearby.filter((r) => !why(r)), [foodType, qty, minsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Navbar role="donor" />

      <header className="fl-page-header">
        <div className="fl-container">
          <div className="fl-kicker"><b>New listing</b> · St. Xavier&apos;s College Canteen</div>
          <h1 className="fl-text-2xl mb-2">What&apos;s left over <em>tonight?</em></h1>
          <p className="sub fl-text-sm mb-0">Three questions. Nearby recipients are ranked the moment you post.</p>
        </div>
      </header>

      <main className="fl-page-body">
        <div className="fl-container py-5">
          <div className="row g-5">
            <div className="col-lg-7">
              <section className="fl-form-sect">
                <span className="no">1</span>
                <div>
                  <h2>What food is it?</h2>
                  <label className="form-label" htmlFor="desc">Dish, as you'd write it on the label</label>
                  <input id="desc" className="form-control mb-3" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  <span className="form-label d-block">Type</span>
                  <div className="d-flex flex-wrap gap-2">
                    {Object.entries(foodTypeMeta).map(([key, meta]) => (
                      <button type="button" key={key} className={`chip ${foodType === key ? "selected" : ""}`} onClick={() => setFoodType(key)} aria-pressed={foodType === key}>
                        <i className={`bi ${meta.icon} me-1`} aria-hidden="true" />{meta.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="fl-form-sect">
                <span className="no">2</span>
                <div>
                  <h2>How much?</h2>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="qty">Quantity</label>
                      <input id="qty" type="number" className="form-control" value={qty} min={1} onChange={(e) => setQty(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="unit">Unit</label>
                      <select id="unit" className="form-select" defaultValue="MEALS">
                        <option value="MEALS">Meals</option>
                        <option value="KG">Kg</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-text">A meal is roughly one plate — about 350 g of cooked food.</div>
                </div>
              </section>

              <section className="fl-form-sect">
                <span className="no">3</span>
                <div>
                  <h2>Until when can you hold it?</h2>
                  <label className="form-label" htmlFor="deadline">Pickup deadline</label>
                  <input id="deadline" type="datetime-local" className="form-control" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  <div className="form-text mb-3">{relativePreview(deadline)}</div>
                  <label className="form-label" htmlFor="addr">Pickup address</label>
                  <input id="addr" className="form-control" defaultValue="St. Xavier's College Canteen, Dhobi Talao, Mumbai" />
                  <div className="form-text">Pin confirmed on map · 18.9497° N, 72.8296° E</div>
                </div>
              </section>

              <div className="d-flex justify-content-between align-items-center gap-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <Link to="/donor" className="fl-text-sm text-secondary-fl">Cancel</Link>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-lg-touch px-4">Save draft</button>
                  <button type="button" className="btn btn-primary btn-lg-touch px-4" onClick={() => setPosted(true)} disabled={fits.length === 0}>
                    {posted ? "Posted ✓" : "Post listing"}
                  </button>
                </div>
              </div>
            </div>

            {/* ---- live preview ---- */}
            <div className="col-lg-5">
              <div style={{ position: "sticky", top: 90 }}>
                <div className="fl-preview-label">What recipients will see</div>
                <div className="fl-offer" style={{ display: "block" }}>
                  <div className="main">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="rankno">New offer</span>
                      {!Number.isNaN(deadlineMs) && deadlineMs > Date.now() && <CountdownTimer deadline={deadlineMs} />}
                    </div>
                    <h3>{qty || 0} meals <span>· {desc || "Your dish"}</span></h3>
                    <div className="meta d-flex flex-wrap gap-2 align-items-center">
                      <FoodTypeBadge foodType={foodType} />
                      <span>St. Xavier&apos;s College Canteen, Dhobi Talao</span>
                    </div>
                  </div>
                </div>

                <div className="fl-preview-label mt-4">Who could take it right now</div>
                <div className="fl-board">
                  {nearby.map((r) => {
                    const ok = fits.includes(r);
                    const reason = why(r);
                    return (
                      <div key={r.name} className="d-flex justify-content-between align-items-center px-3 py-3" style={{ borderBottom: "1px solid var(--border)", opacity: ok ? 1 : 0.45, transition: "opacity 250ms" }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="fl-text-sm text-truncate" style={{ fontWeight: 600 }}>{r.name}</div>
                          <div className="fl-text-xs text-muted-fl">{r.locality} · {r.t.km} km · ~{r.t.min} min · room for {r.room}</div>
                        </div>
                        <span className="fl-text-xs ms-2 text-nowrap" style={{ color: ok ? "var(--primary-hover)" : "var(--text-muted)", fontWeight: 600 }}>
                          {ok ? "Can take it" : reason}
                        </span>
                      </div>
                    );
                  })}
                  <div className="px-3 py-3 fl-text-xs text-secondary-fl" style={{ background: "var(--bg)" }}>
                    {fits.length > 0
                      ? <><strong>{fits.length}</strong> of {nearby.length} nearby recipients fit. The best-ranked one gets the offer first.</>
                      : "Nobody nearby can take this as it stands. Try a later deadline or smaller batches."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
