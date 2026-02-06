import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Save, Trash2 } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: any;
}

const defaultKeys = [
  { key: 'brand', label: 'Marque (couleurs, réseaux sociaux)' },
  { key: 'shipping_rules', label: 'Règles de livraison' },
  { key: 'legal_mentions', label: 'Mentions légales' },
  { key: 'legal_cgv', label: 'CGV' },
  { key: 'legal_privacy', label: 'Politique de confidentialité' },
  { key: 'legal_cookies', label: 'Cookies' },
  { key: 'supported_currencies', label: 'Devises supportées' },
  { key: 'supported_countries', label: 'Pays supportés' },
  { key: 'email_templates', label: 'Templates email' },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('site_settings').select('*').order('key');
    setSettings(data || []);
  }

  function startEdit(setting: Setting) {
    setEditingKey(setting.key);
    setEditValue(JSON.stringify(setting.value, null, 2));
  }

  async function handleSave(key: string) {
    let parsed: any;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      toast.error('JSON invalide');
      return;
    }
    const existing = settings.find(s => s.key === key);
    let error;
    if (existing) {
      ({ error } = await supabase.from('site_settings').update({ value: parsed }).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('site_settings').insert({ key, value: parsed }));
    }
    if (error) toast.error(error.message);
    else { toast.success('Enregistré'); setEditingKey(null); load(); }
  }

  async function handleCreate(key: string) {
    const { error } = await supabase.from('site_settings').insert({ key, value: {} });
    if (error) toast.error(error.message);
    else { toast.success('Créé'); load(); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce réglage ?')) return;
    const { error } = await supabase.from('site_settings').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Supprimé'); load(); }
  }

  const existingKeys = new Set(settings.map(s => s.key));
  const missingDefaults = defaultKeys.filter(d => !existingKeys.has(d.key));

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Réglages</h1>

      {missingDefaults.length > 0 && (
        <div className="mb-8">
          <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mb-3">Réglages manquants — cliquez pour créer :</p>
          <div className="flex flex-wrap gap-2">
            {missingDefaults.map(d => (
              <button
                key={d.key}
                onClick={() => handleCreate(d.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-body border border-dashed border-border hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={12} /> {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {settings.map(s => {
          const meta = defaultKeys.find(d => d.key === s.key);
          const isEditing = editingKey === s.key;

          return (
            <div key={s.id} className="border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-body font-medium">{meta?.label || s.key}</p>
                  <p className="text-[10px] tracking-wider uppercase text-muted-foreground font-body">{s.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button onClick={() => startEdit(s)} className="text-xs font-body text-primary hover:underline">Modifier</button>
                  )}
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full border border-border bg-transparent px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-y"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(s.key)} className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2 text-[10px] tracking-wider uppercase font-body hover:bg-primary transition-colors">
                      <Save size={12} /> Enregistrer
                    </button>
                    <button onClick={() => setEditingKey(null)} className="px-4 py-2 text-[10px] tracking-wider uppercase font-body border border-border hover:border-foreground transition-colors">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="text-xs font-mono text-muted-foreground bg-muted/30 p-3 overflow-x-auto max-h-24 overflow-y-auto">
                  {JSON.stringify(s.value, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSettings;
