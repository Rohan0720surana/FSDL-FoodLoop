import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { mockSimulationResults, strategyLabels, mockTimeToMatchHistogram } from "../mockdata/simulation";

const strategyColor = {
  BROADCAST: "#b9b2a2",
  NEAREST: "#6f8a7e",
  WEIGHTED_GREEDY: "#1fa97e",
  HUNGARIAN_OPTIMAL: "#c9a24a",
};

const columns = [
  { key: "redistributionRate", label: "Food redistributed", unit: "%", higherIsBetter: true },
  { key: "expiryWasteRate", label: "Expired unclaimed", unit: "%", higherIsBetter: false },
  { key: "avgPickupDistanceKm", label: "Avg pickup distance", unit: " km", higherIsBetter: false },
  { key: "avgTimeToMatchSec", label: "Avg time to match", unit: " s", higherIsBetter: false },
  { key: "rank1AcceptanceRate", label: "First offer accepted", unit: "%", higherIsBetter: true },
  { key: "executionTimeMs", label: "Compute time", unit: " ms", higherIsBetter: false },
];

function best(rows, key, higher) {
  const v = rows.map((r) => r[key]);
  return higher ? Math.max(...v) : Math.min(...v);
}

export default function SimulationResults() {
  const rows = mockSimulationResults;
  const get = (k) => rows.find((r) => r.strategy === k);
  const wg = get("WEIGHTED_GREEDY");
  const bc = get("BROADCAST");
  const hu = get("HUNGARIAN_OPTIMAL");
  const gap = (hu.redistributionRate - wg.redistributionRate).toFixed(1);
  const speedup = Math.round(hu.executionTimeMs / wg.executionTimeMs);
  const wasteCut = Math.round((1 - wg.expiryWasteRate / bc.expiryWasteRate) * 100);

  return (
    <div>
      <Navbar role="admin" />

      <header className="fl-page-header">
        <div className="fl-container">
          <div className="fl-kicker"><b>Simulation run #24</b> · 500 replayed listings · 50 recipients · seed 4471</div>
          <h1 className="fl-text-2xl mb-2">Weighted-Greedy wasted <em>{wasteCut}% less food</em> than broadcasting.</h1>
          <p className="sub fl-text-sm mb-0" style={{ maxWidth: 620 }}>
            Four matching strategies, the same seven days of Mumbai listings, replayed identically for each.
          </p>
          <div className="fl-hstats">
            <div><div className="v">{wg.redistributionRate}<small>%</small></div><div className="l">food redistributed (proposed)</div></div>
            <div><div className="v">{gap}<small>pts</small></div><div className="l">short of the optimal upper bound</div></div>
            <div><div className="v">{speedup}<small>× faster</small></div><div className="l">than computing the optimum</div></div>
          </div>
        </div>
      </header>

      <main className="fl-page-body">
        <div className="fl-container py-5">
          <div className="row g-5 mb-5">
            <div className="col-lg-7">
              <h2 className="fl-h2 mb-2">How much food <em>got eaten</em></h2>
              <p className="fl-text-sm text-secondary-fl mb-3">Share of listed meals collected before their deadline.</p>
              {[...rows].sort((a, b) => a.redistributionRate - b.redistributionRate).map((r) => (
                <div key={r.strategy} className={`fl-hbar ${r.strategy === "WEIGHTED_GREEDY" ? "me" : ""}`}>
                  <span className="fl-text-sm" style={{ fontWeight: r.strategy === "WEIGHTED_GREEDY" ? 600 : 400 }}>{strategyLabels[r.strategy]}</span>
                  <span className="track"><span style={{ width: `${r.redistributionRate}%`, background: strategyColor[r.strategy] }} /></span>
                  <span className="num">{r.redistributionRate}%</span>
                </div>
              ))}
            </div>
            <div className="col-lg-5">
              <div className="fl-next fl-map-texture h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fl-serif mb-3" style={{ fontSize: 20, fontStyle: "italic", color: "#e7c77a" }}>The trade-off</div>
                  <p className="fl-pullquote mb-0" style={{ fontSize: 24, color: "#fff" }}>
                    Optimal matching finds {gap} points more food, but takes {(hu.executionTimeMs / 1000).toFixed(1)} s per batch. Weighted-Greedy answers in {wg.executionTimeMs} ms — fast enough to re-rank every time someone declines.
                  </p>
                </div>
                <div className="d-flex gap-4 mt-4">
                  <div><div className="fl-serif" style={{ fontSize: 30 }}>{wg.executionTimeMs} ms</div><div className="fl-text-xs muted">Weighted-Greedy</div></div>
                  <div><div className="fl-serif" style={{ fontSize: 30 }}>{hu.executionTimeMs.toLocaleString("en-IN")} ms</div><div className="fl-text-xs muted">Hungarian-optimal</div></div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="fl-h2 mb-3">Every metric, <em>side by side</em></h2>
          <div className="fl-board mb-2" style={{ overflowX: "auto" }}>
            <table className="table fl-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.strategy} className={r.strategy === "WEIGHTED_GREEDY" ? "me" : ""}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      <span className="d-inline-block rounded-circle me-2" style={{ width: 9, height: 9, background: strategyColor[r.strategy] }} />
                      {strategyLabels[r.strategy]}
                    </td>
                    {columns.map((c) => (
                      <td key={c.key} className={r[c.key] === best(rows, c.key, c.higherIsBetter) ? "best" : ""}>
                        {r[c.key].toLocaleString("en-IN")}{c.unit}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fl-text-xs text-muted-fl mb-5"><span style={{ color: "var(--gold)" }}>●</span> best value in each column</p>

          <div className="row g-5 align-items-center">
            <div className="col-lg-4">
              <h2 className="fl-h2 mb-3">How long kitchens <em>waited</em></h2>
              <p className="fl-text-sm text-secondary-fl mb-0">
                Broadcasting leaves a third of listings waiting over 20 minutes for anyone to claim them.
                Ranked offers move most matches under five minutes, when cooked food is still at its best.
              </p>
            </div>
            <div className="col-lg-8">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockTimeToMatchHistogram} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={2}>
                    <CartesianGrid stroke="#ece5d6" vertical={false} />
                    <XAxis dataKey="bucket" stroke="#8c948d" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8c948d" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip cursor={{ fill: "rgba(201,162,74,0.08)" }} contentStyle={{ background: "#fff", border: "1px solid #e7dfd0", borderRadius: 10, fontSize: 13 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => strategyLabels[v]} />
                    {Object.keys(strategyColor).map((k) => (
                      <Bar key={k} dataKey={k} fill={strategyColor[k]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
