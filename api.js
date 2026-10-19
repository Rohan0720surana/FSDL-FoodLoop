// api.js - Shared helper for all FoodLoop frontend pages.
// Include with: <script src="api.js"></script>

const API_BASE = "http://localhost:5000/api";

// ── Session helpers (localStorage) ───────────────────────────────────────────

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
    var raw = localStorage.getItem("fl_org");
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

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function apiFetch(path, options) {
  if (options === undefined) { options = {}; }
  var token = getToken();
  var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }
  try {
    var response = await fetch(API_BASE + path, Object.assign({}, options, { headers: headers }));
    var data = {};
    try { data = await response.json(); } catch (_e) {}
    return { ok: response.ok, status: response.status, data: data };
  } catch (networkErr) {
    return {
      ok: false,
      status: 0,
      data: { message: "Cannot reach the server. Is the backend running?" }
    };
  }
}
