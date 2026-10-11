#!/usr/bin/env node
/* =========================================================
   Sync the site's meetup data from Eventbrite.

   Run daily by .github/workflows/eventbrite-sync.yml.

   - Upcoming events  -> js/events.js  (drives the "next meetup")
   - Past events      -> js/past.js    (drives the Past Meetups page),
                          preserving any youtubeId / photos you added.

   Env:
     EVENTBRITE_TOKEN   (required) your Eventbrite private token
     EVENTBRITE_ORG_ID  (optional) organization id; auto-discovered if unset
     EVENTBRITE_MOCK    (optional) path to a JSON file [{...events}] for testing
   ========================================================= */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVENTS_FILE = path.join(ROOT, "js", "events.js");
const PAST_FILE = path.join(ROOT, "js", "past.js");
const INDEX_FILE = path.join(ROOT, "index.html");
const CONFIG_FILE = path.join(ROOT, "js", "config.js");
const JSONLD_FILE = path.join(ROOT, "js", "jsonld.js");
const API = "https://www.eventbriteapi.com/v3";

const TOKEN = process.env.EVENTBRITE_TOKEN;
const MOCK = process.env.EVENTBRITE_MOCK;

// Hide events whose title matches (e.g. cancelled / not part of the meetup series).
const EXCLUDE_TITLE = /coliving summit/i;
// Hide specific event ids (e.g. a duplicate listing of the same meetup).
const EXCLUDE_IDS = new Set(["1990612153537"]); // generic July 28 dup of House Hacking
const keep = (items) =>
  items.filter((e) => e.topic && !EXCLUDE_TITLE.test(e.topic) && !EXCLUDE_IDS.has(String(e.id)));

async function api(pathname, params = {}) {
  const url = new URL(API + pathname);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Eventbrite ${res.status} ${res.statusText} for ${url.pathname}`);
  return res.json();
}

async function fetchAll(orgId, timeFilter, orderBy) {
  const out = [];
  let continuation;
  do {
    const data = await api(`/organizations/${orgId}/events/`, {
      time_filter: timeFilter,
      order_by: orderBy,
      continuation,
    });
    out.push(...(data.events || []));
    continuation = data.pagination && data.pagination.has_more_items ? data.pagination.continuation : null;
  } while (continuation);
  return out;
}

/* --- map an Eventbrite event to our shape --- */
function firstParagraph(text) {
  return String(text || "").split(/\n{2,}/)[0].trim();
}
function toItem(e) {
  const start = (e.start && (e.start.local || e.start.utc)) || "";
  const desc = (e.description && e.description.text) || "";
  return {
    id: String(e.id),
    date: start.slice(0, 10),
    topic: (e.name && e.name.text) || "Meetup",
    summary: (e.summary && e.summary.trim()) || firstParagraph(desc),
    body: desc,
    speaker: "",
    eventbriteUrl: e.url || "",
  };
}

/* --- collapse a multi-day event (same title, consecutive days) into one
       entry with a dateEnd range; leaves separate monthly meetups alone --- */
function mergeMultiDay(items) {
  const asc = items.slice().sort((a, b) => a.date.localeCompare(b.date));
  const out = [];
  const norm = (s) => String(s || "").trim().toLowerCase();
  for (const it of asc) {
    const prev = out[out.length - 1];
    if (prev && norm(prev.topic) === norm(it.topic)) {
      const gapDays = (new Date(it.date) - new Date(prev.dateEnd || prev.date)) / 86400000;
      if (gapDays >= 0 && gapDays <= 2) { prev.dateEnd = it.date; continue; }
    }
    out.push({ ...it });
  }
  return out;
}

/* --- read an existing "window.X = [...]" data file --- */
function loadWindowArray(file, varName) {
  if (!fs.existsSync(file)) return [];
  try {
    const win = {};
    // eslint-disable-next-line no-new-func
    new Function("window", fs.readFileSync(file, "utf8"))(win);
    return Array.isArray(win[varName]) ? win[varName] : [];
  } catch (err) {
    console.warn(`Could not parse ${path.basename(file)}: ${err.message}`);
    return [];
  }
}

function writeDataFile(file, varName, header, items) {
  const body = `${header}\nwindow.${varName} = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(file, body);
}

