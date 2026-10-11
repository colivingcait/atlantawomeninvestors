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

  const organizer = CONFIG.eventbriteUrl || "#";

  const $ = (id) => document.getElementById(id);
  const fmtTime = (h) => (h > 12 ? h - 12 : h);
  const timeRange = window.meetupTimeRange
    ? window.meetupTimeRange()
    : `${fmtTime(CONFIG.meetup.startHour)}–${fmtTime(CONFIG.meetup.startHour + CONFIG.meetup.durationHours)} PM`;

  // RSVP and Add to Calendar go to the organizer page.
  document.querySelectorAll("[data-rsvp], [data-calendar]").forEach((a) => (a.href = organizer));
  if (window.renderVenue) window.renderVenue(document.getElementById("venue-body"));

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

  // footer year
  if ($("year")) $("year").textContent = new Date().getFullYear();
})();
