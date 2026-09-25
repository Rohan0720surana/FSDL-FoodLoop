import { Link } from "react-router-dom";
import Logo from "./Logo";
import counterNight from "../assets/counter-night.webp";

const STEPS = [
  { n: 1, t: "Organisation type", d: "Donor or recipient" },
  { n: 2, t: "Organisation details", d: "Name, contact, location" },
  { n: 3, t: "Verification", d: "Reviewed within a day" },
];

export default function RegisterShell({ step, children }) {
  return (
    <div className="row g-0" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <aside className="col-lg-4 d-none d-lg-flex fl-register-side" style={{ backgroundImage: `url(${counterNight})` }}>
        <div className="d-flex flex-column justify-content-between h-100 w-100 p-5">
          <Link to="/" className="fl-brand text-decoration-none" aria-label="FoodLoop home">
            <Logo tone="dark" />
          </Link>

          <div>
            <div className="fl-kicker" style={{ color: "rgba(255,255,255,0.7)" }}><b style={{ color: "#e7c77a" }}>Register</b> your organisation</div>
            <h2 className="fl-display fl-text-2xl mb-5" style={{ color: "#fff" }}>
              Three minutes to join Mumbai's <em>surplus food network.</em>
            </h2>
            <ol className="list-unstyled mb-0">
              {STEPS.map((s) => {
                const state = s.n < step ? "done" : s.n === step ? "active" : "";
                return (
                  <li key={s.n} className={`fl-reg-step ${state}`}>
                    <span className="bubble">{s.n < step ? <i className="bi bi-check-lg" /> : s.n}</span>
                    <div>
                      <div className="t">{s.t}</div>
                      <div className="d">{s.d}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="fl-text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Institutional organisations only · Mumbai
          </div>
        </div>
      </aside>

      <main className="col-lg-8 d-flex align-items-center justify-content-center p-4 p-lg-5">
        <div style={{ width: "100%", maxWidth: 760 }}>{children}</div>
      </main>
    </div>
  );
}
