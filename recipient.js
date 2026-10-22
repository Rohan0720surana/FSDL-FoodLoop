// recipient.js - the shelter's dashboard: today's room, offers to accept or
// pass, the pickups it has accepted (with handover codes and a printable slip),
// and rating the food after collecting it.

let org = requireLogin("RECIPIENT");
let offers = [];    // offers waiting for my reply
let pickups = [];   // food I accepted
let me = null;      // my organisation, fresh from the server

if (org) {
  setupNavbar();
  document.getElementById("headerOrg").innerText = org.name + ", " + org.locality;
  document.getElementById("greeting").innerHTML =
    "<b>" + greeting() + ", " + escapeHtml(org.name) + "!</b>";
  refreshAll();
  setInterval(updateTimes, 1000);   // countdowns every second
  setInterval(refreshAll, 15000);   // fresh data every 15 seconds
}

function refreshAll() {
  let button = document.getElementById("refreshBtn");
  button.disabled = true;
  button.innerText = "Refreshing...";
  return loadMe()
    .then(loadOffers)
    .then(loadPickups)
    .then(function () {
      showSummary();
      button.disabled = false;
      button.innerText = "Refresh";
    });
}

function isToday(date) {
  return date && new Date(date).toDateString() == new Date().toDateString();
}

// ---------------- my organisation: capacity and verification ----------------

function loadMe() {
  return apiFetch("/organisations/me").then(function (result) {
    if (result.status == 401) {
      logout();
      return;
    }
    if (!result.ok) return;
    me = result.data;
    saveSession(getToken(), me);

    document.getElementById("capacityText").innerHTML =
      "Room left today: <b>" + me.remainingCapacityToday + " meals</b> (" +
      (me.capacityPerDay - me.remainingCapacityToday) + " of " + me.capacityPerDay + " used)" +
      "<br><span class='caption'>Food you accept: " + me.foodTypesAccepted.map(foodTypeName).join(", ") +
      " &middot; Your staff travel up to " + me.serviceRadiusKm + " km" +
      " &middot; Reliability " + Math.round(me.reliabilityScore * 100) + "%</span>";

    // waiting for verification, or turned down by an admin
    let verifyNotice = document.getElementById("verifyNotice");
    let rejectNotice = document.getElementById("rejectNotice");
    verifyNotice.classList.add("hidden");
    rejectNotice.classList.add("hidden");
    if (me.rejected) {
      rejectNotice.innerHTML = "<b>Your organisation was not approved.</b> Reason: " + escapeHtml(me.rejectionReason) +
        "<br>Please contact FoodLoop once this is fixed, and we will check again.";
      rejectNotice.classList.remove("hidden");
    } else if (!me.verified) {
      verifyNotice.classList.remove("hidden");
    }
  });
}

// ---------------- today's summary (A2) ----------------

function showSummary() {
  if (!me) return;
  let pickupsToday = 0;
  let toCollect = 0;
  for (let i = 0; i < pickups.length; i++) {
    let l = pickups[i].listing;
    if (isToday(l.acceptedAt)) pickupsToday++;
    if (l.status == "ACCEPTED") toCollect++;
  }
  document.getElementById("summary").innerHTML =
    "<div class='stat'><b>" + me.remainingCapacityToday + "</b>meals of room left today</div>" +
    "<div class='stat'><b>" + offers.length + "</b>offers waiting for your reply</div>" +
    "<div class='stat'><b>" + toCollect + "</b>pickups to collect</div>" +
    "<div class='stat'><b>" + pickupsToday + "</b>accepted today</div>" +
    "<div class='stat'><b>" + (me.rating ? me.rating.average + " &#9733;" : "-") + "</b>punctuality rating from kitchens</div>";
}

// ---------------- offers waiting for my reply ----------------

function loadOffers() {
  return apiFetch("/offers/mine").then(function (result) {
    let box = document.getElementById("offersContainer");
    if (!result.ok) {
      box.innerHTML = "<p class='red-text'>" + escapeHtml(result.data.message || "Could not load offers.") + "</p>";
      return;
    }
    offers = result.data;

    if (offers.length == 0) {
      box.innerHTML = "<div class='box'><p>No food is waiting for your reply right now. This page checks again every 15 seconds.</p></div>";
      return;
    }

    box.innerHTML = "";
    for (let i = 0; i < offers.length; i++) {
      box.append(offerCard(offers[i]));
    }
    updateTimes();
  });
}

