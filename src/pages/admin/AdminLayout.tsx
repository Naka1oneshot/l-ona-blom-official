import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { Package, Layers, FileText, ShoppingCart, Users, Tag, Settings, LayoutDashboard, FolderTree, FileUp, Clock, Mail, Palette, Search, Sparkles, HelpCircle, Video } from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/produits', icon: Package, label: 'Produits' },
  { to: '/admin/categories', icon: FolderTree, label: 'Catégories' },
  { to: '/admin/collections', icon: Layers, label: 'Collections' },
  { to: '/admin/commandes', icon: ShoppingCart, label: 'Commandes' },
  { to: '/admin/articles', icon: FileText, label: 'Articles' },
  { to: '/admin/messages', icon: Mail, label: 'Messages', badgeKey: 'messages' },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/promos', icon: Tag, label: 'Promos' },
  { to: '/admin/promotion', icon: Video, label: 'Promotion' },
  { to: '/admin/import', icon: FileUp, label: 'Import' },
  { to: '/admin/coming-soon', icon: Clock, label: 'Coming Soon' },
  { to: '/admin/theme', icon: Palette, label: 'Thème' },
  { to: '/admin/seo-check', icon: Search, label: 'SEO', badgeKey: 'seo' },
  { to: '/admin/faq', icon: HelpCircle, label: 'FAQ' },
  { to: '/admin/fonctionnalites', icon: Sparkles, label: 'Fonctionnalités' },
  { to: '/admin/reglages', icon: Settings, label: 'Réglages' },
];

/** Lightweight SEO issue counter — runs once on mount, includes sitemap check */
function useSeoIssueCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const SITEMAP_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap?_t=${Date.now()}`;

      const [prodRes, colRes, postRes, sitemapRes] = await Promise.all([
        supabase.from('products').select('id, name_en, description_fr, description_en, images, reference_code, base_price_eur, status, slug'),
        supabase.from('collections').select('id, title_en, narrative_fr, narrative_en, cover_image, published_at, slug'),
        supabase.from('posts').select('id, title_en, lead_fr, lead_en, cover_image, published_at, slug'),
        fetch(SITEMAP_ENDPOINT).then(r => r.ok ? r.text() : '').catch(() => ''),
      ]);

      let issues = 0;
      for (const p of (prodRes.data || [])) {
        if (!p.images || (p.images as any[]).length === 0) issues++;
        else if (!p.reference_code) issues++;
        else if (!p.description_fr && !p.description_en) issues++;
        else if (!p.name_en) issues++;
        else if (p.base_price_eur === 0) issues++;
      }
      for (const c of (colRes.data || [])) {
        if (!c.cover_image) issues++;
        else if (!c.narrative_fr && !c.narrative_en) issues++;
        else if (!c.title_en) issues++;
      }
      for (const a of (postRes.data || [])) {
        if (!a.cover_image) issues++;
        else if (!a.lead_fr && !a.lead_en) issues++;
        else if (!a.title_en) issues++;
      }

      // Sitemap cross-check
      if (sitemapRes) {
        const KNOWN_STATIC = new Set(['/', '/boutique', '/collections', '/actualites', '/a-propos', '/contact', '/faq', '/try-on', '/cgv', '/confidentialite', '/cookies', '/mentions-legales']);
        const activeProdSlugs = new Set((prodRes.data || []).filter(p => p.status === 'active').map(p => p.slug));
        const pubColSlugs = new Set((colRes.data || []).filter(c => c.published_at).map(c => c.slug));
        const pubPostSlugs = new Set((postRes.data || []).filter(a => a.published_at).map(a => a.slug));

        const parser = new DOMParser();
        const doc = parser.parseFromString(sitemapRes, 'application/xml');
        doc.querySelectorAll('url loc').forEach(el => {
          try {
            const path = new URL(el.textContent || '').pathname;
            if (KNOWN_STATIC.has(path)) return;
            // Check slug format issues
            if (/[A-Z]/.test(path) || / |%20/.test(path)) { issues++; return; }
            try { if (/[àâäéèêëïîôùûüÿçœæ]/i.test(decodeURIComponent(path))) { issues++; return; } } catch {}
            // Check orphan
            if (path.startsWith('/boutique/')) { if (!activeProdSlugs.has(decodeURIComponent(path.replace('/boutique/', '')))) issues++; }
            else if (path.startsWith('/collections/')) { if (!pubColSlugs.has(decodeURIComponent(path.replace('/collections/', '')))) issues++; }
            else if (path.startsWith('/actualites/')) { if (!pubPostSlugs.has(decodeURIComponent(path.replace('/actualites/', '')))) issues++; }
            else issues++; // unknown route
          } catch {}
        });
      }

      setCount(issues);
    })();
  }, []);

  return count;
}

/** Count of unread (status = 'new') contact messages */
function useNewMessageCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then(({ count: c }) => setCount(c ?? 0));
  }, []);

  return count;
}

const AdminLayout = () => {
  const location = useLocation();
  const seoCount = useSeoIssueCount();
  const msgCount = useNewMessageCount();

  const badgeCounts: Record<string, number> = {
    seo: seoCount,
    messages: msgCount,
  };

  return (
    <>
    <Header />
    <div className="pt-16 md:pt-20 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-sidebar-background hidden md:block fixed top-16 md:top-20 bottom-0 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const badge = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.1em] uppercase font-body transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon size={15} />
                {item.label}
                {item.badgeKey !== undefined && (
                   <span className={`ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-medium leading-none px-1 ${badge > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
                     {badge}
                   </span>
                 )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 border-b border-border bg-background overflow-x-auto">
        <div className="flex px-4 py-2 gap-1">
          {navItems.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const badge = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-body whitespace-nowrap transition-colors ${
                  active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon size={12} />
                {item.label}
                {item.badgeKey !== undefined && (
                   <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-medium leading-none px-0.5 ${badge > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
                     {badge}
                   </span>
                 )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 p-6 md:p-8 mt-10 md:mt-0">
        <Outlet />
      </main>
    </div>
    </>
  );
};

export default AdminLayout;
