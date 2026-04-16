// Lightweight CSV export — no dependency. Quotes values containing commas, quotes, or newlines.

function escapeCell(value) {
  if (value == null) return '';
  const str = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * @param {Array<{key: string, label: string, format?: (row:any)=>any}>} columns
 * @param {Array<object>} rows
 */
export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell(c.format ? c.format(row) : row[c.key]))
        .join(','),
    )
    .join('\n');
  return `${header}\n${body}`;
}

export function downloadCsv(filename, columns, rows) {
  const csv = toCsv(columns, rows);
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
