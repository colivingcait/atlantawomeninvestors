/* =========================================================
   Atlanta Women Investors — /event landing page
   A focused, ad-friendly page for ONE meetup.

   URL options:
     /event            -> shows the next upcoming meetup
     /event?d=2026-07-28 -> shows that specific meetup
   Data comes from js/config.js (CONFIG) + js/events.js (EVENTS).
   ========================================================= */
(function eventPage() {
  const CONFIG = window.CONFIG || {};
  const EVENTS = Array.isArray(window.EVENTS) ? window.EVENTS : [];

  function parseEventDate(str) {
    const [y, m, d] = String(str).split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    dt.setHours(CONFIG.meetup.startHour, CONFIG.meetup.startMinute, 0, 0);
    return dt;
  }

  // pick event: ?d=YYYY-MM-DD, else nearest upcoming, else last in list
  const params = new URLSearchParams(location.search);
  const want = params.get("d");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sorted = EVENTS.filter((e) => e && e.date).sort(
    (a, b) => parseEventDate(a.date) - parseEventDate(b.date)
  );
  let ev =
    (want && sorted.find((e) => e.date === want)) ||
    sorted.find((e) => parseEventDate(e.date) >= startOfToday) ||
    sorted[sorted.length - 1];

  const rsvpUrl = (ev && ev.eventbriteUrl) || CONFIG.eventbriteUrl || "#";

  const $ = (id) => document.getElementById(id);
  const fmtTime = (h) => (h > 12 ? h - 12 : h);
  const timeRange = `${fmtTime(CONFIG.meetup.startHour)}–${fmtTime(
    CONFIG.meetup.startHour + CONFIG.meetup.durationHours
  )} PM`;

  // wire all RSVP buttons
  document.querySelectorAll("[data-rsvp]").forEach((a) => (a.href = rsvpUrl));

  if (!ev) {
    if ($("ev-topic")) $("ev-topic").textContent = "Our next meetup";
    return;
  }

  const dt = parseEventDate(ev.date);
  const dateLong = dt.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // ---- fill content ----
  const coming = !ev.topic || /^coming soon$/i.test(ev.topic.trim());
  if ($("ev-eyebrow")) $("ev-eyebrow").textContent = coming ? "Save the date" : "You're invited";
  if ($("ev-topic")) $("ev-topic").textContent = coming ? "Atlanta Women Investors Meetup" : ev.topic;
  if ($("ev-date")) $("ev-date").textContent = dateLong;
  if ($("ev-time")) $("ev-time").textContent = timeRange;
  if ($("ev-loc")) $("ev-loc").textContent = CONFIG.meetup.location;
  if ($("ev-summary")) $("ev-summary").textContent = ev.summary || "";
  if (ev.speaker && $("ev-speaker")) {
    $("ev-speaker").textContent = "With " + ev.speaker;
    $("ev-speaker").hidden = false;
  }

  // writeup paragraphs (escaped)
  if ($("ev-body")) {
    const html = String(ev.body || "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => "<p>" + p.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</p>")
      .join("");
    $("ev-body").innerHTML = html || "<p>Full details coming soon — RSVP to be the first to know.</p>";
  }

  // page + share titles
  const titleStr = (coming ? "Atlanta Women Investors Meetup" : ev.topic) + " · " + dateLong;
  document.title = titleStr + " | Atlanta Women Investors";
  const setMeta = (sel, val) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute("content", val);
  };
  setMeta('meta[property="og:title"]', titleStr);
  setMeta('meta[name="description"]', ev.summary || CONFIG.meetup.description);
  setMeta('meta[property="og:description"]', ev.summary || CONFIG.meetup.description);

  // ---- Add to Calendar (.ics) ----
  const icsBtn = $("ev-ics");
  if (icsBtn) {
    icsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const pad = (n) => String(n).padStart(2, "0");
      const toICS = (d) =>
        d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
        "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
      const end = new Date(dt.getTime() + CONFIG.meetup.durationHours * 3600 * 1000);
      const summary = coming ? CONFIG.meetup.title : CONFIG.meetup.title + ": " + ev.topic;
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0",
        "PRODID:-//Atlanta Women Investors//Meetup//EN", "BEGIN:VEVENT",
        "UID:" + toICS(dt) + "@atlantawomeninvestors.com",
        "DTSTAMP:" + toICS(new Date()),
        "DTSTART:" + toICS(dt), "DTEND:" + toICS(end),
        "SUMMARY:" + summary, "LOCATION:" + CONFIG.meetup.location,
        "DESCRIPTION:" + (ev.summary || CONFIG.meetup.description),
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = "awi-meetup.ics";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // footer year
  if ($("year")) $("year").textContent = new Date().getFullYear();
})();
