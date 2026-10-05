// donor.js - the donor dashboard: post food, see listings, countdowns

// greeting based on the time of day (Date object)
let hour = new Date().getHours();
let greeting = "Good evening";
if (hour < 12) {
  greeting = "Good morning";
} else if (hour < 17) {
  greeting = "Good afternoon";
}
document.getElementById("greeting").innerHTML = "<b>" + greeting + ", St. Xavier's Canteen!</b>";

// listings already posted tonight (deadline = now + some minutes)
let now = Date.now();
let listings = [
  { food: "Chicken curry + rice", type: "Non-veg", meals: 65, deadline: now + 9 * 60000, status: "Offered to Kripa Foundation" },
  { food: "Paneer tikka trays", type: "Veg", meals: 22, deadline: now + 47 * 60000, status: "Accepted by Sneh Sadan" },
  { food: "Veg biryani + dal", type: "Veg", meals: 48, deadline: now + 134 * 60000, status: "Offered to Sneh Sadan" }
];

// add one row to the table using createElement and append
function addRow(listing, index) {
  let table = document.getElementById("listingTable");
  let row = document.createElement("tr");

  row.innerHTML =
    "<td>" + listing.food + "</td>" +
    "<td>" + listing.type + "</td>" +
    "<td>" + listing.meals + "</td>" +
    "<td id='time" + index + "'></td>" +
    "<td id='status" + index + "'>" + listing.status + "</td>" +
    "<td id='action" + index + "'><button class='btn btn-red' onclick='cancelListing(this)'>Cancel</button></td>";

  table.append(row);
}

// show the listings that already exist
for (let i = 0; i < listings.length; i++) {
  addRow(listings[i], i);
}

// update every "time left" cell - runs every second
function updateTimes() {
  for (let i = 0; i < listings.length; i++) {
    let cell = document.getElementById("time" + i);
    if (cell == null) continue;           // that listing was cancelled
    if (listings[i].expired) continue;    // already marked expired

    let msLeft = listings[i].deadline - Date.now();
    cell.innerText = formatTime(msLeft);

    // deadline passed: grey out the row, change the status, remove the Cancel button
    if (msLeft <= 0) {
      listings[i].expired = true;
      cell.parentElement.classList.add("passed-row");
      cell.classList.remove("green-text", "orange-text", "red-text");
      document.getElementById("status" + i).innerText = "Expired - not collected";
      document.getElementById("action" + i).innerText = "-";
      continue;
    }

    // colour depends on how much time is left
    cell.classList.remove("green-text", "orange-text", "red-text");
    if (msLeft < 15 * 60000) {
      cell.classList.add("red-text");
    } else if (msLeft < 60 * 60000) {
      cell.classList.add("orange-text");
    } else {
      cell.classList.add("green-text");
    }
  }
}
updateTimes();
setInterval(updateTimes, 1000);

// Cancel button: remove that row from the table
function cancelListing(button) {
  if (confirm("Cancel this listing?")) {
    button.parentElement.parentElement.remove();
  }
}

// Finding the best shelter "takes time", so we use a Promise.
// It waits 2 seconds (like asking a server), scores every shelter
// and gives back the list sorted best first.
function findBestShelter(meals, type, minutesLeft) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      let ranked = [];
      for (let i = 0; i < shelters.length; i++) {
        let score = matchScore(shelters[i], meals, type, minutesLeft);
        if (score > 0) {
          ranked.push({ shelter: shelters[i], score: score });
        }
      }
      ranked.sort(function (a, b) {
        return b.score - a.score;
      });

      if (ranked.length == 0) {
        reject("No shelter can collect this food in time. Try a longer pickup time or fewer meals.");
      } else {
        resolve(ranked);
      }
    }, 2000);
  });
}

// show the top 3 shelters in a small table under the form
function showRanking(ranked) {
  let table = document.getElementById("rankTable");
  table.innerHTML = "<tr><th>Rank</th><th>Shelter</th><th>Distance</th><th>Drive time</th><th>Score</th></tr>";

  for (let i = 0; i < ranked.length && i < 3; i++) {
    let s = ranked[i].shelter;
    let km = distanceKm(kitchen.lat, kitchen.lng, s.lat, s.lng);
    let row = document.createElement("tr");
    if (i == 0) {
      row.classList.add("accepted-row");
    }
    row.innerHTML =
      "<td>#" + (i + 1) + "</td>" +
      "<td>" + s.name + ", " + s.area + "</td>" +
      "<td>" + km + " km</td>" +
      "<td>" + driveMinutes(km) + " min</td>" +
      "<td><b>" + ranked[i].score + "</b> / 100</td>";
    table.append(row);
  }
  document.getElementById("rankBox").classList.remove("hidden");
}

// "Post food" button
function postFood() {
  let food = document.getElementById("food").value;
  let type = document.getElementById("type").value;
  let meals = Number(document.getElementById("quantity").value);
  let hours = Number(document.getElementById("hours").value);
  let message = document.getElementById("message");

  // validation
  if (food == "" || meals <= 0 || hours <= 0) {
    alert("Please enter the food name, quantity and pickup time.");
    return;
  }
  if (hours > 6) {
    alert("Cooked food should be collected within 6 hours.");
    return;
  }

  message.innerText = "Finding the best shelter...";
  message.className = "";
  document.getElementById("rankBox").classList.add("hidden");

  findBestShelter(meals, type, hours * 60)
    .then(function (ranked) {
      let result = ranked[0];
      let listing = {
        food: food,
        type: type,
        meals: meals,
        deadline: Date.now() + hours * 3600000,
        status: "Offered to " + result.shelter.name + " (score " + result.score + ")"
      };
      listings.push(listing);
      addRow(listing, listings.length - 1);
      updateTimes();
      message.innerText = "Posted! Offered to " + result.shelter.name + ", " + result.shelter.area + ".";
      message.className = "green-text";
      showRanking(ranked);
      document.getElementById("food").value = "";
      document.getElementById("quantity").value = "";
      document.getElementById("hours").value = "";
    })
    .catch(function (error) {
      message.innerText = error;
      message.className = "red-text";
    });
}
