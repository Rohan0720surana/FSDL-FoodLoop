import { useSearchParams, useNavigate, Link } from "react-router-dom";
import RegisterShell from "../components/RegisterShell";

const donorTypes = ["Restaurant", "Hotel", "Canteen", "Caterer", "Event venue", "Bakery", "Grocery store"];
const recipientTypes = ["NGO", "Shelter", "Orphanage", "Old-age home", "Community kitchen", "Food bank"];

function Field({ id, label, icon, ...rest }) {
  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="fl-input-icon">
        <i className={`bi ${icon}`} />
        <input id={id} className="form-control" {...rest} />
      </div>
    </div>
  );
}

export default function OrgDetails() {
  const [params] = useSearchParams();
  const role = params.get("role") === "recipient" ? "RECIPIENT" : "DONOR";
  const navigate = useNavigate();
  const isDonor = role === "DONOR";

  return (
    <RegisterShell step={2}>
      <div className="fl-kicker"><b>Step 2</b> of 3</div>
      <h1 className="fl-display fl-text-3xl mb-2">Tell us about your organisation</h1>
      <p className="fl-text-base text-secondary-fl mb-4">
        Registering as a{" "}
        <span className="fl-check-chip" style={{ verticalAlign: "middle" }}>
          <i className={`bi ${isDonor ? "bi-shop" : "bi-basket3"}`} />{isDonor ? "Donor" : "Recipient"}
        </span>
      </p>

      <form className="fl-auth-card" style={{ maxWidth: "none" }} onSubmit={(e) => { e.preventDefault(); navigate("/pending"); }}>
        <div className="fl-eyebrow mb-3">Organisation</div>
        <div className="row g-3 mb-4">
          <div className="col-md-7">
            <Field id="orgName" label="Organisation name" icon="bi-building" placeholder={isDonor ? "St. Xavier's College Canteen" : "Sneh Sadan Balgram"} />
          </div>
          <div className="col-md-5">
            <label className="form-label" htmlFor="orgType">Type</label>
            <select id="orgType" className="form-select" defaultValue="" style={{ background: "var(--bg)" }}>
              <option value="" disabled>Select type</option>
              {(isDonor ? donorTypes : recipientTypes).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="fl-eyebrow mb-3">Contact</div>
        <div className="row g-3 mb-4">
          <div className="col-md-6"><Field id="contact" label="Contact person" icon="bi-person" placeholder="Priya Sharma" /></div>
          <div className="col-md-6"><Field id="phone" label="Phone" icon="bi-telephone" placeholder="+91 98200 12345" /></div>
          <div className="col-12"><Field id="regEmail" type="email" label="Email" icon="bi-envelope" placeholder="contact@organisation.in" /></div>
        </div>

        <div className="fl-eyebrow mb-3">Location</div>
        <div className="row g-3 mb-4">
          <div className="col-md-8"><Field id="address" label="Address" icon="bi-geo-alt" placeholder="12 Dhobi Talao Cross Lane" /></div>
          <div className="col-md-4"><Field id="locality" label="Locality" icon="bi-pin-map" placeholder="Dhobi Talao" /></div>
        </div>

        <div className="fl-eyebrow mb-3">Security</div>
        <div className="row g-3 mb-4">
          <div className="col-md-6"><Field id="pw" type="password" label="Password" icon="bi-lock" placeholder="••••••••" /></div>
          <div className="col-md-6"><Field id="pw2" type="password" label="Confirm password" icon="bi-lock" placeholder="••••••••" /></div>
        </div>

        <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <Link to="/register" className="fl-text-sm text-secondary-fl text-decoration-none"><i className="bi bi-arrow-left me-1" />Back</Link>
          <button type="submit" className="btn btn-primary btn-lg-touch px-4">
            Submit for verification<i className="bi bi-arrow-right ms-2" />
          </button>
        </div>
      </form>
    </RegisterShell>
  );
}
