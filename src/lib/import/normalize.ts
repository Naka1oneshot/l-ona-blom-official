/** Normalize text: trim + collapse whitespace */
export function normText(v: any): string {
  if (v == null) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

/** Parse boolean from various Excel formats. Returns null if unrecognizable. */
export function parseBool(v: any): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  if (v == null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'yes', 'oui', 'vrai'].includes(s)) return true;
  if (['false', '0', 'no', 'non', 'faux'].includes(s)) return false;
  return null;
}

/** Shortcut: parseBool defaulting to false */
export function normBool(v: any): boolean {
  return parseBool(v) ?? false;
}

/** Robust number parser handling Excel numbers, strings, comma decimals */
export function parseNumber(v: any): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  let s = String(v).trim().replace(/[¤$€£¥\s]/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Parse price string to cents (integer). E.g. 890 -> 89000, 890.00 -> 89000 */
export function normPriceToCents(v: any): number {
  const n = parseNumber(v);
  if (n == null) return 0;
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
  if (typeof v === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

/** Normalize integer (stock_qty, days, etc.) */
export function normInt(v: any): number | null {
  const n = parseNumber(v);
  return n == null ? null : Math.round(n);
}

/** Deep-equal comparison for sorted arrays */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/**
 * Normalize a header string for fuzzy matching:
 * lowercase, remove accents, remove parentheses content, collapse whitespace, trim
 */
export function normalizeHeader(h: string): string {
  return h
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parenthetical
    .replace(/[^a-z0-9]/g, ' ') // non-alnum -> space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve a column value from a raw row using normalized header matching.
 * Accepts multiple alias strings. Each alias is normalized and compared
 * against normalized versions of the actual keys in the row.
 */
export function colFuzzy(raw: Record<string, any>, ...aliases: string[]): any {
  // Build a normalized map of row keys
  const normMap = new Map<string, string>(); // normalizedKey -> originalKey
  for (const k of Object.keys(raw)) {
    normMap.set(normalizeHeader(k), k);
  }

  for (const alias of aliases) {
    const norm = normalizeHeader(alias);
    const origKey = normMap.get(norm);
    if (origKey != null) {
      const v = raw[origKey];
      if (v !== '' && v != null) return v;
    }
  }
  return undefined;
}
