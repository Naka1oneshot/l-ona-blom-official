import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Heart, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WishlistRow {
  product_id: string;
  user_id: string;
  created_at: string;
}

interface ProductInfo {
  id: string;
  name_fr: string;
  name_en: string;
  slug: string;
  images: string[] | null;
  base_price_eur: number;
  status: string;
}

interface RankedProduct extends ProductInfo {
  count: number;
  unique_users: number;
  last_added: string;
}

const AdminWishlists = () => {
  const [ranked, setRanked] = useState<RankedProduct[]>([]);
  const [totalWishes, setTotalWishes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [wishRes, prodRes] = await Promise.all([
        supabase.from('wishlists').select('product_id, user_id, created_at'),
        supabase.from('products').select('id, name_fr, name_en, slug, images, base_price_eur, status'),
      ]);

      const wishes = (wishRes.data || []) as WishlistRow[];
      const products = (prodRes.data || []) as ProductInfo[];
      const prodMap = new Map(products.map(p => [p.id, p]));

      // Aggregate
      const agg = new Map<string, { count: number; users: Set<string>; last: string }>();
      const allUsers = new Set<string>();

      for (const w of wishes) {
        allUsers.add(w.user_id);
        const entry = agg.get(w.product_id) || { count: 0, users: new Set(), last: w.created_at };
        entry.count++;
        entry.users.add(w.user_id);
        if (w.created_at > entry.last) entry.last = w.created_at;
        agg.set(w.product_id, entry);
      }

      const result: RankedProduct[] = [];
      for (const [pid, data] of agg) {
        const prod = prodMap.get(pid);
        if (!prod) continue;
        result.push({
          ...prod,
          count: data.count,
          unique_users: data.users.size,
          last_added: data.last,
        });
      }

      result.sort((a, b) => b.count - a.count);

      setRanked(result);
      setTotalWishes(wishes.length);
      setTotalUsers(allUsers.size);
      setLoading(false);
    })();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const maxCount = ranked.length > 0 ? ranked[0].count : 1;

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Analyse Wishlists</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-border p-6">
          <Heart size={20} className="text-muted-foreground mb-3" />
          <p className="text-3xl text-display font-medium">{totalWishes}</p>
          <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mt-1">Total favoris</p>
        </div>
        <div className="border border-border p-6">
          <Users size={20} className="text-muted-foreground mb-3" />
          <p className="text-3xl text-display font-medium">{totalUsers}</p>
          <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mt-1">Utilisateurs</p>
        </div>
        <div className="border border-border p-6">
          <TrendingUp size={20} className="text-muted-foreground mb-3" />
          <p className="text-3xl text-display font-medium">{ranked.length}</p>
          <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mt-1">Produits souhaités</p>
        </div>
        <div className="border border-border p-6">
          <Heart size={20} className="text-muted-foreground mb-3" />
          <p className="text-3xl text-display font-medium">
            {totalUsers > 0 ? (totalWishes / totalUsers).toFixed(1) : '0'}
          </p>
          <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mt-1">Moy. / utilisateur</p>
        </div>
      </div>

      {/* Ranking table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">Chargement...</div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          Aucun produit en liste de souhaits pour le moment.
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_120px_80px_100px_40px] gap-4 px-4 py-3 bg-muted/30 text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground items-center">
            <span className="w-6 text-center">#</span>
            <span>Produit</span>
            <span className="text-center">Popularité</span>
            <span className="text-center">Favoris</span>
            <span className="text-center">Dernier ajout</span>
            <span />
          </div>

          {ranked.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-[auto_1fr_120px_80px_100px_40px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/20 transition-colors"
            >
              {/* Rank */}
              <span className="w-6 text-center text-sm font-body text-muted-foreground">
                {idx + 1}
              </span>

              {/* Product info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-12 bg-secondary flex-shrink-0 overflow-hidden">
                  {item.images && item.images[0] && (
                    <img src={item.images[0]} alt={item.name_fr} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-body truncate">{item.name_fr}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {(item.base_price_eur / 100).toFixed(0)} € · {item.unique_users} utilisateur{item.unique_users > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Popularity bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Count */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1 text-sm font-body">
                  <Heart size={12} className="text-primary" />
                  {item.count}
                </span>
              </div>

              {/* Last added */}
              <span className="text-center text-xs font-body text-muted-foreground">
                {formatDate(item.last_added)}
              </span>

              {/* Link */}
              <Link
                to={`/boutique/${item.slug}`}
                target="_blank"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWishlists;
