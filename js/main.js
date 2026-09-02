/* =========================================================
   Atlanta Women Investors — main.js
   Handles: mobile nav, monthly calendar, Eventbrite RSVP,
   email subscribe, add-to-calendar, footer year.
   ========================================================= */

/* ------------------------------------------------------------------
   CONFIG comes from js/config.js (window.CONFIG), shared with /event.
   Edit settings there.
   ------------------------------------------------------------------ */
const CONFIG = window.CONFIG;

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
   Upcoming topics (from js/events.js)
   ------------------------------------------------------------------ */
function getEvents() {
  return Array.isArray(window.EVENTS) ? window.EVENTS.slice() : [];
}

function parseEventDate(str) {
  // "YYYY-MM-DD" -> local Date at the meetup start time
  const [y, m, d] = String(str).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setHours(CONFIG.meetup.startHour, CONFIG.meetup.startMinute, 0, 0);
  return dt;
}

function upcomingEvents(from = new Date()) {
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return getEvents()
    .filter((e) => e && e.date && parseEventDate(e.date) >= startOfToday)
    .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
}

function eventForDay(year, month, day) {
  return getEvents().find((e) => {
    const dt = parseEventDate(e.date);
    return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day;
  });
}

(function meetups() {
  const featured = document.getElementById("topic-featured");
  const list = document.getElementById("topic-list");
  const empty = document.getElementById("topic-empty");
  const whenEl = document.getElementById("rsvp-when");
  const icsBtn = document.getElementById("add-to-calendar");
  if (!featured || !list) return;

  const upcoming = upcomingEvents();
  const dateOpts = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  const fmt = (h) => (h > 12 ? h - 12 : h);
  const timeRange = window.meetupTimeRange
    ? window.meetupTimeRange()
    : `${fmt(CONFIG.meetup.startHour)}–${fmt(CONFIG.meetup.startHour + CONFIG.meetup.durationHours)} PM`;
  const rsvpFor = (e) => (e && e.eventbriteUrl) || CONFIG.eventbriteUrl || "#";

  // Always point RSVP buttons somewhere sensible, and render the venue block.
  document.querySelectorAll("[data-rsvp]").forEach((a) => (a.href = rsvpFor(upcoming[0])));
  document.querySelectorAll("[data-collection]").forEach((a) => (a.href = CONFIG.eventbriteUrl || "#"));
  if (window.renderVenue) window.renderVenue(document.getElementById("venue-body"));

  if (!upcoming.length) {
    if (empty) empty.hidden = false;
    if (whenEl) whenEl.textContent = "Date to be announced";
    return;
  }

  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  // Body paragraphs, minus any that just repeat the summary (Eventbrite often does).
  const paragraphs = (body, exclude) =>
    String(body || "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => p !== String(exclude || "").trim())
      .map((p) => `<p>${esc(p)}</p>`)
      .join("");

  // ---- LEFT: overview of the next meetup ----
  const f = upcoming[0];
  const fDate = parseEventDate(f.date);
  featured.innerHTML = `
    <div class="topic-feature-head">
      <span class="topic-badge">Next meetup</span>
      <span class="topic-date">${fDate.toLocaleDateString("en-US", dateOpts)} · ${timeRange}</span>
    </div>
    <h3 class="topic-feature-title">${esc(f.topic)}</h3>
    ${f.speaker ? `<p class="topic-speaker">With ${esc(f.speaker)}</p>` : ""}
    <p class="topic-feature-summary">${esc(f.summary)}</p>
    <div class="topic-feature-body">${paragraphs(f.body, f.summary)}</div>
    <div class="feature-facts">
      <div><span class="feature-fact-label">Where</span><span class="feature-fact-val">${esc((CONFIG.venue && CONFIG.venue.name) || "Atlanta")}</span></div>
      <div><span class="feature-fact-label">Who</span><span class="feature-fact-val">All experience levels</span></div>
      <div><span class="feature-fact-label">Cost</span><span class="feature-fact-val">Free to attend</span></div>
    </div>
  `;
  featured.hidden = false;

  // ---- RIGHT: RSVP / mark-your-calendar ----
  if (whenEl) whenEl.textContent = `${fDate.toLocaleDateString("en-US", dateOpts)} · ${timeRange}`;
  if (icsBtn) {
    icsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const pad = (n) => String(n).padStart(2, "0");
      const toICS = (d) =>
        d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
        "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
      const end = new Date(fDate.getTime() + CONFIG.meetup.durationHours * 3600 * 1000);
      const coming = !f.topic || /^coming soon$/i.test(f.topic.trim());
      const summary = coming ? CONFIG.meetup.title : `${CONFIG.meetup.title}: ${f.topic}`;
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0",
        "PRODID:-//Atlanta Women Investors//Meetup//EN", "BEGIN:VEVENT",
        "UID:" + toICS(fDate) + "@atlantawomeninvestors.com",
        "DTSTAMP:" + toICS(new Date()),
        "DTSTART:" + toICS(fDate), "DTEND:" + toICS(end),
        "SUMMARY:" + summary,
        "LOCATION:" + (window.venueLocation ? window.venueLocation() : CONFIG.meetup.location),
        "DESCRIPTION:" + (f.summary || CONFIG.meetup.description),
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = "awi-meetup.ics";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ---- BELOW: the next few meetups + topics ----
  const rest = upcoming.slice(1, 5);
  const moreTitle = document.querySelector(".meetup-more-title");
  if (moreTitle) moreTitle.hidden = rest.length === 0;
  list.innerHTML = rest
    .map((e) => {
      const dt = parseEventDate(e.date);
      let shortDate = dt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      if (e.dateEnd) {
        const de = parseEventDate(e.dateEnd);
        const sameMonth = de.getMonth() === dt.getMonth();
        shortDate += "–" + de.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "long", day: "numeric" });
      }
      return `
        <article class="topic-card">
          <div class="topic-card-top">
            <p class="topic-card-date">${shortDate}</p>
            <span class="topic-type">Free</span>
          </div>
          <h4 class="topic-card-title">${esc(e.topic)}</h4>
          <p class="topic-card-summary">${esc(e.summary)}</p>
          <a class="topic-card-link" href="${rsvpFor(e)}" target="_blank" rel="noopener">RSVP &rarr;</a>
        </article>`;
    })
    .join("");
})();

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
        const ev = eventForDay(viewYear, viewMonth, day);
        el.title = ev && ev.topic ? `${ev.topic} — click for details` : "Meetup day — click to RSVP";
        el.tabIndex = 0;
        const go = () =>
          document.getElementById("meetups").scrollIntoView({ behavior: "smooth" });
        el.addEventListener("click", go);
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
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

  // If a topic is set for this date in events.js, show it on the card + in the .ics.
  const ev = eventForDay(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const icsSummary = ev && ev.topic ? `${CONFIG.meetup.title}: ${ev.topic}` : CONFIG.meetup.title;

  dateEl.textContent = dt.toLocaleDateString("en-US", opts);
  metaEl.textContent = ev && ev.topic
    ? `${ev.topic} · ${timeStr}`
    : `${timeStr} · ${CONFIG.meetup.location}`;
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
      "SUMMARY:" + icsSummary,
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
   Email subscribe form (AJAX, works with Formspree / Mailchimp-style)
   ------------------------------------------------------------------ */
(function subscribe() {
  const form = document.getElementById("subscribe-form");
  const note = document.getElementById("subscribe-note");
  if (!form || !note) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: real visitors never fill this in.
    if (form.querySelector('[name="_gotcha"]')?.value) return;

    const name = form.querySelector('[name="name"]')?.value.trim() || "";
    const email = form.querySelector('[name="email"]')?.value.trim() || "";

    note.classList.remove("error");
    note.textContent = "Subscribing…";

    try {
      const res = await fetch(window.CONFIG.crmWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: "atlanta_women_investors", form: "subscribe", email, firstName: name }),
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
   Generic CRM forms (text-me-back, referral, speaker, sponsor inquiry)
   ------------------------------------------------------------------ */
(function crmForms() {
  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const note = form.querySelector("[data-note]");
      const val = (n) => (form.querySelector(`[name="${n}"]`)?.value || "").trim();
      const setNote = (msg, err) => { if (note) { note.classList.toggle("error", !!err); note.textContent = msg; } };
      const url = CONFIG.crmWebhookUrl;
      if (!url) { setNote("Form isn't connected yet.", true); return; }
      setNote("Sending…");
      const kind = form.dataset.form;
      const message = kind === "friend_referral"
        ? `Friend: ${val("friendName")} <${val("friendEmail")}>`
        : (val("message") || val("topic") || val("question"));
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site: "atlanta_women_investors",
            form: kind,
            firstName: val("name") || val("firstName"),
            email: val("email"),
            phone: val("phone"),
            company: val("company"),
            message,
          }),
        });
        if (!res.ok) throw new Error("bad response");
        form.reset();
        setNote(form.dataset.success || "Thanks — we'll be in touch!");
      } catch (err) {
        setNote("Something went wrong — email hello@atlantawomeninvestors.com and we'll add you.", true);
      }
    });
  });
})();

