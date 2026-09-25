import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  { state: "done", icon: "bi-check-lg", t: "Registration received", d: "24 Sep 2026, 6:42 pm" },
  { state: "done", icon: "bi-check-lg", t: "FSSAI licence number matched", d: "Automatic check · 6:43 pm" },
  { state: "now", icon: "bi-hourglass-split", t: "Address and contact verified by a FoodLoop admin", d: "Usually within one working day" },
  { state: "", icon: "bi-flag", t: "You can post surplus food", d: "We'll email canteen@stxaviers.edu" },
];

export default function Pending() {
  return (
    <div>
      <Navbar role="public" />
      <main className="fl-page-body">
        <div className="fl-container py-5">
          <div className="row g-5 py-lg-4 align-items-center">
            <div className="col-lg-6">
              <div className="fl-kicker"><b>Almost there</b></div>
              <h1 className="fl-display fl-text-4xl mb-3">We&apos;re checking your kitchen <em>is real.</em></h1>
              <p className="fl-text-base text-secondary-fl mb-4" style={{ maxWidth: 480 }}>
                Every organisation on FoodLoop is verified by hand, so recipients can trust where food comes
                from and donors know who is collecting it.
              </p>
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-secondary btn-lg-touch px-4">Back to login</Link>
                <Link to="/" className="btn btn-link fl-text-sm" style={{ color: "var(--primary-hover)" }}>Read how matching works</Link>
              </div>
            </div>

            <div className="col-lg-5 offset-lg-1">
              <div className="fl-ticket">
                <div className="sect">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="fl-serif" style={{ fontSize: 22 }}>St. Xavier&apos;s College Canteen</div>
                    <span className="fl-status-tag moderate">Pending</span>
                  </div>
                  <div className="fl-text-xs text-muted-fl">Donor · Dhobi Talao, Mumbai 400001</div>
                </div>
                <div className="tear" />
                <div className="sect">
                  <ol className="fl-progress-steps">
                    {steps.map((s) => (
                      <li key={s.t} className={s.state}>
                        <span className="dot"><i className={`bi ${s.icon}`} aria-hidden="true" /></span>
                        <div>
                          <div className="fl-text-sm" style={{ fontWeight: 600 }}>{s.t}</div>
                          <div className="fl-text-xs text-muted-fl">{s.d}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
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
