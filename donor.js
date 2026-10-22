// donor.js - the donor dashboard: post food, see who it was offered to,
// confirm the pickup with the shelter's handover code, and rate the shelter.

let org = requireLogin("DONOR");
let listings = [];          // my listings, as sent by the server
let openOffersFor = null;   // listing whose timeline is being shown
let myRating = null;        // how shelters rated my food

if (org) {
  setupNavbar();
  document.getElementById("headerOrg").innerText = org.name + ", " + org.locality;
  document.getElementById("greeting").innerHTML =
    "<b>" + greeting() + ", " + escapeHtml(org.name) + "!</b>";
  loadMyRating().then(loadListings);
  loadInsights();
  setInterval(updateTimes, 1000);    // countdown every second
  setInterval(loadListings, 15000);  // fresh data every 15 seconds
}

function clockTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isToday(date) {
  return date && new Date(date).toDateString() == new Date().toDateString();
}

// ---------------- today's summary (A2) ----------------

function loadMyRating() {
  return apiFetch("/organisations/me").then(function (result) {
    if (result.ok) myRating = result.data.rating;
  });
}

function showSummary() {
  let postedToday = 0;
  let waiting = 0;
  let coming = 0;
  let mealsToday = 0;
  for (let i = 0; i < listings.length; i++) {
    let l = listings[i];
    if (isToday(l.createdAt)) postedToday++;
    if (l.status == "MATCHED") waiting++;
    if (l.status == "ACCEPTED") coming++;
    if (l.status == "COLLECTED" && isToday(l.collectedAt)) mealsToday += l.quantity;
  }
  document.getElementById("summary").innerHTML =
    "<div class='stat'><b>" + postedToday + "</b>posted today</div>" +
    "<div class='stat'><b>" + waiting + "</b>waiting for a shelter</div>" +
    "<div class='stat'><b>" + coming + "</b>shelters on the way</div>" +
    "<div class='stat'><b>" + mealsToday + "</b>meals collected today</div>" +
    "<div class='stat'><b>" + (myRating ? myRating.average + " &#9733;" : "-") + "</b>your food rating from shelters</div>";
}

// ---------------- "you usually have surplus on ..." (B5) ----------------

function loadInsights() {
  apiFetch("/listings/insights").then(function (result) {
    let box = document.getElementById("insight");
    if (!result.ok) return;
    let s = result.data;
    let text = "";

    if (s.today) {
      text = "<b>On " + s.today.day + " you usually post about " + s.today.averageMeals + " meals around " +
        s.today.usualTime + "</b>, mostly " + foodTypeName(s.today.usualFoodType).toLowerCase() +
        " (from your last " + s.today.listings + " " + s.today.day + "). " +
        "<button class='btn btn-small' onclick='useSuggestion(" + s.today.averageMeals + ", \"" + s.today.usualFoodType + "\")'>Fill in " +
        s.today.averageMeals + " meals</button>";
    } else if (s.busiestDay) {
      text = "Your busiest day is <b>" + s.busiestDay.day + "</b>: about " + s.busiestDay.averageMeals +
        " meals around " + s.busiestDay.usualTime + ". Nothing usual for today.";
    } else {
      text = "Post food a few times and FoodLoop will learn which days you usually have surplus.";
    }
    box.innerHTML = text + "<br><span class='caption'>Worked out from your past " + s.totalListings +
      " listings with a MongoDB aggregation (grouped by day of the week).</span>";
    box.classList.remove("hidden");
  });
}

function useSuggestion(meals, foodType) {
  document.getElementById("quantity").value = meals;
  document.getElementById("type").value = foodType;
  document.getElementById("food").focus();
}

// ---------------- posting food ----------------

function showMessage(text, cssClass) {
  let message = document.getElementById("message");
  message.innerText = text;
  message.className = cssClass || "";
}

