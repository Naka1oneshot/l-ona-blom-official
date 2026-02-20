import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { COUNTRY_OPTIONS, type UserAddress } from '@/types/shipping';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  type: 'shipping' | 'billing';
  onSaved: (addr: UserAddress) => void;
  onCancel: () => void;
  existing?: UserAddress | null;
}

export default function AddressForm({ type, onSaved, onCancel, existing }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    first_name: existing?.first_name ?? '',
    last_name: existing?.last_name ?? '',
    company: existing?.company ?? '',
    vat_number: existing?.vat_number ?? '',
    address1: existing?.address1 ?? '',
    address2: existing?.address2 ?? '',
    city: existing?.city ?? '',
    postal_code: existing?.postal_code ?? '',
    region: existing?.region ?? '',
    country_code: existing?.country_code ?? 'FR',
    phone: existing?.phone ?? '',
    label: existing?.label ?? '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!user) return;
    if (!form.first_name || !form.last_name || !form.address1 || !form.city || !form.postal_code) {
      toast.error(language === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        type,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        company: form.company.trim() || null,
        vat_number: form.vat_number.trim() || null,
        address1: form.address1.trim(),
        address2: form.address2.trim() || null,
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),
        region: form.region.trim() || null,
        country_code: form.country_code,
        phone: form.phone.trim() || null,
        label: type === 'shipping' ? (form.label.trim() || null) : null,
        is_default: false,
      };

      if (existing) {
        const { data, error } = await supabase
          .from('user_addresses')
          .update(payload as any)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as unknown as UserAddress);
      } else {
        const { data, error } = await supabase
          .from('user_addresses')
          .insert(payload as any)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as unknown as UserAddress);
      }
      qc.invalidateQueries({ queryKey: ['user_addresses'] });
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving address');
    } finally {
      setSaving(false);
    }
  };

  const label = (fr: string, en: string) => language === 'fr' ? fr : en;
  const countries = COUNTRY_OPTIONS.map(c => ({ code: c.code, name: language === 'fr' ? c.label_fr : c.label_en }));

  return (
    <div className="space-y-3 border border-foreground/10 p-4 rounded-sm bg-secondary/30">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Prénom', 'First name')} *</label>
          <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Nom', 'Last name')} *</label>
          <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
      </div>
      {type === 'shipping' && (
        <div>
          <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Libellé', 'Label')}</label>
          <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder={label('ex: Maison, Bureau', 'e.g. Home, Office')} className="mt-1 h-9 text-sm" />
        </div>
      )}
      {type === 'billing' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Entreprise', 'Company')}</label>
            <Input value={form.company} onChange={e => set('company', e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('N° TVA', 'VAT number')}</label>
            <Input value={form.vat_number} onChange={e => set('vat_number', e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
        </div>
      )}
      <div>
        <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Adresse', 'Address')} *</label>
        <Input value={form.address1} onChange={e => set('address1', e.target.value)} className="mt-1 h-9 text-sm" />
      </div>
      <div>
        <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Complément', 'Line 2')}</label>
        <Input value={form.address2} onChange={e => set('address2', e.target.value)} className="mt-1 h-9 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Code postal', 'Postal code')} *</label>
          <Input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Ville', 'City')} *</label>
          <Input value={form.city} onChange={e => set('city', e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Pays', 'Country')} *</label>
          <Select value={form.country_code} onValueChange={v => set('country_code', v)}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">{label('Téléphone', 'Phone')}</label>
        <Input value={form.phone} onChange={e => set('phone', e.target.value)} className="mt-1 h-9 text-sm" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-primary-foreground py-2 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? '...' : label('Enregistrer', 'Save')}
        </button>
        <button onClick={onCancel} className="px-6 py-2 border border-foreground/20 text-xs tracking-[0.15em] uppercase font-body hover:bg-secondary transition-colors">
          {label('Annuler', 'Cancel')}
        </button>
      </div>
    </div>
  );
}
