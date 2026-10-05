// data.js - sample data and helper functions used by the donor, recipient and map pages.
// There is no database yet, so everything is stored in arrays.

// our kitchen (the donor in this demo)
const kitchen = {
  name: "St. Xavier's College Canteen",
  area: "Dhobi Talao",
  lat: 18.9497,
  lng: 72.8296
};

// shelters and NGOs that can receive food
const shelters = [
  { name: "Sneh Sadan Balgram", area: "Dadar", lat: 19.0186, lng: 72.8430, room: 48, takesNonVeg: true, reliability: 0.9 },
  { name: "Asha Deep Night Shelter", area: "Bandra East", lat: 19.0633, lng: 72.8411, room: 60, takesNonVeg: true, reliability: 0.8 },
  { name: "Kripa Foundation Food Bank", area: "BKC", lat: 19.0669, lng: 72.8679, room: 120, takesNonVeg: true, reliability: 0.7 },
  { name: "Seva Sadan Community Kitchen", area: "Kurla", lat: 19.0726, lng: 72.8845, room: 90, takesNonVeg: true, reliability: 0.75 },
  { name: "Prakash Old Age Home", area: "Chembur", lat: 19.0522, lng: 72.9005, room: 25, takesNonVeg: false, reliability: 0.95 }
];

// Distance in km between two places, using their latitude and longitude.
// (Haversine formula: distance on the curved surface of the Earth, radius 6371 km.)
function distanceKm(lat1, lng1, lat2, lng2) {
  let toRad = Math.PI / 180;
  let dLat = (lat2 - lat1) * toRad;
  let dLng = (lng2 - lng1) * toRad;
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  let straightLine = 2 * 6371 * Math.asin(Math.sqrt(a));
  let byRoad = straightLine * 1.3;        // roads are about 30% longer than a straight line
  return Math.round(byRoad * 10) / 10;    // round to 1 decimal place
}

// Driving time in minutes, assuming 20 km/h average speed in Mumbai traffic
function driveMinutes(km) {
  return Math.round(km / 20 * 60);
}

// Score out of 100 for one shelter and one listing.
// Weights: time 35%, distance 25%, capacity 20%, food type 10%, reliability 10%
function matchScore(shelter, meals, foodType, minutesLeft) {
  let km = distanceKm(kitchen.lat, kitchen.lng, shelter.lat, shelter.lng);
  let minutes = driveMinutes(km);

  // rules that remove a shelter completely
  if (minutes > minutesLeft) return 0;                       // can't reach in time
  if (meals > shelter.room) return 0;                        // not enough room
  if (foodType == "Non-veg" && !shelter.takesNonVeg) return 0; // doesn't take non-veg

  let timeScore = 1 - minutes / minutesLeft;    // more spare time = better
  let distanceScore = 1 - km / 25;              // closer = better (25 km or more scores 0)
  if (distanceScore < 0) distanceScore = 0;
  let capacityScore = meals / shelter.room;     // fills their spare room well = better
  let typeScore = 1;
  let reliabilityScore = shelter.reliability;

  let total = 0.35 * timeScore + 0.25 * distanceScore + 0.20 * capacityScore +
              0.10 * typeScore + 0.10 * reliabilityScore;
  return Math.round(total * 100);
}

// turns milliseconds into text like "1h 25m" or "12m 05s"
function formatTime(ms) {
  if (ms <= 0) return "Expired";
  let totalSeconds = Math.floor(ms / 1000);
  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  let s = totalSeconds % 60;
  if (h > 0) return h + "h " + m + "m";
  if (s < 10) s = "0" + s;
  return m + "m " + s + "s";
}
