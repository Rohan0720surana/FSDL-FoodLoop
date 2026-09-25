import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../components/LeafletIconFix";
import Navbar from "../components/Navbar";
import CountdownTimer from "../components/CountdownTimer";
import { donorOrgs, recipientOrgs } from "../mockdata/orgs";
import { myListings } from "../mockdata/listings";
import { mockOffers, urgencyFromDeadline } from "../mockdata/offers";
import { trip, directionsUrl, isPeak } from "../utils/geo";

const URGENCY = { ample: "#3f8f6e", moderate: "#a88a3c", urgent: "#b0703f", critical: "#a24b3e" };
const KITCHEN = donorOrgs[0]; // St. Xavier's College Canteen, Dhobi Talao
const SHELTER = recipientOrgs.find((r) => r.id === "r2"); // Sneh Sadan Balgram, Dadar
const PICKUP = myListings.find((l) => l.status === "ACCEPTED"); // paneer trays, code 4827

const pin = (color, size = 16) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 1px ${color}99,0 4px 10px rgba(0,0,0,.25)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
const diamond = (color, size = 14) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
const youIcon = L.divIcon({ className: "", html: `<div class="fl-you-pin"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });

function FitTo({ points }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [70, 70], maxZoom: 14 });
  }, [map, points]);
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 14, { duration: 0.8 });
  }, [map, target]);
  return null;
}

// Browser location, updated as the device moves. Needs the user's permission.
function useLiveLocation(enabled) {
  const [pos, setPos] = useState(null);
  const [status, setStatus] = useState("");
  const watchRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setPos(null);
      setStatus("");
      return undefined;
    }
    if (!("geolocation" in navigator)) {
      setStatus("This browser can't share its location.");
      return undefined;
    }
    setStatus("Finding your location…");
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) });
        setStatus("");
      },
      (err) => setStatus(err.code === 1
        ? "Location permission was declined, so distances are estimated from your shelter."
        : "Couldn't get a location fix. Try again near a window."),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  }, [enabled]);

  return { pos, status };
}

function Legend({ items }) {
  return (
    <div className="fl-map-legend" aria-hidden="true">
      {items.map(([kind, color, label]) => (
        <span key={label}>
          <i
            className={kind === "sq" ? "sq" : "d"}
            style={{
              background: color,
              boxShadow: kind === "you" ? "0 0 0 3px rgba(47,111,237,.25)" : undefined,
            }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ================= RECIPIENT: route to the kitchen ================= */
function RecipientMap() {
  const [stage, setStage] = useState("route"); // route -> arrived -> done
  const [useGps, setUseGps] = useState(false);
  const [focus, setFocus] = useState(null);
  const { pos: you, status } = useLiveLocation(useGps);

  const from = you ?? SHELTER;
  const leg = trip(from, KITCHEN);
  const fitPoints = useMemo(() => [SHELTER, KITCHEN], []);
  const others = mockOffers.map((o) => ({
    ...o,
    donor: donorOrgs.find((d) => d.id === o.listing.donorId),
    urgency: urgencyFromDeadline(o.listing.pickupDeadline),
  }));

  return (
    <div className="fl-map-layout">
      <aside className="fl-map-panel">
        <div className="fl-kicker"><b>Pickup</b> · accepted 9:21 pm</div>
        <h1 className="fl-display fl-text-3xl mb-2">Collect from <em>St. Xavier&apos;s.</em></h1>
        <p className="fl-text-base text-secondary-fl mb-4">
          {PICKUP.quantity} meals of paneer tikka trays in {KITCHEN.locality}, back to {SHELTER.name} in {SHELTER.locality}.
        </p>

        <div className="fl-stat-pair mb-2">
          <div><div className="v">{leg.km}<small className="fl-text-sm"> km</small></div><div className="l">{you ? "from you, by road" : "by road"}</div></div>
          <div><div className="v">~{leg.min}<small className="fl-text-sm"> min</small></div><div className="l">{leg.peak ? "evening traffic" : "normal traffic"}</div></div>
          <div><div className="v" style={{ fontSize: 20 }}><CountdownTimer deadline={PICKUP.pickupDeadline} /></div><div className="l">until deadline</div></div>
        </div>
        <p className="fl-text-xs text-muted-fl mb-3">
          Estimated from the straight-line distance plus 30% for roads, at {isPeak() ? "evening-peak" : "off-peak"} city speed.
          Google Maps gives turn-by-turn directions.
        </p>

        <div className="d-flex gap-2 flex-wrap">
          <a className="btn btn-primary px-3" href={directionsUrl(from, KITCHEN)} target="_blank" rel="noreferrer">
            <i className="bi bi-sign-turn-right" aria-hidden="true" />Open in Google Maps
          </a>
          <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setUseGps((v) => !v)} aria-pressed={useGps}>
            <i className={`bi ${useGps ? "bi-geo-alt-fill" : "bi-crosshair"}`} aria-hidden="true" />
            {useGps ? "Stop using my location" : "Use my location"}
          </button>
        </div>
        {(status || you) && (
          <div className="fl-geo-status" aria-live="polite">
            {status || `Live: ${leg.km} km from you to the kitchen, accurate to about ${you.acc} m.`}
          </div>
        )}

        <div className="fl-step-box mt-4">
          {stage === "route" && (
            <>
              <div className="fl-text-base mb-1" style={{ fontWeight: 600 }}>At the kitchen door</div>
              <p className="fl-text-sm text-secondary-fl mb-3">When your staff reach St. Xavier&apos;s, tap below to show the handover code.</p>
              <button type="button" className="btn btn-primary btn-lg-touch w-100" onClick={() => setStage("arrived")}>
                We&apos;ve reached the kitchen
              </button>
            </>
          )}
          {stage === "arrived" && (
            <>
              <div className="fl-text-sm text-muted-fl">Show this code at the counter</div>
              <div className="fl-code my-1" style={{ fontSize: 40 }}>{PICKUP.handoverCode}</div>
              <ul className="fl-text-sm text-secondary-fl ps-3 mb-3">
                <li>Count {PICKUP.quantity} meals, sealed and labelled</li>
                <li>Check the cooked-at time on the labels</li>
                <li>Keep veg and non-veg crates apart</li>
              </ul>
              <button type="button" className="btn btn-primary btn-lg-touch w-100" onClick={() => setStage("done")}>
                Confirm collection
              </button>
            </>
          )}
          {stage === "done" && (
            <>
              <div className="fl-serif" style={{ fontSize: 24 }}>Collected. <em className="fl-serif" style={{ color: "var(--primary)" }}>Safe drive back.</em></div>
              <p className="fl-text-sm text-secondary-fl mt-2 mb-3">St. Xavier&apos;s has been told the {PICKUP.quantity} meals are on their way to Sneh Sadan.</p>
              <Link to="/recipient" className="btn btn-outline-secondary w-100">Back to dashboard</Link>
            </>
          )}
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <span className="fl-text-base" style={{ fontWeight: 600 }}>Your other offers</span>
            <span className="fl-text-xs text-muted-fl">inside your {SHELTER.serviceRadiusKm} km area</span>
          </div>
          {others.map((o) => (
            <button key={o.id} type="button" className={`fl-list-btn ${focus?.id === o.donor.id ? "on" : ""}`} onClick={() => setFocus(o.donor)}>
              <span className="dot" style={{ background: URGENCY[o.urgency] }} />
              <span>
                <span className="n d-block">{o.listing.quantity} meals · {o.donor.name}</span>
                <span className="s d-block">{o.donor.locality} · {o.distanceKm} km · ~{o.etaMin} min</span>
              </span>
              <span className="r"><CountdownTimer deadline={o.listing.pickupDeadline} /></span>
            </button>
          ))}
          <Link to="/recipient/offers" className="fl-text-sm d-inline-block mt-3" style={{ color: "var(--primary-hover)", fontWeight: 600 }}>
            Answer them in the offer inbox →
          </Link>
        </div>
      </aside>

      <div className="fl-map-canvas">
        <MapContainer center={[SHELTER.lat, SHELTER.lng]} zoom={12} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitTo points={fitPoints} />
          <FlyTo target={focus} />
          <Circle
            center={[SHELTER.lat, SHELTER.lng]}
            radius={SHELTER.serviceRadiusKm * 1000}
            pathOptions={{ color: "#1fa97e", weight: 1.5, dashArray: "6 6", fillColor: "#1fa97e", fillOpacity: 0.05 }}
          />
          <Polyline positions={[[from.lat, from.lng], [KITCHEN.lat, KITCHEN.lng]]} pathOptions={{ color: "#1e4435", weight: 4, dashArray: "2 9", lineCap: "round" }} />
          {others.filter((o) => o.donor.id !== KITCHEN.id).map((o) => (
            <Marker key={o.id} position={[o.donor.lat, o.donor.lng]} icon={pin(URGENCY[o.urgency], 14)}>
              <Tooltip direction="top" offset={[0, -8]}>{o.donor.name} · {o.listing.quantity} meals</Tooltip>
            </Marker>
          ))}
          <Marker position={[KITCHEN.lat, KITCHEN.lng]} icon={pin("#c9a24a", 22)}>
            <Tooltip permanent direction="top" offset={[0, -12]}>Collect here · St. Xavier&apos;s</Tooltip>
          </Marker>
          <Marker position={[SHELTER.lat, SHELTER.lng]} icon={diamond("#1e4435", 18)}>
            <Tooltip permanent direction="bottom" offset={[0, 12]}>Sneh Sadan (you)</Tooltip>
          </Marker>
          {you && <Marker position={[you.lat, you.lng]} icon={youIcon}><Tooltip direction="top">You are here</Tooltip></Marker>}
        </MapContainer>
        <Legend items={[
          ["d", "#c9a24a", "Tonight's pickup"],
          ["sq", "#1e4435", "Your shelter"],
          ["d", URGENCY.moderate, "Other offers, coloured by time left"],
          ["you", "#2f6fed", "You, when location is on"],
        ]} />
        <div className="fl-map-note">The dashed circle is the {SHELTER.serviceRadiusKm} km area you collect from. Offers only come from inside it.</div>
      </div>
    </div>
  );
}

/* ================= DONOR: who is coming to the kitchen ================= */
function DonorMap() {
  const [handed, setHanded] = useState(false);
  const [focus, setFocus] = useState(null);
  const leg = trip(SHELTER, KITCHEN);
  const fitPoints = useMemo(() => [KITCHEN, ...recipientOrgs], []);

  const holders = Object.fromEntries(myListings.filter((l) => l.heldBy && l.status !== "ACCEPTED").map((l) => [l.heldBy, l]));
  const reach = recipientOrgs
    .map((r) => ({ ...r, t: trip(r, KITCHEN), listing: holders[r.name] }))
    .sort((a, b) => a.t.min - b.t.min);
  const colourFor = (r) => (r.id === SHELTER.id ? "#1fa97e" : r.listing ? "#c9a24a" : "#8c948d");

  return (
    <div className="fl-map-layout">
      <aside className="fl-map-panel">
        <div className="fl-kicker"><b>Incoming pickup</b> · Dhobi Talao</div>
        <h1 className="fl-display fl-text-3xl mb-2">Sneh Sadan is <em>on the way.</em></h1>
        <p className="fl-text-base text-secondary-fl mb-4">
          Their van left Dadar at 9:21 pm for your {PICKUP.quantity} meals of paneer tikka trays.
        </p>

        <div className="fl-stat-pair mb-2">
          <div><div className="v">{leg.km}<small className="fl-text-sm"> km</small></div><div className="l">their drive, by road</div></div>
          <div><div className="v">~{leg.min}<small className="fl-text-sm"> min</small></div><div className="l">{leg.peak ? "in evening traffic" : "in normal traffic"}</div></div>
          <div><div className="v" style={{ fontSize: 20 }}><CountdownTimer deadline={PICKUP.pickupDeadline} /></div><div className="l">your deadline</div></div>
        </div>
        <p className="fl-text-xs text-muted-fl mb-4">Arrival is estimated from distance and time of day.</p>

        <div className="fl-step-box">
          {!handed ? (
            <>
              <div className="fl-text-base mb-1" style={{ fontWeight: 600 }}>When they arrive</div>
              <p className="fl-text-sm text-secondary-fl mb-2">Hand the food only to someone who shows this code:</p>
              <div className="fl-code mb-3" style={{ fontSize: 36 }}>{PICKUP.handoverCode}</div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-primary btn-lg-touch flex-grow-1" onClick={() => setHanded(true)}>Mark as handed over</button>
                <button type="button" className="btn btn-outline-secondary btn-lg-touch px-3" aria-label="Call Sneh Sadan">
                  <i className="bi bi-telephone" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="fl-serif" style={{ fontSize: 24 }}>Handed over. <em className="fl-serif" style={{ color: "var(--primary)" }}>Thank you.</em></div>
              <p className="fl-text-sm text-secondary-fl mt-2 mb-3">{PICKUP.quantity} meals are off to Sneh Sadan. They count toward your September total.</p>
              <Link to="/donor" className="btn btn-outline-secondary w-100">Back to dashboard</Link>
            </>
          )}
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <span className="fl-text-base" style={{ fontWeight: 600 }}>Who can reach you tonight</span>
            <span className="fl-text-xs text-muted-fl">closest first</span>
          </div>
          {reach.map((r) => (
            <button key={r.id} type="button" className={`fl-list-btn ${focus?.id === r.id ? "on" : ""}`} onClick={() => setFocus(r)}>
              <span className="dot" style={{ background: colourFor(r), borderRadius: 2, transform: "rotate(45deg)" }} />
              <span>
                <span className="n d-block">{r.name}</span>
                <span className="s d-block">{r.locality} · {r.t.km} km · ~{r.t.min} min</span>
              </span>
              <span className="r" style={{ color: r.id === SHELTER.id ? "var(--primary-hover)" : r.listing ? "#7d6528" : "var(--text-muted)" }}>
                {r.id === SHELTER.id ? "Collecting" : r.listing ? "Has an offer" : "In reach"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="fl-map-canvas">
        <MapContainer center={[KITCHEN.lat, KITCHEN.lng]} zoom={12} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitTo points={fitPoints} />
          <FlyTo target={focus} />
          <Polyline positions={[[SHELTER.lat, SHELTER.lng], [KITCHEN.lat, KITCHEN.lng]]} pathOptions={{ color: "#1fa97e", weight: 4, dashArray: "2 9", lineCap: "round" }} />
          {reach.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={diamond(colourFor(r), r.id === SHELTER.id ? 18 : 13)}>
              <Tooltip permanent={r.id === SHELTER.id} direction="top" offset={[0, -10]}>
                {r.id === SHELTER.id ? "Sneh Sadan · on the way" : `${r.name} · ~${r.t.min} min`}
              </Tooltip>
            </Marker>
          ))}
          <Marker position={[KITCHEN.lat, KITCHEN.lng]} icon={pin("#1e4435", 22)}>
            <Tooltip permanent direction="bottom" offset={[0, 12]}>Your kitchen</Tooltip>
          </Marker>
        </MapContainer>
        <Legend items={[
          ["d", "#1e4435", "Your kitchen"],
          ["sq", "#1fa97e", "Coming to collect"],
          ["sq", "#c9a24a", "Holding one of your offers"],
          ["sq", "#8c948d", "Other recipients in reach"],
        ]} />
      </div>
    </div>
  );
}

export default function MapView({ role = "recipient" }) {
  return (
    <div>
      <Navbar role={role} />
      {role === "donor" ? <DonorMap /> : <RecipientMap />}
    </div>
  );
}
