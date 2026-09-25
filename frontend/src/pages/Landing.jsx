import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../components/LeafletIconFix";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CountdownTimer from "../components/CountdownTimer";
import heroClosing from "../assets/hero-closing.webp";
import packingPhoto from "../assets/kitchen-packing.webp";
import handoverPhoto from "../assets/handover.webp";
import stepPost from "../assets/step-post.webp";
import stepOffer from "../assets/step-offer.webp";
import stepCollect from "../assets/step-collect.webp";
import { mockPlatformStats } from "../mockdata/offers";
import { platformImpact } from "../mockdata/impact";
import { donorOrgs, recipientOrgs, activeListingMarkers, mumbaiCenter } from "../mockdata/orgs";

const now = Date.now();
const min = 60 * 1000;

const showcaseListing = {
  description: "Veg biryani + dal",
  quantity: 48,
  donorOrgName: "Regency Banquet Hall",
  donorLocality: "Andheri West",
  pickupDeadline: now + 102 * min,
};

// Listed in distance order. The closest one is full tonight, so it drops to last once scored.
const candidates = [
  { id: "sahyog", name: "Sahyog Food Collective", locality: "Khar", distanceKm: 1.1, etaMin: 7, score: 58, note: "only 10 meals of space left" },
  { id: "annapurna", name: "Annapurna Community Kitchen", locality: "Bandra", distanceKm: 2.3, etaMin: 11, score: 92, note: "time feasible, capacity fit" },
  { id: "udaan", name: "Udaan Community Kitchen", locality: "Kurla", distanceKm: 6.7, etaMin: 29, score: 61, note: "feasible, 29 min drive" },
];
const byScore = [...candidates].sort((a, b) => b.score - a.score).map((c) => c.id);
const ROW_H = 76;

const localities = [
  "Andheri West", "Bandra", "Dadar", "Kurla", "Chembur", "BKC", "Colaba", "Powai",
  "Ghatkopar", "Malad", "Byculla", "Matunga", "Lower Parel", "Vile Parle", "Sion", "Khar",
];

const evening = [
  { tm: "9:40 pm", tx: "Wedding at a banquet hall in Andheri ends. Sixty thalis untouched." },
  { tm: "9:55 pm", tx: "Manager calls two NGOs he has numbers for. One is closed, one doesn't pick up." },
  { tm: "10:30 pm", tx: "A volunteer group replies on WhatsApp. Their van is in Thane." },
  { tm: "11:15 pm", tx: "Kitchen staff need to leave. The trays are still sitting out." },
  { tm: "12:05 am", tx: "Food is thrown away.", bad: true },
];

const steps = [
  { n: "1", img: stepPost, alt: "A chef holding a phone above trays of leftover biryani, paneer and dal next to stacks of empty meal containers", title: "A kitchen posts what's left", body: "Quantity, food type, and a hard pickup deadline. Under a minute, typed while closing up." },
  { n: "2", img: stepOffer, alt: "A community-kitchen coordinator at her desk checking an offer on her phone, chai and notebook beside her", title: "FoodLoop picks who can make it", body: "Every nearby recipient is scored on reachability, distance, spare capacity, food type and track record." },
  { n: "3", img: stepCollect, alt: "A young volunteer walking out of a restaurant kitchen door carrying crates of sealed meal containers", title: "Their staff come to collect", body: "The top-ranked organisation gets one offer with a countdown. They accept, and their own people drive over." },
];

const factors = [
  { label: "Time feasibility", w: 35, c: "#1e4435", body: "Can they arrive before the deadline?" },
  { label: "Proximity", w: 25, c: "#1fa97e", body: "Distance inside their service radius." },
  { label: "Capacity fit", w: 20, c: "#c9a24a", body: "Room left for this quantity today." },
  { label: "Food type", w: 10, c: "#a88a3c", body: "Veg, non-veg, bakery — what they take." },
  { label: "Reliability", w: 10, c: "#8c948d", body: "How often they've actually turned up." },
];

