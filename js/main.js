/* =========================================================
   Atlanta Women Investors — main.js
   Handles: mobile nav, monthly calendar, Eventbrite RSVP,
   email subscribe, add-to-calendar, footer year.
   ========================================================= */

/* ------------------------------------------------------------------
   CONFIG — organizers, edit these values.
   ------------------------------------------------------------------ */
const CONFIG = {
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
    title: "Atlanta Women Investors Meetup",
    location: "Atlanta, GA",
    description: "Monthly meetup for women building wealth through real estate. RSVP on Eventbrite.",
  },
};

/* ------------------------------------------------------------------
   Mobile nav toggle
   ------------------------------------------------------------------ */
(function navToggle() {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    })
  );
})();

/* ------------------------------------------------------------------
   Helpers for meetup dates
   ------------------------------------------------------------------ */
function nthWeekdayOfMonth(year, month, weekday, nth) {
  // month: 0-based. Returns a Date for the nth weekday (or last if nth === -1).
  if (nth === -1) {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - offset);
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (nth - 1) * 7);
}

function meetupDateFor(year, month) {
  return nthWeekdayOfMonth(year, month, CONFIG.meetup.weekday, CONFIG.meetup.nth);
}

function nextMeetupDate(from = new Date()) {
  let d = meetupDateFor(from.getFullYear(), from.getMonth());
  const todayMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (d < todayMidnight) {
    const nm = from.getMonth() + 1;
    d = meetupDateFor(from.getFullYear() + Math.floor(nm / 12), nm % 12);
  }
  const dt = new Date(d);
  dt.setHours(CONFIG.meetup.startHour, CONFIG.meetup.startMinute, 0, 0);
  return dt;
}

/* ------------------------------------------------------------------
   Calendar widget
   ------------------------------------------------------------------ */
(function calendar() {
  const grid = document.getElementById("cal-grid");
  const title = document.getElementById("cal-title");
  if (!grid || !title) return;

  const monthNames = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const dows = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();

  function render() {
    title.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    grid.innerHTML = "";

    dows.forEach((d) => {
      const el = document.createElement("div");
      el.className = "cal-dow";
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const meetup = meetupDateFor(viewYear, viewMonth).getDate();

    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement("div");
      el.className = "cal-day empty";
      grid.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement("div");
      el.className = "cal-day";
      el.textContent = day;
      el.setAttribute("role", "gridcell");

      if (
        day === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear()
      ) {
        el.classList.add("today");
      }

      if (day === meetup) {
        el.classList.add("meetup");
        el.title = "Meetup day — click to RSVP";
        el.tabIndex = 0;
        el.addEventListener("click", () =>
          document.getElementById("meetups").scrollIntoView({ behavior: "smooth" })
        );
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("meetups").scrollIntoView({ behavior: "smooth" });
          }
        });
      }
      grid.appendChild(el);
    }
  }

  document.getElementById("cal-prev").addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    render();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  });

  render();
})();

/* ------------------------------------------------------------------
   Next event card + add-to-calendar (.ics download)
   ------------------------------------------------------------------ */
(function nextEvent() {
  const card = document.getElementById("next-event-card");
  if (!card) return;
  const dateEl = document.getElementById("next-event-date");
  const metaEl = document.getElementById("next-event-meta");
  const addBtn = document.getElementById("add-to-calendar");

  const dt = nextMeetupDate();
  const opts = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  dateEl.textContent = dt.toLocaleDateString("en-US", opts);
  metaEl.textContent = `${timeStr} · ${CONFIG.meetup.location}`;
  card.hidden = false;

  function pad(n) { return String(n).padStart(2, "0"); }
  function toICSDate(d) {
    return (
      d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
      "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z"
    );
  }

  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const end = new Date(dt.getTime() + CONFIG.meetup.durationHours * 3600 * 1000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Atlanta Women Investors//Meetup//EN",
      "BEGIN:VEVENT",
      "UID:" + toICSDate(dt) + "@atlantawomeninvestors.com",
      "DTSTAMP:" + toICSDate(new Date()),
      "DTSTART:" + toICSDate(dt),
      "DTEND:" + toICSDate(end),
      "SUMMARY:" + CONFIG.meetup.title,
      "LOCATION:" + CONFIG.meetup.location,
      "DESCRIPTION:" + CONFIG.meetup.description,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "atlanta-women-investors-meetup.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
})();

/* ------------------------------------------------------------------
   Eventbrite RSVP widget (or fallback link)
   ------------------------------------------------------------------ */
(function eventbrite() {
  const fallback = document.getElementById("eventbrite-fallback");
  const link = document.getElementById("eventbrite-link");
  if (link) link.href = CONFIG.eventbriteUrl;

  if (!CONFIG.eventbriteEventId) return; // keep fallback link

  // Load Eventbrite widget script, then mount inline checkout.
  const script = document.createElement("script");
  script.src = "https://www.eventbrite.com/static/widgets/eb_widgets.js";
  script.async = true;
  script.onload = () => {
    if (!window.EBWidgets) return;
    const container = document.getElementById("eventbrite-widget");
    const mount = document.createElement("div");
    mount.id = "eventbrite-widget-container";
    container.innerHTML = "";
    container.appendChild(mount);
    window.EBWidgets.createWidget({
      widgetType: "checkout",
      eventId: CONFIG.eventbriteEventId,
      iframeContainerId: "eventbrite-widget-container",
      iframeContainerHeight: 560,
    });
  };
  script.onerror = () => {
    // network blocked — leave fallback link visible
    if (fallback) fallback.style.display = "";
  };
  document.head.appendChild(script);
})();

/* ------------------------------------------------------------------
   Email subscribe form (AJAX, works with Formspree / Mailchimp-style)
   ------------------------------------------------------------------ */
(function subscribe() {
  const form = document.getElementById("subscribe-form");
  const note = document.getElementById("subscribe-note");
  if (!form || !note) return;

  form.addEventListener("submit", async (e) => {
    const action = form.getAttribute("action") || "";

    // If still on the placeholder action, don't fire a broken request.
    if (action.includes("YOUR_FORM_ID") || action.trim() === "") {
      e.preventDefault();
      note.classList.add("error");
      note.textContent =
        "Email list isn't connected yet. Organizers: set the form action in index.html.";
      return;
    }

    // Progressive enhancement: try AJAX, fall back to normal submit.
    e.preventDefault();
    const data = new FormData(form);
    note.classList.remove("error");
    note.textContent = "Subscribing…";

    try {
      const res = await fetch(action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        form.reset();
        note.classList.remove("error");
        note.textContent = "🎉 You're on the list! Check your inbox to confirm.";
      } else {
        throw new Error("Bad response");
      }
    } catch (err) {
      note.classList.add("error");
      note.textContent =
        "Something went wrong. Please try again or email hello@atlantawomeninvestors.com.";
    }
  });
})();

/* ------------------------------------------------------------------
   Footer year
   ------------------------------------------------------------------ */
(function year() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();
