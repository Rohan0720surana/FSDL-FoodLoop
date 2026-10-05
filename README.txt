FoodLoop - basic HTML, CSS and JavaScript version
=================================================

How to open
-----------
Double-click index.html. Internet is needed only for the Google Map.

Files
-----
index.html      Home page: what FoodLoop is, how it works, score table
register.html   Registration form; errors are shown in red under each wrong field
login.html      Login checked against demo accounts, opens the donor or recipient page
donor.html      Donor page: post food, top 3 shelters, listings with live countdown
donor.js        JavaScript for the donor page
recipient.html  Recipient page: offers sorted by score, "Why?" breakdown,
                Accept / Pass, room left updates after Accept
map.html        Google Map (iframe), route from our kitchen to each shelter
data.js         Sample data (arrays of objects) and helper functions
style.css       One external style sheet for all pages
images/         Logo (logo.svg), two photos, use-case diagram

Demo accounts
-------------
Donor:      canteen@stxaviers.edu  /  canteen123
Recipient:  contact@snehsadan.org  /  shelter123

What each page uses (from the syllabus)
---------------------------------------
HTML    headings, paragraphs, lists (ol, ul), tables, images, links,
        forms (text, password, radio, checkbox, select, textarea,
        submit, reset), iframe
CSS     external style sheet, element / id / class / grouping selectors,
        background-color, border, border-radius, margin, padding,
        fonts, text-align, header / navigation bar / content / footer layout
JS      variables (let, const), arithmetic and comparison operators,
        if / else if / else, for loop, functions, arrays of objects,
        array push and sort, Date object, Math object, string concatenation,
        events (onclick, onsubmit), alert and confirm, form validation
        with regular expressions, DOM: getElementById, querySelector,
        innerHTML, innerText, createElement, append, remove,
        setAttribute, classList, parentElement, setInterval, setTimeout,
        Promise with resolve / reject, .then() and .catch()

Where the important logic is
----------------------------
distanceKm()       data.js     distance between two places (Math.sin, Math.cos)
matchScore()       data.js     score out of 100 (35/25/20/10/10 weights)
updateTimes()      donor.js    countdown, runs every second with setInterval
findBestShelter()  donor.js    Promise that ranks the shelters after 2 seconds
showRanking()      donor.js    shows the top 3 shelters in a table
updateTimes()      donor.js    also marks a listing expired when time runs out
validateForm()     register.html   showError() puts a message under the field
login()            login.html  looks for the email and password in the users array
updateCapacity()   recipient.html  room left, disables Accept if the food won't fit
toggleWhy()        recipient.html  shows / hides the score breakdown row
showPlace()        map.html    changes the iframe src to move the map
showShelter()      map.html    shows the route from our kitchen (saddr / daddr)
