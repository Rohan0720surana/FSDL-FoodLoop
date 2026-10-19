// donor.js - Donor dashboard connected to FoodLoop API

// ── 1. Page guard & Authentication ───────────────────────────────────────────
const token = getToken();
const org = getOrg();

if (!token || !org || org.type !== "DONOR") {
  window.location.href = "login.html";
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

// Display organisation name and greeting
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
}

// ── State ─────────────────────────────────────────────────────────────────────
let currentListings = [];
let currentSelectedListingId = null;
let currentSelectedListingTitle = "";

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

// ── 2 & 3. Post Food & Match Listing ──────────────────────────────────────────
async function postFood() {
  const foodInput = document.getElementById("food");
  const typeInput = document.getElementById("type");
  const quantityInput = document.getElementById("quantity");
  const hoursInput = document.getElementById("hours");
  const messageEl = document.getElementById("message");
  const postBtn = document.getElementById("postBtn");
  const rankBox = document.getElementById("rankBox");

  messageEl.innerText = "";
  messageEl.className = "";
  rankBox.classList.add("hidden");

  const food = foodInput.value.trim();
  const foodType = typeInput.value;
  const quantity = Number(quantityInput.value);
  const hours = parseFloat(hoursInput.value);

  // Client-side validations
  if (!food) {
    messageEl.innerText = "Please enter the food name/description.";
    messageEl.className = "red-text";
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    messageEl.innerText = "Please enter a valid quantity of meals (greater than 0).";
    messageEl.className = "red-text";
    return;
  }
  if (isNaN(hours) || hours <= 0) {
    messageEl.innerText = "Please enter how many hours the food can be picked up for.";
    messageEl.className = "red-text";
    return;
  }
  if (hours < 0.5) {
    messageEl.innerText = "Pickup deadline must be at least 30 minutes (0.5 hours) from now.";
    messageEl.className = "red-text";
    return;
  }

  // Calculate deadline
  const pickupDeadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  // Disable button and show loading state
  postBtn.disabled = true;
  postBtn.innerText = "Posting listing...";
  messageEl.innerText = "Creating surplus food listing...";
  messageEl.className = "";

  const createRes = await apiFetch("/listings", {
    method: "POST",
    body: JSON.stringify({
      donor: org._id,
      description: food,
      foodType: foodType,
      quantity: quantity,
      pickupDeadline: pickupDeadline,
    }),
  });

  if (!createRes.ok) {
    postBtn.disabled = false;
    postBtn.innerText = "Post food";
    messageEl.innerText = (createRes.data && createRes.data.message)
      ? createRes.data.message
      : "Failed to create listing.";
    messageEl.className = "red-text";
    return;
  }

  const createdListing = createRes.data;

  // Now trigger matching
  postBtn.innerText = "Matching with shelters...";
  messageEl.innerText = "Listing created. Finding eligible shelters and calculating route scores...";

  const matchRes = await apiFetch("/listings/" + createdListing._id + "/match", {
    method: "POST",
  });

  postBtn.disabled = false;
  postBtn.innerText = "Post food";

  if (!matchRes.ok) {
    messageEl.innerText = "Listing posted, but matching returned an error: " +
      ((matchRes.data && matchRes.data.message) ? matchRes.data.message : "Server error");
    messageEl.className = "orange-text";
    loadMyListings();
    return;
  }

  // Reset form inputs
  foodInput.value = "";
  quantityInput.value = "";
  hoursInput.value = "";

  const offers = matchRes.data.offers || [];
  if (offers.length === 0) {
    messageEl.innerText = matchRes.data.message || "No recipient can take this listing right now.";
    messageEl.className = "orange-text";
    rankBox.classList.add("hidden");
  } else {
    const firstRecipient = offers[0].recipient ? offers[0].recipient.name : "top-ranked shelter";
    messageEl.innerText = "Posted! Top offer sent to " + firstRecipient + ".";
    messageEl.className = "green-text";

    // Populate rankTable
    const rankTable = document.getElementById("rankTable");
    rankTable.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Shelter</th>
        <th>Locality</th>
        <th>Distance</th>
        <th>Drive time</th>
        <th>Score</th>
      </tr>
    `;

    offers.forEach(function (offer, index) {
      const tr = document.createElement("tr");
      if (index === 0) {
        tr.classList.add("accepted-row");
      }
      const shelterName = offer.recipient ? escapeHtml(offer.recipient.name) : "Unknown";
      const locality = offer.recipient && offer.recipient.locality ? escapeHtml(offer.recipient.locality) : "-";
      const distance = offer.km != null ? offer.km + " km" : "-";
      const driveTime = offer.driveMinutes != null ? offer.driveMinutes + " min" : "-";

      tr.innerHTML = `
        <td>#${offer.rank}</td>
        <td>${shelterName}</td>
        <td>${locality}</td>
        <td>${distance}</td>
        <td>${driveTime}</td>
        <td><b>${offer.score}</b> / 100</td>
      `;
      rankTable.appendChild(tr);
    });

    rankBox.classList.remove("hidden");
  }

  // Reload the listings table
  loadMyListings();
}

// ── 4. My Listings & Offers ───────────────────────────────────────────────────
async function loadMyListings() {
  const listingsMessage = document.getElementById("listingsMessage");
  const tbody = document.getElementById("listingTableBody");

  listingsMessage.innerText = "Loading listings...";
  listingsMessage.className = "";

  const res = await apiFetch("/listings/mine");

  if (!res.ok) {
    listingsMessage.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Failed to load listings.";
    listingsMessage.className = "red-text";
    return;
  }

  currentListings = res.data || [];
  listingsMessage.innerText = "";

  tbody.innerHTML = "";

  if (currentListings.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No listings posted yet.</td></tr>";
    return;
  }

  currentListings.forEach(function (listing, index) {
    const tr = document.createElement("tr");
    tr.id = "listing-row-" + listing._id;

    const deadlineTime = new Date(listing.pickupDeadline).getTime();
    const msLeft = deadlineTime - Date.now();

    let deadlineDisplay = formatTime(msLeft);
    let timeClass = "";
    if (msLeft <= 0) {
      deadlineDisplay = "Expired";
      tr.classList.add("passed-row");
    } else if (msLeft < 15 * 60000) {
      timeClass = "red-text";
    } else if (msLeft < 60 * 60000) {
      timeClass = "orange-text";
    } else {
      timeClass = "green-text";
    }

    const descEscaped = escapeHtml(listing.description);
    const idEscaped = escapeHtml(listing._id);

    tr.innerHTML = `
      <td>${descEscaped}</td>
      <td>${escapeHtml(listing.foodType)}</td>
      <td>${listing.quantity} meals</td>
      <td id="time-cell-${index}" class="${timeClass}">${deadlineDisplay}</td>
      <td><span id="status-cell-${index}">${escapeHtml(listing.status)}</span></td>
      <td>
        <button class="btn" onclick="viewOffers('${idEscaped}', '${descEscaped}')">View offers</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateCountdowns() {
  if (!currentListings || currentListings.length === 0) return;

  currentListings.forEach(function (listing, index) {
    const cell = document.getElementById("time-cell-" + index);
    if (!cell) return;

    const msLeft = new Date(listing.pickupDeadline).getTime() - Date.now();
    cell.innerText = formatTime(msLeft);

    cell.classList.remove("green-text", "orange-text", "red-text");
    if (msLeft <= 0) {
      cell.innerText = "Expired";
      const row = cell.closest("tr");
      if (row) row.classList.add("passed-row");
    } else if (msLeft < 15 * 60000) {
      cell.classList.add("red-text");
    } else if (msLeft < 60 * 60000) {
      cell.classList.add("orange-text");
    } else {
      cell.classList.add("green-text");
    }
  });
}

// Run countdown timer every second
setInterval(updateCountdowns, 1000);

// View offers for a specific listing
async function viewOffers(listingId, listingTitle) {
  currentSelectedListingId = listingId;
  currentSelectedListingTitle = listingTitle;

  const section = document.getElementById("offersSection");
  const titleEl = document.getElementById("offersListingTitle");
  const messageEl = document.getElementById("offersMessage");
  const tbody = document.getElementById("offersTableBody");

  titleEl.innerText = listingTitle;
  messageEl.innerText = "Loading offers...";
  messageEl.className = "";
  tbody.innerHTML = "";
  section.classList.remove("hidden");

  // Scroll smoothly to offers section
  section.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const res = await apiFetch("/listings/" + listingId + "/offers");

  if (!res.ok) {
    messageEl.innerText = (res.data && res.data.message)
      ? res.data.message
      : "Failed to load offers.";
    messageEl.className = "red-text";
    return;
  }

  const offers = res.data || [];
  messageEl.innerText = "";

  if (offers.length === 0) {
    messageEl.innerText = "No offers found for this listing.";
    messageEl.className = "orange-text";
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No offers recorded.</td></tr>";
    return;
  }

  offers.forEach(function (offer) {
    const tr = document.createElement("tr");

    if (offer.status === "ACCEPTED") {
      tr.classList.add("accepted-row");
    } else if (offer.status === "PASSED" || offer.status === "EXPIRED") {
      tr.classList.add("passed-row");
    }

    const shelterName = offer.recipient ? escapeHtml(offer.recipient.name) : "Unknown";
    const locality = offer.recipient && offer.recipient.locality ? escapeHtml(offer.recipient.locality) : "-";
    const activeDisplay = offer.active
      ? "<span class='green-text'><b>Active</b></span>"
      : "No";

    tr.innerHTML = `
      <td>#${offer.rank}</td>
      <td>${shelterName}</td>
      <td>${locality}</td>
      <td><b>${offer.score}</b> / 100</td>
      <td><b>${escapeHtml(offer.status)}</b></td>
      <td>${activeDisplay}</td>
    `;
    tbody.appendChild(tr);
  });
}

function closeOffers() {
  currentSelectedListingId = null;
  currentSelectedListingTitle = "";
  document.getElementById("offersSection").classList.add("hidden");
}

// ── 5. Refresh All ────────────────────────────────────────────────────────────
async function refreshAll() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerText = "Refreshing...";
  }

  await loadMyListings();

  if (currentSelectedListingId) {
    await viewOffers(currentSelectedListingId, currentSelectedListingTitle);
  }

  if (refreshBtn) {
    refreshBtn.disabled = false;
    refreshBtn.innerText = "Refresh";
  }
}

// Initial load
loadMyListings();
