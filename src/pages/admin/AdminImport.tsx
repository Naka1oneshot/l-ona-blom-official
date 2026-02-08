import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, MinusCircle, Download, History, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseXlsx } from '@/lib/import/parseXlsx';
import { previewProductImport, executeProductImport } from '@/lib/import/productEngine';
import { previewCollectionImport, executeCollectionImport } from '@/lib/import/collectionEngine';
import type { ImportReport, PreviewRow, ImportStats, RowMessage } from '@/lib/import/types';
import * as XLSX from 'xlsx';

const STATUS_CONFIG = {
  CREATE: { icon: CheckCircle, color: 'text-green-600', label: 'Création' },
  UPDATE: { icon: AlertTriangle, color: 'text-amber-500', label: 'Mise à jour' },
  NO_CHANGE: { icon: MinusCircle, color: 'text-muted-foreground', label: 'Inchangé' },
  ERROR: { icon: XCircle, color: 'text-destructive', label: 'Erreur' },
};

interface ImportRun {
  id: string;
  type: string;
  filename: string;
  stats_json: ImportStats;
  created_at: string;
}

const AdminImport = () => {
  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Import Excel</h1>
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="bg-transparent gap-1 mb-8">
          <TabsTrigger value="products" className="text-xs tracking-[0.15em] uppercase font-body px-5 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none border border-foreground/20 data-[state=active]:border-foreground transition-all">
            <FileSpreadsheet size={14} className="mr-2" /> Produits
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs tracking-[0.15em] uppercase font-body px-5 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none border border-foreground/20 data-[state=active]:border-foreground transition-all">
            <FileSpreadsheet size={14} className="mr-2" /> Collections
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs tracking-[0.15em] uppercase font-body px-5 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none border border-foreground/20 data-[state=active]:border-foreground transition-all">
            <History size={14} className="mr-2" /> Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ImportTab type="products" sheetNames={['Produits', 'products']} />
        </TabsContent>
        <TabsContent value="collections">
          <ImportTab type="collections" sheetNames={['Collections', 'collections']} />
        </TabsContent>
        <TabsContent value="history">
          <ImportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ─── Template Download ─── */
async function downloadProductTemplate() {
  const { data: cats } = await supabase.from('categories').select('name_fr, slug').order('sort_order');
  const catNames = (cats || []).map(c => c.name_fr);

  const headers = [
    'Référence Produit', 'Slug', 'Statut', 'Catégorie', 'Nom (FR)',
    'Description (FR)', 'Grille de tailles', 'Prix (EUR)',
    'Prix TU (EUR)', 'Prix XS (EUR)', 'Prix S (EUR)', 'Prix M (EUR)', 'Prix L (EUR)',
    'Prix XL (EUR)', 'Prix 2XL (EUR)', 'Prix 3XL (EUR)',
    'Couleurs (séparées par |)', 'Matières - tags (séparées par |)',
    'Matières (FR - texte)', 'Entretien (FR)', 'Histoire (FR)',
    'Tressages (séparées par |)', 'Couleurs de tressage (séparées par |)',
    'Sur commande', 'Délai min (jours)',
    'Délai max (jours)', 'Précommande', 'Date expédition estimée (YYYY-MM-DD)',
    'Sur mesure', 'Stock (quantité)', 'Encarts narratifs (FR - Scrollytelling)',
  ];

  const exampleRow: Record<string, string> = {
    'Référence Produit': 'PRO001',
    'Slug': 'ma-robe-exemple',
    'Statut': 'Brouillon',
    'Catégorie': catNames[0] || 'Robes',
    'Nom (FR)': 'Ma Robe Exemple',
    'Description (FR)': 'Une description…',
    'Grille de tailles': 'XS,S,M,L,XL,2XL,3XL',
    'Prix (EUR)': '350',
    'Prix XS (EUR)': '350',
    'Prix S (EUR)': '350',
    'Prix M (EUR)': '350',
    'Prix L (EUR)': '370',
    'Prix XL (EUR)': '370',
    'Prix 2XL (EUR)': '390',
    'Prix 3XL (EUR)': '390',
    'Sur commande': 'Non',
    'Précommande': 'Non',
    'Sur mesure': 'Non',
  };

  const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });

  // Add data validation for Statut and Catégorie columns
  // Statut = column C (index 2), Catégorie = column D (index 3)
  if (catNames.length > 0) {
    ws['!dataValidation'] = ws['!dataValidation'] || [];
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produits');
  XLSX.writeFile(wb, 'modele-produits.xlsx');
}