function offerCard(offer) {
  let listing = offer.listing;
  let donor = listing.donor || {};
  let b = offer.breakdown || {};

  let why =
    "Time " + b.time + " &times; 35% = " + Math.round(b.time * 350) / 10 +
    " &nbsp;+&nbsp; Distance " + b.proximity + " &times; 25% = " + Math.round(b.proximity * 250) / 10 +
    " &nbsp;+&nbsp; Capacity " + b.capacity + " &times; 20% = " + Math.round(b.capacity * 200) / 10 +
    " &nbsp;+&nbsp; Food type " + b.foodType + " &times; 10% = " + Math.round(b.foodType * 100) / 10 +
    " &nbsp;+&nbsp; Reliability " + b.reliability + " &times; 10% = " + Math.round(b.reliability * 100) / 10 +
    " &nbsp;=&nbsp; <b>" + offer.score + "</b>";

  let card = document.createElement("div");
  card.className = "box";
  card.innerHTML =
    "<h3>" + escapeHtml(listing.description) + " <span class='caption'>(" + foodTypeName(listing.foodType) + ")</span></h3>" +
    "<p><b>" + listing.quantity + " meals</b> from <b>" + escapeHtml(donor.name) + "</b>, " + escapeHtml(donor.locality) +
    "<br><span class='caption'>Food rating from other shelters: " + starsText(donor.rating) + "</span>" +
    "<br>" + (offer.km != null ? offer.km + " km away, about " + offer.driveMinutes + " min drive" : "") + "</p>" +
    "<p>Food must be collected within: <span id='deadline-" + offer._id + "'></span>" +
    "<br>Please reply within: <span id='reply-" + offer._id + "'></span></p>" +
    "<p>Match score: <b>" + offer.score + " / 100</b> " +
    "<button class='link-btn' onclick=\"toggleWhy('" + offer._id + "')\">Why?</button></p>" +
    "<p id='why-" + offer._id + "' class='hidden caption'>" + why + "</p>" +
    "<button class='btn' id='accept-" + offer._id + "' onclick=\"acceptOffer('" + offer._id + "', " + listing.quantity + ")\">Accept</button> " +
    "<button class='btn btn-grey' id='pass-" + offer._id + "' onclick=\"passOffer('" + offer._id + "')\">Pass</button>";
  return card;
}

function toggleWhy(id) {
  document.getElementById("why-" + id).classList.toggle("hidden");
}

// countdowns for each offer - runs every second
function updateTimes() {
  for (let i = 0; i < offers.length; i++) {
    let o = offers[i];
    let deadline = document.getElementById("deadline-" + o._id);
    let reply = document.getElementById("reply-" + o._id);
    if (!deadline || !reply) continue;

    let msToDeadline = new Date(o.listing.pickupDeadline).getTime() - Date.now();
    deadline.innerText = formatTime(msToDeadline);
    deadline.className = timeClass(msToDeadline);

    let msToReply = new Date(o.replyBy).getTime() - Date.now();
    reply.innerText = msToReply > 0 ? formatTime(msToReply) : "Time is up - moving to the next shelter";
    reply.className = msToReply < 3 * 60000 ? "red-text" : "orange-text";
  }
}

function showAction(text, cssClass) {
  let message = document.getElementById("actionMessage");
  message.innerText = text;
  message.className = cssClass;
}

// stop double clicks while a reply is being sent
function lockButtons(id, text) {
  let accept = document.getElementById("accept-" + id);
  let pass = document.getElementById("pass-" + id);
  if (accept) accept.disabled = true;
  if (pass) pass.disabled = true;
  showAction(text, "");
}

function acceptOffer(id, meals) {
  if (!confirm("Accept " + meals + " meals? Your staff will need to collect them before the deadline.")) return;
  lockButtons(id, "Accepting...");
  apiFetch("/offers/" + id + "/accept", { method: "POST" }).then(function (result) {
    showAction(result.data.message, result.ok ? "green-text" : "red-text");
    refreshAll();
  });
}

function passOffer(id) {
  if (!confirm("Pass on this food? It will be offered to the next shelter.")) return;
  lockButtons(id, "Passing...");
  apiFetch("/offers/" + id + "/pass", { method: "POST" }).then(function (result) {
    showAction(result.data.message, result.ok ? "green-text" : "red-text");
    refreshAll();
  });
}

// ---------------- my pickups ----------------

