export type ImportType = 'products' | 'collections';
export type RowStatus = 'CREATE' | 'UPDATE' | 'NO_CHANGE' | 'ERROR';
export type RowSeverity = 'error' | 'warning';

export interface RowMessage {
  severity: RowSeverity;
  message: string;
}

export interface PreviewRow {
  rowIndex: number;
  referenceCode: string;
  slug: string;
  label: string; // name_fr or title_fr for display
  status: RowStatus;
  messages: RowMessage[];
  data: Record<string, any>;
  changes?: string[]; // list of changed field names
}

export interface ImportStats {
  created: number;
  updated: number;
  no_change: number;
  errors: number;
  warnings: number;
}

export interface ImportReport {
  rows: PreviewRow[];
  stats: ImportStats;
}
