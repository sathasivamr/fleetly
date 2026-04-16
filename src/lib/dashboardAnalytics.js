// Aggregate Traccar report APIs for dashboard charts (replaces static mock series).
import { api } from '@/lib/api';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Per-day fleet activity from summary report: distance-based buckets per device.
 */
export async function fetchFleetStatusSeries(deviceIds = []) {
  if (!deviceIds.length) {
    return [];
  }
  const now = new Date();
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const from = startOfDay(day);
    const to = endOfDay(day);
    let rows = [];
    try {
      rows = (await api.reports.summary({ from, to, deviceId: deviceIds })) || [];
    } catch {
      rows = [];
    }
    let active = 0;
    let idle = 0;
    let stopped = 0;
    for (const row of rows) {
      const d = Number(row.distance) || 0;
      if (d > 500) active += 1;
      else if (d === 0) stopped += 1;
      else idle += 1;
    }
    out.push({
      day: DAY_NAMES[day.getDay()],
      active,
      idle,
      stopped,
    });
  }
  return out;
}

/**
 * Monthly utilization heuristic from total distance vs a nominal target per device.
 */
export async function fetchUtilizationSeries(deviceIds = []) {
  if (!deviceIds.length) {
    return [];
  }
  const n = Math.max(deviceIds.length, 1);
  const out = [];
  for (let m = 5; m >= 0; m -= 1) {
    const end = new Date();
    end.setMonth(end.getMonth() - m);
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    const endM = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
    let rows = [];
    try {
      rows = (await api.reports.summary({
        from: start.toISOString(),
        to: endM.toISOString(),
        deviceId: deviceIds,
      })) || [];
    } catch {
      rows = [];
    }
    const totalDist = rows.reduce((s, r) => s + (Number(r.distance) || 0), 0);
    const utilization = Math.min(100, Math.round((totalDist / n / 200000) * 100));
    out.push({
      month: MONTH_NAMES[end.getMonth()],
      utilization,
      target: 75,
    });
  }
  return out;
}

/**
 * Weekly spentFuel (liters) from summary — Traccar does not provide currency; UI labels as fuel volume.
 */
export async function fetchFuelVolumeSeries(deviceIds = []) {
  if (!deviceIds.length) {
    return [];
  }
  const out = [];
  for (let w = 5; w >= 0; w -= 1) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const endWeek = new Date(end);
    endWeek.setHours(23, 59, 59, 999);
    let rows = [];
    try {
      rows = (await api.reports.summary({
        from: start.toISOString(),
        to: endWeek.toISOString(),
        deviceId: deviceIds,
      })) || [];
    } catch {
      rows = [];
    }
    const liters = rows.reduce((s, r) => s + (Number(r.spentFuel) || 0), 0);
    out.push({
      week: `W${6 - w + 1}`,
      cost: Math.round(liters * 100) / 100,
    });
  }
  return out;
}

export function computeDashboardKpis(vehicles = [], alerts = [], maintenanceRows = []) {
  const total = vehicles.length;
  const active = vehicles.filter((v) => v.status === 'moving').length;
  const idle = vehicles.filter((v) => v.status === 'idle').length;
  const startOfToday = startOfDay(new Date());
  const alertsToday = alerts.filter((a) => a.time && new Date(a.time) >= new Date(startOfToday)).length;
  const maintenanceDue = maintenanceRows.filter((m) => m.status !== 'completed').length;

  let avgUtil = 0;
  if (total > 0) {
    const moving = vehicles.filter((v) => v.status === 'moving' || v.status === 'idle').length;
    avgUtil = Math.round((moving / total) * 100);
  }

  return {
    totalVehicles: total,
    activeVehicles: active,
    idleVehicles: idle,
    alertsToday,
    maintenanceDue,
    avgUtilization: avgUtil,
  };
}
