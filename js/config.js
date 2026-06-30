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
};
