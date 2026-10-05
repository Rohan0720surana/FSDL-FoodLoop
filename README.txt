FoodLoop - basic HTML, CSS and JavaScript version
=================================================

How to open
-----------
Double-click index.html. Internet is needed only for the Google Map.

Files
-----
index.html      Home page: what FoodLoop is, how it works, score table
register.html   Registration form with JavaScript validation (alert)
login.html      Login form, opens the donor or recipient page
donor.html      Donor page: post food, table of listings with live countdown
donor.js        JavaScript for the donor page
recipient.html  Recipient page: offers sorted by score, Accept / Pass buttons
map.html        Google Map (iframe) and table of nearby shelters with distance
data.js         Sample data (arrays of objects) and helper functions
style.css       One external style sheet for all pages
images/         Two photos

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
findBestShelter()  donor.js    Promise that picks the best shelter after 2 seconds
validateForm()     register.html
showPlace()        map.html    changes the iframe src to move the map
