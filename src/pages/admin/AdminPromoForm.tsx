import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface Props {
  promo?: any;
  onSave: () => void;
  onCancel: () => void;
}

const AdminPromoForm = ({ promo, onSave, onCancel }: Props) => {
  const isNew = !promo;
  const [form, setForm] = useState({
    code: promo?.code || '',
    type: promo?.type || 'percent',
    value: promo?.value || 0,
    currency: promo?.currency || 'EUR',
    starts_at: promo?.starts_at ? new Date(promo.starts_at).toISOString().slice(0, 10) : '',
    ends_at: promo?.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 10) : '',
    max_redemptions: promo?.max_redemptions ?? '',
    active: promo?.active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      currency: form.currency,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      max_redemptions: form.max_redemptions === '' ? null : Number(form.max_redemptions),
      active: form.active,
    };
    let error;
    if (isNew) {
      ({ error } = await supabase.from('promo_codes').insert(payload));
    } else {
      ({ error } = await supabase.from('promo_codes').update(payload).eq('id', promo.id));
    }
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success(isNew ? 'Code créé' : 'Code mis à jour'); onSave(); }
  };

  const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";
  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-2 text-xs tracking-wider uppercase font-body text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Retour
      </button>
      <h1 className="text-display text-3xl mb-8">{isNew ? 'Nouveau Code Promo' : 'Modifier le Code'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div><label className={labelClass}>Code</label><input value={form.code} onChange={e => set('code', e.target.value)} className={`${inputClass} uppercase tracking-widest`} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass}>
              <option value="percent">Pourcentage</option>
              <option value="fixed">Montant fixe</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{form.type === 'percent' ? 'Valeur (%)' : 'Valeur (centimes)'}</label>
            <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className={inputClass} required min={0} />
          </div>
        </div>
        {form.type === 'fixed' && (
          <div>
            <label className={labelClass}>Devise</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inputClass}>
              {['EUR', 'USD', 'GBP', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Début</label><input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Fin</label><input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)} className={inputClass} /></div>
        </div>
        <div><label className={labelClass}>Utilisations max (vide = illimité)</label><input type="number" value={form.max_redemptions} onChange={e => set('max_redemptions', e.target.value)} className={inputClass} min={0} /></div>
        <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="accent-primary" />
          Actif
        </label>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors disabled:opacity-50">
            {submitting ? '...' : isNew ? 'Créer' : 'Enregistrer'}
          </button>
          <button type="button" onClick={onCancel} className="border border-foreground/20 px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:border-foreground transition-colors">Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default AdminPromoForm;