function postFood() {
  let food = document.getElementById("food").value.trim();
  let type = document.getElementById("type").value;
  let meals = Number(document.getElementById("quantity").value);
  let hours = Number(document.getElementById("hours").value);
  let button = document.getElementById("postBtn");
  document.getElementById("rankBox").classList.add("hidden");

  // checks before sending
  if (food == "") {
    showMessage("Please enter what the food is.", "red-text");
    return;
  }
  if (!Number.isInteger(meals) || meals <= 0) {
    showMessage("Please enter the number of meals (a whole number above 0).", "red-text");
    return;
  }
  if (!(hours >= 0.5 && hours <= 12)) {
    showMessage("The pickup time must be between half an hour and 12 hours.", "red-text");
    return;
  }

  let deadline = new Date(Date.now() + hours * 3600000).toISOString();
  button.disabled = true;
  button.innerText = "Posting...";
  showMessage("Posting the food...");

  // 1. save the listing, 2. ask the server to rank the shelters
  apiFetch("/listings", {
    method: "POST",
    body: JSON.stringify({ description: food, foodType: type, quantity: meals, pickupDeadline: deadline })
  })
    .then(function (created) {
      if (!created.ok) {
        throw new Error(created.data.message || "Could not post the food.");
      }
      showMessage("Posted. Finding the best shelter...");
      return apiFetch("/listings/" + created.data._id + "/match", { method: "POST" });
    })
    .then(function (matched) {
      if (!matched.ok) {
        throw new Error(matched.data.message || "Could not match the food.");
      }
      let offers = matched.data.offers || [];
      if (offers.length == 0) {
        showMessage(matched.data.message, "orange-text");
      } else {
        showMessage("Posted! Offered first to " + offers[0].recipient.name + ".", "green-text");
        showRanking(offers);
        document.getElementById("food").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("hours").value = "";
      }
      loadListings();
    })
    .catch(function (error) {
      showMessage(error.message, "red-text");
      loadListings();
    })
    .then(function () {
      button.disabled = false;
      button.innerText = "Post food";
    });
}

// the ranked shelters for the food just posted
function showRanking(offers) {
  let table = document.getElementById("rankTable");
  table.innerHTML = "<tr><th>Rank</th><th>Shelter</th><th>Area</th><th>Distance</th><th>Drive time</th><th>Score</th></tr>";

  for (let i = 0; i < offers.length; i++) {
    let o = offers[i];
    let row = document.createElement("tr");
    if (i == 0) row.classList.add("accepted-row");
    row.innerHTML =
      "<td>#" + o.rank + "</td>" +
      "<td>" + escapeHtml(o.recipient.name) + (i == 0 ? " <span class='badge badge-accepted'>asked first</span>" : "") + "</td>" +
      "<td>" + escapeHtml(o.recipient.locality) + "</td>" +
      "<td>" + o.km + " km</td>" +
      "<td>" + o.driveMinutes + " min</td>" +
      "<td><b>" + o.score + "</b> / 100</td>";
    table.append(row);
  }
  document.getElementById("rankBox").classList.remove("hidden");
}

// ---------------- my listings ----------------

function loadListings() {
  return apiFetch("/listings/mine").then(function (result) {
    let message = document.getElementById("listingsMessage");
    if (result.status == 401) {
      logout();
      return;
    }
    if (!result.ok) {
      message.innerText = result.data.message || "Could not load your listings.";
      message.className = "red-text";
      return;
    }
    message.innerText = "";

    // keep anything typed into a code box while the table is redrawn
    let typed = {};
    let boxes = document.querySelectorAll(".code-input");
    for (let i = 0; i < boxes.length; i++) {
      typed[boxes[i].id] = boxes[i].value;
    }

    listings = result.data;
    showListings();
    showSummary();

    for (let id in typed) {
      let box = document.getElementById(id);
      if (box) box.value = typed[id];
    }
    if (openOffersFor) loadOffers(openOffersFor);
  });
}