const faqs = [
  {
    q: "Does FoodLoop deliver the food?",
    a: "No. FoodLoop is a matching platform, not a delivery service. The recipient organisation's own staff travels to the donor and collects directly. This keeps the platform free to run and keeps food-handling responsibility with the organisations already licensed for it.",
  },
  {
    q: "Why not just send every listing to everyone nearby?",
    a: "Because broadcasting creates a race, not a fit. A shelter 800 metres away with no capacity left, or one that can't reach you before closing, isn't a match — it's a wasted notification and an expired listing. FoodLoop ranks, then offers to one organisation at a time.",
  },
  {
    q: "What happens if the top-ranked recipient declines?",
    a: "The offer cascades automatically to the next feasible organisation on the ranked list, and keeps cascading until someone accepts or the deadline passes. Declining costs a recipient nothing — it just moves the food along faster.",
  },
  {
    q: "Who can register as a donor?",
    a: "Institutional kitchens — restaurants, hotels, college canteens, caterers, event venues, bakeries and grocery stores. Individual households aren't eligible in this version, because food-safety accountability sits with licensed food handlers.",
  },
  {
    q: "How is food safety handled?",
    a: "Only licensed food businesses can post, and every container is labelled with the dish and the time it was cooked. The deadline a kitchen sets is the latest it is still safe to eat, so offers that can't be collected before then are never sent. Recipients check labels and count at the door before confirming the handover.",
  },
];

