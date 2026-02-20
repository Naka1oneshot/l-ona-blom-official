import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, MapPin, Truck, Package, DollarSign, Gift, Calculator, Globe, AlertTriangle, FlaskConical } from 'lucide-react';
import { COUNTRY_OPTIONS } from '@/types/shipping';
import { calculateShipping } from '@/lib/shipping/calcShipping';

// ─── Types for local state ───
type Zone = { id: string; name_fr: string; name_en: string | null; description_fr: string | null; description_en: string | null; customs_notice: boolean; is_active: boolean; sort_order: number };
type ZoneCountry = { zone_id: string; country_code: string };
type SizeClass = { code: string; label_fr: string; label_en: string | null; weight_points: number; is_active: boolean; sort_order: number };
type Method = { id: string; code: string; name_fr: string; name_en: string | null; description_fr: string | null; description_en: string | null; is_active: boolean; supports_insurance: boolean; supports_signature: boolean; supports_gift_wrap: boolean; eta_min_days: number | null; eta_max_days: number | null; sort_order: number };
type RateRule = { id: string; zone_id: string; method_id: string; min_subtotal_eur: number; max_subtotal_eur: number | null; min_weight_points: number; max_weight_points: number | null; price_eur: number; is_active: boolean; priority: number };
type FreeThreshold = { id: string; zone_id: string; method_id: string | null; threshold_eur: number; is_active: boolean };
type ShipOption = { id: string; code: string; name_fr: string; name_en: string | null; is_active: boolean };
type OptionPrice = { id: string; option_id: string; zone_id: string | null; method_id: string | null; price_eur: number; is_active: boolean };
type TaxSettings = { id: number; vat_enabled: boolean; vat_rate: number };

