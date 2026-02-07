/** Normalize text: trim + collapse whitespace */
export function normText(v: any): string {
  if (v == null) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

/** Parse boolean from various Excel formats */
export function normBool(v: any): boolean {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['true', '1', 'yes', 'oui'].includes(s);
}

/** Parse price string to cents (integer). E.g. 890 -> 89000, 890.00 -> 89000 */
export function normPriceToCents(v: any): number {
  if (v == null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[^\d.,\-]/g, '').replace(',', '.'));
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Parse a pipe-separated list into a sorted array of trimmed strings */
export function normList(v: any): string[] {
  if (v == null || v === '') return [];
  return String(v)
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
    .sort();
}

/** Parse date from Excel serial number or string -> YYYY-MM-DD or ISO */
export function normDate(v: any): string | null {
  if (v == null || v === '') return null;
  // Excel serial date number
  if (typeof v === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // Try parsing as date
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s; // return raw if unparseable
}

/** Normalize integer (stock_qty, days, etc.) */
export function normInt(v: any): number | null {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

/** Deep-equal comparison for sorted arrays */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}
