// register.js - code shared by the donor and recipient registration forms.
// Every field is checked as soon as you leave it (onblur), and again on submit.

// one check per field: returns an error message, or "" if the value is fine
const fieldChecks = {
  orgName: function (v) { return v.trim() == "" ? "Enter the name of your organisation." : ""; },
  category: function (v) { return v == "" ? "Choose the type of organisation." : ""; },
  address: function (v) { return v.trim() == "" ? "Enter your address." : ""; },
  area: function (v) { return v == "" ? "Choose your area." : ""; },
  contact: function (v) { return v.trim() == "" ? "Enter the contact person's name." : ""; },
  // mobile number: exactly 10 digits, starting with 6, 7, 8 or 9
  mobile: function (v) { return /^[6-9][0-9]{9}$/.test(v.trim()) ? "" : "Enter a valid 10-digit mobile number."; },
  // email: something@something.something
  email: function (v) { return /^[^ @]+@[^ @]+\.[a-z]+$/i.test(v.trim()) ? "" : "Enter a valid email address."; },
  password: function (v) { return v.length < 6 ? "Password must be at least 6 characters." : ""; },
  confirmPassword: function (v) {
    return v != document.getElementById("password").value ? "Passwords do not match." : "";
  },
  // donor form only: FSSAI licence is exactly 14 digits
  fssai: function (v) { return /^[0-9]{14}$/.test(v.trim()) ? "" : "Enter the 14-digit FSSAI licence number."; },
  // recipient form only
  capacity: function (v) {
    let n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 5000 ? "" : "Enter a whole number of meals between 1 and 5000.";
  },
  radius: function (v) { return v == "" ? "Choose how far your staff can travel." : ""; }
};

// show a red message under one field and give the field a red border
function showError(id, message) {
  let errorBox = document.getElementById("err-" + id);
  if (errorBox) errorBox.innerText = message;
  let field = document.getElementById(id);
  if (field) {
    field.classList.remove("input-ok");
    field.classList.add("input-error");
  }
}

// a field that passed: green border and a small tick
function showOk(id) {
  let errorBox = document.getElementById("err-" + id);
  if (errorBox) errorBox.innerHTML = "<span class='ok-tick'>&#10003;</span>";
  let field = document.getElementById(id);
  if (field) {
    field.classList.remove("input-error");
    field.classList.add("input-ok");
  }
}

// check one field; returns true if it is fine
function checkField(id) {
  let field = document.getElementById(id);
  if (!field || !fieldChecks[id]) return true;
  let message = fieldChecks[id](field.value);
  if (message) {
    showError(id, message);
    return false;
  }
  showOk(id);
  return true;
}

// check a field when the user leaves it (and when a dropdown changes)
function watchFields() {
  for (let id in fieldChecks) {
    let field = document.getElementById(id);
    if (!field) continue;
    field.addEventListener("blur", function () { checkField(id); });
    if (field.tagName == "SELECT") {
      field.addEventListener("change", function () { checkField(id); });
    }
  }
  // re-check "confirm password" when the password changes
  let password = document.getElementById("password");
  password.addEventListener("input", function () {
    if (document.getElementById("confirmPassword").value != "") checkField("confirmPassword");
  });
}

// remove all old messages before checking again
function clearErrors() {
  let messages = document.querySelectorAll(".error");
  for (let i = 0; i < messages.length; i++) {
    messages[i].innerText = "";
  }
  let fields = document.querySelectorAll(".input-error, .input-ok");
  for (let i = 0; i < fields.length; i++) {
    fields[i].classList.remove("input-error", "input-ok");
  }
  document.getElementById("serverError").innerText = "";
}

// checks every field on this form; returns true if they are all fine
function checkAllFields() {
  let ok = true;
  for (let id in fieldChecks) {
    if (!checkField(id)) ok = false;
  }
  return ok;
}

// the fields both forms send to the server
function commonBody(type) {
  let area = findArea(document.getElementById("area").value);
  return {
    type: type,
    name: document.getElementById("orgName").value.trim(),
    category: document.getElementById("category").value,
    address: document.getElementById("address").value.trim(),
    locality: area.name,
    lat: area.lat,
    lng: area.lng,
    contactName: document.getElementById("contact").value.trim(),
    phone: document.getElementById("mobile").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };
}

// send the form to the server, then open the right dashboard
function sendRegistration(body) {
  let button = document.getElementById("submitBtn");
  let label = button.value;
  button.disabled = true;
  button.value = "Registering...";

  apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) })
    .then(function (result) {
      button.disabled = false;
      button.value = label;

      if (result.ok) {
        saveSession(result.data.token, result.data.organisation);
        window.location.href = dashboardFor(result.data.organisation.type);
      } else {
        document.getElementById("serverError").innerText =
          result.data.message || "Registration failed. Please try again.";
        window.scrollTo(0, 0);
      }
    });
}
