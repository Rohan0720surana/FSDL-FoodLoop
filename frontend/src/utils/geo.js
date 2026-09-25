// Distance and travel-time estimates used by the maps and the matching views.
// Straight-line distance x a road factor, at a time-of-day city speed.
// Real road routing / live traffic needs a routing API and comes with the backend.

const ROAD_FACTOR = 1.3; // Mumbai roads are rarely straight; ~30% longer than the crow flies
const PEAK_KMH = 18; // 8-11 am and 5-10 pm
const OFF_PEAK_KMH = 26;

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function roadKm(a, b) {
  return haversineKm(a, b) * ROAD_FACTOR;
}

export function isPeak(date = new Date()) {
  const h = date.getHours();
  return (h >= 8 && h < 11) || (h >= 17 && h < 22);
}

export function etaMinutes(km, date = new Date()) {
  return Math.max(1, Math.round((km / (isPeak(date) ? PEAK_KMH : OFF_PEAK_KMH)) * 60));
}

export function trip(a, b, date = new Date()) {
  const km = roadKm(a, b);
  return { km: Math.round(km * 10) / 10, min: etaMinutes(km, date), peak: isPeak(date) };
}

export function directionsUrl(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
}