/* ------------------------------------------------------------------
   Gallery carousel arrows
   ------------------------------------------------------------------ */
(function carousel() {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const rail = root.querySelector(".gallery-rail");
    if (!rail) return;
    const step = () => Math.max(280, rail.clientWidth * 0.7);
    root.querySelector("[data-car-prev]")?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    root.querySelector("[data-car-next]")?.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
  });
  // arrows live in the header (sibling), so also wire by section
  document.querySelectorAll("#gallery").forEach((sec) => {
    const rail = sec.querySelector(".gallery-rail");
    if (!rail) return;
    const step = () => Math.max(280, rail.clientWidth * 0.7);
    sec.querySelector("[data-car-prev]")?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    sec.querySelector("[data-car-next]")?.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
  });
})();

/* ------------------------------------------------------------------
   Sponsor inquiry fold + copy-link buttons
   ------------------------------------------------------------------ */
(function sponsorFold() {
  const card = document.querySelector("[data-sponsor-fold]");
  if (!card) return;
  const openBtn = card.querySelector("[data-sponsor-open]");
  const form = card.querySelector(".sponsor-form");
  const cancel = card.querySelector("[data-sponsor-cancel]");
  const openRow = openBtn ? openBtn.closest(".sponsor-cta-actions") : null;
  openBtn?.addEventListener("click", () => { if (openRow) openRow.hidden = true; if (form) form.hidden = false; });
  cancel?.addEventListener("click", () => { if (form) form.hidden = true; if (openRow) openRow.hidden = false; });
})();

(function copyLinks() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const orig = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy || CONFIG.eventbriteUrl || location.href);
        btn.textContent = "Link copied";
        setTimeout(() => (btn.textContent = orig), 2000);
      } catch (_) { btn.textContent = "Copy failed"; setTimeout(() => (btn.textContent = orig), 2000); }
    });
  });
})();

/* ------------------------------------------------------------------
   Footer year
   ------------------------------------------------------------------ */
(function year() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();
