// recipient.js - Recipient dashboard connected to FoodLoop API

// ── 1. Page guard & Authentication ───────────────────────────────────────────
const token = getToken();
const org = getOrg();

if (!token || !org || org.type !== "RECIPIENT") {
  window.location.href = "login.html";
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

// ── State ─────────────────────────────────────────────────────────────────────
let currentOffers = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(ms) {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  let s = totalSeconds % 60;
  if (h > 0) return h + "h " + m + "m";
  if (s < 10) s = "0" + s;
  return m + "m " + s + "s";
}

// ── Initial Display from Session ──────────────────────────────────────────────
if (org) {
  const headerOrg = document.getElementById("headerOrg");
  if (headerOrg) {
    headerOrg.innerText = org.name + (org.locality ? ", " + org.locality : "");
  }

  const hour = new Date().getHours();
  let timeGreeting = "Good evening";
  if (hour < 12) {
    timeGreeting = "Good morning";
  } else if (hour < 17) {
    timeGreeting = "Good afternoon";
  }

  const greetingEl = document.getElementById("greeting");
  if (greetingEl) {
    greetingEl.innerHTML = "<b>" + timeGreeting + ", " + escapeHtml(org.name) + "!</b>";
  }

  // Display initial capacity from session
  const capacityText = document.getElementById("capacityText");
  if (capacityText) {
    const rem = org.remainingCapacityToday != null ? org.remainingCapacityToday : (org.capacityPerDay || 0);
    capacityText.innerHTML = "Remaining capacity today: <b>" + rem + " meals</b>" +
      (org.capacityPerDay != null ? " (Daily capacity: " + org.capacityPerDay + " meals)" : "");
  }
}

// ── 1. Load Organisation Details & Remaining Capacity ─────────────────────────
async function loadCapacity() {
  if (!org || !org._id) return;

  const capacityText = document.getElementById("capacityText");
  const res = await apiFetch("/organisations/" + org._id);

  if (res.ok && res.data) {
    const currentOrg = res.data;
    saveSession(getToken(), currentOrg);

    const headerOrg = document.getElementById("headerOrg");
    if (headerOrg) {
      headerOrg.innerText = currentOrg.name + (currentOrg.locality ? ", " + currentOrg.locality : "");
    }

    if (capacityText) {
      const rem = currentOrg.remainingCapacityToday != null ? currentOrg.remainingCapacityToday : (currentOrg.capacityPerDay || 0);
      capacityText.innerHTML = "Remaining capacity today: <b>" + rem + " meals</b>" +
        (currentOrg.capacityPerDay != null ? " (Daily capacity: " + currentOrg.capacityPerDay + " meals)" : "");
    }
  } else if (!capacityText.innerHTML) {
    // Fall back to session values if API request fails
    const rem = org.remainingCapacityToday != null ? org.remainingCapacityToday : (org.capacityPerDay || 0);
    capacityText.innerHTML = "Remaining capacity today: <b>" + rem + " meals</b>" +
      (org.capacityPerDay != null ? " (Daily capacity: " + org.capacityPerDay + " meals)" : "");
  }
}

// ── 2. Load Active Offers (GET /api/offers/mine) ──────────────────────────────
async function loadOffers() {
  const statusMsg = document.getElementById("statusMessage");
  const container = document.getElementById("offersContainer");

  if (!currentOffers || currentOffers.length === 0) {
    statusMsg.innerText = "Loading offers...";
    statusMsg.className = "";
  }

  const res = await apiFetch("/offers/mine");

  if (!res.ok) {
    statusMsg.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Failed to load offers.";
    statusMsg.className = "red-text";
    return;
  }

  statusMsg.innerText = "";
  currentOffers = res.data || [];
  renderOffers(currentOffers);
}

function renderOffers(offers) {
  const container = document.getElementById("offersContainer");
  container.innerHTML = "";

  if (!offers || offers.length === 0) {
    container.innerHTML = `
      <div class="box">
        <p style="text-align: center; color: #666; margin: 15px 0;">
          No offers right now. Check back soon or click Refresh.
        </p>
      </div>
    `;
    return;
  }

  offers.forEach(function (offer) {
    const listing = offer.listing || {};
    const donor = listing.donor || {};
    const donorName = donor.name || "Unknown donor";
    const donorLocality = donor.locality || "";

    const msLeft = listing.pickupDeadline
      ? new Date(listing.pickupDeadline).getTime() - Date.now()
      : 0;

    let timeClass = "green-text";
    let timeText = formatTime(msLeft);
    if (msLeft <= 0) {
      timeText = "Expired";
      timeClass = "red-text";
    } else if (msLeft < 15 * 60000) {
      timeClass = "red-text";
    } else if (msLeft < 60 * 60000) {
      timeClass = "orange-text";
    }

    let breakdownHtml = "";
    if (offer.breakdown) {
      const b = offer.breakdown;
      breakdownHtml = `
        <button class="link-btn" onclick="toggleWhy('${offer._id}')">Why?</button>
        <div id="why-${offer._id}" class="hidden caption" style="margin-top: 5px; padding: 6px; background-color: #eee; border-radius: 4px;">
          Time: ${(b.time != null ? Math.round(b.time * 100) : 0)}% &middot; 
          Proximity: ${(b.proximity != null ? Math.round(b.proximity * 100) : 0)}% &middot; 
          Capacity: ${(b.capacity != null ? Math.round(b.capacity * 100) : 0)}% &middot; 
          Food type: ${(b.foodType != null ? Math.round(b.foodType * 100) : 0)}% &middot; 
          Reliability: ${(b.reliability != null ? Math.round(b.reliability * 100) : 0)}%
        </div>
      `;
    }

    const card = document.createElement("div");
    card.className = "box";
    card.id = "offer-card-" + offer._id;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 260px;">
          <h3 style="margin: 0 0 6px 0; color: #2e7d32;">${escapeHtml(listing.description || "Food listing")}</h3>
          <p style="margin: 3px 0;">
            <b>Food type:</b> ${escapeHtml(listing.foodType || "N/A")} &middot; 
            <b>Quantity:</b> ${listing.quantity || 0} meals
          </p>
          <p style="margin: 3px 0;">
            <b>Donor:</b> ${escapeHtml(donorName)}${donorLocality ? " (" + escapeHtml(donorLocality) + ")" : ""}
          </p>
          <p style="margin: 3px 0;">
            <b>Time left:</b> <span id="countdown-${offer._id}" class="${timeClass}"><b>${timeText}</b></span>
          </p>
          <p style="margin: 3px 0;">
            <b>Match score:</b> <b>${offer.score}</b> / 100 ${breakdownHtml}
          </p>
        </div>
        <div style="margin-top: 10px;">
          <button class="btn" id="btn-accept-${offer._id}" onclick="acceptOffer('${offer._id}')">Accept</button>
          <button class="btn btn-grey" id="btn-pass-${offer._id}" onclick="passOffer('${offer._id}')">Pass</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleWhy(offerId) {
  const el = document.getElementById("why-" + offerId);
  if (el) {
    el.classList.toggle("hidden");
  }
}

// ── Countdown Timer (every second) ────────────────────────────────────────────
function updateCountdowns() {
  if (!currentOffers || currentOffers.length === 0) return;

  currentOffers.forEach(function (offer) {
    const el = document.getElementById("countdown-" + offer._id);
    if (!el || !offer.listing || !offer.listing.pickupDeadline) return;

    const msLeft = new Date(offer.listing.pickupDeadline).getTime() - Date.now();
    el.innerText = formatTime(msLeft);
    el.classList.remove("green-text", "orange-text", "red-text");

    if (msLeft <= 0) {
      el.innerText = "Expired";
      el.classList.add("red-text");
    } else if (msLeft < 15 * 60000) {
      el.classList.add("red-text");
    } else if (msLeft < 60 * 60000) {
      el.classList.add("orange-text");
    } else {
      el.classList.add("green-text");
    }
  });
}
setInterval(updateCountdowns, 1000);

// ── 3. Accept & Pass Actions ──────────────────────────────────────────────────
async function acceptOffer(offerId) {
  if (!confirm("Are you sure you want to accept this offer?")) {
    return;
  }

  const acceptBtn = document.getElementById("btn-accept-" + offerId);
  const passBtn = document.getElementById("btn-pass-" + offerId);
  const actionMsg = document.getElementById("actionMessage");

  if (acceptBtn) {
    acceptBtn.disabled = true;
    acceptBtn.innerText = "Accepting...";
  }
  if (passBtn) {
    passBtn.disabled = true;
  }

  actionMsg.innerText = "Accepting offer...";
  actionMsg.className = "";

  const res = await apiFetch("/offers/" + offerId + "/accept", {
    method: "POST",
  });

  if (res.ok) {
    actionMsg.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Offer accepted!";
    actionMsg.className = "green-text";
  } else {
    actionMsg.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Failed to accept offer.";
    actionMsg.className = "red-text";
  }

  // Reload offers and remaining capacity
  await loadCapacity();
  await loadOffers();
}

async function passOffer(offerId) {
  if (!confirm("Are you sure you want to pass on this offer? It will move to the next shelter.")) {
    return;
  }

  const acceptBtn = document.getElementById("btn-accept-" + offerId);
  const passBtn = document.getElementById("btn-pass-" + offerId);
  const actionMsg = document.getElementById("actionMessage");

  if (passBtn) {
    passBtn.disabled = true;
    passBtn.innerText = "Passing...";
  }
  if (acceptBtn) {
    acceptBtn.disabled = true;
  }

  actionMsg.innerText = "Passing offer...";
  actionMsg.className = "";

  const res = await apiFetch("/offers/" + offerId + "/pass", {
    method: "POST",
  });

  if (res.ok) {
    actionMsg.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Offer passed to next recipient.";
    actionMsg.className = "green-text";
  } else {
    actionMsg.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Failed to pass offer.";
    actionMsg.className = "red-text";
  }

  // Reload offers and remaining capacity
  await loadCapacity();
  await loadOffers();
}

// ── 4. Refresh Button & Auto-reload ───────────────────────────────────────────
async function refreshAll() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerText = "Refreshing...";
  }

  await loadCapacity();
  await loadOffers();

  if (refreshBtn) {
    refreshBtn.disabled = false;
    refreshBtn.innerText = "Refresh";
  }
}

// Auto-reload offers every 15 seconds
setInterval(loadOffers, 15000);

// ── Initial load ──────────────────────────────────────────────────────────────
loadCapacity();
loadOffers();