async function downloadCollectionTemplate() {
  const headers = [
    'Référence Collection', 'Slug', 'Titre (FR)', 'Sous-titre (FR)',
    'Narratif (FR)', 'Date de publication (YYYY-MM-DD)',
    'Tags (séparés par |)', 'Produits (slugs séparés par |)',
  ];

  const exampleRow: Record<string, string> = {
    'Référence Collection': 'COL001',
    'Slug': 'ma-collection-exemple',
    'Titre (FR)': 'Ma Collection',
    'Sous-titre (FR)': 'Sous-titre',
    'Narratif (FR)': 'Le récit de la collection…',
    'Date de publication (YYYY-MM-DD)': '2026-03-01',
  };

  const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Collections');
  XLSX.writeFile(wb, 'modele-collections.xlsx');
}

/* ─── Import Tab Component ─── */
function ImportTab({ type, sheetNames }: { type: 'products' | 'collections'; sheetNames: string[] }) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [importWarnings, setImportWarnings] = useState<RowMessage[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setReport(null);
    setDone(false);
    setImportWarnings([]);
    setLoading(true);
    try {
      const buffer = await f.arrayBuffer();
      // Try multiple sheet names
      let rows: Record<string, any>[] | null = null;
      let lastError = '';
      for (const name of sheetNames) {
        try {
          const result = parseXlsx(buffer, name);
          rows = result.rows;
          break;
        } catch (e: any) {
          lastError = e.message;
        }
      }
      if (!rows) throw new Error(lastError || `Feuille introuvable (attendue: ${sheetNames.join(' ou ')})`);

      const r = type === 'products'
        ? await previewProductImport(rows)
        : await previewCollectionImport(rows);
      setReport(r);
      // Auto-select actionable rows (CREATE or UPDATE)
      const actionable = new Set<number>();
      r.rows.forEach((row, i) => {
        if (row.status === 'CREATE' || row.status === 'UPDATE') actionable.add(i);
      });
      setSelectedRows(actionable);
    } catch (err: any) {
      toast.error(err.message || 'Erreur de lecture du fichier');
    } finally {
      setLoading(false);
    }
  }, [type, sheetNames]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) handleFile(f);
    else toast.error('Fichier .xlsx attendu');
  }, [handleFile]);

  const handleImport = async () => {
    if (!report || !user) return;
    setImporting(true);
    setProgress(null);
    try {
      const onProgress = (current: number, total: number, label: string) => {
        setProgress({ current, total, label });
      };

      // Filter only selected rows
      const rowsToImport = report.rows.filter((_, i) => selectedRows.has(i));

      let warnings: RowMessage[] = [];
      if (type === 'products') {
        warnings = await executeProductImport(rowsToImport, onProgress);
      } else {
        warnings = await executeCollectionImport(rowsToImport, onProgress);
      }

      setImportWarnings(warnings);

      await supabase.from('import_runs').insert({
        type,
        filename: file?.name || 'import.xlsx',
        user_id: user.id,
        stats_json: report.stats as any,
        report_json: report.rows.map(r => ({
          row: r.rowIndex, ref: r.referenceCode, status: r.status,
          messages: r.messages, changes: r.changes,
        })) as any,
      });

      toast.success(`Import terminé${warnings.length > 0 ? ` (${warnings.length} avertissements)` : ''}`);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const json = JSON.stringify(report.rows.map(r => ({
      ligne: r.rowIndex, reference: r.referenceCode, slug: r.slug,
      label: r.label, status: r.status,
      changes: r.changes?.join(', ') || '',
      messages: r.messages.map(m => `[${m.severity}] ${m.message}`).join(' | '),
    })), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-import-${type}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setReport(null); setDone(false); setImportWarnings([]); setSelectedRows(new Set()); };

  const hasErrors = report && report.stats.errors > 0;
  const selectedActionCount = report ? report.rows.filter((r, i) => selectedRows.has(i) && (r.status === 'CREATE' || r.status === 'UPDATE')).length : 0;
  const hasActions = selectedActionCount > 0;
  const actionableCount = report ? report.rows.filter(r => r.status === 'CREATE' || r.status === 'UPDATE').length : 0;

  const toggleRow = (i: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (!report) return;
    const actionableIndices = report.rows.map((r, i) => (r.status === 'CREATE' || r.status === 'UPDATE') ? i : -1).filter(i => i >= 0);
    const allSelected = actionableIndices.every(i => selectedRows.has(i));
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(actionableIndices));
    }
  };

  return (
    <div className="space-y-6">
      {/* Template download */}
      <div className="flex gap-3">
        <button
          onClick={() => type === 'products' ? downloadProductTemplate() : downloadCollectionTemplate()}
          className="flex items-center gap-2 border border-foreground/20 px-5 py-2 text-[10px] tracking-[0.15em] uppercase font-body hover:border-foreground transition-colors"
        >
          <Download size={14} /> Télécharger le modèle {type === 'products' ? 'Produits' : 'Collections'}
        </button>
      </div>

      {!report && !loading && (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-foreground/20 hover:border-primary/50 transition-colors p-12 text-center cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx';
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFile(f);
            };
            input.click();
          }}
        >
          <Upload size={32} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-body text-muted-foreground">
            Glissez un fichier <strong>.xlsx</strong> ici ou cliquez pour sélectionner
          </p>
          <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground/60 mt-2">
            Feuille attendue : "{sheetNames[0]}"
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
          <span className="ml-3 text-sm font-body text-muted-foreground">Analyse en cours…</span>
        </div>
      )}

      {report && (
        <>
          {/* Stats bar */}
          <div className="flex flex-wrap gap-4 p-4 border border-border bg-muted/30">
            <StatBadge count={report.stats.created} label="Créations" color="text-green-600" />
            <StatBadge count={report.stats.updated} label="Mises à jour" color="text-amber-500" />
            <StatBadge count={report.stats.no_change} label="Inchangés" color="text-muted-foreground" />
            <StatBadge count={report.stats.errors} label="Erreurs" color="text-destructive" />
            {report.stats.warnings > 0 && (
              <StatBadge count={report.stats.warnings} label="Avertissements" color="text-amber-400" />
            )}
          </div>

          {/* Preview table */}
          <div className="border border-border overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm font-body">
              <thead className="sticky top-0 bg-background border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2 text-center w-10">
                    <input
                      type="checkbox"
                      checked={actionableCount > 0 && selectedRows.size >= actionableCount}
                      onChange={toggleAll}
                      className="accent-primary"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] tracking-wider uppercase text-muted-foreground">Ligne</th>
                  <th className="px-3 py-2 text-left text-[10px] tracking-wider uppercase text-muted-foreground">Réf</th>
                  <th className="px-3 py-2 text-left text-[10px] tracking-wider uppercase text-muted-foreground">Slug</th>
                  <th className="px-3 py-2 text-left text-[10px] tracking-wider uppercase text-muted-foreground">Nom</th>
                  <th className="px-3 py-2 text-left text-[10px] tracking-wider uppercase text-muted-foreground">Statut</th>
                  <th className="px-3 py-2 text-left text-[10px] tracking-wider uppercase text-muted-foreground">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.rows.map((row, i) => {
                  const cfg = STATUS_CONFIG[row.status];
                  const Icon = cfg.icon;
                  const isActionable = row.status === 'CREATE' || row.status === 'UPDATE';
                  const isChecked = selectedRows.has(i);
                  return (
                    <tr key={i} className={`hover:bg-muted/20 ${!isChecked && isActionable ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-2 text-center">
                        {isActionable ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(i)}
                            className="accent-primary"
                          />
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{row.rowIndex}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.referenceCode}</td>
                      <td className="px-3 py-2 text-xs">{row.slug}</td>
                      <td className="px-3 py-2">{row.label}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.color}`}>
                          <Icon size={14} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.changes && row.changes.length > 0 && (
                          <span className="text-amber-500">{row.changes.join(', ')}</span>
                        )}
                        {row.messages.map((m, j) => (
                          <span key={j} className={`block ${m.severity === 'error' ? 'text-destructive' : 'text-amber-400'}`}>
                            {m.message}
                          </span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Import warnings */}
          {importWarnings.length > 0 && (
            <div className="border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
              <p className="text-[10px] tracking-[0.15em] uppercase font-body text-amber-500 mb-2">Avertissements de traduction</p>
              {importWarnings.map((w, i) => (
                <p key={i} className="text-xs font-body text-amber-400">{w.message}</p>
              ))}
            </div>
          )}

          {/* Progress */}
          {importing && progress && (
            <div className="flex items-center gap-3 p-4 border border-border bg-muted/30">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-sm font-body">
                Traduction & import : {progress.current}/{progress.total} — {progress.label}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!done && (
              <>
                <button
                  onClick={handleImport}
                  disabled={importing || !!hasErrors || !hasActions}
                  className="bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {importing ? 'Import & traduction en cours…' : `Lancer l'import (${selectedActionCount} / ${actionableCount} sélectionnés)`}
                </button>
                <button onClick={reset} className="border border-foreground/20 px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:border-foreground transition-colors">
                  Annuler
                </button>
              </>
            )}
            {done && (
              <>
                <button onClick={downloadReport} className="flex items-center gap-2 border border-foreground/20 px-6 py-3 text-xs tracking-[0.2em] uppercase font-body hover:border-foreground transition-colors">
                  <Download size={14} /> Télécharger le rapport
                </button>
                <button onClick={reset} className="bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors">
                  Nouvel import
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Stat Badge ─── */
function StatBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-display ${color}`}>{count}</span>
      <span className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground">{label}</span>
    </div>
  );
}

/* ─── Import History ─── */
function ImportHistory() {
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    supabase
      .from('import_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRuns((data as unknown as ImportRun[]) || []);
        setLoading(false);
      });
  }, []);

  if (detail) {
    return (
      <div>
        <button onClick={() => setDetail(null)} className="flex items-center gap-2 text-xs tracking-wider uppercase font-body text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> Retour
        </button>
        <h3 className="text-display text-xl mb-4">Rapport — {detail.filename}</h3>
        <pre className="bg-muted/30 border border-border p-4 text-xs font-mono overflow-auto max-h-[600px] whitespace-pre-wrap">
          {JSON.stringify(detail.report_json, null, 2)}
        </pre>
      </div>
    );
  }

  if (loading) return <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin mx-auto mt-8" />;
  if (runs.length === 0) return <p className="text-sm text-muted-foreground font-body py-8 text-center">Aucun import effectué.</p>;

  return (
    <div className="border border-border divide-y divide-border">
      {runs.map(run => {
        const s = run.stats_json;
        return (
          <div key={run.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDetail(run)}>
            <div>
              <p className="text-sm font-body font-medium">{run.filename}</p>
              <p className="text-[10px] tracking-[0.1em] uppercase font-body text-muted-foreground">
                {run.type} · {new Date(run.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-3 text-xs font-body">
              {s.created > 0 && <span className="text-green-600">+{s.created}</span>}
              {s.updated > 0 && <span className="text-amber-500">~{s.updated}</span>}
              {s.errors > 0 && <span className="text-destructive">✕{s.errors}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminImport;
