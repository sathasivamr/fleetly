// Client-side reverse geocoding via OpenStreetMap Nominatim.
// Used when the Traccar server doesn't have server-side geocoding enabled.
//
// Policy compliance (https://operations.osmfoundation.org/policies/nominatim/):
// - Max 1 request/second (serialized queue)
// - Identify with a referer/user-agent (browser sends Referer automatically)
// - Cache results aggressively (localStorage, ~11m precision)

const CACHE_KEY = 'fleet-geocode-cache-v1';
const PRECISION = 4; // ~11 meters
const CACHE_LIMIT = 2000;
const MIN_INTERVAL_MS = 1100;
const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

function roundKey(lat, lng) {
  return `${lat.toFixed(PRECISION)},${lng.toFixed(PRECISION)}`;
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    const entries = Object.entries(cache);
    if (entries.length > CACHE_LIMIT) {
      entries.sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
      const trimmed = Object.fromEntries(entries.slice(0, CACHE_LIMIT));
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch {
    /* quota exceeded — drop silently */
  }
}

const memoryCache = loadCache();
const inflight = new Map(); // key -> Promise<string|null>
const queue = [];
let lastRequestAt = 0;
let draining = false;
const subscribers = new Set();

function notify(key, address) {
  subscribers.forEach((fn) => {
    try {
      fn(key, address);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

function formatAddress(data) {
  if (!data) return null;
  const a = data.address || {};
  const line1 = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(' ');
  const locality = a.suburb || a.neighbourhood || a.village || a.town || a.city || a.county;
  const region = a.state || a.region;
  const parts = [line1 || null, locality, region].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return data.display_name || null;
}

async function runRequest(lat, lng) {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  const url = `${ENDPOINT}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return formatAddress(await res.json());
}

async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length) {
    const { key, lat, lng, resolve } = queue.shift();
    try {
      const address = await runRequest(lat, lng);
      memoryCache[key] = { a: address, t: Date.now() };
      saveCache(memoryCache);
      notify(key, address);
      resolve(address);
    } catch {
      resolve(null);
    }
    inflight.delete(key);
  }
  draining = false;
}

export function lookupCached(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = roundKey(lat, lng);
  const hit = memoryCache[key];
  return hit ? hit.a : null;
}

export function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Promise.resolve(null);
  const key = roundKey(lat, lng);
  if (memoryCache[key]) return Promise.resolve(memoryCache[key].a);
  if (inflight.has(key)) return inflight.get(key);
  const promise = new Promise((resolve) => {
    queue.push({ key, lat, lng, resolve });
  });
  inflight.set(key, promise);
  drain();
  return promise;
}

export function subscribeGeocode(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function geocodeKey(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return roundKey(lat, lng);
}
