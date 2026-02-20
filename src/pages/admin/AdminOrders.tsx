import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Truck, X, ExternalLink, ChevronLeft, Package, MapPin, Clock, FileText, User, CreditCard, Scissors } from 'lucide-react';

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

/* ---------- helpers ---------- */
function fmt(cents: number, cur: string) {
  const val = (cents / 100).toFixed(2);
  const sym = cur?.toUpperCase() === 'EUR' ? '€' : cur?.toUpperCase();
  return `${val} ${sym}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderAddress(addr: any, label: string) {
  if (!addr) return null;
  return (
    <div className="border border-border p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{label}</p>
      <p className="text-sm font-body leading-relaxed">
        {[addr.first_name, addr.last_name].filter(Boolean).join(' ') || addr.name || '—'}<br />
        {addr.company && <>{addr.company}<br /></>}
        {addr.line1 || addr.address1 || '—'}<br />
        {(addr.line2 || addr.address2) && <>{addr.line2 || addr.address2}<br /></>}
        {addr.postal_code} {addr.city}<br />
        {addr.region && <>{addr.region}<br /></>}
        {addr.country || addr.country_code || '—'}
        {addr.phone && <><br />{addr.phone}</>}
        {addr.vat_number && <><br />TVA: {addr.vat_number}</>}
      </p>
    </div>
  );
}

/* ---------- Order Detail Panel ---------- */
const OrderDetail = ({ order, onBack, onStatusChange, onShip }: { order: any; onBack: () => void; onStatusChange: (id: string, s: string) => void; onShip: (o: any) => void }) => {
  const [profile, setProfile] = useState<any>(null);
  const items = (order.items_json || []) as any[];
  const shipping = order.shipping_address_json as any;
  const billing = order.billing_address_json as any;
  const mtm = order.made_to_measure_data_json as any;
  const shippingOpts = order.shipping_options_json as any;

  useEffect(() => {
    if (order.user_id) {
      supabase.from('profiles').select('*').eq('user_id', order.user_id).single().then(({ data }) => setProfile(data));
    }
  }, [order.user_id]);

  // Build a timeline from available data
  const timeline: { date: string; label: string; status?: string }[] = [];
  if (order.created_at) timeline.push({ date: order.created_at, label: 'Commande créée', status: 'NEW' });
  if (order.status !== 'NEW' && order.status !== 'CANCELLED') timeline.push({ date: order.created_at, label: 'Paiement confirmé', status: 'PAID' });
  if (['PREPARING', 'SHIPPED', 'DELIVERED'].includes(order.status)) timeline.push({ date: order.updated_at, label: 'En préparation', status: 'PREPARING' });
  if (order.shipped_at) timeline.push({ date: order.shipped_at, label: `Expédié via ${order.tracking_carrier || '—'}`, status: 'SHIPPED' });
  if (order.status === 'DELIVERED') timeline.push({ date: order.updated_at, label: 'Livré', status: 'DELIVERED' });
  if (order.status === 'CANCELLED') timeline.push({ date: order.updated_at, label: 'Annulé', status: 'CANCELLED' });

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour aux commandes
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-2xl">Commande #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-xs font-body text-muted-foreground mt-1">{fmtDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] tracking-[0.15em] uppercase font-body px-3 py-1 ${statusColors[order.status] || ''}`}>{order.status}</span>
          {['PAID', 'PREPARING'].includes(order.status) && (
            <button onClick={() => onShip(order)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-wider uppercase font-body border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              <Truck className="w-3 h-3" /> Expédier
            </button>
          )}
          <select value={order.status} onChange={e => onStatusChange(order.id, e.target.value)} className="text-xs font-body border border-border bg-transparent px-2 py-1 focus:outline-none focus:border-primary">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Items + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-xs uppercase tracking-wider font-body flex items-center gap-1"><Package className="w-3 h-3" /> Articles ({items.length})</h3>
            </div>
            {items.length === 0 && <p className="p-4 text-sm text-muted-foreground font-body">Aucun article enregistré.</p>}
            <div className="divide-y divide-border">
              {items.map((item: any, i: number) => (
                <div key={i} className="p-4 flex gap-4">
                  {item.image && <img src={item.image} alt="" className="w-16 h-20 object-cover border border-border flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium truncate">{item.name || item.product_name || `Article ${i + 1}`}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-body text-muted-foreground">
                      {item.size && <span>Taille: {item.size}</span>}
                      {item.color && <span>Couleur: {item.color}</span>}
                      {item.braiding && <span>Tressage: {item.braiding}</span>}
                      {item.braiding_color && <span>Couleur tressage: {item.braiding_color}</span>}
                      <span>Qté: {item.quantity || 1}</span>
                    </div>
                  </div>
                  <p className="text-sm font-body whitespace-nowrap">{fmt((item.unit_amount || item.price || 0) * (item.quantity || 1), item.currency || order.currency)}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="border-t border-border p-4 space-y-1">
              <div className="flex justify-between text-xs font-body text-muted-foreground">
                <span>Sous-total</span><span>{fmt(order.subtotal, order.currency)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-xs font-body text-green-600">
                  <span>Réduction</span><span>-{fmt(order.discount_total, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-body text-muted-foreground">
                <span>Livraison</span><span>{order.shipping_fee > 0 ? fmt(order.shipping_fee, order.shipping_currency || order.currency) : 'Offert'}</span>
              </div>
              <div className="flex justify-between text-sm font-body font-semibold pt-2 border-t border-border">
                <span>Total</span><span>{fmt(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Made to measure */}
          {mtm && Object.keys(mtm).length > 0 && (
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-xs uppercase tracking-wider font-body flex items-center gap-1"><Scissors className="w-3 h-3" /> Mesures sur-mesure</h3>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(mtm).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{k}</p>
                    <p className="text-sm font-body">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-xs uppercase tracking-wider font-body flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</h3>
              </div>
              <p className="p-4 text-sm font-body whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right column: Customer, Addresses, Timeline, Shipping */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Client</p>
            {profile ? (
              <div className="text-sm font-body space-y-0.5">
                <p className="font-medium">{[profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'}</p>
                <p className="text-muted-foreground">{profile.email}</p>
                {profile.phone && <p className="text-muted-foreground">{profile.phone}</p>}
              </div>
            ) : (
              <p className="text-sm font-body text-muted-foreground">Client invité</p>
            )}
          </div>

          {/* Addresses */}
          {renderAddress(shipping, 'Adresse de livraison')}
          {renderAddress(billing, 'Adresse de facturation')}

          {/* Payment */}
          <div className="border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Paiement</p>
            <div className="text-sm font-body space-y-0.5">
              {order.stripe_session_id && <p className="text-xs text-muted-foreground font-mono truncate">{order.stripe_session_id}</p>}
              {order.promo_code_id && <p>Code promo appliqué</p>}
              <p>{fmt(order.total, order.currency)}</p>
            </div>
          </div>

          {/* Shipping info */}
          {(order.tracking_number || order.shipping_fee > 0 || shippingOpts) && (
            <div className="border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2 flex items-center gap-1"><Truck className="w-3 h-3" /> Livraison</p>
              <div className="text-sm font-body space-y-1">
                {order.shipment_preference && <p>Préférence: {order.shipment_preference}</p>}
                {order.tracking_carrier && <p>Transporteur: {order.tracking_carrier}</p>}
                {order.tracking_number && (
                  <p className="flex items-center gap-1">
                    N° suivi: {order.tracking_number}
                    {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="w-3 h-3" /></a>}
                  </p>
                )}
                {order.estimated_ship_start_date && <p className="text-muted-foreground text-xs">Expédition estimée: {order.estimated_ship_start_date}</p>}
                {order.estimated_delivery_date && <p className="text-muted-foreground text-xs">Livraison estimée: {order.estimated_delivery_date}</p>}
                {shippingOpts && typeof shippingOpts === 'object' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {(shippingOpts as any).insurance && <span className="mr-2">✓ Assurance</span>}
                    {(shippingOpts as any).signature && <span className="mr-2">✓ Signature</span>}
                    {(shippingOpts as any).gift_wrap && <span className="mr-2">✓ Emballage cadeau</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> Historique</p>
            <div className="space-y-3">
              {timeline.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${ev.status === order.status ? 'bg-primary' : 'bg-border'}`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-body">{ev.label}</p>
                    <p className="text-[10px] font-body text-muted-foreground">{fmtDate(ev.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customs notice */}
          {order.customs_notice_shown && (
            <div className="border border-amber-300 bg-amber-50 p-3 text-xs font-body text-amber-800">
              ⚠️ Avis douane affiché au client
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Main AdminOrders ---------- */
const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
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
    else {
      toast.success('Statut mis à jour');
      await load();
      // Refresh selected order if open
      if (selectedOrder?.id === id) {
        const updated = (await supabase.from('orders').select('*').eq('id', id).single()).data;
        setSelectedOrder(updated);
      }
    }
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
      const { error } = await supabase.from('orders').update({
        tracking_carrier: shipForm.carrier,
        tracking_number: shipForm.trackingNumber.trim(),
        tracking_url: shipForm.trackingUrl.trim() || null,
        status: 'SHIPPED',
        shipped_at: new Date().toISOString(),
      }).eq('id', shipDialog.id);

      if (error) throw error;

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
      } else {
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
      }

      setShipDialog(null);
      await load();
      // Refresh detail view
      if (selectedOrder?.id === shipDialog.id) {
        const updated = (await supabase.from('orders').select('*').eq('id', shipDialog.id).single()).data;
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSending(false);
    }
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;
  const inputClass = 'w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary';

  // If an order is selected, show detail view
  if (selectedOrder) {
    return (
      <>
        <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} onStatusChange={updateStatus} onShip={openShipDialog} />
        {/* Ship dialog overlay */}
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
              <button onClick={handleShip} disabled={sending} className="w-full py-3 bg-foreground text-background text-xs tracking-[0.2em] uppercase font-body hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                {sending ? 'Envoi en cours…' : 'Confirmer l\'expédition & envoyer l\'email'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

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
          <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
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
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {['PAID', 'PREPARING'].includes(order.status) && (
                  <button onClick={() => openShipDialog(order)} className="flex items-center gap-1 px-3 py-1 text-[10px] tracking-wider uppercase font-body border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors" title="Marquer comme expédié">
                    <Truck className="w-3 h-3" /> Expédier
                  </button>
                )}
                {order.tracking_number && (
                  <span className="text-[10px] font-body text-muted-foreground flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {order.tracking_carrier}: {order.tracking_number}
                    {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="w-3 h-3" /></a>}
                  </span>
                )}
                <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className="text-xs font-body border border-border bg-transparent px-2 py-1 focus:outline-none focus:border-primary">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ship dialog from list */}
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
            <button onClick={handleShip} disabled={sending} className="w-full py-3 bg-foreground text-background text-xs tracking-[0.2em] uppercase font-body hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
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
