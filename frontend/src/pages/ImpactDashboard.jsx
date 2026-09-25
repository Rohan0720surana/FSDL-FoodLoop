import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip as MapTip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../components/LeafletIconFix";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import servingPhoto from "../assets/serving.webp";
import { platformImpact, donorImpact, recipientImpact } from "../mockdata/impact";
import { donorOrgs, recipientOrgs } from "../mockdata/orgs";
import { trip } from "../utils/geo";

// St. Xavier's (donor view): where its 612 meals went. Adds up to 612.
const donorLedger = [
  { id: "r2", meals: 186 },
  { id: "r1", meals: 142 },
  { id: "r4", meals: 118 },
  { id: "r3", meals: 94 },
  { id: "r5", meals: 72 },
];
// Sneh Sadan (recipient view): where its 438 meals came from. Adds up to 438.
const recipientLedger = [
  { id: "d1", meals: 142 },
  { id: "d3", meals: 96 },
  { id: "d2", meals: 88 },
  { id: "d6", meals: 70 },
  { id: "d4", meals: 42 },
];

const week = {
  donor: [
    { day: "Fri", meals: 42 }, { day: "Sat", meals: 118 }, { day: "Sun", meals: 96 }, { day: "Mon", meals: 0 },
    { day: "Tue", meals: 55 }, { day: "Wed", meals: 64 }, { day: "Thu", meals: 40 },
  ],
  recipient: [
    { day: "Fri", meals: 36 }, { day: "Sat", meals: 48 }, { day: "Sun", meals: 0 }, { day: "Mon", meals: 30 },
    { day: "Tue", meals: 42 }, { day: "Wed", meals: 25 }, { day: "Thu", meals: 40 },
  ],
};

const receipts = {
  donor: [
    { no: "FL-2291", when: "Thu, 3:12 pm", food: "Veg pulao + dal", meals: 40, other: "Sneh Sadan Balgram", mins: 38 },
    { no: "FL-2274", when: "Wed, 9:40 pm", food: "Rajma chawal", meals: 64, other: "Asha Deep Shelter", mins: 26 },
    { no: "FL-2250", when: "Tue, 2:05 pm", food: "Staff lunch surplus", meals: 55, other: "Kripa Foundation", mins: 44 },
    { no: "FL-2231", when: "Sat, 10:15 pm", food: "Fest dinner trays", meals: 96, other: "Seva Sadan Kitchen", mins: 31 },
  ],
  recipient: [
    { no: "FL-2291", when: "Thu, 3:12 pm", food: "Veg pulao + dal", meals: 40, other: "St. Xavier's Canteen", mins: 38 },
    { no: "FL-2282", when: "Wed, 8:55 pm", food: "Irani bun-maska", meals: 25, other: "Yazdani Irani Bakery", mins: 22 },
    { no: "FL-2266", when: "Tue, 10:20 pm", food: "Wedding thalis", meals: 42, other: "Regency Banquet Hall", mins: 41 },
    { no: "FL-2240", when: "Mon, 9:30 pm", food: "Buffet surplus", meals: 30, other: "Delisea Banquets", mins: 29 },
  ],
};

const dot = (color, size) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

// Fit after layout, so the map knows its real size before choosing a zoom.
function FitRoutes({ bounds }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [36, 36] });
    }, 50);
    return () => clearTimeout(t);
  }, [map, bounds]);
  return null;
}

