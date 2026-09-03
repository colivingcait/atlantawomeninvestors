/* Renders a single meetup recap from js/past.js, keyed by URL slug
   (e.g. /recap/aug-2026). Falls back to ?slug= then the newest recap. */
(function recapPage() {
  var CONFIG = window.CONFIG || {};
  var PAST = Array.isArray(window.PAST_MEETUPS) ? window.PAST_MEETUPS : [];
  var EVENTS = Array.isArray(window.EVENTS) ? window.EVENTS : [];
  var recaps = window.buildRecaps ? window.buildRecaps(PAST) : [];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); };

  // resolve slug from path or query
  var params = new URLSearchParams(location.search);
  var slug = params.get("slug");
  if (!slug) {
    var parts = location.pathname.replace(/\/+$/, "").split("/");
    var last = parts[parts.length - 1];
    if (last && last !== "recap" && last !== "index.html") slug = last;
  }
  var rec = recaps.find(function (r) { return r.slug === slug; }) || recaps[0];
  if ($("year")) $("year").textContent = new Date().getFullYear();
  if (!rec) { if ($("recap-title")) $("recap-title").textContent = "Recap coming soon"; return; }

  var m = rec.item;
  var d = new Date(m.date + "T12:00:00");
  var dateLong = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  var venue = (CONFIG.venue && CONFIG.venue.name)
    ? CONFIG.venue.name + ", " + (CONFIG.venue.area || "Atlanta")
    : (CONFIG.meetup ? CONFIG.meetup.location : "Atlanta");

  document.title = m.topic + " | Recap | Atlanta Women Investors";
  var setMeta = function (sel, v) { var el = document.querySelector(sel); if (el) el.setAttribute("content", v); };
  setMeta('meta[property="og:title"]', m.topic + " — Recap");
  setMeta('meta[name="description"]', m.summary || "");
  setMeta('meta[property="og:description"]', m.summary || "");

  if ($("recap-datev")) $("recap-datev").textContent = dateLong + " · " + venue;
  if ($("recap-title")) $("recap-title").textContent = m.topic;
  if ($("recap-summary")) $("recap-summary").textContent = m.summary || "";
  if ($("recap-covered")) $("recap-covered").textContent = m.summary || "";

  // recording
  var vwrap = $("recap-video");
  if (vwrap) {
    vwrap.innerHTML = m.youtubeId
      ? '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(m.youtubeId) + '" title="' + esc(m.topic) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      : '<div style="display:grid;place-items:center;height:100%;color:#bcd0c1">Recording coming soon</div>';
  }

  // share + original event
  var shareUrl = location.origin + "/recap/?slug=" + rec.slug;
  if ($("recap-share-url")) $("recap-share-url").textContent = "Share this page — " + shareUrl.replace(/^https?:\/\//, "");
  if ($("recap-copy")) $("recap-copy").dataset.copy = shareUrl;
  if ($("recap-event")) $("recap-event").href = m.eventbriteUrl || CONFIG.eventbriteUrl || "#";

  // photos
  var photos = Array.isArray(m.photos) ? m.photos : [];
  if (photos.length && $("recap-photos")) {
    $("recap-photos").innerHTML = photos.map(function (p) {
      return '<figure><img src="' + p + '" alt="" loading="lazy" onerror="this.closest(\'figure\').remove()"></figure>';
    }).join("");
    if ($("recap-photos-sec")) $("recap-photos-sec").hidden = false;
  }

  // next meetup
  var today = new Date().toISOString().slice(0, 10);
  var next = EVENTS.filter(function (e) { return e && e.date && e.date >= today; })
    .sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
  if (next) {
    var nd = new Date(next.date + "T12:00:00");
    if ($("recap-next-date")) $("recap-next-date").textContent = nd.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    var tr = window.meetupTimeRange ? window.meetupTimeRange() : "6:30–9:30 PM";
    if ($("recap-next-meta")) $("recap-next-meta").textContent = tr + " · " + venue + " · Free";
    if ($("recap-next-rsvp")) $("recap-next-rsvp").href = next.eventbriteUrl || CONFIG.eventbriteUrl || "#";
  }

  // recap signup form context
  var form = document.querySelector('form[data-form="recap_recordings"]');
  if (form) form.dataset.meetup = m.date + " " + m.topic;

  // other past meetups
  var others = recaps.filter(function (r) { return r.slug !== rec.slug; }).slice(0, 3);
  if ($("recap-others")) {
    $("recap-others").innerHTML = others.map(function (r) {
      var od = new Date(r.item.date + "T12:00:00");
      return '<a class="recap-other" href="/recap/?slug=' + r.slug + '"><p class="d">' +
        od.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
        '</p><strong>' + esc(r.item.topic) + '</strong><span class="go">View recap &rarr;</span></a>';
    }).join("");
  }
})();
