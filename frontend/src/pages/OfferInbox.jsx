import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MatchScorePanel from "../components/MatchScorePanel";
import { mockOffers } from "../mockdata/offers";

const folders = [
  { key: "pending", label: "Waiting for you", count: mockOffers.length },
  { key: "accepted", label: "Accepted", count: 1 },
  { key: "expired", label: "Missed", count: 3 },
];

const byScore = [...mockOffers].sort((a, b) => a.rank - b.rank);

export default function OfferInbox() {
  const [folder, setFolder] = useState("pending");

  return (
    <div>
      <Navbar role="recipient" />

      <header className="fl-page-header">
        <div className="fl-container">
          <div className="fl-kicker"><b>Ranked for Sneh Sadan Balgram</b> · Dadar</div>
          <h1 className="fl-text-2xl mb-2">Offers, best match <em>first.</em></h1>
          <p className="sub fl-text-sm mb-0" style={{ maxWidth: 560 }}>
            Each one was sent because you can reach it in time and have room for it. Answer before the
            countdown ends, or it moves on to the next kitchen.
          </p>
        </div>
      </header>

      <main className="fl-page-body">
        <div className="fl-container py-5">
          <div className="row g-5">
            <div className="col-lg-3">
              <nav aria-label="Offer folders">
                {folders.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFolder(f.key)}
                    className={`fl-folder ${folder === f.key ? "on" : ""}`}
                    aria-current={folder === f.key ? "page" : undefined}
                  >
                    <span>{f.label}</span>
                    <span className="c">{f.count}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="fl-text-sm mb-2" style={{ fontWeight: 600 }}>How we pick for you</div>
                <p className="fl-text-xs text-secondary-fl mb-2">
                  Time to reach the kitchen counts most (35%), then distance (25%), your spare
                  capacity (20%), food type (10%) and your pickup record (10%).
                </p>
                <p className="fl-text-xs text-muted-fl mb-0">Bars on each card show how this offer scored on each.</p>
              </div>
            </div>

            <div className="col-lg-9">
              {folder === "pending" ? (
                byScore.map((o) => (
                  <MatchScorePanel
                    key={o.id}
                    offer={o}
                    actions={
                      <>
                        <button type="button" className="btn btn-primary btn-sm px-3">Accept &amp; send staff</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm px-3">Pass</button>
                      </>
                    }
                  />
                ))
              ) : (
                <div className="text-center py-5" style={{ border: "1px dashed var(--sand-deep)", borderRadius: 18 }}>
                  <div className="fl-serif" style={{ fontSize: 26 }}>
                    {folder === "accepted" ? "One pickup on the road." : "Three offers ran out of time."}
                  </div>
                  <p className="fl-text-sm text-secondary-fl mt-2 mb-0">
                    {folder === "accepted"
                      ? "Accepted offers stay here until your staff mark them collected."
                      : "Missed offers move here so you can see what you passed on this week."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
