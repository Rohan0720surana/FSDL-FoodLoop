import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path;

  return (
    <nav className="fl-navbar navbar navbar-expand-md py-3">
      <div className="fl-container d-flex w-100 align-items-center">
        <Link to="/" className="fl-brand text-decoration-none me-4">
          Food<span className="dot">Loop</span>
        </Link>

        <div className="d-none d-md-flex gap-1 flex-grow-1">
          <Link className={`nav-link px-3 py-2 ${isActive("/") ? "active" : ""}`} to="/">
            Home
          </Link>
          <Link
            className={`nav-link px-3 py-2 ${isActive("/donor/listings/new") ? "active" : ""}`}
            to="/donor/listings/new"
          >
            Post Surplus
          </Link>
          <Link
            className={`nav-link px-3 py-2 ${isActive("/recipient/offers") ? "active" : ""}`}
            to="/recipient/offers"
          >
            Offer Inbox
          </Link>
          <Link
            className={`nav-link px-3 py-2 ${isActive("/admin/simulation") ? "active" : ""}`}
            to="/admin/simulation"
          >
            Simulation
          </Link>
        </div>

        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-secondary btn-sm px-3">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm px-3">
            Register org
          </Link>
        </div>
      </div>
    </nav>
  );
}