function dot(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px ${color}66;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function RankedList() {
  const [ranked, setRanked] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let t;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        t = setTimeout(() => setRanked(true), 900);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  const replay = () => {
    setRanked(false);
    setTimeout(() => setRanked(true), 1100);
  };

  const order = ranked ? byScore : candidates.map((c) => c.id);

  return (
    <div className="fl-rank-panel" ref={ref}>
      <div className="fl-rank-head">
        <div>
          <div className="fl-text-lg" style={{ fontWeight: 600 }}>{showcaseListing.description}</div>
          <div className="fl-text-sm text-secondary-fl mt-1">
            {showcaseListing.quantity} meals · {showcaseListing.donorOrgName}, {showcaseListing.donorLocality}
          </div>
        </div>
        <span className="fl-timer-chip"><CountdownTimer deadline={showcaseListing.pickupDeadline} /></span>
      </div>
      <div className="px-4 pt-3 pb-2 d-flex justify-content-between align-items-center">
        <span className={`fl-rank-mode ${ranked ? "on" : ""}`}>
          {ranked ? "Ranked by FoodLoop score" : "Sorted by distance"}
        </span>
        <button type="button" className="fl-replay" onClick={replay}>
          <i className="bi bi-arrow-counterclockwise me-1" />Replay
        </button>
      </div>
      <div className="fl-rank-stack" style={{ height: candidates.length * ROW_H }} aria-live="polite">
        {candidates.map((m) => {
          const pos = order.indexOf(m.id);
          const top = ranked && pos === 0;
          return (
            <div
              key={m.id}
              className={`fl-rank-row ${top ? "top" : ""}`}
              style={{ transform: `translateY(${pos * ROW_H}px)` }}
            >
              <span className="rk">{pos + 1}</span>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="fl-text-sm text-truncate" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</span>
                  {top && <span className="fl-check-chip" style={{ padding: "1px 8px" }}>Offer sent</span>}
                </div>
                <div className="fl-text-xs text-secondary-fl mt-1 text-truncate">
                  {m.locality} · {m.distanceKm} km · {m.note}
                </div>
              </div>
              <div className="fl-score-pill" style={{ opacity: ranked ? 1 : 0.35, transition: "opacity 400ms" }}>
                {m.score}<small>/100</small>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 fl-text-xs text-muted-fl" style={{ borderTop: "1px solid var(--border)" }}>
        Sahyog is closest but nearly full, so Annapurna gets the offer. If Annapurna declines, it moves to Udaan on its own.
      </div>
    </div>
  );
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="fl-photo-hero">
        <div className="fl-hero-bg" style={{ backgroundImage: `url(${heroClosing})` }} aria-hidden="true" />
        <Navbar role="public" overlay />
        <div className="fl-container py-5" style={{ width: "100%" }}>
          <div className="row g-5 align-items-center" style={{ paddingTop: 48 }}>
            <div className="col-lg-8">
              <div className="fl-pill mb-4">
                <span className="fl-live"><span className="dot" /></span>
                {mockPlatformStats.activeDonors + mockPlatformStats.activeRecipients} organisations connected across Mumbai
              </div>
              <h1 className="fl-display-hero fl-text-5xl" style={{ color: "#fff", maxWidth: 700 }}>
                Surplus food, matched <em>before the clock</em> runs out.
              </h1>
              <p className="fl-text-lg mt-4" style={{ color: "rgba(255,255,255,0.82)", maxWidth: 520 }}>
                Every evening kitchens across the city finish service with good food they can't sell
                and can't store. FoodLoop routes it to the organisation that can genuinely collect
                it in time.
              </p>
              <div className="d-flex flex-wrap align-items-center gap-3 mt-5">
                <Link to="/donor" className="btn btn-primary btn-lg-touch px-4 text-nowrap">
                  Post surplus food
                </Link>
                <a href="#how-it-works" className="btn btn-outline-light btn-lg-touch px-4 text-nowrap">
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="fl-stats-band">
        <div className="fl-container">
          <div className="row g-3">
            {[
              { v: platformImpact.mealsRedistributed.toLocaleString("en-IN"), u: "meals", l: "redistributed so far", c: "↑ 12% on last month", featured: true },
              { v: mockPlatformStats.activeDonors + mockPlatformStats.activeRecipients, u: "orgs", l: "on the network", c: "34 kitchens · 51 recipients" },
              { v: mockPlatformStats.avgTimeToMatchMin, u: "min", l: "average time to match", c: "from post to accepted offer" },
              { v: platformImpact.completionRate, u: "%", l: "of offers collected", c: "no-shows lower future rank" },
            ].map((s) => (
              <div className="col-6 col-lg-3" key={s.l}>
                <div className={`fl-stat-card ${s.featured ? "featured" : ""}`}>
                  <div className="num">{s.v}<span className="unit">{s.u}</span></div>
                  <div className="lbl">{s.l}</div>
                  <div className="ctx">{s.c}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LOCALITY MARQUEE ============ */}
      <div className="fl-marquee mt-5" aria-label="Localities on the network">
        <div className="fl-marquee-track">
          {[...localities, ...localities].map((l, i) => (
            <span key={i} aria-hidden={i >= localities.length}>{l}<i>●</i></span>
          ))}
        </div>
      </div>

      {/* ============ THE PROBLEM ============ */}
      <section id="about" className="fl-section-white fl-section">
        <div className="fl-container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h2 className="fl-display fl-text-4xl mb-4">
                It was never a shortage of generosity. <em>It was timing.</em>
              </h2>
              <p className="fl-text-base text-secondary-fl mb-3" style={{ maxWidth: 520 }}>
                A banquet hall in Andheri finishes a wedding with sixty untouched thalis. Four
                kilometres away, a community kitchen is short for tomorrow's lunch. Both want the
                same outcome. Neither knows about the other.
              </p>
              <p className="fl-text-base text-secondary-fl mb-0" style={{ maxWidth: 520 }}>
                Most platforms broadcast a listing to everyone nearby and hope someone shows up.
                That treats distance as the only thing that matters and ignores the constraint
                that actually decides the outcome: the clock.
              </p>
            </div>

            <div className="col-lg-5 offset-lg-1">
              <figure className="fl-problem-photo mb-0">
                <img src={packingPhoto} alt="Kitchen staff packing labelled containers of leftover biryani and dal at 10:35 pm" loading="lazy" />
                <figcaption><span className="t">10:35 pm</span> Packing what&apos;s left, with nowhere yet to send it.</figcaption>
              </figure>
            </div>
          </div>

          <div className="fl-evening-strip">
            <div className="head">
              <span className="fl-serif" style={{ fontSize: 22 }}>A Saturday in Andheri, <em>without FoodLoop</em></span>
              <span className="fl-text-xs text-muted-fl">An illustrative evening</span>
            </div>
            <ol>
              {evening.map((e) => (
                <li key={e.tm} className={e.bad ? "bad" : ""}>
                  <span className="tm">{e.tm}</span>
                  <span className="tx">{e.tx}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ============ WHAT FOODLOOP IS ============ */}
      <section className="fl-section-mint fl-section">
        <div className="fl-container">
          <p className="fl-pullquote mb-5" style={{ maxWidth: 880 }}>
            FoodLoop isn't a donation website and it isn't a delivery app. It works more like a
            dispatch desk: take a time-critical item, work out who can really handle it, and
            route it there <em className="fl-serif" style={{ color: "var(--primary)" }}>before the window closes.</em>
          </p>
          <div className="row g-4">
            {[
              { t: "Targeted, not broadcast", b: "One ranked offer at a time, so nobody races and nothing gets double-claimed." },
              { t: "Deadline comes first", b: "A recipient who can't arrive in time is filtered out before scoring even starts." },
              { t: "Cascades on its own", b: "Declines and timeouts move the offer down the list without anyone chasing." },
              { t: "Measured, not assumed", b: "Benchmarked against naive baselines and an optimal upper bound." },
            ].map((f, i) => (
              <div className="col-6 col-lg-3" key={f.t}>
                <div className="fl-point">
                  <span className="n">{["i.", "ii.", "iii.", "iv."][i]}</span>
                  <div className="fl-text-base mt-2 mb-1" style={{ fontWeight: 600 }}>{f.t}</div>
                  <div className="fl-text-sm text-secondary-fl">{f.b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="fl-section-sand fl-section">
        <div className="fl-container">
          <div className="row mb-5 align-items-end g-4">
            <div className="col-lg-6">
              <h2 className="fl-display fl-text-4xl mb-0">From a full tray to a <em>served meal.</em></h2>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <p className="fl-text-sm text-secondary-fl mb-0">
                Mumbai's dabbawalas move two lakh lunches a day on a simple rule: every tiffin has
                a code and a time it must arrive by. FoodLoop borrows the same idea for surplus.
              </p>
            </div>
          </div>
          <div className="row g-5 fl-steps-photos">
            {steps.map((s) => (
              <div className="col-md-4" key={s.n}>
                <figure className="fl-step-photo">
                  <img src={s.img} alt={s.alt} loading="lazy" />
                  <span className="big" aria-hidden="true">{s.n}</span>
                </figure>
                <h3 className="fl-text-xl mb-2" style={{ fontWeight: 600 }}><span className="visually-hidden">Step {s.n}: </span>{s.title}</h3>
                <p className="fl-text-sm text-secondary-fl mb-0" style={{ maxWidth: 340 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MATCHING ENGINE ============ */}
      <section id="matching" className="fl-section fl-section-white">
        <div className="fl-container">
          <div className="row g-5 align-items-center mb-5">
            <div className="col-lg-7 order-lg-2">
              <RankedList />
            </div>
            <div className="col-lg-5 order-lg-1">
              <div className="fl-kicker"><b>The matching engine</b></div>
              <h2 className="fl-display fl-text-4xl mb-4">
                Nearby isn&apos;t the same as <em>feasible.</em>
              </h2>
              <p className="fl-text-base text-secondary-fl mb-0" style={{ maxWidth: 440 }}>
                The closest organisation is often the wrong one. They may be full, closed,
                unable to take a vegetarian-only batch, or stuck behind Western Express Highway
                traffic. So every candidate is scored before a single offer goes out.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="d-flex justify-content-between align-items-baseline mb-3 flex-wrap gap-2">
              <span className="fl-text-sm" style={{ fontWeight: 600 }}>How the score is weighted</span>
              <span className="fl-text-xs text-muted-fl">Adds up to 100</span>
            </div>
            <div className="fl-weight-bar" role="img" aria-label="Score weights: time 35, proximity 25, capacity 20, food type 10, reliability 10">
              {factors.map((f) => <span key={f.label} style={{ width: `${f.w}%`, background: f.c }} />)}
            </div>
            <div className="fl-weight-legend">
              {factors.map((f) => (
                <div key={f.label}>
                  <div className="fl-text-sm"><span className="sw" style={{ background: f.c }} />{f.label} <span className="pc ms-1">{f.w}%</span></div>
                  <div className="fl-text-xs text-secondary-fl mt-1">{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TWO AUDIENCES (full bleed split) ============ */}
      <section className="fl-split">
        <div className="dark" id="donors">
          <div style={{ maxWidth: 480, marginLeft: "auto" }}>
            <div className="fl-kicker" style={{ color: "#e7c77a" }}>For donor kitchens</div>
            <h3 className="fl-display fl-text-3xl mb-3" style={{ color: "#fff" }}>You're closing up. It takes a minute.</h3>
            <p className="fl-text-sm mb-4">
              Restaurants, hotels, canteens, caterers and banquet halls. Post what's left, set the
              deadline you can hold it until, and FoodLoop finds who can come and get it.
            </p>
            <ul>
              {["Posting takes under a minute", "You set the pickup deadline", "Contact shared only after acceptance", "No-shows lower a recipient's future rank"].map((t) => <li key={t}>{t}</li>)}
            </ul>
            <Link to="/donor" className="btn btn-primary px-4">Post surplus food</Link>
          </div>
        </div>
        <div className="light" id="recipients">
          <div style={{ maxWidth: 480 }}>
            <div className="fl-kicker"><b>For recipient organisations</b></div>
            <h3 className="fl-display fl-text-3xl mb-3">Only offers you can actually fulfil.</h3>
            <p className="fl-text-sm text-secondary-fl mb-4">
              NGOs, shelters, community kitchens and food banks. Declare capacity, radius, hours and
              food types once. After that you only see offers that fit.
            </p>
            <ul>
              {["Ranked offers, not a scramble", "Every offer says why you were picked", "Decline freely, no penalty", "Your own staff collect, on your schedule"].map((t) => <li key={t}>{t}</li>)}
            </ul>
            <Link to="/register" className="btn btn-outline-secondary px-4">Register your organisation</Link>
          </div>
        </div>
      </section>

      {/* ============ IMPACT ============ */}
      <section id="impact" className="fl-section-sand fl-section">
        <div className="fl-container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-5">
              <figure className="fl-handover-photo mb-0">
                <img src={handoverPhoto} alt="A banquet-hall chef handing sealed meal containers to two staff from a community kitchen at the kitchen door" loading="lazy" />
                <figcaption><span className="t">3:12 pm</span> Lunch surplus leaves the kitchen door. No courier, just the people who&apos;ll serve it.</figcaption>
              </figure>
            </div>
            <div className="col-lg-7">
              <p className="fl-pullquote mb-3">
                &ldquo;Forty-eight meals reached us with an hour to spare. That&apos;s the whole difference.&rdquo;
              </p>
              <div className="fl-text-sm text-secondary-fl mb-5">Kitchen coordinator, Annapurna Community Kitchen, Bandra</div>

              <div className="row g-4 align-items-center">
                <div className="col-md-6">
                  <div className="fl-receipt">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="rh">Handover #FL-2291</span>
                      <span className="fl-text-xs text-muted-fl">Sat, 3:12 pm</span>
                    </div>
                    {[
                      ["From", "Regency Banquet Hall"],
                      ["To", "Annapurna Kitchen"],
                      ["Food", "Veg biryani + dal"],
                      ["Quantity", "48 meals"],
                      ["Posted → collected", "38 min"],
                      ["Time to spare", "1 h 04 m"],
                    ].map(([k, v]) => (
                      <div className="rline" key={k}><span>{k}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span></div>
                    ))}
                    <span className="stamp">Collected</span>
                  </div>
                </div>
                <div className="col-md-6 ps-md-4">
                  <div className="fl-serif" style={{ fontSize: 76, lineHeight: 0.9, fontWeight: 500 }}>
                    {platformImpact.mealsRedistributed.toLocaleString("en-IN")}
                  </div>
                  <div className="fl-text-sm text-secondary-fl mt-2 mb-4">meals that didn&apos;t go into a bin</div>
                  <div className="d-flex gap-4">
                    {[
                      [mockPlatformStats.avgTimeToMatchMin + " min", "to find a match"],
                      [platformImpact.completionRate + "%", "collected on time"],
                    ].map(([n, t]) => (
                      <div key={t} style={{ borderLeft: "2px solid var(--gold)", paddingLeft: 14 }}>
                        <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{n}</div>
                        <div className="fl-text-xs text-secondary-fl">{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MUMBAI ============ */}
      <section id="mumbai" className="fl-section-white fl-section">
        <div className="fl-container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-4">
              <h2 className="fl-display fl-text-3xl mb-4">Three kilometres in Dadar at 7 pm is <em>not</em> three kilometres.</h2>
              <p className="fl-text-base text-secondary-fl mb-4">
                Distances here are short but slow. A matching engine that ignores evening traffic
                keeps producing matches nobody can keep, so travel time is estimated per locality
                and per hour.
              </p>
              <div className="d-flex gap-4">
                {[
                  [activeListingMarkers.length, "live listings"],
                  [activeListingMarkers.filter((m) => m.urgency === "urgent" || m.urgency === "critical").length, "under an hour left"],
                  [12, "matched within 5 km today"],
                ].map(([n, t]) => (
                  <div key={t}>
                    <div className="fl-serif" style={{ fontSize: 36, lineHeight: 1 }}>{n}</div>
                    <div className="fl-text-xs text-secondary-fl mt-1">{t}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-8">
              <div className="overflow-hidden" style={{ height: 480, borderRadius: "28px 6px 28px 6px", border: "1px solid var(--border)" }}>
                <MapContainer center={[mumbaiCenter.lat, mumbaiCenter.lng]} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {donorOrgs.map((d) => <Marker key={d.id} position={[d.lat, d.lng]} icon={dot("#c9a24a")} />)}
                  {recipientOrgs.map((r) => <Marker key={r.id} position={[r.lat, r.lng]} icon={dot("#1fa97e")} />)}
                </MapContainer>
              </div>
              <div className="d-flex gap-4 mt-3 fl-text-xs text-secondary-fl">
                <span><span className="d-inline-block rounded-circle me-2" style={{ width: 10, height: 10, background: "#c9a24a" }} />Donor kitchens</span>
                <span><span className="d-inline-block rounded-circle me-2" style={{ width: 10, height: 10, background: "#1fa97e" }} />Recipient organisations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="fl-section-sand fl-section">
        <div className="fl-container">
          <div className="row g-5">
            <div className="col-lg-4">
              <h2 className="fl-display fl-text-3xl">Questions people <em>actually</em> ask.</h2>
            </div>
            <div className="col-lg-8">
              {faqs.map((f, i) => (
                <div key={f.q} style={{ borderTop: "1px solid var(--sand-deep)" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    className="w-100 d-flex justify-content-between align-items-center text-start py-4"
                    style={{ background: "none", border: "none", color: "var(--text-primary)" }}
                    aria-expanded={openFaq === i}
                  >
                    <span className="fl-text-lg" style={{ fontWeight: 500 }}>{f.q}</span>
                    <i className={`bi ${openFaq === i ? "bi-dash-lg" : "bi-plus-lg"} ms-3`} style={{ color: "var(--primary)" }} />
                  </button>
                  {openFaq === i && (
                    <p className="fl-text-sm text-secondary-fl pb-4 mb-0" style={{ maxWidth: 640 }}>{f.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="fl-section-sm fl-section-ink">
        <div className="fl-container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <h2 className="fl-display fl-text-3xl mb-3" style={{ color: "#fff" }}>
                Have surplus food <em>tonight?</em>
              </h2>
              <p className="fl-text-base mb-0" style={{ color: "rgba(255,255,255,0.7)", maxWidth: 520 }}>
                Post it before the deadline. FoodLoop will find the organisation nearby that can
                actually come and collect it in time.
              </p>
            </div>
            <div className="col-lg-5 d-flex flex-wrap gap-3 justify-content-lg-end">
              <Link to="/donor" className="btn btn-primary btn-lg-touch px-4 text-nowrap">Post surplus food</Link>
              <Link to="/register" className="btn btn-outline-light btn-lg-touch px-4 text-nowrap">Register</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
