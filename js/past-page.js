/* Past Meetups index: featured latest recap + grid of the rest,
   each linking to its /recap/<slug>/ page. Data from js/past.js. */
(function pastIndex() {
  var PAST = Array.isArray(window.PAST_MEETUPS) ? window.PAST_MEETUPS : [];
  var recaps = window.buildRecaps ? window.buildRecaps(PAST) : [];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var fmt = function (d) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); };
  if ($("year")) $("year").textContent = new Date().getFullYear();

  if (!recaps.length) { if ($("past-empty")) $("past-empty").hidden = false; return; }

  var mediaBlock = function (m, cls) {
    if (m.youtubeId) return '<div class="' + cls + '"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(m.youtubeId) + '" title="' + esc(m.topic) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    if (m.photos && m.photos[0]) return '<div class="' + cls + '"><img src="' + m.photos[0] + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/img/gallery-placeholder.svg\'"></div>';
    return '<div class="' + cls + '"><div style="display:grid;place-items:center;height:100%;color:#bcd0c1">Recording coming soon</div></div>';
  };

  // Featured = newest
  var f = recaps[0];
  var fe = $("past-featured");
  if (fe) {
    fe.innerHTML =
      mediaBlock(f.item, "recap-video") +
      '<div>' +
        '<span class="recap-badge">Latest recap</span>' +
        '<h3>' + esc(f.item.topic) + '</h3>' +
        '<p class="d" style="color:var(--teal-600);font-weight:600;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 0.5rem">' + fmt(f.item.date) + '</p>' +
        '<p>' + esc(f.item.summary) + '</p>' +
        '<a class="btn btn-primary" href="/recap/' + f.slug + '/">Open the recap page</a>' +
      '</div>';
    fe.hidden = false;
  }

  // Grid = the rest + a "next recap" slot
  var rest = recaps.slice(1);
  var grid = $("past-grid");
  if (grid) {
    grid.innerHTML = rest.map(function (r) {
      var m = r.item;
      var pill = m.youtubeId ? '<span class="rec-pill">Recording</span>' : "";
      return '<a class="past-item" href="/recap/' + r.slug + '/">' +
        mediaBlock(m, "past-item-media") +
        '<div class="past-item-body">' + pill +
          '<p class="d">' + fmt(m.date) + '</p>' +
          '<h3>' + esc(m.topic) + '</h3>' +
          '<span class="go">View recap &rarr;</span>' +
        '</div></a>';
    }).join("") +
    '<div class="past-slot"><strong>Next recap lands here</strong><a href="/#subscribe" style="font-weight:600;color:var(--teal-600)">Get notified &rarr;</a></div>';
  }
})();
