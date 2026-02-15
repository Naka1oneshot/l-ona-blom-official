import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminProductForm from './AdminProductForm';

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { load(); }, []);

  // Auto-open edit form from URL param
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const p = products.find(x => x.id === editId);
      if (p) { setEditing(p); setSearchParams({}, { replace: true }); }
    }
  }, [products, searchParams]);

  async function load() {
    const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    setProducts(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Produit supprimé'); load(); }
  }

  async function moveProduct(index: number, direction: -1 | 1) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= products.length) return;

    const a = products[index];
    const b = products[swapIndex];

    // Use array indices to guarantee distinct values even when sort_order are equal
    const aNewOrder = swapIndex;
    const bNewOrder = index;

    const updates = [
      supabase.from('products').update({ sort_order: aNewOrder }).eq('id', a.id),
      supabase.from('products').update({ sort_order: bNewOrder }).eq('id', b.id),
    ];

    // Optimistic update
    const newProducts = [...products];
    newProducts[index] = { ...b, sort_order: bNewOrder };
    newProducts[swapIndex] = { ...a, sort_order: aNewOrder };
    setProducts(newProducts);

    await Promise.all(updates);
  }

  const missingStripeCount = products.filter(p => p.status === 'active' && !p.stripe_product_id).length;

  async function syncStripe() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-products');
      if (error) throw error;
      toast.success(`${data.synced} produit(s) synchronisé(s) sur Stripe`);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  }

  if (creating || editing) {
    return (
      <AdminProductForm
        product={editing}
        onSave={() => { setCreating(false); setEditing(null); load(); }}
        onCancel={() => { setCreating(false); setEditing(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Produits</h1>
        <div className="flex items-center gap-3">
          {missingStripeCount > 0 && (
            <button
              onClick={syncStripe}
              disabled={syncing}
              className="flex items-center gap-2 border border-border px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Sync Stripe ({missingStripeCount})
            </button>
          )}
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary transition-colors"
          >
            <Plus size={14} /> Nouveau
          </button>
        </div>
      </div>

      <div className="border border-border divide-y divide-border">
        {products.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground font-body">Aucun produit.</p>
        )}
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 p-4 hover:bg-muted/30 transition-colors">
            {/* Sort controls */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => moveProduct(i, -1)}
                disabled={i === 0}
                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                aria-label="Monter"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => moveProduct(i, 1)}
                disabled={i === products.length - 1}
                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                aria-label="Descendre"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Thumbnail */}
            {p.images?.[0] && (
              <div className="w-10 h-14 bg-secondary rounded overflow-hidden shrink-0">
                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate">
                {p.reference_code && <span className="text-muted-foreground font-normal mr-1.5">{p.reference_code}</span>}
                {p.name_fr}
                {p.status === 'active' && !p.stripe_product_id && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[9px] tracking-wider uppercase font-body bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Stripe manquant
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground font-body">
                {p.category} · {p.status} · €{(p.base_price_eur / 100).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => setEditing(p)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
