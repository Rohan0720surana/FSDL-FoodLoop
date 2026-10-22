// api.js - shared helper for every FoodLoop page.
// It knows where the server is, remembers who is logged in, and sends requests.

const API_BASE = "/api";   // the Express server serves both the pages and the API

// ---------------- the logged-in organisation (saved in localStorage) ----------------

function saveSession(token, org) {
  try {
    localStorage.setItem("fl_token", token);
    localStorage.setItem("fl_org", JSON.stringify(org));
  } catch (e) {
    console.warn("saveSession: localStorage unavailable", e);
  }
}

function getToken() {
  try {
    return localStorage.getItem("fl_token");
  } catch (e) {
    return null;
  }
}

function getOrg() {
  try {
    let raw = localStorage.getItem("fl_org");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem("fl_token");
    localStorage.removeItem("fl_org");
  } catch (e) {
    console.warn("clearSession: localStorage unavailable", e);
  }
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

// the page each kind of account should open after logging in
function dashboardFor(type) {
  if (type == "DONOR") return "donor.html";
  if (type == "RECIPIENT") return "recipient.html";
  return "admin.html";
}

// Send a page to login unless the right kind of account is logged in.
// type is "DONOR" or "RECIPIENT". Returns the organisation, or null.
function requireLogin(type) {
  let org = getOrg();
  if (!getToken() || !org || org.type != type) {
    window.location.href = "login.html";
    return null;
  }
  return org;
}

// ---------------- talking to the server ----------------

// Sends a request and gives back a Promise of { ok, status, data }.
// The login token is added automatically.
function apiFetch(path, options) {
  if (options == undefined) options = {};
  let headers = { "Content-Type": "application/json" };
  let token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  return fetch(API_BASE + path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body
  })
    .then(function (response) {
      // a 401 means the login is missing or has expired
      if (response.status == 401 && token) {
        clearSession();
      }
      return response.json()
        .catch(function () { return {}; })
        .then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
    })
    .catch(function () {
      return { ok: false, status: 0, data: { message: "Cannot reach the server. Is the backend running?" } };
    });
}

// ---------------- small helpers used by several pages ----------------

// make text safe to put inside innerHTML
function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

// green / orange / red class for the time left
function timeClass(ms) {
  if (ms < 15 * 60000) return "red-text";
  if (ms < 60 * 60000) return "orange-text";
  return "green-text";
}

// readable names for the food types stored in the database
const foodTypeNames = { VEG: "Veg", NON_VEG: "Non-veg", BAKERY: "Bakery", PACKAGED: "Packaged" };

function foodTypeName(code) {
  return foodTypeNames[code] || code;
}

// Good morning / afternoon / evening, from the Date object
function greeting() {
  let hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Shows who is logged in on the right of the nav bar, with a Logout link.
// Each page calls this once.
function setupNavbar() {
  let navbar = document.querySelector(".navbar");
  let org = getOrg();
  if (!navbar || !org || !getToken()) return;

  let loginLink = navbar.querySelector("a[href='login.html']");
  if (loginLink) loginLink.remove();

  let who = document.createElement("span");
  who.className = "nav-user";
  who.innerHTML = escapeHtml(org.name) + " &middot; <a href='#' onclick='logout(); return false;'>Logout</a>";
  navbar.append(who);

  // admins get a link to the verification page
  if (org.type == "ADMIN") {
    let adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.innerText = "Admin";
    if (window.location.pathname.indexOf("admin.html") != -1) adminLink.className = "active";
    navbar.insertBefore(adminLink, navbar.querySelector(".nav-user"));
  }
}

// "4.6 ★ (12 ratings)" or "No ratings yet"
function starsText(rating) {
  if (!rating || !rating.count) return "No ratings yet";
  return rating.average + " &#9733; (" + rating.count + " rating" + (rating.count == 1 ? "" : "s") + ")";
}

// a row of 5 clickable stars that calls onPick(stars)
function starPicker(id, onPickName) {
  let html = "<span class='star-picker' id='" + id + "'>";
  for (let i = 1; i <= 5; i++) {
    html += "<button type='button' class='star' title='" + i + " star" + (i > 1 ? "s" : "") +
      "' onclick=\"" + onPickName + "('" + id + "', " + i + ")\">&#9733;</button>";
  }
  return html + "</span>";
}