function statusBadge(status) {
  let names = { OPEN: "Not offered", MATCHED: "Offered", ACCEPTED: "Accepted", COLLECTED: "Collected", EXPIRED: "Expired" };
  return "<span class='badge badge-" + status.toLowerCase() + "'>" + names[status] + "</span>";
}

// what the Status column says under the label
function statusDetail(l) {
  if (l.status == "OPEN") {
    return "No shelter could take it when it was posted.";
  }
  if (l.status == "MATCHED" && l.activeOffer) {
    return "Asking <b>" + escapeHtml(l.activeOffer.shelter) + "</b> (score " + l.activeOffer.score + ")" +
      "<br><span class='caption'>Reply due by " + clockTime(l.activeOffer.replyBy) + "</span>";
  }
  if (l.status == "ACCEPTED" && l.acceptedBy) {
    return "<b>" + escapeHtml(l.acceptedBy.name) + "</b> is coming to collect" +
      "<br><span class='caption'>Contact: " + escapeHtml(l.acceptedBy.contactName) + ", " + escapeHtml(l.acceptedBy.phone) +
      " &middot; punctuality " + starsText(l.acceptedBy.rating) + "</span>";
  }
  if (l.status == "COLLECTED" && l.acceptedBy) {
    let when = isToday(l.collectedAt) ? clockTime(l.collectedAt) :
      new Date(l.collectedAt).toLocaleDateString([], { day: "numeric", month: "short" });
    return "Collected by " + escapeHtml(l.acceptedBy.name) + ", " + when;
  }
  if (l.status == "EXPIRED") {
    return "No shelter collected it before the deadline.";
  }
  return "";
}

function actionButtons(l) {
  let id = l._id;
  let timeline = "<button class='btn btn-grey btn-small' onclick=\"viewOffers('" + id + "')\">Timeline</button> ";
  let cancel = "<button class='btn btn-red btn-small' onclick=\"cancelListing('" + id + "')\">Cancel</button>";

  if (l.status == "OPEN") {
    return "<button class='btn btn-small' onclick=\"tryAgain('" + id + "')\">Try again</button> " + cancel;
  }
  if (l.status == "MATCHED") {
    return timeline + cancel;
  }
  if (l.status == "ACCEPTED") {
    return "<label for='code-" + id + "' class='caption'>Shelter's code</label><br>" +
      "<input type='text' class='code-input' id='code-" + id + "' maxlength='4' placeholder='Code'> " +
      "<button class='btn btn-small' id='confirm-" + id + "' onclick=\"confirmPickup('" + id + "')\">Confirm pickup</button><br>" + timeline;
  }
  if (l.status == "COLLECTED" && l.acceptedBy) {
    // rate the shelter once (B7)
    if (l.ratingOfShelter && l.ratingOfShelter.stars) {
      return timeline + "<br><span class='caption'>You rated them " + l.ratingOfShelter.stars + " <span class='stars-shown'>&#9733;</span></span>";
    }
    return timeline + "<br><span class='caption'>Did they come on time?</span><br>" + starPicker("rate-" + id, "rateShelter");
  }
  return timeline;
}

function showListings() {
  let table = document.getElementById("listingTable");
  // remove the old rows but keep the heading row
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  if (listings.length == 0) {
    let row = table.insertRow();
    row.innerHTML = "<td colspan='5'>You have not posted any food yet. Use the form above.</td>";
    return;
  }

  for (let i = 0; i < listings.length; i++) {
    let l = listings[i];
    let row = document.createElement("tr");
    if (l.status == "ACCEPTED" || l.status == "COLLECTED") row.classList.add("accepted-row");
    if (l.status == "EXPIRED") row.classList.add("passed-row");
    row.innerHTML =
      "<td>" + escapeHtml(l.description) + "<br><span class='caption'>" + foodTypeName(l.foodType) +
      " &middot; posted " + new Date(l.createdAt).toLocaleDateString([], { day: "numeric", month: "short" }) + "</span></td>" +
      "<td>" + l.quantity + "</td>" +
      "<td id='time-" + l._id + "'></td>" +
      "<td>" + statusBadge(l.status) + "<br>" + statusDetail(l) + "</td>" +
      "<td>" + actionButtons(l) + "</td>";
    table.append(row);
  }
  updateTimes();
}

