import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminPromoForm from './AdminPromoForm';

const AdminPromos = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce code promo ?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Code supprimé'); load(); }
  }

  if (creating || editing) {
    return (
      <AdminPromoForm
        promo={editing}
        onSave={() => { setCreating(false); setEditing(null); load(); }}
        onCancel={() => { setCreating(false); setEditing(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Codes Promo</h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary transition-colors">
          <Plus size={14} /> Nouveau
        </button>
      </div>
      <div className="border border-border divide-y divide-border">
        {promos.length === 0 && <p className="p-6 text-sm text-muted-foreground font-body">Aucun code promo.</p>}
        {promos.map(p => (
          <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium tracking-wider">{p.code}</p>
              <p className="text-xs text-muted-foreground font-body">
                {p.type === 'percent' ? `${p.value}%` : `${(p.value / 100).toFixed(2)} ${p.currency}`}
                {' · '}{p.active ? 'Actif' : 'Inactif'}
                {p.max_redemptions && ` · ${p.times_redeemed}/${p.max_redemptions} utilisations`}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => setEditing(p)} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPromos;
