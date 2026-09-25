import { useEffect, useRef, useState } from "react";
import { urgencyFromDeadline } from "../mockdata/offers";

function formatRemaining(ms) {
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h >= 1) return `${h}h ${m}m`;
  if (m >= 1) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `0:${String(s).padStart(2, "0")}`;
}

const urgencyIcon = {
  ample: "bi-clock",
  moderate: "bi-clock",
  urgent: "bi-alarm",
  critical: "bi-alarm-fill",
};

export default function CountdownTimer({ deadline, className = "" }) {
  const [now, setNow] = useState(Date.now());
  const announcedRef = useRef(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadline - now;
  const urgency = urgencyFromDeadline(deadline);
  const minsLeft = remaining / 60000;
  const shouldPulse = minsLeft > 0 && minsLeft < 15;

  if (minsLeft <= 15 && !announcedRef.current) announcedRef.current = true;

  return (
    <span
      className={`fl-countdown urgency-${urgency} ${shouldPulse ? "pulse" : ""} ${className}`}
      aria-live={minsLeft <= 15 ? "polite" : "off"}
    >
      <i className={`bi ${urgencyIcon[urgency]}`} aria-hidden="true" />
      {formatRemaining(remaining)}
    </span>
  );
}
