/* =========================================================
   Atlanta Women Investors — SHARED SITE CONFIG
   Used by both the homepage and the /event landing page.
   ========================================================= */
window.CONFIG = {
  // Eventbrite: every "RSVP" button points here. Using the collection page so
  // visitors see all upcoming monthly meetups and can pick a date.
  eventbriteEventId: "1990612059255", // (kept for reference; embed not used)
  eventbriteUrl: "https://www.eventbrite.com/cc/women-real-estate-investors-atl-monthly-meetups-4833857",

  // Meetup recurrence used to build the calendar + "add to calendar".
  // weekday: 0=Sun ... 6=Sat. nth: 1=first, 2=second, 3=third, 4=fourth, -1=last.
  meetup: {
    weekday: 2,          // Tuesday
    nth: 4,              // 4th Tuesday of each month
    startHour: 18,       // 6:30 PM
    startMinute: 30,
    durationHours: 3,    // 6:30–9:30 PM
    title: "Women Real Estate Investors Meetup",
    location: "New Realm Brewing, 550 Somerset Terrace NE, Atlanta, GA 30306",
    description: "Monthly meetup for women building wealth through real estate. Co-hosted by Caitlyn Verdugo & Jasmine Brown. RSVP on Eventbrite.",
  },

  // Caitlyn's CRM — the subscribe form POSTs straight here (see
  // js/main.js). Same shared endpoint used by her other sites.
  crmWebhookUrl: "https://crm.callcaitlyn.com/api/webhooks/site-form",

  // VENUE — drives the "Where we meet" block, the map, and the .ics location.
  venue: {
    name: "New Realm Brewing",
    area: "Atlanta",
    address: "550 Somerset Terrace NE, Atlanta, GA 30306",
    note: "",        // optional extra line (parking, which room, etc.)
  },
};

/* Meetup time range, e.g. "6:30–9:30 PM" (12-hour, minutes-aware). */
window.meetupTimeRange = function () {
  var m = window.CONFIG.meetup;
  var sm = m.startMinute || 0;
  var eh = m.startHour + m.durationHours;
  var h12 = function (h) { return h > 12 ? h - 12 : h; };
  var mm = function (x) { return String(x).padStart(2, "0"); };
  return h12(m.startHour) + ":" + mm(sm) + "–" + h12(eh) + ":" + mm(sm) + " PM";
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
