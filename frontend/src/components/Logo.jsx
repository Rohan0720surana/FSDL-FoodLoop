// FoodLoop mark: the ring is the pickup deadline, the green arc is the route
// closing the loop, the gold hand is the time left.
const TONES = {
  light: { ring: "#1e4435", route: "#1fa97e", hand: "#c9a24a", text: "#14201a" },
  dark: { ring: "#f8f4ec", route: "#1fa97e", hand: "#e7c77a", text: "#ffffff" },
};

export function LogoMark({ size = 30, tone = "light" }) {
  const c = TONES[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M44 11.22 A24 24 0 1 1 11.22 44" fill="none" stroke={c.ring} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M11.22 44 A24 24 0 0 1 20.74 10.81" fill="none" stroke={c.route} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M17.9 5.6 L27.6 7.2 L23.6 16.2 Z" fill={c.route} stroke={c.route} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="32" y1="32" x2="41.5" y2="22.5" stroke={c.hand} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill={c.hand} />
    </svg>
  );
}

export default function Logo({ tone = "light", size = 30 }) {
  return (
    <span className="fl-logo" style={{ color: TONES[tone].text }}>
      <LogoMark size={size} tone={tone} />
      <span className="fl-logo-word" style={{ fontSize: Math.round(size * 0.8) }}>
        Food<i>Loop</i>
      </span>
    </span>
  );
}
