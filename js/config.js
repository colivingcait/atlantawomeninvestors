/* =========================================================
   Atlanta Women Investors — SHARED SITE CONFIG
   Used by both the homepage and the /event landing page.
   ========================================================= */
window.CONFIG = {
  // Eventbrite: paste your event ID (the number at the end of an event URL)
  // to embed an inline RSVP/checkout widget. Leave empty to show a link.
  eventbriteEventId: "1990612059255", // Women Real Estate Investors Meetup
  // Your public Eventbrite organizer or event page (used for the fallback link).
  eventbriteUrl: "https://www.eventbrite.com/e/women-real-estate-investors-meetup-tickets-1990612059255",

  // Meetup recurrence used to build the calendar + "add to calendar".
  // weekday: 0=Sun ... 6=Sat. nth: 1=first, 2=second, 3=third, 4=fourth, -1=last.
  meetup: {
    weekday: 2,          // Tuesday
    nth: 4,              // 4th Tuesday of each month
    startHour: 18,       // 6:00 PM
    startMinute: 0,
    durationHours: 3,    // 6–9 PM
    title: "Women Real Estate Investors Meetup",
    location: "Atlanta, GA (venue TBA)",
    description: "Monthly meetup for women building wealth through real estate. Co-hosted by Caitlyn Verdugo & Jasmine Brown. RSVP on Eventbrite.",
  },

  // VENUE — fill this in once decided, and the location block + map appear
  // automatically (and feed the Add-to-Calendar file). Leave name empty for
  // a "venue announced soon" message.
  //
  // Option A — uncomment to use The Lost Druid (Decatur):
  //   name: "The Lost Druid", area: "Decatur",
  //   address: "2606 E College Ave, Decatur, GA 30030",
  // Option B — uncomment to use New Realm Brewing (Midtown):
  //   name: "New Realm Brewing", area: "Midtown, Atlanta",
  //   address: "550 Somerset Terrace NE #101, Atlanta, GA 30306",
  // (Double-check the exact address before going live.)
  venue: {
    name: "",        // e.g. "The Lost Druid"
    area: "",        // e.g. "Decatur"
    address: "",     // full address — powers the map + directions link
    note: "",        // optional extra line (parking, which room, etc.)
  },
};

/* Venue location string for the .ics / calendar (falls back to meetup.location). */
window.venueLocation = function () {
  var v = (window.CONFIG && window.CONFIG.venue) || {};
  if (v.name) return v.address ? v.name + ", " + v.address : v.name + ", " + (v.area || "Atlanta, GA");
  return window.CONFIG.meetup.location;
};

/* Render the "Where we meet" block into an element (shared by both pages). */
window.renderVenue = function (bodyEl) {
  if (!bodyEl) return;
  var v = (window.CONFIG && window.CONFIG.venue) || {};
  if (v.name) {
    var q = encodeURIComponent(v.address || v.name + " " + (v.area || "Atlanta"));
    bodyEl.innerHTML =
      '<h3 class="venue-name">' + v.name + "</h3>" +
      (v.area ? '<p class="venue-area">' + v.area + "</p>" : "") +
      (v.address ? '<p class="venue-address">' + v.address + "</p>" : "") +
      (v.note ? '<p class="venue-note">' + v.note + "</p>" : "") +
      '<a class="venue-link" href="https://www.google.com/maps/search/?api=1&query=' + q +
      '" target="_blank" rel="noopener">Get directions &rarr;</a>' +
      '<iframe class="venue-map" loading="lazy" title="Map to ' + v.name + '" ' +
      'referrerpolicy="no-referrer-when-downgrade" ' +
      'src="https://maps.google.com/maps?q=' + q + '&z=15&output=embed"></iframe>';
  } else {
    bodyEl.innerHTML =
      '<p class="venue-tba">We\'re finalizing the venue between two great Atlanta spots. ' +
      "<strong>RSVP and we'll email you the exact address.</strong></p>";
  }
};
