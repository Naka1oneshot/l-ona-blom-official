import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, any>[];
}

/**
 * Parse an xlsx file buffer and return the rows from the expected sheet.
 */
export function parseXlsx(buffer: ArrayBuffer, expectedSheet: string): ParsedSheet {
  const wb = XLSX.read(buffer, { type: 'array' });

  // Find sheet (case-insensitive)
  const sheetName = wb.SheetNames.find(
    n => n.toLowerCase() === expectedSheet.toLowerCase()
  );
  if (!sheetName) {
    throw new Error(
      `Feuille "${expectedSheet}" introuvable. Feuilles disponibles : ${wb.SheetNames.join(', ')}`
    );
  }

  const ws = wb.Sheets[sheetName];
  const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (jsonRows.length === 0) {
    throw new Error('Le fichier est vide (aucune ligne de données).');
  }

  // Normalize header keys (trim)
  const headers = Object.keys(jsonRows[0]).map(h => h.trim());
  const rows = jsonRows.map(row => {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k.trim()] = v;
    }
    return clean;
  });

  return { headers, rows };
}
