/* =========================================================
   Atlanta Women Investors — shared site behavior
   Loaded on every page: mobile nav, CRM forms, carousel,
   sponsor fold, copy-link buttons, footer year.
   (Homepage-specific logic lives in js/main.js.)
   ========================================================= */
(function site() {
  var CONFIG = window.CONFIG || {};

  /* Mobile nav toggle */
  var btn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Generic CRM forms */
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-note]");
      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
      var setNote = function (msg, err) { if (note) { note.classList.toggle("error", !!err); note.textContent = msg; } };
      var url = CONFIG.crmWebhookUrl;
      if (!url) { setNote("Form isn't connected yet.", true); return; }
      setNote("Sending…");
      var kind = form.dataset.form;
      var message = kind === "friend_referral"
        ? "Friend: " + val("friendName") + " <" + val("friendEmail") + ">"
        : (val("message") || val("topic") || val("question"));
      try {
        var res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site: "atlanta_women_investors",
            form: kind,
            firstName: val("name") || val("firstName"),
            email: val("email"),
            phone: val("phone"),
            company: val("company"),
            message: message,
            meetup: form.dataset.meetup || "",
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

  /* Gallery carousel arrows */
  document.querySelectorAll("#gallery, [data-carousel]").forEach(function (root) {
    var rail = root.querySelector(".gallery-rail");
    if (!rail) return;
    var step = function () { return Math.max(280, rail.clientWidth * 0.7); };
    var prev = root.querySelector("[data-car-prev]");
    var next = root.querySelector("[data-car-next]");
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
  });

  /* Sponsor inquiry fold */
  var sc = document.querySelector("[data-sponsor-fold]");
  if (sc) {
    var openBtn = sc.querySelector("[data-sponsor-open]");
    var sform = sc.querySelector(".sponsor-form");
    var cancel = sc.querySelector("[data-sponsor-cancel]");
    var openRow = openBtn ? openBtn.closest(".sponsor-cta-actions") : null;
    if (openBtn) openBtn.addEventListener("click", function () { if (openRow) openRow.hidden = true; if (sform) sform.hidden = false; });
    if (cancel) cancel.addEventListener("click", function () { if (sform) sform.hidden = true; if (openRow) openRow.hidden = false; });
  }

  /* Copy-link buttons */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    var orig = b.textContent;
    b.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(b.dataset.copy || CONFIG.eventbriteUrl || location.href);
        b.textContent = "Link copied";
        setTimeout(function () { b.textContent = orig; }, 2000);
      } catch (_) { b.textContent = "Copy failed"; setTimeout(function () { b.textContent = orig; }, 2000); }
    });
  });

  /* Footer year */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
