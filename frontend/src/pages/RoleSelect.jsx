import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterShell from "../components/RegisterShell";

const roles = [
  {
    key: "DONOR",
    eyebrow: "Donor",
    title: "We have surplus food",
    body: "Post what's left in under a minute. FoodLoop ranks nearby recipients and sends the offer for you.",
    icon: "bi-shop",
    types: ["Restaurants", "Hotels", "Canteens", "Caterers", "Event venues"],
  },
  {
    key: "RECIPIENT",
    eyebrow: "Recipient",
    title: "We collect and serve food",
    body: "Receive ranked offers you can actually fulfil — never an open marketplace to scramble through.",
    icon: "bi-basket3",
    types: ["NGOs", "Shelters", "Community kitchens", "Food banks"],
  },
];

export default function RoleSelect() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  return (
    <RegisterShell step={1}>
      <div className="fl-kicker"><b>Step 1</b> of 3</div>
      <h1 className="fl-display fl-text-3xl mb-2">What kind of organisation are you?</h1>
      <p className="fl-text-base text-secondary-fl mb-5">This decides what you'll see — donors post surplus, recipients receive ranked offers.</p>

      <div className="row g-4 mb-5 align-items-stretch">
        {roles.map((r) => {
          const selected = role === r.key;
          return (
            <div className="col-md-6" key={r.key}>
              <button
                type="button"
                onClick={() => setRole(r.key)}
                className={`fl-role-card h-100 w-100 text-start ${selected ? "selected" : ""}`}
                aria-pressed={selected}
              >
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <span className="fl-role-icon"><i className={`bi ${r.icon}`} /></span>
                  <span className="fl-role-radio">{selected && <i className="bi bi-check-lg" />}</span>
                </div>
                <div className="fl-eyebrow mb-2">{r.eyebrow}</div>
                <h2 className="fl-text-xl mb-2" style={{ fontWeight: 700 }}>{r.title}</h2>
                <p className="fl-text-sm text-secondary-fl mb-4">{r.body}</p>
                <div className="d-flex flex-wrap gap-2 mt-auto">
                  {r.types.map((t) => <span key={t} className="fl-type-chip">{t}</span>)}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <Link to="/login" className="fl-text-sm text-secondary-fl text-decoration-none">Already registered? <span style={{ color: "var(--primary)", fontWeight: 600 }}>Log in</span></Link>
        <button
          type="button"
          className="btn btn-primary btn-lg-touch px-4"
          disabled={!role}
          onClick={() => navigate(`/register/details?role=${role.toLowerCase()}`)}
        >
          Continue<i className="bi bi-arrow-right ms-2" />
        </button>
      </div>
    </RegisterShell>
  );
}