function loadPickups() {
  return apiFetch("/offers/pickups").then(function (result) {
    let box = document.getElementById("pickupsContainer");
    if (!result.ok) {
      box.innerHTML = "<p class='red-text'>" + escapeHtml(result.data.message || "Could not load pickups.") + "</p>";
      return;
    }
    pickups = result.data;
    if (pickups.length == 0) {
      box.innerHTML = "<div class='box'><p>You have not accepted any food yet.</p></div>";
      return;
    }

    let html = "<table><tr><th>Food</th><th>Collect from</th><th>Handover code</th><th>Status</th></tr>";
    for (let i = 0; i < pickups.length; i++) {
      let l = pickups[i].listing;
      let donor = l.donor || {};
      let directions = "https://www.google.com/maps/dir/?api=1&destination=" + donor.lat + "," + donor.lng;

      let status;
      if (l.status == "COLLECTED") {
        status = "<span class='badge badge-collected'>Collected</span><br>";
        // rate the food once (B7)
        if (l.ratingOfFood && l.ratingOfFood.stars) {
          status += "<span class='caption'>You rated the food " + l.ratingOfFood.stars + " <span class='stars-shown'>&#9733;</span></span>";
        } else {
          status += "<span class='caption'>Was the food fresh?</span><br>" + starPicker("rate-" + l._id, "rateFood");
        }
      } else {
        let msLeft = new Date(l.pickupDeadline).getTime() - Date.now();
        status = "<span class='badge badge-accepted'>Go and collect</span><br>" +
          "<span class='" + timeClass(msLeft) + "'>" + formatTime(msLeft) + " left</span><br>" +
          "<button class='btn btn-small' onclick='printSlip(" + i + ")'>Print slip</button>";
      }

      html +=
        "<tr" + (l.status == "COLLECTED" ? " class='passed-row'" : "") + ">" +
        "<td>" + l.quantity + " meals of " + escapeHtml(l.description) + "</td>" +
        "<td><b>" + escapeHtml(donor.name) + "</b><br>" + escapeHtml(donor.address) +
        "<br><span class='caption'>Call " + escapeHtml(donor.contactName) + ": " + escapeHtml(donor.phone) + "</span>" +
        "<br><a href='" + directions + "' target='_blank'>Directions in Google Maps</a></td>" +
        "<td>" + (l.status == "COLLECTED" ? escapeHtml(l.handoverCode) : "<span class='handover-code'>" + escapeHtml(l.handoverCode) + "</span>") + "</td>" +
        "<td>" + status + "</td>" +
        "</tr>";
    }
    html += "</table>";
    box.innerHTML = html;
  });
}

// a star was clicked: send the food rating (B7)
function rateFood(pickerId, stars) {
  let listingId = pickerId.replace("rate-", "");
  let buttons = document.querySelectorAll("#" + pickerId + " .star");
  for (let i = 0; i < buttons.length; i++) {
    if (i < stars) buttons[i].classList.add("on");
    buttons[i].disabled = true;
  }
  apiFetch("/offers/pickups/" + listingId + "/rate", { method: "POST", body: JSON.stringify({ stars: stars }) })
    .then(function (result) {
      showAction(result.data.message, result.ok ? "green-text" : "red-text");
      loadPickups();
    });
}

// ---------------- printable handover slip (A4) ----------------

function printSlip(index) {
  let l = pickups[index].listing;
  let donor = l.donor || {};
  document.getElementById("slip").innerHTML =
    "<h1>FoodLoop pickup slip</h1>" +
    "<p><b>Handover code:</b> <span class='handover-code'>" + escapeHtml(l.handoverCode) + "</span></p>" +
    "<table>" +
    "<tr><td>Food</td><td>" + l.quantity + " meals of " + escapeHtml(l.description) + " (" + foodTypeName(l.foodType) + ")</td></tr>" +
    "<tr><td>Collect from</td><td>" + escapeHtml(donor.name) + "<br>" + escapeHtml(donor.address) + "</td></tr>" +
    "<tr><td>Kitchen contact</td><td>" + escapeHtml(donor.contactName) + ", " + escapeHtml(donor.phone) + "</td></tr>" +
    "<tr><td>Collect before</td><td>" + new Date(l.pickupDeadline).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" }) + "</td></tr>" +
    "<tr><td>Collected by</td><td>" + escapeHtml(me ? me.name : org.name) + "</td></tr>" +
    "</table>" +
    "<p>Show this code at the kitchen. The kitchen types it into FoodLoop to confirm the pickup.</p>" +
    "<p>Staff name: ______________________ &nbsp; Signature: ______________________</p>";
  window.print();
}
