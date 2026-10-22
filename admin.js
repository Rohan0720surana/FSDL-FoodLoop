// admin.js - verify or turn down shelters, and see every organisation

let org = requireLogin("ADMIN");

if (org) {
  setupNavbar();
  document.getElementById("greeting").innerHTML = "<b>" + greeting() + ", " + escapeHtml(org.name) + "!</b>";
  loadOrganisations();
}

function shortDate(date) {
  return new Date(date).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function shelterStatus(o) {
  if (o.verified) return "<span class='badge badge-accepted'>Verified</span>";
  if (o.rejected) return "<span class='badge badge-expired'>Not approved</span>";
  return "<span class='badge badge-matched'>Waiting</span>";
}

function loadOrganisations() {
  apiFetch("/admin/organisations").then(function (result) {
    if (result.status == 401 || result.status == 403) {
      logout();
      return;
    }
    if (!result.ok) {
      document.getElementById("pending").innerHTML = "<p class='red-text'>" + escapeHtml(result.data.message) + "</p>";
      return;
    }

    let shelters = [];
    let kitchens = [];
    for (let i = 0; i < result.data.length; i++) {
      if (result.data[i].type == "RECIPIENT") shelters.push(result.data[i]);
      else kitchens.push(result.data[i]);
    }
    let waiting = shelters.filter(function (s) { return !s.verified && !s.rejected; });
    let verified = shelters.filter(function (s) { return s.verified; });

    document.getElementById("summary").innerHTML =
      "<div class='stat'><b>" + waiting.length + "</b>shelters waiting</div>" +
      "<div class='stat'><b>" + verified.length + "</b>verified shelters</div>" +
      "<div class='stat'><b>" + kitchens.length + "</b>donor kitchens</div>";

    showPending(waiting);
    showShelters(shelters);
    showKitchens(kitchens);
  });
}

// one card per shelter waiting for a decision
function showPending(waiting) {
  let box = document.getElementById("pending");
  if (waiting.length == 0) {
    box.innerHTML = "<div class='box'><p>No shelters are waiting. New sign-ups appear here.</p></div>";
    return;
  }
  let html = "";
  for (let i = 0; i < waiting.length; i++) {
    let s = waiting[i];
    html +=
      "<div class='box'>" +
      "<h3>" + escapeHtml(s.name) + " <span class='caption'>" + escapeHtml(s.category) + "</span></h3>" +
      "<table>" +
      "<tr><td>Contact</td><td>" + escapeHtml(s.contactName) + ", " + escapeHtml(s.phone) + ", " + escapeHtml(s.email) + "</td></tr>" +
      "<tr><td>Address</td><td>" + escapeHtml(s.address) + " (" + escapeHtml(s.locality) + ")</td></tr>" +
      "<tr><td>Food accepted</td><td>" + s.foodTypesAccepted.map(foodTypeName).join(", ") + "</td></tr>" +
      "<tr><td>Meals per day</td><td>" + s.capacityPerDay + ", staff travel up to " + s.serviceRadiusKm + " km</td></tr>" +
      "<tr><td>Signed up</td><td>" + shortDate(s.createdAt) + "</td></tr>" +
      "</table>" +
      "<button class='btn' onclick=\"verify('" + s._id + "')\">Verify</button> " +
      "<label for='reason-" + s._id + "'>or turn down because:</label> " +
      "<input type='text' id='reason-" + s._id + "' placeholder='e.g. phone number not reachable'> " +
      "<button class='btn btn-red' onclick=\"reject('" + s._id + "')\">Turn down</button>" +
      "</div>";
  }
  box.innerHTML = html;
}

function showShelters(shelters) {
  let html = "<tr><th>Shelter</th><th>Area</th><th>Status</th><th>Meals / day</th><th>Pickups done</th><th>Reliability</th></tr>";
  for (let i = 0; i < shelters.length; i++) {
    let s = shelters[i];
    html += "<tr>" +
      "<td><b>" + escapeHtml(s.name) + "</b><br><span class='caption'>" + escapeHtml(s.category) + "</span>" +
      (s.rejected ? "<br><span class='caption red-text'>" + escapeHtml(s.rejectionReason) + "</span>" : "") + "</td>" +
      "<td>" + escapeHtml(s.locality) + "</td>" +
      "<td>" + shelterStatus(s) + "</td>" +
      "<td>" + s.capacityPerDay + "</td>" +
      "<td>" + s.pickupsCompleted + "</td>" +
      "<td>" + Math.round(s.reliabilityScore * 100) + "%</td>" +
      "</tr>";
  }
  document.getElementById("shelterTable").innerHTML = html;
}

function showKitchens(kitchens) {
  let html = "<tr><th>Kitchen</th><th>Area</th><th>FSSAI licence</th><th>Contact</th><th>Listings posted</th></tr>";
  for (let i = 0; i < kitchens.length; i++) {
    let k = kitchens[i];
    html += "<tr>" +
      "<td><b>" + escapeHtml(k.name) + "</b><br><span class='caption'>" + escapeHtml(k.category) + "</span></td>" +
      "<td>" + escapeHtml(k.locality) + "</td>" +
      "<td>" + escapeHtml(k.fssaiLicence || "-") + "</td>" +
      "<td>" + escapeHtml(k.contactName) + "<br>" + escapeHtml(k.phone) + "</td>" +
      "<td>" + k.listingsPosted + "</td>" +
      "</tr>";
  }
  document.getElementById("kitchenTable").innerHTML = html;
}

function showAction(text, cssClass) {
  let message = document.getElementById("actionMessage");
  message.innerText = text;
  message.className = cssClass;
}

function verify(id) {
  if (!confirm("Verify this shelter? It will start receiving food offers.")) return;
  apiFetch("/admin/organisations/" + id + "/verify", { method: "POST" }).then(function (result) {
    showAction(result.data.message, result.ok ? "green-text" : "red-text");
    loadOrganisations();
  });
}

function reject(id) {
  let reason = document.getElementById("reason-" + id).value.trim();
  if (reason == "") {
    showAction("Type a reason so the shelter knows what to fix.", "red-text");
    document.getElementById("reason-" + id).focus();
    return;
  }
  apiFetch("/admin/organisations/" + id + "/reject", { method: "POST", body: JSON.stringify({ reason: reason }) })
    .then(function (result) {
      showAction(result.data.message, result.ok ? "green-text" : "red-text");
      loadOrganisations();
    });
}
