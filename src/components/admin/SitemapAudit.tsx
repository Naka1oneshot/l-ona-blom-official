import React, { useEffect, useState } from 'react';
import { Globe, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface UrlCheckResult {
  url: string;
  path: string;
  lastmod?: string;
  priority?: string;
  slugIssue?: string; // e.g. spaces, uppercase
}

const SITEMAP_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;

function parseSitemapXml(xml: string): SitemapUrl[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const urlEls = doc.querySelectorAll('url');
  const urls: SitemapUrl[] = [];
  urlEls.forEach(el => {
    const loc = el.querySelector('loc')?.textContent || '';
    const lastmod = el.querySelector('lastmod')?.textContent || undefined;
    const changefreq = el.querySelector('changefreq')?.textContent || undefined;
    const priority = el.querySelector('priority')?.textContent || undefined;
    if (loc) urls.push({ loc, lastmod, changefreq, priority });
  });
  return urls;
}

function analyzeUrl(entry: SitemapUrl): UrlCheckResult {
  const path = new URL(entry.loc).pathname;
  const result: UrlCheckResult = {
    url: entry.loc,
    path,
    lastmod: entry.lastmod,
    priority: entry.priority,
  };

  // Check for spaces or uppercase in path (excluding the domain)
  if (path !== '/' && /[A-Z]/.test(path)) {
    result.slugIssue = 'Majuscules dans l\'URL';
  }
  if (/ |%20/.test(entry.loc)) {
    result.slugIssue = 'Espaces dans l\'URL';
  }
  // Check for accented characters
  if (/[àâäéèêëïîôùûüÿçœæ]/.test(decodeURIComponent(path))) {
    result.slugIssue = (result.slugIssue ? result.slugIssue + ' + ' : '') + 'Accents dans l\'URL';
  }

  return result;
}

const SitemapAudit: React.FC = () => {
  const [urls, setUrls] = useState<UrlCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchSitemap = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(SITEMAP_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const entries = parseSitemapXml(xml);
      setUrls(entries.map(analyzeUrl));
      setFetched(true);
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement du sitemap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSitemap(); }, []);

  const issueUrls = urls.filter(u => u.slugIssue);
  const staticUrls = urls.filter(u => !u.path.includes('/', 2)); // top-level paths
  const dynamicUrls = urls.filter(u => u.path.split('/').length > 2);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe size={18} /> Sitemap ({urls.length} URLs)
          </CardTitle>
          <div className="flex items-center gap-2">
            <a
              href={SITEMAP_ENDPOINT}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Voir le XML <ExternalLink size={12} />
            </a>
            <Button variant="ghost" size="sm" onClick={fetchSitemap} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {fetched && !error && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                {issueUrls.length === 0 ? (
                  <CheckCircle2 size={16} className="text-primary" />
                ) : (
                  <AlertTriangle size={16} className="text-destructive" />
                )}
                <span className="font-medium">{issueUrls.length} problème{issueUrls.length !== 1 ? 's' : ''} d'URL</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{staticUrls.length} statiques</Badge>
              <Badge variant="outline" className="font-mono text-xs">{dynamicUrls.length} dynamiques</Badge>
            </div>

            {/* Issues table */}
            {issueUrls.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Problème</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issueUrls.map(u => (
                    <TableRow key={u.url}>
                      <TableCell className="font-mono text-xs break-all">{u.path}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-[10px]">{u.slugIssue}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* All URLs list */}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Voir toutes les URLs ({urls.length})
              </summary>
              <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chemin</TableHead>
                      <TableHead>Dernière MAJ</TableHead>
                      <TableHead>Priorité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urls.map(u => (
                      <TableRow key={u.url}>
                        <TableCell className="font-mono text-xs">{u.path}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.lastmod || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.priority || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SitemapAudit;
