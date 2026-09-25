import { Link } from "react-router-dom";
import Logo from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { to: "/#how-it-works", label: "How it works" },
      { to: "/#matching", label: "Matching engine" },
      { to: "/#impact", label: "Impact" },
      { to: "/admin/simulation", label: "Strategy results" },
    ],
  },
  {
    title: "For kitchens",
    links: [
      { to: "/donor", label: "Donor dashboard" },
      { to: "/donor/listings/new", label: "Post surplus food" },
      { to: "/donor/map", label: "Incoming pickups" },
      { to: "/donor/impact", label: "Your impact" },
    ],
  },
  {
    title: "For recipients",
    links: [
      { to: "/recipient", label: "Recipient dashboard" },
      { to: "/recipient/offers", label: "Offer inbox" },
      { to: "/recipient/map", label: "Pickup route" },
      { to: "/recipient/impact", label: "Meals received" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/login", label: "Log in" },
      { to: "/register", label: "Register" },
      { to: "/pending", label: "Verification status" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="fl-footer">
      <div className="fl-container">
        <div className="row g-5">
          <div className="col-lg-4">
            <Link to="/" className="fl-brand text-decoration-none" aria-label="FoodLoop home">
              <Logo tone="dark" size={34} />
            </Link>
            <p className="mt-3 mb-0 fl-footer-lede">
              Surplus food from Mumbai&apos;s kitchens, matched to the shelters and community kitchens
              that can collect it before the deadline.
            </p>
          </div>
          {columns.map((col) => (
            <div className="col-6 col-md-3 col-lg-2" key={col.title}>
              <div className="fl-footer-head">{col.title}</div>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to} className="fl-footer-link">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="fl-footer-base">
          <span>© 2026 FoodLoop</span>
          <span>Made in Mumbai, for the people who feed it.</span>
        </div>
      </div>
    </footer>
  );
}
