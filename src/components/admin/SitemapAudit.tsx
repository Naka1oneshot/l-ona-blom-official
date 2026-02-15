import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, Link2Off } from 'lucide-react';
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

type UrlStatus = 'ok' | 'slug-issue' | 'orphan' | 'checking';

interface UrlCheckResult {
  url: string;
  path: string;
  lastmod?: string;
  priority?: string;
  slugIssues: string[];
  status: UrlStatus;
}

const SITEMAP_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;

const KNOWN_STATIC_PATHS = new Set([
  '/', '/boutique', '/collections', '/actualites', '/a-propos',
  '/contact', '/faq', '/try-on', '/cgv', '/confidentialite',
  '/cookies', '/mentions-legales',
]);

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

function detectSlugIssues(path: string): string[] {
  if (path === '/') return [];
  const issues: string[] = [];
  if (/[A-Z]/.test(path)) issues.push('Majuscules');
  if (/ |%20/.test(path)) issues.push('Espaces');
  try {
    if (/[àâäéèêëïîôùûüÿçœæ]/i.test(decodeURIComponent(path))) issues.push('Accents');
  } catch {}
  return issues;
}

const SitemapAudit: React.FC = () => {
  const [urls, setUrls] = useState<UrlCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchAndValidate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sitemap + DB data in parallel
      const [sitemapRes, productsRes, collectionsRes, postsRes] = await Promise.all([
        fetch(SITEMAP_ENDPOINT),
        supabase.from('products').select('slug, status'),
        supabase.from('collections').select('slug, published_at'),
        supabase.from('posts').select('slug, published_at'),
      ]);

      if (!sitemapRes.ok) throw new Error(`Sitemap HTTP ${sitemapRes.status}`);
      const xml = await sitemapRes.text();
      const entries = parseSitemapXml(xml);

      // Build lookup sets for valid slugs
      const activeProductSlugs = new Set(
        (productsRes.data || []).filter(p => p.status === 'active').map(p => p.slug)
      );
      const publishedCollectionSlugs = new Set(
        (collectionsRes.data || []).filter(c => c.published_at).map(c => c.slug)
      );
      const publishedPostSlugs = new Set(
        (postsRes.data || []).filter(p => p.published_at).map(p => p.slug)
      );

      const results: UrlCheckResult[] = entries.map(entry => {
        const path = new URL(entry.loc).pathname;
        const slugIssues = detectSlugIssues(path);

        // Check if the path corresponds to a valid resource
        let status: UrlStatus = 'ok';

        if (KNOWN_STATIC_PATHS.has(path)) {
          // Known static route — always OK
        } else if (path.startsWith('/boutique/')) {
          const slug = decodeURIComponent(path.replace('/boutique/', ''));
          if (!activeProductSlugs.has(slug)) status = 'orphan';
        } else if (path.startsWith('/collections/')) {
          const slug = decodeURIComponent(path.replace('/collections/', ''));
          if (!publishedCollectionSlugs.has(slug)) status = 'orphan';
        } else if (path.startsWith('/actualites/')) {
          const slug = decodeURIComponent(path.replace('/actualites/', ''));
          if (!publishedPostSlugs.has(slug)) status = 'orphan';
        } else {
          // Unknown route pattern
          status = 'orphan';
        }

        if (slugIssues.length > 0) status = 'slug-issue';

        return { url: entry.loc, path, lastmod: entry.lastmod, priority: entry.priority, slugIssues, status };
      });

      setUrls(results);
      setFetched(true);
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAndValidate(); }, []);

  const issueUrls = urls.filter(u => u.status !== 'ok');
  const orphanUrls = urls.filter(u => u.status === 'orphan');
  const slugIssueUrls = urls.filter(u => u.status === 'slug-issue');
  const okUrls = urls.filter(u => u.status === 'ok');

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
              XML <ExternalLink size={12} />
            </a>
            <Button variant="ghost" size="sm" onClick={fetchAndValidate} disabled={loading}>
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
                <span className="font-medium">
                  {issueUrls.length === 0
                    ? 'Toutes les URLs sont valides'
                    : `${issueUrls.length} problème${issueUrls.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{okUrls.length} ✓ valides</Badge>
              {orphanUrls.length > 0 && (
                <Badge variant="destructive" className="text-xs">{orphanUrls.length} orphelines</Badge>
              )}
              {slugIssueUrls.length > 0 && (
                <Badge variant="destructive" className="text-xs">{slugIssueUrls.length} slug invalide</Badge>
              )}
            </div>

            {/* Orphan URLs — link to content that doesn't exist in DB */}
            {orphanUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Link2Off size={14} className="text-destructive" /> URLs orphelines (contenu introuvable en base)
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chemin</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orphanUrls.map(u => (
                      <TableRow key={u.url}>
                        <TableCell className="font-mono text-xs break-all">{u.path}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px]">Contenu introuvable</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Slug issues */}
            {slugIssueUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-destructive" /> Problèmes de slug
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chemin</TableHead>
                      <TableHead>Problèmes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slugIssueUrls.map(u => (
                      <TableRow key={u.url}>
                        <TableCell className="font-mono text-xs break-all">{u.path}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.slugIssues.map(i => (
                              <Badge key={i} variant="destructive" className="text-[10px]">{i}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Full URL list */}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Toutes les URLs ({urls.length})
              </summary>
              <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Chemin</TableHead>
                      <TableHead>Dernière MAJ</TableHead>
                      <TableHead>Priorité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urls.map(u => (
                      <TableRow key={u.url}>
                        <TableCell>
                          {u.status === 'ok' ? (
                            <CheckCircle2 size={14} className="text-primary" />
                          ) : (
                            <AlertTriangle size={14} className="text-destructive" />
                          )}
                        </TableCell>
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
