/** Traccar maintenance `type` is a position-attribute key; start/period are stored as raw longs. */

const DISTANCE_KEYS = new Set(['odometer', 'serviceOdometer', 'tripOdometer', 'obdOdometer']);

export function maintenanceKind(type) {
  if (!type) return 'raw';
  if (type.endsWith('Time')) return 'calendar';
  if (DISTANCE_KEYS.has(type)) return 'distance';
  if (type === 'hours') return 'hours';
  return 'raw';
}

/** Human-readable start for table cells */
export function formatMaintenanceStart(type, start) {
  if (start == null || start === '') return '—';
  const k = maintenanceKind(type);
  if (k === 'calendar') {
    const d = new Date(Number(start));
    return Number.isNaN(d.getTime()) ? String(start) : d.toLocaleDateString();
  }
  if (k === 'distance') return `${(Number(start) / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} km`;
  if (k === 'hours') return `${(Number(start) / 3600000).toLocaleString(undefined, { maximumFractionDigits: 2 })} h`;
  return String(start);
}

export function formatMaintenancePeriod(type, period) {
  if (period == null || period === '') return '—';
  const k = maintenanceKind(type);
  if (k === 'calendar') return `${(Number(period) / 86400000).toLocaleString(undefined, { maximumFractionDigits: 2 })} days`;
  if (k === 'distance') return `${(Number(period) / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} km`;
  if (k === 'hours') return `${(Number(period) / 3600000).toLocaleString(undefined, { maximumFractionDigits: 2 })} h`;
  return String(period);
}

/**
 * Build API payload from dialog fields.
 * @param {'calendar'|'distance'|'hours'|'raw'} kind
 */
export function encodeMaintenanceValues(kind, { startStr, periodStr }) {
  const s = String(startStr ?? '').trim();
  const p = String(periodStr ?? '').trim();
  if (kind === 'calendar') {
    const startMs = new Date(`${s}T00:00:00`).getTime();
    const days = Number(p);
    if (!Number.isFinite(startMs) || !Number.isFinite(days)) throw new Error('Invalid date or days');
    return { start: startMs, period: Math.round(days * 86400000) };
  }
  if (kind === 'distance') {
    const kmS = Number(s);
    const kmP = Number(p);
    if (!Number.isFinite(kmS) || !Number.isFinite(kmP)) throw new Error('Enter start and interval in kilometers');
    return { start: Math.round(kmS * 1000), period: Math.round(kmP * 1000) };
  }
  if (kind === 'hours') {
    const hS = Number(s);
    const hP = Number(p);
    if (!Number.isFinite(hS) || !Number.isFinite(hP)) throw new Error('Enter start and interval in engine hours');
    return { start: Math.round(hS * 3600000), period: Math.round(hP * 3600000) };
  }
  const nS = Number(s);
  const nP = Number(p);
  if (!Number.isFinite(nS) || !Number.isFinite(nP)) throw new Error('Enter numeric start and period (raw server units)');
  return { start: Math.round(nS), period: Math.round(nP) };
}

/** Decode API values to dialog strings for a given kind */
export function decodeMaintenanceValues(kind, start, period) {
  if (kind === 'calendar') {
    const d = new Date(Number(start));
    const dateStr = Number.isNaN(d.getTime())
      ? ''
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const days = Number(period) / 86400000;
    return { startStr: dateStr, periodStr: Number.isFinite(days) ? String(Math.round(days * 1000) / 1000) : '' };
  }
  if (kind === 'distance') {
    return {
      startStr: start != null ? String(Number(start) / 1000) : '',
      periodStr: period != null ? String(Number(period) / 1000) : '',
    };
  }
  if (kind === 'hours') {
    return {
      startStr: start != null ? String(Number(start) / 3600000) : '',
      periodStr: period != null ? String(Number(period) / 3600000) : '',
    };
  }
  return {
    startStr: start != null ? String(start) : '',
    periodStr: period != null ? String(period) : '',
  };
}

export const MAINTENANCE_TYPE_OPTIONS = [
  { value: 'odometer', label: 'Odometer (distance)' },
  { value: 'serviceOdometer', label: 'Service odometer (distance)' },
  { value: 'tripOdometer', label: 'Trip odometer (distance)' },
  { value: 'hours', label: 'Engine hours' },
  { value: 'deviceTime', label: 'Device time (calendar)' },
  { value: 'fixTime', label: 'Fix time (calendar)' },
  { value: 'serverTime', label: 'Server time (calendar)' },
];