export default function ImpactDashboard({ role = "donor" }) {
  const isDonor = role === "donor";
  const own = isDonor ? donorImpact : recipientImpact;
  const home = isDonor ? donorOrgs[0] : recipientOrgs.find((r) => r.id === "r2");
  const partners = isDonor ? recipientOrgs : donorOrgs;
  const ledger = (isDonor ? donorLedger : recipientLedger).map((row) => {
    const org = partners.find((p) => p.id === row.id);
    return { ...row, org, t: trip(home, org) };
  });
  const max = Math.max(...ledger.map((l) => l.meals));
  const days = week[role];
  const weekTotal = days.reduce((s, d) => s + d.meals, 0);
  const best = days.reduce((a, b) => (b.meals > a.meals ? b : a));
  const bounds = L.latLngBounds([home, ...ledger.map((l) => l.org)].map((p) => [p.lat, p.lng]));

  return (
    <div>
      <Navbar role={role} />

      <header className="fl-page-header">
        <div className="fl-container">
          <div className="fl-kicker"><b>{isDonor ? "Your impact" : "What you received"}</b> · September 2026</div>
          <h1 className="fl-text-2xl mb-2">
            {isDonor ? <>Your surplus fed <em>612 people</em> this month.</> : <>You received <em>438 meals</em> this month.</>}
          </h1>
          <p className="sub mb-0">
            {isDonor
              ? "Food that would otherwise have gone into a bin at closing time."
              : "Collected by your own staff, from kitchens across the city."}
          </p>
        </div>
      </header>

      <main className="fl-page-body">
        <div className="fl-container py-5">

          {/* ---- opening spread ---- */}
          <section className="fl-report-open pt-lg-3">
            <figure className="fl-report-photo">
              <img src={servingPhoto} alt="Two community-kitchen volunteers serving rice and dal onto steel plates while children eat on a floor mat" />
              <figcaption>
                {isDonor ? "Sneh Sadan, Dadar, where almost a third of your surplus was served this month." : "Dinner service at Sneh Sadan, Dadar."}
              </figcaption>
            </figure>
            <div>
              <div className="fl-report-num">{own.mealsRedistributed}</div>
              <div className="fl-text-lg mt-3">
                meals {isDonor ? "handed over" : "received"} in September
                <span className="fl-delta ms-2">↑ {own.mealsRedistributedDelta}% on August</span>
              </div>
              <ul className="fl-facts">
                <li><span className="v">{own.completionRate}%</span><span className="t">{isDonor ? "of your offers collected before the deadline" : "of your pickups made on time"}</span></li>
                <li><span className="v">{own.avgPickupDistanceKm} km</span><span className="t">{isDonor ? "average drive for a recipient to reach you" : "average drive to a kitchen"}</span></li>
                <li><span className="v">{isDonor ? "~1.4 t" : "~1.0 t"}</span><span className="t">of cooked food kept out of landfill</span></li>
              </ul>
            </div>
          </section>

          {/* ---- this week ---- */}
          <section className="mt-5 pt-4">
            <div className="fl-rule-head">
              <h2 className="fl-h2">This week, <em>day by day</em></h2>
              <span className="fl-text-base text-secondary-fl">{weekTotal} meals in 7 days · best day {best.day}</span>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days} margin={{ top: 28, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#e8dfca" vertical={false} />
                  <XAxis dataKey="day" stroke="#56625b" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8c948d" fontSize={13} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(201,162,74,0.08)" }}
                    contentStyle={{ background: "#fff", border: "1px solid #e7dfd0", borderRadius: 10, fontSize: 14 }}
                    formatter={(v) => [`${v} meals`, ""]}
                  />
                  <Bar dataKey="meals" radius={[8, 8, 0, 0]} maxBarSize={72}>
                    {days.map((d) => (
                      <Cell key={d.day} fill={d.day === best.day ? "#c9a24a" : d.day === "Thu" ? "#1fa97e" : "#285a47"} />
                    ))}
                    <LabelList dataKey="meals" position="top" fontSize={14} fill="#14201a" formatter={(v) => (v ? v : "–")} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="fl-text-sm text-muted-fl mt-2 mb-0">
              {isDonor
                ? "Gold is your best day (the college fest). Green is today, so far. Monday the canteen was shut."
                : "Gold is your best day. Green is today, so far. On Sunday no offer fitted your collection hours."}
            </p>
          </section>

          {/* ---- where it went ---- */}
          <section className="mt-5 pt-4">
            <div className="fl-rule-head">
              <h2 className="fl-h2">{isDonor ? <>Where the food <em>went</em></> : <>Where it <em>came from</em></>}</h2>
              <span className="fl-text-base text-secondary-fl">{isDonor ? "5 recipients" : "5 kitchens"} · September</span>
            </div>
            <div className="row g-5">
              <div className="col-lg-6">
                <ol className="fl-ledger">
                  {ledger.map((l, i) => (
                    <li key={l.id}>
                      <span className="no">{String(i + 1).padStart(2, "0")}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="place">{l.org.locality}</div>
                        <div className="org text-truncate">{l.org.name} · {l.t.km} km by road</div>
                        <div className="line"><span style={{ width: `${(l.meals / max) * 100}%` }} /></div>
                      </div>
                      <span className="m">{l.meals}<small>meals</small></span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="col-lg-6">
                <div className="fl-mini-map">
                  <MapContainer bounds={bounds} scrollWheelZoom={false} dragging={false} zoomControl={false} doubleClickZoom={false} touchZoom={false}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <FitRoutes bounds={bounds} />
                    {ledger.map((l) => (
                      <Polyline
                        key={l.id}
                        positions={[[home.lat, home.lng], [l.org.lat, l.org.lng]]}
                        pathOptions={{ color: "#1e4435", weight: 1.5 + (l.meals / max) * 5, opacity: 0.75, lineCap: "round" }}
                      />
                    ))}
                    {ledger.map((l) => (
                      <Marker key={`m-${l.id}`} position={[l.org.lat, l.org.lng]} icon={dot("#1fa97e", 12)}>
                        <MapTip direction="top" offset={[0, -6]}>{l.org.locality} · {l.meals} meals</MapTip>
                      </Marker>
                    ))}
                    <Marker position={[home.lat, home.lng]} icon={dot("#c9a24a", 18)}>
                      <MapTip permanent direction="bottom" offset={[0, 10]}>{isDonor ? "Your kitchen" : "Sneh Sadan"}</MapTip>
                    </Marker>
                  </MapContainer>
                </div>
                <p className="fl-text-sm text-muted-fl mt-2 mb-0">Thicker lines carried more meals.</p>
              </div>
            </div>
          </section>

          {/* ---- handovers ---- */}
          <section className="mt-5 pt-4">
            <div className="fl-rule-head">
              <h2 className="fl-h2">Recent <em>handovers</em></h2>
              <span className="fl-text-base text-secondary-fl">Each one confirmed with a code at the door</span>
            </div>
            <div className="fl-receipts">
              {receipts[role].map((r) => (
                <div className="fl-receipt" key={r.no}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="rh">#{r.no}</span>
                    <span className="fl-text-xs text-muted-fl">{r.when}</span>
                  </div>
                  <div className="rline"><span>{isDonor ? "To" : "From"}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{r.other}</span></div>
                  <div className="rline"><span>Food</span><span style={{ fontWeight: 600, textAlign: "right" }}>{r.food}</span></div>
                  <div className="rline"><span>Quantity</span><span style={{ fontWeight: 600 }}>{r.meals} meals</span></div>
                  <div className="rline"><span>Posted → collected</span><span style={{ fontWeight: 600 }}>{r.mins} min</span></div>
                  <span className="stamp">Collected</span>
                </div>
              ))}
            </div>
          </section>

          {/* ---- across the city ---- */}
          <section className="fl-city-band fl-map-texture mt-5">
            <div className="row g-4 align-items-end">
              <div className="col-lg-5">
                <div className="fl-serif" style={{ fontSize: 22, fontStyle: "italic", color: "#e7c77a" }}>Across Mumbai</div>
                <p className="fl-text-lg mt-2 mb-0" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {isDonor
                    ? "Your kitchen is one of 34 donors. Together, this is what the network moved in September."
                    : "Sneh Sadan is one of 51 recipients. Together, this is what the network moved in September."}
                </p>
              </div>
              <div className="col-4 col-lg-2 offset-lg-1"><div className="v">{platformImpact.mealsRedistributed.toLocaleString("en-IN")}</div><div className="l">meals</div></div>
              <div className="col-4 col-lg-2"><div className="v">{platformImpact.organisationsActive}</div><div className="l">organisations</div></div>
              <div className="col-4 col-lg-2"><div className="v">{platformImpact.avgMatchTimeMin}<small className="fl-text-base"> min</small></div><div className="l">from post to match</div></div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
