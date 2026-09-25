// Organisations for Map View (C01) — real Mumbai localities & coordinates

export const donorOrgs = [
  { id: "d1", name: "St. Xavier's College Canteen", type: "CANTEEN", locality: "Dhobi Talao", lat: 18.9497, lng: 72.8296 },
  { id: "d2", name: "Yazdani Irani Bakery", type: "BAKERY", locality: "Fort", lat: 18.9367, lng: 72.8347 },
  { id: "d3", name: "Regency Banquet Hall", type: "EVENT_VENUE", locality: "Andheri West", lat: 19.1197, lng: 72.8464 },
  { id: "d4", name: "Sea Lounge Kitchen, Colaba", type: "HOTEL", locality: "Colaba", lat: 18.9220, lng: 72.8347 },
  { id: "d5", name: "Konkan Spice Caterers", type: "CATERER", locality: "Powai", lat: 19.1176, lng: 72.9060 },
  { id: "d6", name: "Delisea Banquets", type: "EVENT_VENUE", locality: "Worli", lat: 19.0176, lng: 72.8178 },
];

export const recipientOrgs = [
  { id: "r1", name: "Asha Deep Night Shelter", type: "SHELTER", locality: "Bandra East", lat: 19.0633, lng: 72.8411, capacity: 80 },
  { id: "r2", name: "Sneh Sadan Balgram", type: "ORPHANAGE", locality: "Dadar", lat: 19.0186, lng: 72.8430, capacity: 80, serviceRadiusKm: 14 },
  { id: "r3", name: "Seva Sadan Community Kitchen", type: "COMMUNITY_KITCHEN", locality: "Kurla", lat: 19.0726, lng: 72.8845, capacity: 100 },
  { id: "r4", name: "Kripa Foundation Food Bank", type: "FOOD_BANK", locality: "BKC", lat: 19.0669, lng: 72.8679, capacity: 150 },
  { id: "r5", name: "Prakash Old Age Home", type: "OLD_AGE_HOME", locality: "Chembur", lat: 19.0522, lng: 72.9005, capacity: 40 },
];

export const activeListingMarkers = [
  { id: "lst_1", donorId: "d1", lat: 18.9497, lng: 72.8296, quantity: 48, urgency: "moderate" },
  { id: "lst_2", donorId: "d3", lat: 19.1197, lng: 72.8464, quantity: 22, urgency: "urgent" },
  { id: "lst_3", donorId: "d4", lat: 18.9220, lng: 72.8347, quantity: 65, urgency: "critical" },
];

export const mumbaiCenter = { lat: 19.0330, lng: 72.8570 };
