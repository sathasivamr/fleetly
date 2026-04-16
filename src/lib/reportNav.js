/**
 * Report navigation helpers — same URL rules as classic Traccar (preserve device/group filters).
 */

export function buildReportPath(path, search) {
  const source = typeof search === 'string' ? new URLSearchParams(search.replace(/^\?/, '')) : search;
  const deviceIds = source.getAll('deviceId');
  const groupIds = source.getAll('groupId');
  if (!deviceIds.length && !groupIds.length) return path;
  const params = new URLSearchParams();
  if (path === '/reports/chart' || path === '/reports/route' || path === '/replay') {
    const first = deviceIds[0];
    if (first != null) params.append('deviceId', first);
  } else {
    deviceIds.forEach((id) => params.append('deviceId', id));
    groupIds.forEach((id) => params.append('groupId', id));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** All report destinations for tab bar + parity with Traccar reports menu */
export const REPORT_TABS = [
  { path: '/reports', label: 'Overview', end: true, type: 'index' },
  { path: '/reports/combined', label: 'Combined', type: 'route' },
  { path: '/reports/events', label: 'Events', type: 'route' },
  { path: '/reports/geofences', label: 'Geofences', type: 'route' },
  { path: '/reports/trips', label: 'Trips', type: 'route' },
  { path: '/reports/stops', label: 'Stops', type: 'route' },
  { path: '/reports/summary', label: 'Summary', type: 'route' },
  { path: '/reports/chart', label: 'Chart', type: 'route' },
  { path: '/reports/route', label: 'Route', type: 'route' },
  { path: '/replay', label: 'Replay', type: 'replay' },
  { path: '/reports/logs', label: 'Logs', type: 'static' },
  { path: '/reports/scheduled', label: 'Scheduled', type: 'static', hideWhenReadonly: true },
  { path: '/reports/statistics', label: 'Statistics', type: 'static', admin: true },
  { path: '/reports/audit', label: 'Audit', type: 'static', admin: true },
];
