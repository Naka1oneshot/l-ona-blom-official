import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Truck, X, ExternalLink } from 'lucide-react';

const statuses = ['NEW', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

const statusColors: Record<string, string> = {
  NEW: 'bg-muted text-muted-foreground',
  PAID: 'bg-primary/10 text-primary',
  PREPARING: 'bg-accent/20 text-accent-foreground',
  SHIPPED: 'bg-primary/20 text-primary',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

const carriers = ['Colissimo', 'Chronopost', 'DHL', 'UPS', 'FedEx', 'Mondial Relay', 'DPD', 'GLS', 'Autre'];

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [shipDialog, setShipDialog] = useState<any | null>(null);
  const [shipForm, setShipForm] = useState({ carrier: 'Colissimo', trackingNumber: '', trackingUrl: '' });
  const [sending, setSending] = useState(false);

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

  function openShipDialog(order: any) {
    setShipForm({
      carrier: order.tracking_carrier || 'Colissimo',
      trackingNumber: order.tracking_number || '',
      trackingUrl: order.tracking_url || '',
    });
    setShipDialog(order);
  }

  async function handleShip() {
    if (!shipDialog) return;
    if (!shipForm.trackingNumber.trim()) { toast.error('Numéro de suivi requis'); return; }

    setSending(true);
    try {
      // Update order in DB
      const { error } = await supabase.from('orders').update({
        tracking_carrier: shipForm.carrier,
        tracking_number: shipForm.trackingNumber.trim(),
        tracking_url: shipForm.trackingUrl.trim() || null,
        status: 'SHIPPED',
        shipped_at: new Date().toISOString(),
      }).eq('id', shipDialog.id);

      if (error) throw error;

      // Resolve customer email from shipping_address_json or profile
      let customerEmail = '';
      let customerName = '';

      const addr = shipDialog.shipping_address_json as any;
      if (addr) {
        customerName = [addr.first_name, addr.last_name].filter(Boolean).join(' ') || addr.name || '';
      }

      if (shipDialog.user_id) {
        const { data: profile } = await supabase.from('profiles').select('email, first_name, last_name').eq('user_id', shipDialog.user_id).single();
        if (profile) {
          customerEmail = profile.email;
          if (!customerName) customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        }
      }

      if (!customerEmail) {
        toast.success('Commande marquée expédiée (email client non trouvé)');
        setShipDialog(null);
        load();
        return;
      }

      // Send shipping email
      const { error: emailError } = await supabase.functions.invoke('send-shipping-email', {
        body: {
          customerEmail,
          customerName: customerName || 'Client',
          orderId: shipDialog.id,
          trackingCarrier: shipForm.carrier,
          trackingNumber: shipForm.trackingNumber.trim(),
          trackingUrl: shipForm.trackingUrl.trim() || undefined,
          currency: shipDialog.currency,
          total: shipDialog.total,
        },
      });

      if (emailError) {
        console.error('Shipping email error:', emailError);
        toast.success('Commande expédiée (erreur envoi email)');
      } else {
        toast.success('Commande expédiée — email envoyé au client');
      }

      setShipDialog(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSending(false);
    }
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;
  const inputClass = 'w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary';

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
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-body">{order.currency} {(order.total / 100).toFixed(2)}</p>
              <div className="flex items-center gap-2">
                {/* Ship button - only for PAID or PREPARING */}
                {['PAID', 'PREPARING'].includes(order.status) && (
                  <button
                    onClick={() => openShipDialog(order)}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] tracking-wider uppercase font-body border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Marquer comme expédié"
                  >
                    <Truck className="w-3 h-3" />
                    Expédier
                  </button>
                )}
                {/* Show tracking info if shipped */}
                {order.tracking_number && (
                  <span className="text-[10px] font-body text-muted-foreground flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {order.tracking_carrier}: {order.tracking_number}
                    {order.tracking_url && (
                      <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="w-3 h-3" /></a>
                    )}
                  </span>
                )}
                <select
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  className="text-xs font-body border border-border bg-transparent px-2 py-1 focus:outline-none focus:border-primary"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ship dialog */}
      {shipDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border p-6 w-full max-w-md relative">
            <button onClick={() => setShipDialog(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            <h2 className="text-display text-lg mb-1">Expédier la commande</h2>
            <p className="text-xs text-muted-foreground font-body mb-6">#{shipDialog.id.slice(0, 8).toUpperCase()} — {shipDialog.currency} {(shipDialog.total / 100).toFixed(2)}</p>

            <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1">Transporteur</label>
            <select value={shipForm.carrier} onChange={e => setShipForm(f => ({ ...f, carrier: e.target.value }))} className={inputClass + ' mb-4'}>
              {carriers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1">Numéro de suivi *</label>
            <input value={shipForm.trackingNumber} onChange={e => setShipForm(f => ({ ...f, trackingNumber: e.target.value }))} className={inputClass + ' mb-4'} placeholder="Ex: 6A12345678901" />

            <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1">URL de suivi (optionnel)</label>
            <input value={shipForm.trackingUrl} onChange={e => setShipForm(f => ({ ...f, trackingUrl: e.target.value }))} className={inputClass + ' mb-6'} placeholder="https://..." />

            <button
              onClick={handleShip}
              disabled={sending}
              className="w-full py-3 bg-foreground text-background text-xs tracking-[0.2em] uppercase font-body hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              {sending ? 'Envoi en cours…' : 'Confirmer l\'expédition & envoyer l\'email'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
