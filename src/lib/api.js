// Traccar REST client.
// Dev: /api is proxied to VITE_TRACCAR_URL (vite.config.js).
// Production: set VITE_TRACCAR_URL at build time. If the SPA is opened on the *same origin*
// (e.g. UI at https://traccar.example.com and API on that host), we use relative /api so
// session cookies are always same-origin. If the UI is on another host (e.g. Firebase),
// we use the full Traccar URL (CORS + SameSite=None on the server).
import { ApiError } from '@/lib/apiError';

function apiBase() {
  if (import.meta.env.DEV) return '/api';
  const raw = import.meta.env.VITE_TRACCAR_URL;
  if (!raw || !String(raw).trim()) return '/api';
  const trimmed = String(raw).trim();
  try {
    if (typeof window !== 'undefined') {
      const apiOrigin = new URL(trimmed).origin;
      if (apiOrigin === window.location.origin) {
        return '/api';
      }
    }
  } catch {
    /* invalid VITE_TRACCAR_URL */
  }
  return `${trimmed.replace(/\/$/, '')}/api`;
}

const BASE = apiBase();

export const OPENID_AUTH_URL = `${BASE}/session/openid/auth`;

function qs(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach((item) => search.append(k, item));
    else search.append(k, v);
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

function parseErrorBodyText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFromBody(body, fallback) {
  if (body == null) return fallback;
  if (typeof body === 'string') return body || fallback;
  if (typeof body === 'object' && body.message) return String(body.message);
  return fallback;
}

/**
 * @param {string} path
 * @param {RequestInit} opts
 */
export async function request(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(opts.body && !opts.headers?.['Content-Type']
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(opts.headers || {}),
      },
      ...opts,
    });
  } catch (e) {
    const err = new ApiError(e.message || 'Network error', { status: 0 });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fleet-api-error', { detail: err }));
    }
    throw err;
  }

  if (!res.ok) {
    if (res.status === 401 && res.headers.get('WWW-Authenticate') === 'TOTP') {
      const err = new ApiError('TOTP required', { status: 401, needsTotp: true });
      throw err;
    }
    const text = await res.text().catch(() => '');
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? parseErrorBodyText(text) : text;
    const msg = messageFromBody(body, `${res.status} ${res.statusText}`);
    const err = new ApiError(msg, { status: res.status, body, raw: text });

    if (typeof window !== 'undefined' && res.status === 403) {
      window.dispatchEvent(new CustomEvent('fleet-api-error', { detail: err }));
    }

    const isLoginPost =
      path === '/session' &&
      (opts.method === 'POST' || opts.method === 'post');
    const isTokenLoginAttempt = path.includes('token=');
    const pathOnly = path.split('?')[0];
    const isSessionProbe =
      (!opts.method || opts.method === 'GET') && pathOnly === '/session';
    const isSessionLogout =
      String(opts.method || '').toUpperCase() === 'DELETE' && pathOnly === '/session';
    if (
      typeof window !== 'undefined' &&
      res.status === 401 &&
      !isLoginPost &&
      !isTokenLoginAttempt &&
      !isSessionProbe &&
      !isSessionLogout
    ) {
      window.dispatchEvent(new CustomEvent('fleet-session-expired'));
    }

    throw err;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  session: {
    get: () => request('/session'),
    login: (email, password, code) => {
      const body = new URLSearchParams({ email, password });
      if (code) body.append('code', code);
      return request('/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    },
    /** Token-based session (query string). */
    loginWithToken: (token) =>
      request(`/session?token=${encodeURIComponent(token)}`),
    /**
     * Logout. On static hosts (e.g. Firebase) cross-origin cookies may not reach Traccar, so DELETE
     * can return 401 — we still treat that as OK and clear the UI. Same-origin deploys get a real 204.
     */
    logout: async () => {
      let res;
      try {
        res = await fetch(`${BASE}/session`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
      } catch (e) {
        return null;
      }
      if (res.ok || res.status === 401) return null;
      const text = await res.text().catch(() => '');
      const err = new ApiError(text || `${res.status}`, { status: res.status, raw: text });
      throw err;
    },
    server: () => request('/server'),
    /** Impersonate user (admin). */
    becomeUser: (userId) => request(`/session/${userId}`, { method: 'POST' }),
    generateToken: (expirationIso) =>
      request('/session/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ expiration: expirationIso }).toString(),
      }),
  },

  server: {
    get: () => request('/server'),
    update: (payload) =>
      request('/server', { method: 'PUT', body: JSON.stringify(payload) }),
    reboot: () => request('/server/reboot', { method: 'POST' }),
    geocode: (params) => request(`/server/geocode${qs(params)}`),
  },

  users: {
    list: (params) => request(`/users${qs(params)}`),
    get: (id) => request(`/users/${id}`),
    create: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
    register: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
    totpSetup: () => request('/users/totp', { method: 'POST' }),
  },

  password: {
    reset: (email) =>
      request('/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: String(email) }).toString(),
      }),
    update: (token, password) =>
      request('/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: String(token), password: String(password) }).toString(),
      }),
  },

  permissions: {
    list: () => request('/permissions'),
    update: (payload) =>
      request('/permissions', { method: 'PUT', body: JSON.stringify(payload) }),
  },

  devices: {
    list: (params) => request(`/devices${qs(params)}`),
    get: (id) => request(`/devices/${id}`),
    create: (payload) => request('/devices', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/devices/${id}`, { method: 'DELETE' }),
    getAccumulators: (deviceId) => request(`/devices/${deviceId}/accumulators`),
    putAccumulators: (deviceId, payload) =>
      request(`/devices/${deviceId}/accumulators`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  positions: {
    list: (params) => request(`/positions${qs(params)}`),
  },

  drivers: {
    list: (params) => request(`/drivers${qs(params)}`),
    get: (id) => request(`/drivers/${id}`),
    create: (payload) => request('/drivers', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),
  },

  maintenance: {
    list: (params) => request(`/maintenance${qs(params)}`),
    get: (id) => request(`/maintenance/${id}`),
    create: (payload) => request('/maintenance', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/maintenance/${id}`, { method: 'DELETE' }),
  },

  groups: {
    list: (params) => request(`/groups${qs(params)}`),
    get: (id) => request(`/groups/${id}`),
    create: (payload) => request('/groups', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  },

  geofences: {
    list: (params) => request(`/geofences${qs(params)}`),
    get: (id) => request(`/geofences/${id}`),
    create: (payload) => request('/geofences', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/geofences/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/geofences/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list: (params) => request(`/notifications${qs(params)}`),
    get: (id) => request(`/notifications/${id}`),
    create: (payload) =>
      request('/notifications', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
    types: () => request('/notifications/types'),
    /** Notificator types that support announcements (e.g. email, telegram). */
    notificators: (params) => request(`/notifications/notificators${qs(params)}`),
    /** POST body: { subject, body } — query repeats userId for each recipient. */
    send: (notificator, userIds, body) => {
      const search = new URLSearchParams();
      (userIds || []).forEach((uid) => search.append('userId', uid));
      const q = search.toString();
      return request(
        `/notifications/send/${encodeURIComponent(notificator)}${q ? `?${q}` : ''}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
    },
  },

  commands: {
    list: (params) => request(`/commands${qs(params)}`),
    get: (id) => request(`/commands/${id}`),
    create: (payload) => request('/commands', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/commands/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/commands/${id}`, { method: 'DELETE' }),
    send: (payload) => request('/commands/send', { method: 'POST', body: JSON.stringify(payload) }),
    /** Command type definitions for building saved commands (same as classic Traccar). */
    types: () => request('/commands/types'),
  },

  calendars: {
    list: (params) => request(`/calendars${qs(params)}`),
    get: (id) => request(`/calendars/${id}`),
    create: (payload) => request('/calendars', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/calendars/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/calendars/${id}`, { method: 'DELETE' }),
  },

  computedAttributes: {
    list: (params) => request(`/attributes/computed${qs(params)}`),
    get: (id) => request(`/attributes/computed/${id}`),
    create: (payload) =>
      request('/attributes/computed', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/attributes/computed/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/attributes/computed/${id}`, { method: 'DELETE' }),
  },

  events: {
    get: (id) => request(`/events/${id}`),
  },

  reports: {
    trips: (params) => request(`/reports/trips${qs(params)}`),
    events: (params) => request(`/reports/events${qs(params)}`),
    stops: (params) => request(`/reports/stops${qs(params)}`),
    summary: (params) => request(`/reports/summary${qs(params)}`),
    route: (params) => request(`/reports/route${qs(params)}`),
    combined: (params) => request(`/reports/combined${qs(params)}`),
    chart: (params) => request(`/reports/chart${qs(params)}`),
    statistics: (params) => request(`/reports/statistics${qs(params)}`),
    geofences: (params) => request(`/reports/geofences${qs(params)}`),
  },

  audit: {
    list: (params) => request(`/audit${qs(params)}`),
  },

  logs: {
    list: (params) => request(`/logs${qs(params)}`),
  },

  /** Scheduled report definitions (GET /reports, POST /reports, …). */
  scheduledReports: {
    list: () => request('/reports'),
    get: (id) => request(`/reports/${id}`),
    create: (payload) => request('/reports', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
  },
};

function socketUrl() {
  if (import.meta.env.DEV) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/api/socket`;
  }
  const t = import.meta.env.VITE_TRACCAR_URL;
  if (t && String(t).trim()) {
    try {
      const u = new URL(String(t).trim());
      if (typeof window !== 'undefined' && u.origin === window.location.origin) {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProto}//${window.location.host}/api/socket`;
      }
      const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${u.host}/api/socket`;
    } catch {
      /* fall through */
    }
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/socket`;
}

export function openSocket(onMessage) {
  const socket = new WebSocket(socketUrl());
  socket.addEventListener('message', (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      /* ignore malformed frames */
    }
  });
  return socket;
}
