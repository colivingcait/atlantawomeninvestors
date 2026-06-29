# Atlanta Women Investors

The website for **Atlanta Women Investors** — a monthly meetup community of women
building wealth through real estate in Atlanta.

🔗 Live site: **https://atlantawomeninvestors.com**

It's a fast, dependency-free static site (plain HTML/CSS/JS), so it's cheap to host,
easy to edit, and quick to load.

---

## What's included

| Feature | Where it lives | Notes |
| --- | --- | --- |
| Hero + About + "Our Story" | `index.html` | Edit the copy directly. |
| **Monthly calendar** | `js/main.js` → `CONFIG.meetup` | Auto-computes your recurring meetup day and highlights it. |
| **Add to Calendar** | `js/main.js` | Generates a downloadable `.ics` for the next meetup. No setup needed. |
| **Eventbrite RSVPs** | `js/main.js` → `CONFIG.eventbrite*` | Embeds the Eventbrite checkout widget, or links out. |
| **Email subscribe** | `index.html` → `<form id="subscribe-form">` | Point the form `action` at your email provider. |
| **Sponsors** | `index.html` → `#sponsors` | Swap placeholder logos/links for real sponsors. |

---

## Quick setup (3 things to fill in)

### 1. Eventbrite RSVPs
Open `js/main.js` and edit the `CONFIG` block at the top:

```js
const CONFIG = {
  eventbriteEventId: "1234567890123",                 // your event's numeric ID
  eventbriteUrl: "https://www.eventbrite.com/o/your-org", // your public page
  ...
};
```

- The **event ID** is the number at the end of an Eventbrite event URL
  (`.../e/my-event-tickets-1234567890123`).
- With an event ID set, the RSVP section embeds Eventbrite's checkout inline.
- Leave it empty and the section shows a button linking to `eventbriteUrl` instead.

### 2. Meetup schedule (drives the calendar + Add-to-Calendar)
Still in `CONFIG.meetup`:

```js
meetup: {
  weekday: 4,   // 0=Sun, 1=Mon ... 6=Sat   (4 = Thursday)
  nth: 2,       // 1=first, 2=second, 3=third, 4=fourth, -1=last of the month
  startHour: 18, startMinute: 30,            // 6:30 PM
  durationHours: 2,
  title: "Atlanta Women Investors Meetup",
  location: "Atlanta, GA",
  description: "...",
}
```

Example: `weekday: 4, nth: 2` = **the 2nd Thursday of every month**.

### 3. Email subscriptions
The form works with any provider that accepts a POST. Two easy options:

**Formspree** (no backend needed):
1. Create a form at <https://formspree.io>.
2. Copy your form ID and set the form `action` in `index.html`:
   ```html
   <form id="subscribe-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

**Mailchimp / ConvertKit / Buttondown:** paste your embedded form's `action`
URL and field names. The included JS submits via AJAX and shows a success
message; if AJAX is blocked it falls back to a normal form submit.

> Until you connect a provider, the form shows a friendly "not connected yet"
> message instead of erroring.

---

## Editing content

- **Text:** all copy is in `index.html` — just edit and save.
- **Colors/fonts:** CSS variables at the top of `css/styles.css` (`:root`).
- **Logo / images:** SVGs in `assets/img/` (swap for your own branding any time).
- **Sponsors:** duplicate a `.sponsor` block in the `#sponsors` section, drop in
  the sponsor's logo and link.

---

## Hosting on GitHub Pages (with your domain)

This repo is ready for GitHub Pages:

1. Push to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
   (The included workflow `.github/workflows/deploy.yml` publishes the site.)
3. The `CNAME` file points Pages at `atlantawomeninvestors.com`.
4. At your domain registrar, add DNS records pointing to GitHub Pages:
   - Four `A` records for the apex domain → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - (optional) a `CNAME` for `www` → `<your-username>.github.io`
5. In **Settings → Pages**, set the custom domain to `atlantawomeninvestors.com`
   and enable **Enforce HTTPS**.

Prefer Netlify or Vercel? Just point them at this repo — no build step, publish
directory is the project root.

---

## Local preview

No build tools required. From the project folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

Made with 💛 in Atlanta.