// update every "time left" cell - runs every second
function updateTimes() {
  for (let i = 0; i < listings.length; i++) {
    let l = listings[i];
    let cell = document.getElementById("time-" + l._id);
    if (!cell) continue;

    cell.classList.remove("green-text", "orange-text", "red-text");
    if (l.status == "COLLECTED") {
      cell.innerText = "Done";
    } else if (l.status == "EXPIRED") {
      cell.innerText = "Expired";
    } else {
      let msLeft = new Date(l.pickupDeadline).getTime() - Date.now();
      cell.innerText = formatTime(msLeft);
      cell.classList.add(timeClass(msLeft));
    }
  }
}

// ---------------- buttons ----------------

function tryAgain(id) {
  apiFetch("/listings/" + id + "/match", { method: "POST" }).then(function (result) {
    let offers = result.data.offers || [];
    if (result.ok && offers.length > 0) {
      showMessage("Offered to " + offers[0].recipient.name + ".", "green-text");
      showRanking(offers);
    } else {
      showMessage(result.data.message || "Still no shelter can take it.", "orange-text");
    }
    window.scrollTo(0, 0);
    loadListings();
  });
}

function cancelListing(id) {
  if (!confirm("Cancel this listing? Shelters will no longer see it.")) return;
  apiFetch("/listings/" + id, { method: "DELETE" }).then(function (result) {
    if (!result.ok) alert(result.data.message);
    if (openOffersFor == id) closeOffers();
    loadListings();
  });
}

// the kitchen checks the code the shelter's staff show at the door
function confirmPickup(id) {
  let code = document.getElementById("code-" + id).value.trim();
  if (!/^[0-9]{4}$/.test(code)) {
    alert("Type the 4-digit code the shelter's staff show you.");
    return;
  }
  let button = document.getElementById("confirm-" + id);
  button.disabled = true;
  button.innerText = "Checking...";
  apiFetch("/listings/" + id + "/collect", { method: "POST", body: JSON.stringify({ code: code }) })
    .then(function (result) {
      alert(result.data.message);
      if (result.ok) document.getElementById("code-" + id).value = "";
      button.disabled = false;
      button.innerText = "Confirm pickup";
      loadListings();
    });
}

// a star was clicked: send the rating (B7)
function rateShelter(pickerId, stars) {
  let id = pickerId.replace("rate-", "");
  let buttons = document.querySelectorAll("#" + pickerId + " .star");
  for (let i = 0; i < buttons.length; i++) {
    if (i < stars) buttons[i].classList.add("on");
    buttons[i].disabled = true;
  }
  apiFetch("/listings/" + id + "/rate", { method: "POST", body: JSON.stringify({ stars: stars }) })
    .then(function (result) {
      showMessage(result.data.message, result.ok ? "green-text" : "red-text");
      loadListings();
    });
}

// ---------------- timeline of one listing (A1) ----------------

function offerStatusText(o) {
  if (o.status == "PENDING") return o.active ? "<b class='orange-text'>Being asked now</b>" : "Waiting in line";
  if (o.status == "ACCEPTED") return "<b class='green-text'>Accepted</b>";
  if (o.status == "PASSED") return "Said no";
  if (o.status == "LAPSED") return "Did not reply in 10 minutes";
  return "Not needed any more";
}

function findListing(id) {
  for (let i = 0; i < listings.length; i++) {
    if (listings[i]._id == id) return listings[i];
  }
  return null;
}

function viewOffers(id) {
  openOffersFor = id;
  let listing = findListing(id);
  document.getElementById("offersListingTitle").innerText = listing ? listing.description : "";
  document.getElementById("offersSection").classList.remove("hidden");
  loadOffers(id);
  document.getElementById("offersSection").scrollIntoView();
}

