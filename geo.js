// geo.js - distance and drive time between two places (same maths as the server)

// Distance in km between two places, using their latitude and longitude.
// Haversine formula: distance on the curved surface of the Earth (radius 6371 km),
// then +30% because roads are not straight.
function distanceKm(lat1, lng1, lat2, lng2) {
  let toRad = Math.PI / 180;
  let dLat = (lat2 - lat1) * toRad;
  let dLng = (lng2 - lng1) * toRad;
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  let straightLine = 2 * 6371 * Math.asin(Math.sqrt(a));
  return Math.round(straightLine * 1.3 * 10) / 10;   // round to 1 decimal place
}

// Driving time in minutes, assuming 20 km/h average speed in Mumbai traffic
function driveMinutes(km) {
  return Math.round(km / 20 * 60);
}
