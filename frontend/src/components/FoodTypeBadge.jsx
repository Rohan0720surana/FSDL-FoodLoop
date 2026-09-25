import { foodTypeMeta } from "../mockdata/offers";

export default function FoodTypeBadge({ foodType }) {
  const meta = foodTypeMeta[foodType] ?? { label: foodType, icon: "bi-basket" };
  return (
    <span className="fl-badge">
      <i className={`bi ${meta.icon} me-1`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