// every step of the listing, from posting to collection, sorted by time
function buildTimeline(l, offers) {
  let events = [];
  function add(time, text, kind) {
    if (time) events.push({ time: new Date(time).getTime(), text: text, kind: kind || "" });
  }

  add(l.createdAt, "Posted " + l.quantity + " meals of " + escapeHtml(l.description));
  if (l.matchedAt) add(l.matchedAt, offers.length + " shelter" + (offers.length == 1 ? " was" : "s were") + " ranked for this food");

  for (let i = 0; i < offers.length; i++) {
    let o = offers[i];
    if (!o.activeSince) continue;   // never asked
    let name = escapeHtml(o.recipient ? o.recipient.name : "A shelter");
    add(o.activeSince, "Asked " + name + " (score " + o.score + ")", "wait");
    if (o.status == "PASSED") add(o.updatedAt, name + " said no, so the rest were scored again", "bad");
    if (o.status == "LAPSED") add(o.updatedAt, name + " did not reply in 10 minutes, so it moved on", "bad");
    if (o.status == "ACCEPTED") add(l.acceptedAt || o.updatedAt, name + " accepted and got a handover code");
  }

  if (l.collectedAt) add(l.collectedAt, "Collected: the code was checked at the kitchen");
  if (l.status == "EXPIRED") add(l.pickupDeadline, "The deadline passed and nobody collected it", "bad");
  if (l.ratingOfShelter && l.ratingOfShelter.stars) add(l.ratingOfShelter.at, "You rated the shelter " + l.ratingOfShelter.stars + " &#9733;");
  if (l.ratingOfFood && l.ratingOfFood.stars) add(l.ratingOfFood.at, "The shelter rated your food " + l.ratingOfFood.stars + " &#9733;");

  events.sort(function (a, b) { return a.time - b.time; });

  let html = "";
  for (let i = 0; i < events.length; i++) {
    html += "<li class='" + events[i].kind + "'><span class='when'>" + clockTime(events[i].time) + "</span>" + events[i].text + "</li>";
  }
  return html;
}

function loadOffers(id) {
  apiFetch("/listings/" + id + "/offers").then(function (result) {
    let table = document.getElementById("offersTable");
    let message = document.getElementById("offersMessage");
    if (!result.ok) {
      message.innerText = result.data.message || "Could not load the offers.";
      message.className = "red-text";
      return;
    }
    let listing = findListing(id);
    if (listing) document.getElementById("timeline").innerHTML = buildTimeline(listing, result.data);

    message.innerText = result.data.length == 0 ? "No shelter has been asked." : "";
    table.innerHTML = "<tr><th>Rank</th><th>Shelter</th><th>Area</th><th>Distance</th><th>Score</th><th>Status</th></tr>";
    for (let i = 0; i < result.data.length; i++) {
      let o = result.data[i];
      let row = document.createElement("tr");
      if (o.status == "ACCEPTED") row.classList.add("accepted-row");
      if (o.status == "PASSED" || o.status == "LAPSED" || o.status == "EXPIRED") row.classList.add("passed-row");
      row.innerHTML =
        "<td>#" + o.rank + "</td>" +
        "<td>" + escapeHtml(o.recipient ? o.recipient.name : "Deleted shelter") + "</td>" +
        "<td>" + escapeHtml(o.recipient ? o.recipient.locality : "") + "</td>" +
        "<td>" + (o.km != null ? o.km + " km" : "-") + "</td>" +
        "<td><b>" + o.score + "</b> / 100</td>" +
        "<td>" + offerStatusText(o) + "</td>";
      table.append(row);
    }
  });
}

function closeOffers() {
  openOffersFor = null;
  document.getElementById("offersSection").classList.add("hidden");
}

function refreshAll() {
  let button = document.getElementById("refreshBtn");
  button.disabled = true;
  button.innerText = "Refreshing...";
  loadListings().then(function () {
    button.disabled = false;
    button.innerText = "Refresh";
  });
}
