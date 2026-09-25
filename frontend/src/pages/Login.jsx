import { Link, useNavigate } from "react-router-dom";
import counterNight from "../assets/counter-night.webp";
import Logo from "../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="row g-0" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="col-lg-6 d-none d-lg-flex fl-auth-visual" style={{ backgroundImage: `url(${counterNight})` }}>
        <div className="d-flex flex-column justify-content-between h-100 w-100 p-5">
          <div>
            <Link to="/" className="fl-brand text-decoration-none" aria-label="FoodLoop home">
              <Logo tone="dark" />
            </Link>
            <div className="fl-auth-quote mt-5">
              <p className="fl-pullquote mb-3" style={{ color: "#fff", fontSize: 26 }}>
                &ldquo;We used to throw away forty plates on a slow night. Now they&apos;re in a community
                kitchen in Bandra before we&apos;ve finished closing.&rdquo;
              </p>
              <div className="fl-text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                Kitchen manager · Regency Banquet Hall, Andheri West
              </div>
            </div>
          </div>

          <div className="d-flex gap-5">
            {[["2,847", "Meals matched"], ["85", "Organisations"], ["8.4 min", "Avg match"]].map(([v, l]) => (
              <div key={l}>
                <div className="fl-serif" style={{ color: "#fff", fontSize: 34, lineHeight: 1 }}>{v}</div>
                <div className="fl-text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-lg-6 d-flex align-items-center justify-content-center p-4">
        <div className="fl-auth-card">
          <Link to="/" className="d-lg-none fl-brand text-decoration-none mb-4 d-inline-block" aria-label="FoodLoop home">
            <Logo />
          </Link>
          <h1 className="fl-display fl-text-3xl mb-2">Welcome <em>back.</em></h1>
          <p className="fl-text-sm text-secondary-fl mb-4">Pick up where your organisation left off.</p>

          <form onSubmit={(e) => { e.preventDefault(); navigate("/donor"); }}>
            <label className="form-label" htmlFor="email">Organisation email</label>
            <div className="fl-input-icon mb-3">
              <i className="bi bi-envelope" />
              <input id="email" type="email" className="form-control" placeholder="canteen@stxaviers.edu" />
            </div>
            <div className="d-flex justify-content-between">
              <label className="form-label" htmlFor="password">Password</label>
              <a href="#" className="fl-text-xs text-decoration-none" style={{ color: "var(--primary)" }}>Forgot password?</a>
            </div>
            <div className="fl-input-icon mb-3">
              <i className="bi bi-lock" />
              <input id="password" type="password" className="form-control" placeholder="••••••••" />
            </div>
            <div className="form-check mb-4">
              <input className="form-check-input" type="checkbox" id="remember" />
              <label className="form-check-label fl-text-sm text-secondary-fl" htmlFor="remember">Keep me signed in</label>
            </div>
            <button type="submit" className="btn btn-primary btn-lg-touch w-100">Log in</button>
          </form>

          <div className="fl-divider-text my-4"><span>or continue as</span></div>
          <div className="row g-2">
            <div className="col-6">
              <button type="button" className="fl-demo-btn" onClick={() => navigate("/donor")}>
                <i className="bi bi-shop" /><span>Donor view</span>
              </button>
            </div>
            <div className="col-6">
              <button type="button" className="fl-demo-btn" onClick={() => navigate("/recipient")}>
                <i className="bi bi-basket3" /><span>Recipient view</span>
              </button>
            </div>
          </div>

          <p className="fl-text-sm text-secondary-fl mt-4 mb-0 text-center">
            New organisation?{" "}
            <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
