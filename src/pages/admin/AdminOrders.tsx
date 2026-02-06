import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statuses = ['NEW', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

const statusColors: Record<string, string> = {
  NEW: 'bg-muted text-muted-foreground',
  PAID: 'bg-primary/10 text-primary',
  PREPARING: 'bg-accent/20 text-accent-foreground',
  SHIPPED: 'bg-primary/20 text-primary',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Statut mis à jour'); load(); }
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Commandes</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 text-[10px] tracking-wider uppercase font-body border ${!filter ? 'bg-foreground text-background' : 'border-border hover:border-foreground'} transition-colors`}>Toutes</button>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-[10px] tracking-wider uppercase font-body border ${filter === s ? 'bg-foreground text-background' : 'border-border hover:border-foreground'} transition-colors`}>{s}</button>
        ))}
      </div>

      <div className="border border-border divide-y divide-border">
        {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground font-body">Aucune commande.</p>}
        {filtered.map(order => (
          <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-body text-muted-foreground">{order.id.slice(0, 8)}…</span>
                <span className="text-xs font-body text-muted-foreground ml-3">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <span className={`text-[10px] tracking-[0.15em] uppercase font-body px-3 py-1 ${statusColors[order.status] || ''}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-body">{order.currency} {(order.total / 100).toFixed(2)}</p>
              <select
                value={order.status}
                onChange={e => updateStatus(order.id, e.target.value)}
                className="text-xs font-body border border-border bg-transparent px-2 py-1 focus:outline-none focus:border-primary"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
