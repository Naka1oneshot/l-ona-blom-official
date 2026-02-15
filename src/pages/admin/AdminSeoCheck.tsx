import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, Image, Tag, FileText, Layers, Package, Newspaper, Globe, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SitemapAudit from '@/components/admin/SitemapAudit';

interface ProductIssue {
  id: string;
  slug: string;
  name_fr: string;
  issues: string[];
}

interface CollectionIssue {
  id: string;
  slug: string;
  title_fr: string;
  issues: string[];
}

interface PostIssue {
  id: string;
  slug: string;
  title_fr: string;
  issues: string[];
}

const INDEXABLE_ROUTES = [
  { path: '/', label: 'Accueil', hasDescription: true },
  { path: '/boutique', label: 'Boutique', hasDescription: true },
  { path: '/collections', label: 'Collections', hasDescription: true },
  { path: '/a-propos', label: 'À propos', hasDescription: true },
  { path: '/contact', label: 'Contact', hasDescription: true },
  { path: '/faq', label: 'FAQ', hasDescription: true },
  { path: '/actualites', label: 'Actualités', hasDescription: true },
];

const NON_INDEX_ROUTES = [
  '/admin/*', '/compte/*', '/panier', '/connexion', '/inscription',
];

const AdminSeoCheck = () => {
  const [productIssues, setProductIssues] = useState<ProductIssue[]>([]);
  const [collectionIssues, setCollectionIssues] = useState<CollectionIssue[]>([]);
  const [postIssues, setPostIssues] = useState<PostIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ products: 0, collections: 0, posts: 0 });
  const [sitemapIssueCount, setSitemapIssueCount] = useState(0);
  const [auditKey, setAuditKey] = useState(0);

  const runAudit = async () => {
    setLoading(true);
    const [prodRes, colRes, postRes] = await Promise.all([
      supabase.from('products').select('id, slug, name_fr, name_en, description_fr, description_en, images, reference_code, base_price_eur, stock_qty, status'),
      supabase.from('collections').select('id, slug, title_fr, title_en, narrative_fr, narrative_en, cover_image, published_at'),
      supabase.from('posts').select('id, slug, title_fr, title_en, lead_fr, lead_en, cover_image, published_at'),
    ]);

    const products = prodRes.data || [];
    const collections = colRes.data || [];
    const posts = postRes.data || [];

    setTotals({ products: products.length, collections: collections.length, posts: posts.length });

    const pIssues: ProductIssue[] = [];
    for (const p of products) {
      const issues: string[] = [];
      if (!p.images || p.images.length === 0) issues.push('Aucune image');
      if (!p.reference_code) issues.push('Pas de référence (SKU)');
      if (!p.description_fr && !p.description_en) issues.push('Pas de description');
      if (!p.name_en) issues.push('Pas de nom EN');
      if (p.base_price_eur === 0) issues.push('Prix à 0');
      if (issues.length > 0) pIssues.push({ id: p.id, slug: p.slug, name_fr: p.name_fr, issues });
    }
    setProductIssues(pIssues);

    const cIssues: CollectionIssue[] = [];
    for (const c of collections) {
      const issues: string[] = [];
      if (!c.cover_image) issues.push('Pas de cover image');
      if (!c.narrative_fr && !c.narrative_en) issues.push('Pas de narrative/description');
      if (!c.title_en) issues.push('Pas de titre EN');
      if (issues.length > 0) cIssues.push({ id: c.id, slug: c.slug, title_fr: c.title_fr, issues });
    }
    setCollectionIssues(cIssues);

    const aIssues: PostIssue[] = [];
    for (const a of posts) {
      const issues: string[] = [];
      if (!a.cover_image) issues.push('Pas de cover image');
      if (!a.lead_fr && !a.lead_en) issues.push('Pas de meta description (lead)');
      if (!a.title_en) issues.push('Pas de titre EN');
      if (issues.length > 0) aIssues.push({ id: a.id, slug: a.slug, title_fr: a.title_fr, issues });
    }
    setPostIssues(aIssues);

    setLoading(false);
  };

  const handleRefresh = () => {
    setAuditKey(k => k + 1);
    runAudit();
  };

  useEffect(() => { runAudit(); }, []);

  const totalIssues = productIssues.length + collectionIssues.length + postIssues.length + sitemapIssueCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-3xl mb-2">Audit SEO</h1>
          <p className="text-sm text-muted-foreground font-body">
            Vérification automatique des données nécessaires au référencement.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            {totalIssues === 0 ? (
              <CheckCircle2 className="mx-auto mb-2 text-primary" size={28} />
            ) : (
              <AlertTriangle className="mx-auto mb-2 text-destructive" size={28} />
            )}
            <p className="text-2xl font-display font-medium">{totalIssues}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Problèmes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-2xl font-display font-medium">{productIssues.length}/{totals.products}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Produits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Layers className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-2xl font-display font-medium">{collectionIssues.length}/{totals.collections}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Newspaper className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-2xl font-display font-medium">{postIssues.length}/{totals.posts}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-2xl font-display font-medium">{sitemapIssueCount}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Sitemap</p>
          </CardContent>
        </Card>
      </div>

      {/* Routes index status */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText size={18} /> Routes indexables</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {INDEXABLE_ROUTES.map(r => (
              <Badge key={r.path} variant="outline" className="font-mono text-xs">{r.path}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Routes noindex : {NON_INDEX_ROUTES.join(', ')}</p>
        </CardContent>
      </Card>

      {/* Sitemap audit */}
      <SitemapAudit key={auditKey} onIssueCount={setSitemapIssueCount} />

      {/* Product issues */}
      {productIssues.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package size={18} /> Produits avec problèmes SEO ({productIssues.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Problèmes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productIssues.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name_fr}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.issues.map(i => (
                          <Badge key={i} variant="destructive" className="text-[10px]">{i}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Collection issues */}
      {collectionIssues.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layers size={18} /> Collections avec problèmes SEO ({collectionIssues.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Problèmes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionIssues.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title_fr}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.issues.map(i => (
                          <Badge key={i} variant="destructive" className="text-[10px]">{i}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Post issues */}
      {postIssues.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Newspaper size={18} /> Articles avec problèmes SEO ({postIssues.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Problèmes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postIssues.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title_fr}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.issues.map(i => (
                          <Badge key={i} variant="destructive" className="text-[10px]">{i}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalIssues === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-primary" size={40} />
            <p className="text-lg font-display">Aucun problème SEO détecté</p>
            <p className="text-sm text-muted-foreground mt-1">Tous les produits, collections et articles sont correctement renseignés.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSeoCheck;
