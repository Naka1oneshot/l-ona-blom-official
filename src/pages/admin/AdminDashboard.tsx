import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, Layers, ShoppingCart, Users } from 'lucide-react';

interface Stats {
  products: number;
  collections: number;
  orders: number;
  customers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ products: 0, collections: 0, orders: 0, customers: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('collections').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([p, c, o, u]) => {
      setStats({
        products: p.count || 0,
        collections: c.count || 0,
        orders: o.count || 0,
        customers: u.count || 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Produits', value: stats.products, icon: Package, to: '/admin/produits' },
    { label: 'Collections', value: stats.collections, icon: Layers, to: '/admin/collections' },
    { label: 'Commandes', value: stats.orders, icon: ShoppingCart, to: '/admin/commandes' },
    { label: 'Clients', value: stats.customers, icon: Users, to: '/admin/clients' },
  ];

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Dashboard</h1>
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
