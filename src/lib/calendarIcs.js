/** Build base64-encoded iCalendar data compatible with Traccar (ASCII). */

function formatLocalIcsDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/**
 * @param {{ name: string, frequency: 'DAILY'|'WEEKLY'|'MONTHLY', summary?: string }} opts
 */
export function buildSimpleCalendarData(opts) {
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const uid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-0000-0000-000000000000';
  let rrule = 'RRULE:FREQ=DAILY';
  if (opts.frequency === 'WEEKLY') rrule = 'RRULE:FREQ=WEEKLY;BYDAY=MO';
  if (opts.frequency === 'MONTHLY') rrule = 'RRULE:FREQ=MONTHLY;BYMONTHDAY=1';
  const summary = (opts.summary || opts.name || 'Schedule').replace(/\n/g, ' ');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fleetly//Traccar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART;TZID=${tzid}:${formatLocalIcsDate(start)}`,
    `DTEND;TZID=${tzid}:${formatLocalIcsDate(end)}`,
    rrule,
    `SUMMARY:${summary}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return btoa(lines.join('\n'));
}

/** Try to extract a title from base64 iCal for list previews */
export function previewCalendarLabel(dataB64) {
  if (!dataB64 || typeof dataB64 !== 'string') return '—';
  try {
    const text = typeof atob === 'function' ? atob(dataB64) : '';
    const sum = text.match(/^SUMMARY:(.+)$/m);
    if (sum) return sum[1].trim().slice(0, 80);
    return text.includes('BEGIN:VCALENDAR') ? 'Custom calendar' : '—';
  } catch {
    return 'Custom';
  }
}
