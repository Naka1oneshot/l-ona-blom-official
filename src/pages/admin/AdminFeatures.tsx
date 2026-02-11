import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface Feature {
  key: string;
  enabled: boolean;
  config: Record<string, any>;
}

const AdminFeatures = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await (supabase as any).from('site_features').select('*').order('key');
    setFeatures(data || []);
    setLoading(false);
  }

  async function toggle(key: string, field: string, value: boolean) {
    if (field === 'enabled') {
      const { error } = await (supabase as any)
        .from('site_features')
        .update({ enabled: value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) { toast.error(error.message); return; }
    } else {
      const feat = features.find(f => f.key === key);
      if (!feat) return;
      const newConfig = { ...feat.config, [field]: value };
      const { error } = await (supabase as any)
        .from('site_features')
        .update({ config: newConfig, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Mis à jour');
    load();
  }

  const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

  if (loading) return <p className="text-sm font-body text-muted-foreground">Chargement…</p>;

  const tryon = features.find(f => f.key === 'virtual_tryon');

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Fonctionnalités</h1>

      {tryon && (
        <div className="border border-border p-6 space-y-5 max-w-lg">
          <h2 className="text-display text-lg">Essayage virtuel</h2>
          <p className="text-[10px] font-body text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded">
            Mode : {tryon.config?.mode === 'ai_leffa' ? 'IA via fal.ai (Leffa)' : 'Overlay manuel'}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Activer l'essayage virtuel</p>
              <p className="text-[11px] text-muted-foreground font-body">Affiche le bouton dans le panier</p>
            </div>
            <button
              onClick={() => toggle('virtual_tryon', 'enabled', !tryon.enabled)}
              className="text-primary"
            >
              {tryon.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-muted-foreground" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Autoriser sans PNG détourée</p>
              <p className="text-[11px] text-muted-foreground font-body">Utilise l'image produit portée comme fallback</p>
            </div>
            <button
              onClick={() => toggle('virtual_tryon', 'allow_without_png', !tryon.config?.allow_without_png)}
              className="text-primary"
            >
              {tryon.config?.allow_without_png ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-muted-foreground" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatures;
