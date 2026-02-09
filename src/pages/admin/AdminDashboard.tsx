import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, Layers, ShoppingCart, Users, Globe, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  products: number;
  collections: number;
  orders: number;
  customers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ products: 0, collections: 0, orders: 0, customers: 0 });
  const [lastPublished, setLastPublished] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('collections').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('site_settings').select('value').eq('key', 'last_published_at').maybeSingle(),
    ]).then(([p, c, o, u, pub]) => {
      setStats({
        products: p.count || 0,
        collections: c.count || 0,
        orders: o.count || 0,
        customers: u.count || 0,
      });
      if (pub.data?.value) {
        const val = pub.data.value as any;
        setLastPublished(typeof val === 'string' ? val : val?.date || null);
      }
    });
  }, []);

  const handleMarkPublished = async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'last_published_at', value: JSON.stringify(now) }, { onConflict: 'key' });
    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      setLastPublished(now);
      toast.success('Date de publication mise à jour');
    }
  };

  const cards = [
    { label: 'Produits', value: stats.products, icon: Package, to: '/admin/produits' },
    { label: 'Collections', value: stats.collections, icon: Layers, to: '/admin/collections' },
    { label: 'Commandes', value: stats.orders, icon: ShoppingCart, to: '/admin/commandes' },
    { label: 'Clients', value: stats.customers, icon: Users, to: '/admin/clients' },
  ];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) +
      ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Dashboard</h1>

      {/* Last published banner */}
      <div className="border border-border rounded-xl p-5 mb-8 flex items-center justify-between gap-4 bg-secondary/30">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-muted-foreground" />
          <div>
            <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground">Dernière mise à jour du site</p>
            <p className="text-sm font-body text-foreground mt-0.5">
              {lastPublished ? formatDate(lastPublished) : 'Jamais publié'}
            </p>
          </div>
        </div>
        <button
          onClick={handleMarkPublished}
          className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase font-body border border-foreground/20 rounded-lg hover:bg-foreground hover:text-background transition-colors"
        >
          <Upload size={14} />
          Marquer comme publié
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="border border-border p-6">
            <card.icon size={20} className="text-muted-foreground mb-3" />
            <p className="text-3xl text-display font-medium">{card.value}</p>
            <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
