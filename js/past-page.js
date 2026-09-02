/* Renders the Past Meetups list from js/past.js. */
(function pastPage() {
  const list = document.getElementById("past-list");
  const empty = document.getElementById("past-empty");
  if (!list) return;

  const items = (Array.isArray(window.PAST_MEETUPS) ? window.PAST_MEETUPS : [])
    .filter((m) => m && m.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!items.length) {
    if (empty) empty.hidden = false;
    return;
  }

  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const fmt = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  list.innerHTML = items
    .map((m) => {
      const photos = Array.isArray(m.photos) ? m.photos : [];
      let media = "";
      let gallery = photos;
      if (m.youtubeId) {
        media = `<div class="past-video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.youtubeId)}" title="${esc(m.topic)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      } else if (photos[0]) {
        media = `<div class="past-video"><img src="${photos[0]}" alt="${esc(m.topic)}" loading="lazy"></div>`;
        gallery = photos.slice(1);
      }
      const thumbs = gallery.length
        ? `<div class="past-photos">${gallery.map((p) => `<img src="${p}" alt="" loading="lazy">`).join("")}</div>`
        : "";
      return `
        <article class="past-card${media ? "" : " past-card--text"}">
          ${media}
          <div class="past-info">
            <p class="past-date">${fmt(m.date)}</p>
            <h3 class="past-topic">${esc(m.topic) || "Meetup"}</h3>
            ${m.summary ? `<p class="past-summary">${esc(m.summary)}</p>` : ""}
            ${m.eventbriteUrl ? `<a class="topic-card-link" href="${m.eventbriteUrl}" target="_blank" rel="noopener">Event details &rarr;</a>` : ""}
            ${thumbs}
          </div>
        </article>`;
    })
    .join("");
})();
