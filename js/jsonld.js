/* JSON-LD for the homepage. One @graph:
   Organization, Caitlyn (same @id as her other sites), the monthly
   EventSeries, and upcoming Event nodes from js/events.js.
   Past dates are left out. scripts/sync-eventbrite.mjs rewrites the
   <script id="site-jsonld"> block in index.html on each daily sync.
   This file refreshes that block in the browser as a backup. */

(function (root) {
  var PERSON = "https://www.colivingcait.com/#caitlyn";
  var ORG = "https://www.atlantawomeninvestors.com/#organization";
  var SERIES = "https://www.atlantawomeninvestors.com/#meetup-series";
  var SITE = "https://www.atlantawomeninvestors.com";
  /* Indoor women's meetup photo from the gallery. Not an exterior or a property. */
  var EVENT_IMAGE = SITE + "/assets/img/meetup-group.jpg";

  function pad(n) { return String(n).padStart(2, "0"); }

  function isRealDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var bits = s.split("-").map(Number);
    var dt = new Date(Date.UTC(bits[0], bits[1] - 1, bits[2]));
    return dt.getUTCFullYear() === bits[0] && dt.getUTCMonth() === bits[1] - 1 && dt.getUTCDate() === bits[2];
  }

  /* Offset, in hours, of America/New_York at that clock time. */
  function atlantaOffsetHours(y, m, d, hour, minute) {
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    var off;
    for (off = -4; off >= -5; off--) {
      var utc = new Date(Date.UTC(y, m - 1, d, hour - off, minute));
      var parts = {};
      dtf.formatToParts(utc).forEach(function (p) { parts[p.type] = p.value; });
      if (+parts.year === y && +parts.month === m && +parts.day === d && +parts.hour === hour && +parts.minute === minute) {
        return off;
      }
    }
    return -5;
  }

  function atlantaStamp(dateStr, hour, minute) {
    var bits = dateStr.split("-").map(Number);
    var off = atlantaOffsetHours(bits[0], bits[1], bits[2], hour, minute);
    var sign = off < 0 ? "-" : "+";
    return bits[0] + "-" + pad(bits[1]) + "-" + pad(bits[2]) + "T" + pad(hour) + ":" + pad(minute) + ":00" + sign + pad(Math.abs(off)) + ":00";
  }

  function todayInAtlanta() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
  }

  function place() {
    return {
      "@type": "Place",
      "name": "New Realm Brewing",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "550 Somerset Terrace NE",
        "addressLocality": "Atlanta",
        "addressRegion": "GA",
        "postalCode": "30306",
        "addressCountry": "US",
      },
    };
  }

  root.buildAwiJsonLd = function (events, nowDateStr, eventbriteUrl) {
    var eventbrite = eventbriteUrl || (root.CONFIG && root.CONFIG.eventbriteUrl) ||
      "https://www.eventbrite.com/o/women-real-estate-investors-meetup-121211260760";
    var meetup = (root.CONFIG && root.CONFIG.meetup) || { startHour: 18, startMinute: 30, durationHours: 3 };
    var today = nowDateStr || todayInAtlanta();
    var startHour = meetup.startHour;
    var startMinute = meetup.startMinute || 0;
    var endHour = startHour + (meetup.durationHours || 3);

    var upcoming = (events || []).filter(function (e) {
      return e && isRealDate(e.date) && e.date >= today;
    }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    var eventNodes = upcoming.map(function (e) {
      return {
        "@type": "Event",
        "@id": SITE + "/#event-" + e.date,
        "name": e.topic || "Atlanta Women Investors Meetup",
        "description": e.summary || "Monthly meetup for women real estate investors in Atlanta.",
        "startDate": atlantaStamp(e.date, startHour, startMinute),
        "endDate": atlantaStamp(e.date, endHour, startMinute),
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "image": EVENT_IMAGE,
        "isAccessibleForFree": true,
        "url": e.eventbriteUrl || eventbrite,
        "offers": {
          "@type": "Offer",
          "price": 0,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": e.eventbriteUrl || eventbrite,
        },
        "location": place(),
        "organizer": { "@id": ORG },
        "superEvent": { "@id": SERIES },
      };
    });

    var series = {
      "@type": "EventSeries",
      "@id": SERIES,
      "name": "Atlanta Women Investors Meetup",
      "description": "Monthly meetup for women real estate investors, the fourth Tuesday of every month, 6:30–9:30 PM at New Realm Brewing in Atlanta.",
      "url": eventbrite,
      "organizer": { "@id": ORG },
      "location": place(),
      "eventSchedule": {
        "@type": "Schedule",
        "repeatFrequency": "P1M",
        "byDay": "https://schema.org/Tuesday",
        "byMonthWeek": 4,
        "startTime": "18:30:00",
        "endTime": "21:30:00",
        "scheduleTimezone": "America/New_York",
      },
    };
    if (eventNodes.length) {
      series.subEvent = eventNodes.map(function (n) { return { "@id": n["@id"] }; });
    }

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": ORG,
          "name": "Atlanta Women Investors",
          "url": SITE,
          "founder": { "@id": PERSON },
        },
        {
          "@type": "Person",
          "@id": PERSON,
          "name": "Caitlyn Verdugo",
          "jobTitle": "Realtor, Real Estate Investor & Coach",
          "worksFor": {
            "@type": "Organization",
            "name": "Keller Williams Realty Metro Atlanta",
          },
          "sameAs": [
            "https://www.colivingcait.com",
            "https://www.househackingatl.com",
            "https://www.zillow.com/profile/caitlynverdugo",
            eventbrite,
          ],
        },
        series,
      ].concat(eventNodes),
    };
  };

  if (typeof document === "undefined") return;

  function publish() {
    var data = root.buildAwiJsonLd(root.EVENTS || []);
    var json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
    var el = document.getElementById("site-jsonld");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "site-jsonld";
      document.head.appendChild(el);
    }
    el.textContent = json;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", publish);
  else publish();
})(typeof window !== "undefined" ? window : globalThis);
