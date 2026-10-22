// areas.js - Mumbai areas with the latitude and longitude of their centre.
// The register forms use this list, so organisations pick their area from a
// dropdown instead of typing coordinates. The matching engine uses lat / lng
// to work out distance and drive time.

const mumbaiAreas = [
  { name: "Colaba", lat: 18.9067, lng: 72.8147 },
  { name: "Fort", lat: 18.9338, lng: 72.8356 },
  { name: "Churchgate", lat: 18.9322, lng: 72.8264 },
  { name: "Dhobi Talao", lat: 18.9497, lng: 72.8296 },
  { name: "Marine Lines", lat: 18.9447, lng: 72.8236 },
  { name: "Girgaon", lat: 18.9553, lng: 72.8172 },
  { name: "Grant Road", lat: 18.9633, lng: 72.8166 },
  { name: "Tardeo", lat: 18.9697, lng: 72.8143 },
  { name: "Mumbai Central", lat: 18.9690, lng: 72.8205 },
  { name: "Byculla", lat: 18.9767, lng: 72.8331 },
  { name: "Lower Parel", lat: 18.9953, lng: 72.8302 },
  { name: "Worli", lat: 19.0100, lng: 72.8170 },
  { name: "Parel", lat: 19.0094, lng: 72.8378 },
  { name: "Prabhadevi", lat: 19.0166, lng: 72.8295 },
  { name: "Dadar", lat: 19.0186, lng: 72.8430 },
  { name: "Wadala", lat: 19.0176, lng: 72.8562 },
  { name: "Matunga", lat: 19.0270, lng: 72.8550 },
  { name: "Mahim", lat: 19.0410, lng: 72.8400 },
  { name: "Dharavi", lat: 19.0380, lng: 72.8538 },
  { name: "Sion", lat: 19.0390, lng: 72.8619 },
  { name: "Bandra West", lat: 19.0596, lng: 72.8295 },
  { name: "Bandra East", lat: 19.0633, lng: 72.8411 },
  { name: "BKC", lat: 19.0669, lng: 72.8679 },
  { name: "Kurla", lat: 19.0726, lng: 72.8845 },
  { name: "Chembur", lat: 19.0522, lng: 72.9005 },
  { name: "Ghatkopar", lat: 19.0860, lng: 72.9080 },
  { name: "Santacruz", lat: 19.0810, lng: 72.8410 },
  { name: "Vile Parle", lat: 19.0990, lng: 72.8440 },
  { name: "Andheri West", lat: 19.1197, lng: 72.8464 },
  { name: "Andheri East", lat: 19.1155, lng: 72.8697 },
  { name: "Powai", lat: 19.1176, lng: 72.9060 },
  { name: "Vikhroli", lat: 19.1110, lng: 72.9280 },
  { name: "Jogeshwari", lat: 19.1350, lng: 72.8490 },
  { name: "Goregaon", lat: 19.1640, lng: 72.8490 },
  { name: "Malad", lat: 19.1860, lng: 72.8480 },
  { name: "Kandivali", lat: 19.2040, lng: 72.8520 },
  { name: "Borivali", lat: 19.2300, lng: 72.8570 },
  { name: "Mulund", lat: 19.1720, lng: 72.9560 }
];

// fill a <select> with the areas, in alphabetical order
function fillAreaSelect(selectId) {
  let select = document.getElementById(selectId);
  let sorted = mumbaiAreas.slice().sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  for (let i = 0; i < sorted.length; i++) {
    let option = document.createElement("option");
    option.value = sorted[i].name;
    option.innerText = sorted[i].name;
    select.append(option);
  }
}

// find an area by name (returns null if not found)
function findArea(name) {
  for (let i = 0; i < mumbaiAreas.length; i++) {
    if (mumbaiAreas[i].name == name) return mumbaiAreas[i];
  }
  return null;
}
