import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { ComingSoonConfig } from '@/hooks/useComingSoon';

const DEFAULT: ComingSoonConfig = {
  enabled: false,
  countdown_date: '2026-02-13T17:00:00',
  message_fr: 'Notre site sera bientôt ouvert au public. Restez connectés.',
  message_en: 'Our site will be open to the public soon. Stay tuned.',
  youtube_ids: ['P_EsmWqLN6w', 'UPl-qZI1cPU'],
  images: Array.from({ length: 10 }, (_, i) => `/images/coming-soon/${i + 1}.jpeg`),
};

const AdminComingSoon = () => {
  const [config, setConfig] = useState<ComingSoonConfig>(DEFAULT);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newYtUrl, setNewYtUrl] = useState('');

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'coming_soon')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettingId(data.id);
          setConfig({ ...DEFAULT, ...(data.value as any) });
        }
      });
  }, []);

  const extractYtId = (url: string) => {
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] || url.trim();
  };

  const save = async () => {
    setSaving(true);
    const payload = { key: 'coming_soon', value: config as any };
    let error;
    if (settingId) {
      ({ error } = await supabase.from('site_settings').update({ value: config as any }).eq('id', settingId));
    } else {
      const res = await supabase.from('site_settings').insert(payload).select().single();
      error = res.error;
      if (res.data) setSettingId(res.data.id);
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Enregistré');
  };

  const addYt = () => {
    const id = extractYtId(newYtUrl);
    if (!id) return;
    setConfig(p => ({ ...p, youtube_ids: [...p.youtube_ids, id] }));
    setNewYtUrl('');
  };

  const removeYt = (idx: number) => {
    setConfig(p => ({ ...p, youtube_ids: p.youtube_ids.filter((_, i) => i !== idx) }));
  };

  const addImage = (url: string) => {
    setConfig(p => ({ ...p, images: [...p.images, url] }));
  };

  const removeImage = (idx: number) => {
    setConfig(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  };

  const inputClass = 'w-full border border-border bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Coming Soon</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors disabled:opacity-50">
          <Save size={14} /> {saving ? '...' : 'Enregistrer'}
        </button>
      </div>

      {/* Enable toggle */}
      <div className="border border-border p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-body font-medium">Activer la page Coming Soon</p>
          <p className="text-[10px] text-muted-foreground font-body tracking-wider">Les visiteurs non-admin seront redirigés</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => setConfig(p => ({ ...p, enabled: v }))} />
      </div>

      {/* Countdown */}
      <div className="border border-border p-5 mb-6">
        <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">Date & heure du décompte</label>
        <input
          type="datetime-local"
          value={config.countdown_date.slice(0, 16)}
          onChange={e => setConfig(p => ({ ...p, countdown_date: e.target.value }))}
          className={inputClass}
        />
      </div>

      {/* Messages */}
      <div className="border border-border p-5 mb-6 space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">Message (FR)</label>
          <textarea value={config.message_fr} onChange={e => setConfig(p => ({ ...p, message_fr: e.target.value }))} className={inputClass + ' min-h-[80px] resize-y'} />
        </div>
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">Message (EN)</label>
          <textarea value={config.message_en} onChange={e => setConfig(p => ({ ...p, message_en: e.target.value }))} className={inputClass + ' min-h-[80px] resize-y'} />
        </div>
      </div>

      {/* YouTube Videos */}
      <div className="border border-border p-5 mb-6">
        <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">Vidéos YouTube</label>
        <div className="space-y-2 mb-3">
          {config.youtube_ids.map((id, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-body text-muted-foreground truncate">https://youtube.com/watch?v={id}</span>
              <button onClick={() => removeYt(i)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Coller un lien YouTube..."
            value={newYtUrl}
            onChange={e => setNewYtUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addYt())}
            className={inputClass}
          />
          <button onClick={addYt} className="px-3 border border-border hover:border-primary transition-colors"><Plus size={16} /></button>
        </div>
      </div>

      {/* Images */}
      <div className="border border-border p-5 mb-6">
        <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-3">Photos du carrousel</label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {config.images.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
        <UploadBtn onUploaded={addImage} />
      </div>
    </div>
  );
};

function UploadBtn({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `coming-soon/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
    if (ref.current) ref.current.value = '';
  };
  return (
    <button onClick={() => ref.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 border border-dashed border-border hover:border-primary text-xs tracking-wider uppercase font-body transition-colors disabled:opacity-50">
      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Ajouter une photo
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
    </button>
  );
}

export default AdminComingSoon;