/* Rewrite the homepage JSON-LD from the events list. buildAwiJsonLd drops
   dates before today in America/New_York, so crawlers stop seeing past events
   even when this file is served with JavaScript off. */
export function refreshIndexJsonLd(events, indexPath = INDEX_FILE) {
  const context = { console, Intl, Date, JSON };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(CONFIG_FILE, "utf8"), context);
  vm.runInContext(fs.readFileSync(JSONLD_FILE, "utf8"), context);
  const data = context.buildAwiJsonLd(events, undefined, context.CONFIG && context.CONFIG.eventbriteUrl);
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  const html = fs.readFileSync(indexPath, "utf8");
  const re = /(<script type="application\/ld\+json" id="site-jsonld">)([\s\S]*?)(<\/script>)/;
  if (!re.test(html)) throw new Error('No <script id="site-jsonld"> block in ' + indexPath);
  const next = html.replace(re, `$1\n${json}\n  $3`);
  fs.writeFileSync(indexPath, next);
  return data;
}

const EVENTS_HEADER = `/* AUTO-GENERATED from Eventbrite by scripts/sync-eventbrite.mjs.
   Do not hand-edit — change the event in Eventbrite instead. */`;
const PAST_HEADER = `/* AUTO-GENERATED from Eventbrite by scripts/sync-eventbrite.mjs.
   Topic/date/summary come from Eventbrite; youtubeId + photos are yours
   and are preserved across syncs (matched by "id"). */`;

async function main() {
  let upcoming = [];
  let past = [];

  if (MOCK) {
    const all = JSON.parse(fs.readFileSync(MOCK, "utf8")).map(toItem);
    const today = new Date().toISOString().slice(0, 10);
    upcoming = all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    past = all.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  } else {
    if (!TOKEN) {
      console.log("EVENTBRITE_TOKEN not set — leaving events.js unchanged.");
      const existing = loadWindowArray(EVENTS_FILE, "EVENTS");
      refreshIndexJsonLd(existing);
      console.log(`Rewrote homepage JSON-LD from ${existing.length} events on disk.`);
      return;
    }
    let orgId = process.env.EVENTBRITE_ORG_ID;
    if (!orgId) {
      const orgs = await api("/users/me/organizations/");
      orgId = orgs.organizations && orgs.organizations[0] && orgs.organizations[0].id;
      if (!orgId) throw new Error("No Eventbrite organization found for this token.");
    }
    upcoming = (await fetchAll(orgId, "current_future", "start_asc")).map(toItem);
    past = (await fetchAll(orgId, "past", "start_desc")).map(toItem);
  }

  // Drop excluded (e.g. cancelled) events, then collapse multi-day events.
  upcoming = mergeMultiDay(keep(upcoming));
  past = mergeMultiDay(keep(past)).sort((a, b) => b.date.localeCompare(a.date));

  // Preserve youtubeId / photos on past entries (match by id).
  const prevPast = loadWindowArray(PAST_FILE, "PAST_MEETUPS");
  const prevById = new Map(prevPast.map((p) => [String(p.id), p]));
  const mergedPast = past.map((p) => {
    const prev = prevById.get(String(p.id)) || {};
    return {
      id: p.id,
      date: p.date,
      topic: p.topic,
      summary: p.summary,
      eventbriteUrl: p.eventbriteUrl,
      youtubeId: prev.youtubeId || "",
      photos: Array.isArray(prev.photos) ? prev.photos : [],
    };
  });
  // Keep any manually-added past entries that aren't in Eventbrite.
  const syncedIds = new Set(mergedPast.map((p) => String(p.id)));
  for (const p of prevPast) {
    if (!syncedIds.has(String(p.id))) mergedPast.push(p);
  }
  mergedPast.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  writeDataFile(EVENTS_FILE, "EVENTS", EVENTS_HEADER, upcoming);
  writeDataFile(PAST_FILE, "PAST_MEETUPS", PAST_HEADER, mergedPast);
  const graph = refreshIndexJsonLd(upcoming);
  const eventCount = graph["@graph"].filter((n) => n["@type"] === "Event").length;

  console.log(`Synced: ${upcoming.length} upcoming, ${mergedPast.length} past. JSON-LD events: ${eventCount}.`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