const AdminShipping = () => {
  const [tab, setTab] = useState('zones');
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneCountries, setZoneCountries] = useState<ZoneCountry[]>([]);
  const [sizeClasses, setSizeClasses] = useState<SizeClass[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [rateRules, setRateRules] = useState<RateRule[]>([]);
  const [freeThresholds, setFreeThresholds] = useState<FreeThreshold[]>([]);
  const [options, setOptions] = useState<ShipOption[]>([]);
  const [optionPrices, setOptionPrices] = useState<OptionPrice[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({ id: 1, vat_enabled: false, vat_rate: 20 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [z, zc, sc, m, rr, ft, o, op, ts] = await Promise.all([
      supabase.from('shipping_zones').select('*').order('sort_order'),
      supabase.from('shipping_zone_countries').select('*'),
      supabase.from('shipping_size_classes').select('*').order('sort_order'),
      supabase.from('shipping_methods').select('*').order('sort_order'),
      supabase.from('shipping_rate_rules').select('*').order('priority'),
      supabase.from('shipping_free_thresholds').select('*'),
      supabase.from('shipping_options').select('*'),
      supabase.from('shipping_option_prices').select('*'),
      supabase.from('tax_settings').select('*').eq('id', 1).single(),
    ]);
    if (z.data) setZones(z.data as any);
    if (zc.data) setZoneCountries(zc.data as any);
    if (sc.data) setSizeClasses(sc.data as any);
    if (m.data) setMethods(m.data as any);
    if (rr.data) setRateRules(rr.data as any);
    if (ft.data) setFreeThresholds(ft.data as any);
    if (o.data) setOptions(o.data as any);
    if (op.data) setOptionPrices(op.data as any);
    if (ts.data) setTaxSettings(ts.data as any);
    setLoading(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground p-8">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wide">Livraisons</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="zones" className="gap-1 text-xs"><Globe size={13} /> Zones</TabsTrigger>
          <TabsTrigger value="methods" className="gap-1 text-xs"><Truck size={13} /> Méthodes</TabsTrigger>
          <TabsTrigger value="sizes" className="gap-1 text-xs"><Package size={13} /> Classes taille</TabsTrigger>
          <TabsTrigger value="rates" className="gap-1 text-xs"><DollarSign size={13} /> Tarifs</TabsTrigger>
          <TabsTrigger value="free" className="gap-1 text-xs"><Gift size={13} /> Offerte</TabsTrigger>
          <TabsTrigger value="options" className="gap-1 text-xs"><MapPin size={13} /> Options</TabsTrigger>
          <TabsTrigger value="tax" className="gap-1 text-xs"><Calculator size={13} /> TVA</TabsTrigger>
          <TabsTrigger value="simulator" className="gap-1 text-xs"><FlaskConical size={13} /> Simulateur</TabsTrigger>
        </TabsList>

        {/* ─── ZONES ─── */}
        <TabsContent value="zones"><ZonesPanel zones={zones} zoneCountries={zoneCountries} onReload={loadAll} /></TabsContent>

        {/* ─── METHODS ─── */}
        <TabsContent value="methods"><MethodsPanel methods={methods} onReload={loadAll} /></TabsContent>

        {/* ─── SIZE CLASSES ─── */}
        <TabsContent value="sizes"><SizeClassesPanel sizeClasses={sizeClasses} onReload={loadAll} /></TabsContent>

        {/* ─── RATE RULES ─── */}
        <TabsContent value="rates"><RateRulesPanel rateRules={rateRules} zones={zones} methods={methods} onReload={loadAll} /></TabsContent>

        {/* ─── FREE THRESHOLDS ─── */}
        <TabsContent value="free"><FreeThresholdsPanel thresholds={freeThresholds} zones={zones} methods={methods} onReload={loadAll} /></TabsContent>

        {/* ─── OPTIONS ─── */}
        <TabsContent value="options"><OptionsPricingPanel options={options} optionPrices={optionPrices} zones={zones} methods={methods} onReload={loadAll} /></TabsContent>

        {/* ─── TAX ─── */}
        <TabsContent value="tax"><TaxPanel taxSettings={taxSettings} onReload={loadAll} /></TabsContent>

        {/* ─── SIMULATOR ─── */}
        <TabsContent value="simulator">
          <SimulatorPanel zones={zones} zoneCountries={zoneCountries} sizeClasses={sizeClasses} methods={methods} rateRules={rateRules} freeThresholds={freeThresholds} options={options} optionPrices={optionPrices} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ═══════════════════════ ZONES ═══════════════════════
function ZonesPanel({ zones, zoneCountries, onReload }: { zones: Zone[]; zoneCountries: ZoneCountry[]; onReload: () => void }) {
  const [editing, setEditing] = useState<Zone | null>(null);
  const [countriesInput, setCountriesInput] = useState('');

  const startEdit = (z: Zone) => {
    setEditing({ ...z });
    const codes = zoneCountries.filter(zc => zc.zone_id === z.id).map(zc => zc.country_code);
    setCountriesInput(codes.join(', '));
  };

  const saveZone = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    const isNew = !id;
    let zoneId = id;

    if (isNew) {
      const { data, error } = await supabase.from('shipping_zones').insert(rest as any).select().single();
      if (error) { toast.error(error.message); return; }
      zoneId = (data as any).id;
    } else {
      const { error } = await supabase.from('shipping_zones').update(rest as any).eq('id', id);
      if (error) { toast.error(error.message); return; }
    }

    // Update countries
    await supabase.from('shipping_zone_countries').delete().eq('zone_id', zoneId);
    const codes = countriesInput.split(/[,;\s]+/).map(c => c.trim().toUpperCase()).filter(Boolean);
    if (codes.length > 0) {
      await supabase.from('shipping_zone_countries').insert(codes.map(c => ({ zone_id: zoneId, country_code: c })));
    }

    toast.success('Zone enregistrée');
    setEditing(null);
    onReload();
  };

  const deleteZone = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    await supabase.from('shipping_zone_countries').delete().eq('zone_id', id);
    await supabase.from('shipping_zones').delete().eq('id', id);
    toast.success('Zone supprimée');
    onReload();
  };

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => {
        setEditing({ id: '', name_fr: '', name_en: '', description_fr: '', description_en: '', customs_notice: false, is_active: true, sort_order: zones.length });
        setCountriesInput('');
      }}><Plus size={14} className="mr-1" /> Ajouter une zone</Button>

      {editing && (
        <div className="border border-border p-4 rounded-md space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nom FR</Label><Input value={editing.name_fr} onChange={e => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label className="text-xs">Nom EN</Label><Input value={editing.name_en || ''} onChange={e => setEditing({ ...editing, name_en: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Pays (codes ISO séparés par virgules)</Label><Textarea value={countriesInput} onChange={e => setCountriesInput(e.target.value)} placeholder="FR, BE, LU…" rows={2} /></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Switch checked={editing.customs_notice} onCheckedChange={v => setEditing({ ...editing, customs_notice: v })} /><Label className="text-xs">Douanes à charge client</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><Label className="text-xs">Active</Label></div>
            <div><Label className="text-xs">Ordre</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} className="w-20" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveZone}><Save size={13} className="mr-1" /> Enregistrer</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {zones.map(z => {
          const codes = zoneCountries.filter(zc => zc.zone_id === z.id).map(zc => zc.country_code);
          return (
            <div key={z.id} className="flex items-center justify-between py-3">
              <div>
                <span className={`font-medium text-sm ${!z.is_active ? 'opacity-50' : ''}`}>{z.name_fr}</span>
                <span className="text-xs text-muted-foreground ml-2">{codes.join(', ')}</span>
                {z.customs_notice && <span className="ml-2 text-xs text-destructive">🛃 Douanes</span>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(z)}>Éditer</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteZone(z.id)}><Trash2 size={13} /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════ METHODS ═══════════════════════
function MethodsPanel({ methods, onReload }: { methods: Method[]; onReload: () => void }) {
  const [editing, setEditing] = useState<Method | null>(null);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    if (!id) {
      const { error } = await supabase.from('shipping_methods').insert(rest as any);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('shipping_methods').update(rest as any).eq('id', id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Méthode enregistrée');
    setEditing(null);
    onReload();
  };

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => setEditing({ id: '', code: '', name_fr: '', name_en: '', description_fr: '', description_en: '', is_active: true, supports_insurance: true, supports_signature: true, supports_gift_wrap: true, eta_min_days: null, eta_max_days: null, sort_order: methods.length })}>
        <Plus size={14} className="mr-1" /> Ajouter
      </Button>

      {editing && (
        <div className="border border-border p-4 rounded-md space-y-3 bg-muted/30">
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Code</Label><Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} /></div>
            <div><Label className="text-xs">Nom FR</Label><Input value={editing.name_fr} onChange={e => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label className="text-xs">Nom EN</Label><Input value={editing.name_en || ''} onChange={e => setEditing({ ...editing, name_en: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">ETA min (jours)</Label><Input type="number" value={editing.eta_min_days ?? ''} onChange={e => setEditing({ ...editing, eta_min_days: e.target.value ? +e.target.value : null })} /></div>
            <div><Label className="text-xs">ETA max (jours)</Label><Input type="number" value={editing.eta_max_days ?? ''} onChange={e => setEditing({ ...editing, eta_max_days: e.target.value ? +e.target.value : null })} /></div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><Label className="text-xs">Active</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editing.supports_insurance} onCheckedChange={v => setEditing({ ...editing, supports_insurance: v })} /><Label className="text-xs">Assurance</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editing.supports_signature} onCheckedChange={v => setEditing({ ...editing, supports_signature: v })} /><Label className="text-xs">Signature</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editing.supports_gift_wrap} onCheckedChange={v => setEditing({ ...editing, supports_gift_wrap: v })} /><Label className="text-xs">Colis cadeau</Label></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save size={13} className="mr-1" /> Enregistrer</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {methods.map(m => (
          <div key={m.id} className="flex items-center justify-between py-3">
            <div>
              <span className={`font-medium text-sm ${!m.is_active ? 'opacity-50' : ''}`}>{m.name_fr}</span>
              <span className="text-xs text-muted-foreground ml-2">{m.code}</span>
              {m.eta_min_days != null && <span className="text-xs text-muted-foreground ml-2">({m.eta_min_days}–{m.eta_max_days}j)</span>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setEditing({ ...m })}>Éditer</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ SIZE CLASSES ═══════════════════════
function SizeClassesPanel({ sizeClasses, onReload }: { sizeClasses: SizeClass[]; onReload: () => void }) {
  const [editing, setEditing] = useState<SizeClass | null>(null);
  const [isNew, setIsNew] = useState(false);

  const save = async () => {
    if (!editing) return;
    if (isNew) {
      const { error } = await supabase.from('shipping_size_classes').insert(editing as any);
      if (error) { toast.error(error.message); return; }
    } else {
      const { code, ...rest } = editing;
      const { error } = await supabase.from('shipping_size_classes').update(rest as any).eq('code', code);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Classe enregistrée');
    setEditing(null);
    onReload();
  };

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => { setIsNew(true); setEditing({ code: '', label_fr: '', label_en: '', weight_points: 1, is_active: true, sort_order: sizeClasses.length }); }}>
        <Plus size={14} className="mr-1" /> Ajouter
      </Button>

      {editing && (
        <div className="border border-border p-4 rounded-md space-y-3 bg-muted/30">
          <div className="grid grid-cols-4 gap-3">
            <div><Label className="text-xs">Code</Label><Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} disabled={!isNew} /></div>
            <div><Label className="text-xs">Label FR</Label><Input value={editing.label_fr} onChange={e => setEditing({ ...editing, label_fr: e.target.value })} /></div>
            <div><Label className="text-xs">Label EN</Label><Input value={editing.label_en || ''} onChange={e => setEditing({ ...editing, label_en: e.target.value })} /></div>
            <div><Label className="text-xs">Points poids</Label><Input type="number" step="0.1" value={editing.weight_points} onChange={e => setEditing({ ...editing, weight_points: +e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save size={13} className="mr-1" /> Enregistrer</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setIsNew(false); }}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {sizeClasses.map(sc => (
          <div key={sc.code} className="flex items-center justify-between py-3">
            <div>
              <span className="font-medium text-sm">{sc.label_fr}</span>
              <span className="text-xs text-muted-foreground ml-2">({sc.code}) — {sc.weight_points} pts</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setIsNew(false); setEditing({ ...sc }); }}>Éditer</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ RATE RULES ═══════════════════════
function RateRulesPanel({ rateRules, zones, methods, onReload }: { rateRules: RateRule[]; zones: Zone[]; methods: Method[]; onReload: () => void }) {
  const [editing, setEditing] = useState<RateRule | null>(null);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    if (!id) {
      const { error } = await supabase.from('shipping_rate_rules').insert(rest as any);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('shipping_rate_rules').update(rest as any).eq('id', id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Règle enregistrée');
    setEditing(null);
    onReload();
  };

  const deleteRule = async (id: string) => {
    await supabase.from('shipping_rate_rules').delete().eq('id', id);
    toast.success('Règle supprimée');
    onReload();
  };

  const zoneLabel = (id: string) => zones.find(z => z.id === id)?.name_fr ?? '?';
  const methodLabel = (id: string) => methods.find(m => m.id === id)?.name_fr ?? '?';

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => setEditing({ id: '', zone_id: zones[0]?.id || '', method_id: methods[0]?.id || '', min_subtotal_eur: 0, max_subtotal_eur: null, min_weight_points: 0, max_weight_points: null, price_eur: 0, is_active: true, priority: 100 })}>
        <Plus size={14} className="mr-1" /> Ajouter une règle
      </Button>

      {editing && (
        <div className="border border-border p-4 rounded-md space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Zone</Label>
              <Select value={editing.zone_id} onValueChange={v => setEditing({ ...editing, zone_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name_fr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Méthode</Label>
              <Select value={editing.method_id} onValueChange={v => setEditing({ ...editing, method_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{methods.map(m => <SelectItem key={m.id} value={m.id}>{m.name_fr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <div><Label className="text-xs">Min €</Label><Input type="number" step="0.01" value={editing.min_subtotal_eur} onChange={e => setEditing({ ...editing, min_subtotal_eur: +e.target.value })} /></div>
            <div><Label className="text-xs">Max €</Label><Input type="number" step="0.01" value={editing.max_subtotal_eur ?? ''} onChange={e => setEditing({ ...editing, max_subtotal_eur: e.target.value ? +e.target.value : null })} placeholder="∞" /></div>
            <div><Label className="text-xs">Min pts</Label><Input type="number" step="0.1" value={editing.min_weight_points} onChange={e => setEditing({ ...editing, min_weight_points: +e.target.value })} /></div>
            <div><Label className="text-xs">Max pts</Label><Input type="number" step="0.1" value={editing.max_weight_points ?? ''} onChange={e => setEditing({ ...editing, max_weight_points: e.target.value ? +e.target.value : null })} placeholder="∞" /></div>
            <div><Label className="text-xs">Prix €</Label><Input type="number" step="0.01" value={editing.price_eur} onChange={e => setEditing({ ...editing, price_eur: +e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-4">
            <div><Label className="text-xs">Priorité</Label><Input type="number" value={editing.priority} onChange={e => setEditing({ ...editing, priority: +e.target.value })} className="w-20" /></div>
            <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><Label className="text-xs">Active</Label></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save size={13} className="mr-1" /> Enregistrer</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-2">Zone</th><th className="pr-2">Méthode</th><th className="pr-2">Sous-total</th><th className="pr-2">Poids</th><th className="pr-2">Prix</th><th className="pr-2">Prio</th><th></th>
          </tr></thead>
          <tbody>
            {rateRules.map(r => (
              <tr key={r.id} className={`border-b ${!r.is_active ? 'opacity-40' : ''}`}>
                <td className="py-2 pr-2">{zoneLabel(r.zone_id)}</td>
                <td className="pr-2">{methodLabel(r.method_id)}</td>
                <td className="pr-2">{r.min_subtotal_eur}–{r.max_subtotal_eur ?? '∞'}€</td>
                <td className="pr-2">{r.min_weight_points}–{r.max_weight_points ?? '∞'}</td>
                <td className="pr-2 font-medium">{r.price_eur}€</td>
                <td className="pr-2">{r.priority}</td>
                <td className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ ...r })}>Éditer</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRule(r.id)}><Trash2 size={12} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════ FREE THRESHOLDS ═══════════════════════
function FreeThresholdsPanel({ thresholds, zones, methods, onReload }: { thresholds: FreeThreshold[]; zones: Zone[]; methods: Method[]; onReload: () => void }) {
  const [editing, setEditing] = useState<FreeThreshold | null>(null);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    if (!id) {
      const { error } = await supabase.from('shipping_free_thresholds').insert(rest as any);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('shipping_free_thresholds').update(rest as any).eq('id', id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Seuil enregistré');
    setEditing(null);
    onReload();
  };

  const deleteThreshold = async (id: string) => {
    await supabase.from('shipping_free_thresholds').delete().eq('id', id);
    toast.success('Seuil supprimé');
    onReload();
  };

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => setEditing({ id: '', zone_id: zones[0]?.id || '', method_id: null, threshold_eur: 0, is_active: true })}>
        <Plus size={14} className="mr-1" /> Ajouter un seuil
      </Button>

      {editing && (
        <div className="border border-border p-4 rounded-md space-y-3 bg-muted/30">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Zone</Label>
              <Select value={editing.zone_id} onValueChange={v => setEditing({ ...editing, zone_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name_fr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Méthode (vide = toutes)</Label>
              <Select value={editing.method_id || '__all'} onValueChange={v => setEditing({ ...editing, method_id: v === '__all' ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Toutes</SelectItem>
                  {methods.map(m => <SelectItem key={m.id} value={m.id}>{m.name_fr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Seuil (€)</Label><Input type="number" step="0.01" value={editing.threshold_eur} onChange={e => setEditing({ ...editing, threshold_eur: +e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save size={13} className="mr-1" /> Enregistrer</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {thresholds.map(t => (
          <div key={t.id} className="flex items-center justify-between py-3">
            <div className="text-sm">
              <span className="font-medium">{zones.find(z => z.id === t.zone_id)?.name_fr}</span>
              {t.method_id && <span className="text-muted-foreground ml-2">({methods.find(m => m.id === t.method_id)?.name_fr})</span>}
              <span className="ml-2">≥ {t.threshold_eur}€ → <span className="text-primary font-medium">Offerte</span></span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing({ ...t })}>Éditer</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteThreshold(t.id)}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ OPTIONS PRICING ═══════════════════════
function OptionsPricingPanel({ options, optionPrices, zones, methods, onReload }: { options: ShipOption[]; optionPrices: OptionPrice[]; zones: Zone[]; methods: Method[]; onReload: () => void }) {
  const toggleOption = async (opt: ShipOption) => {
    await supabase.from('shipping_options').update({ is_active: !opt.is_active } as any).eq('id', opt.id);
    toast.success('Option mise à jour');
    onReload();
  };

  const [editPrice, setEditPrice] = useState<OptionPrice | null>(null);

  const savePrice = async () => {
    if (!editPrice) return;
    const { id, ...rest } = editPrice;
    if (!id) {
      await supabase.from('shipping_option_prices').insert(rest as any);
    } else {
      await supabase.from('shipping_option_prices').update(rest as any).eq('id', id);
    }
    toast.success('Prix enregistré');
    setEditPrice(null);
    onReload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Options disponibles</h3>
        <div className="space-y-2">
          {options.map(o => (
            <div key={o.id} className="flex items-center gap-3">
              <Switch checked={o.is_active} onCheckedChange={() => toggleOption(o)} />
              <span className="text-sm">{o.name_fr} <span className="text-muted-foreground">({o.code})</span></span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Prix des options</h3>
          <Button size="sm" variant="outline" onClick={() => setEditPrice({ id: '', option_id: options[0]?.id || '', zone_id: null, method_id: null, price_eur: 0, is_active: true })}>
            <Plus size={14} className="mr-1" /> Ajouter
          </Button>
        </div>

        {editPrice && (
          <div className="border border-border p-4 rounded-md space-y-3 bg-muted/30 mb-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Option</Label>
                <Select value={editPrice.option_id} onValueChange={v => setEditPrice({ ...editPrice, option_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{options.map(o => <SelectItem key={o.id} value={o.id}>{o.name_fr}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Zone (vide = global)</Label>
                <Select value={editPrice.zone_id || '__all'} onValueChange={v => setEditPrice({ ...editPrice, zone_id: v === '__all' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Global</SelectItem>
                    {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name_fr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Méthode (vide = toutes)</Label>
                <Select value={editPrice.method_id || '__all'} onValueChange={v => setEditPrice({ ...editPrice, method_id: v === '__all' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Toutes</SelectItem>
                    {methods.map(m => <SelectItem key={m.id} value={m.id}>{m.name_fr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Prix €</Label><Input type="number" step="0.01" value={editPrice.price_eur} onChange={e => setEditPrice({ ...editPrice, price_eur: +e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={savePrice}><Save size={13} className="mr-1" /> Enregistrer</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditPrice(null)}>Annuler</Button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {optionPrices.map(op => (
            <div key={op.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium">{options.find(o => o.id === op.option_id)?.name_fr}</span>
                <span className="text-muted-foreground ml-2">
                  {op.zone_id ? zones.find(z => z.id === op.zone_id)?.name_fr : 'Global'}
                  {op.method_id && ` / ${methods.find(m => m.id === op.method_id)?.name_fr}`}
                </span>
                <span className="ml-2 font-medium">{op.price_eur}€</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditPrice({ ...op })}>Éditer</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ TAX ═══════════════════════
function TaxPanel({ taxSettings, onReload }: { taxSettings: TaxSettings; onReload: () => void }) {
  const [settings, setSettings] = useState(taxSettings);

  const save = async () => {
    const { error } = await supabase.from('tax_settings').update({
      vat_enabled: settings.vat_enabled,
      vat_rate: settings.vat_rate,
    } as any).eq('id', 1);
    if (error) { toast.error(error.message); return; }
    toast.success('TVA mise à jour');
    onReload();
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-3">
        <Switch checked={settings.vat_enabled} onCheckedChange={v => setSettings({ ...settings, vat_enabled: v })} />
        <Label>TVA activée</Label>
      </div>
      {settings.vat_enabled && (
        <div className="flex items-center gap-2">
          <Label className="text-xs">Taux (%)</Label>
          <Input type="number" step="0.1" value={settings.vat_rate} onChange={e => setSettings({ ...settings, vat_rate: +e.target.value })} className="w-24" />
        </div>
      )}
      {!settings.vat_enabled && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <p>La TVA est désactivée. Les prix affichés sont TTC par défaut. Activez la TVA pour la facturer séparément.</p>
        </div>
      )}
      <Button size="sm" onClick={save}><Save size={13} className="mr-1" /> Enregistrer</Button>
    </div>
  );
}

// ═══════════════════════ SIMULATOR ═══════════════════════
function SimulatorPanel({ zones, zoneCountries, sizeClasses, methods, rateRules, freeThresholds, options, optionPrices }: {
  zones: Zone[]; zoneCountries: ZoneCountry[]; sizeClasses: SizeClass[]; methods: Method[];
  rateRules: RateRule[]; freeThresholds: FreeThreshold[]; options: ShipOption[]; optionPrices: OptionPrice[];
}) {
  const [countryCode, setCountryCode] = useState('FR');
  const [subtotalEur, setSubtotalEur] = useState('50');
  const [weightPoints, setWeightPoints] = useState('2');
  const [methodId, setMethodId] = useState(methods.find(m => m.is_active)?.id || '');
  const [optInsurance, setOptInsurance] = useState(false);
  const [optSignature, setOptSignature] = useState(false);
  const [optGiftWrap, setOptGiftWrap] = useState(false);

  const activeMethods = methods.filter(m => m.is_active);

  // Build a fake cart item from subtotal + weight
  const subtotalCents = Math.round((parseFloat(subtotalEur) || 0) * 100);
  const wp = parseFloat(weightPoints) || 0;

  // We create a synthetic size class to match the entered weight points
  const syntheticSizeCode = '__SIM__';
  const augmentedSizeClasses = [...sizeClasses, { code: syntheticSizeCode, label_fr: 'Sim', label_en: null, weight_points: wp, is_active: true, sort_order: 999 }];

  const result = calculateShipping(
    {
      cartItems: [{ productId: 'sim', quantity: 1, priceEurCents: subtotalCents, madeToOrder: false, leadTimeDays: null, sizeClassCode: syntheticSizeCode }],
      countryCode,
      methodId,
      selectedOptions: { insurance: optInsurance, signature: optSignature, gift_wrap: optGiftWrap },
      shipmentPreference: 'single',
    },
    { zones, zoneCountries, sizeClasses: augmentedSizeClasses, methods, rateRules, freeThresholds, optionPrices, options: options as any }
  );

  const errorLabels: Record<string, string> = {
    NO_ZONE: 'Aucune zone configurée pour ce pays',
    NO_METHOD: 'Méthode non trouvée ou inactive',
    NO_RATE_RULE: 'Aucune règle de tarif ne correspond à ces paramètres',
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Simulez un calcul de livraison en saisissant un pays, un montant panier et un poids (points).</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-xs">Pays</Label>
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map(c => <SelectItem key={c.code} value={c.code}>{c.label_fr} ({c.code})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Montant panier (€)</Label>
          <Input type="number" min="0" step="0.01" value={subtotalEur} onChange={e => setSubtotalEur(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Points poids</Label>
          <Input type="number" min="0" step="0.1" value={weightPoints} onChange={e => setWeightPoints(e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1">
            Réf : {sizeClasses.map(sc => `${sc.label_fr}=${sc.weight_points}`).join(', ')}
          </p>
        </div>
        <div>
          <Label className="text-xs">Méthode</Label>
          <Select value={methodId} onValueChange={setMethodId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {activeMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.name_fr}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={optInsurance} onChange={e => setOptInsurance(e.target.checked)} className="accent-primary" /> Assurance
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={optSignature} onChange={e => setOptSignature(e.target.checked)} className="accent-primary" /> Signature
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={optGiftWrap} onChange={e => setOptGiftWrap(e.target.checked)} className="accent-primary" /> Colis cadeau
        </label>
      </div>

      {/* ─── Result ─── */}
      <div className="border border-border rounded-lg p-5 space-y-3 bg-muted/30">
        <h3 className="text-sm font-medium tracking-wide uppercase flex items-center gap-2">
          <FlaskConical size={14} /> Résultat
        </h3>

        {result.error ? (
          <div className="flex items-start gap-2 text-destructive text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{errorLabels[result.error] || result.error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs block">Zone</span>
              <span className="font-medium">{result.zone?.name_fr ?? '—'}</span>
              {result.customsNotice && <span className="block text-xs text-destructive mt-0.5">🛃 Douanes à charge client</span>}
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Méthode</span>
              <span className="font-medium">{result.method?.name_fr ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Délai transport</span>
              <span className="font-medium">{result.etaMinDays}–{result.etaMaxDays} jours</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Frais livraison</span>
              <span className="font-medium text-lg">
                {result.isFreeShipping ? (
                  <span className="text-green-600">Gratuit</span>
                ) : (
                  `${(result.shippingPriceEur / 100).toFixed(2)} €`
                )}
              </span>
            </div>
            {result.optionsPriceEur > 0 && (
              <div>
                <span className="text-muted-foreground text-xs block">Dont options</span>
                <span className="font-medium">{(result.optionsPriceEur / 100).toFixed(2)} €</span>
              </div>
            )}
            {result.isFreeShipping && (
              <div>
                <span className="text-muted-foreground text-xs block">Seuil offert</span>
                <span className="font-medium text-green-600">✓ Atteint</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminShipping;
