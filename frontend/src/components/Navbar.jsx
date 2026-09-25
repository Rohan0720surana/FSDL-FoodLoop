import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

const PUBLIC_NAV = [
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#donors", label: "For donors" },
  { to: "/#recipients", label: "For recipients" },
  { to: "/#impact", label: "Impact" },
];

const NAV_BY_ROLE = {
  donor: [
    { to: "/donor", label: "Dashboard" },
    { to: "/donor/listings/new", label: "Post food" },
    { to: "/donor/map", label: "Map" },
    { to: "/donor/impact", label: "Impact" },
  ],
  recipient: [
    { to: "/recipient", label: "Dashboard" },
    { to: "/recipient/offers", label: "Offers", badge: 4 },
    { to: "/recipient/map", label: "Map" },
    { to: "/recipient/impact", label: "Impact" },
  ],
  admin: [{ to: "/admin/simulation", label: "Simulation" }],
};

const ORG_BY_ROLE = {
  donor: { name: "St. Xavier's Canteen", icon: "bi-shop" },
  recipient: { name: "Sneh Sadan Balgram", icon: "bi-house-heart" },
  admin: { name: "FoodLoop admin", icon: "bi-person-gear" },
};

export default function Navbar({ role = "public", overlay = false }) {
  const { pathname } = useLocation();

  if (role === "public") {
    return (
      <nav className={`navbar py-3 ${overlay ? "fl-navbar-overlay" : "fl-navbar"}`}>
        <div className="fl-container d-flex w-100 align-items-center">
          <Link to="/" className="fl-brand text-decoration-none me-lg-5" aria-label="FoodLoop home">
            <Logo tone={overlay ? "dark" : "light"} />
          </Link>
          <div className="d-none d-lg-flex gap-1 flex-grow-1">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.to} to={item.to} className="nav-link px-3 py-2">{item.label}</Link>
            ))}
          </div>
          <div className="d-flex align-items-center gap-3 ms-auto">
            <Link
              to="/login"
              className="fl-nav-login"
              style={{ color: overlay ? "rgba(255,255,255,0.92)" : "var(--text-primary)" }}
            >
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary px-4 text-nowrap">Register</Link>
          </div>
        </div>
      </nav>
    );
  }

  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.donor;
  const org = ORG_BY_ROLE[role] ?? ORG_BY_ROLE.donor;
  const isActive = (to) => pathname === to || (to === "/recipient/map" && pathname === "/map");

  return (
    <nav className="fl-navbar navbar py-0">
      <div className="fl-container w-100">
        <div className="d-flex align-items-center fl-appbar">
          <Link to="/" className="fl-brand text-decoration-none me-4" aria-label="FoodLoop home">
            <Logo />
          </Link>

          <div className="d-none d-md-flex gap-1 flex-grow-1">
            {items.map((item) => (
              <Link key={item.to} to={item.to} className={`nav-link px-3 py-2 d-flex align-items-center gap-2 ${isActive(item.to) ? "active" : ""}`}>
                {item.label}
                {item.badge ? <span className="fl-nav-badge">{item.badge}</span> : null}
              </Link>
            ))}
          </div>

          <span className="fl-org-chip ms-auto">
            <i className={`bi ${org.icon}`} aria-hidden="true" />
            <span className="d-none d-sm-inline">{org.name}</span>
          </span>
        </div>

        {/* phones: links move to a scrollable row under the logo */}
        <div className="d-flex d-md-none gap-1 fl-appbar-mobile">
          {items.map((item) => (
            <Link key={item.to} to={item.to} className={`nav-link px-3 py-2 ${isActive(item.to) ? "active" : ""}`}>
              {item.label}{item.badge ? <span className="fl-nav-badge ms-1">{item.badge}</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
