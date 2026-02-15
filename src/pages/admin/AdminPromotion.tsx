import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Video, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface PromoConfig {
  video_url: string;
  video_type: 'youtube' | 'upload';
  button_text: string;
  button_link: string;
}

const defaultConfig: PromoConfig = {
  video_url: '',
  video_type: 'youtube',
  button_text: 'Réserver Maintenant',
  button_link: '/boutique',
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

const AdminPromotion = () => {
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<PromoConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('site_features')
        .select('*')
        .eq('key', 'hero_promotion')
        .maybeSingle();
      if (data) {
        setEnabled(data.enabled);
        setConfig({ ...defaultConfig, ...data.config });
      }
    })();
  }, []);

  const set = (key: keyof PromoConfig, value: string) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('site_features')
      .upsert({ key: 'hero_promotion', enabled, config }, { onConflict: 'key' });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Promotion enregistrée');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Fichier vidéo requis');
      return;
    }
    setUploading(true);
    const path = `promo/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
    setConfig(prev => ({ ...prev, video_url: urlData.publicUrl, video_type: 'upload' }));
    setUploading(false);
    toast.success('Vidéo importée');
  };

  const ytId = config.video_type === 'youtube' ? extractYouTubeId(config.video_url) : null;

  const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Promotion Vidéo</h1>
        <button
          onClick={() => { setEnabled(!enabled); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body transition-colors ${
            enabled
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          {enabled ? 'Activée' : 'Désactivée'}
        </button>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Video source */}
        <div>
          <label className={labelClass}>Source vidéo</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => set('video_type', 'youtube')}
              className={`px-4 py-2 text-xs tracking-wider uppercase font-body border transition-colors ${
                config.video_type === 'youtube'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              }`}
            >
              YouTube
            </button>
            <button
              type="button"
              onClick={() => set('video_type', 'upload')}
              className={`px-4 py-2 text-xs tracking-wider uppercase font-body border transition-colors ${
                config.video_type === 'upload'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              }`}
            >
              Importer
            </button>
          </div>

          {config.video_type === 'youtube' ? (
            <div>
              <label className={labelClass}>URL YouTube</label>
              <input
                value={config.video_url}
                onChange={e => set('video_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inputClass}
              />
              {ytId && (
                <div className="mt-3 border border-border aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className={labelClass}>Fichier vidéo</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleUpload}
                className={inputClass}
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-muted-foreground font-body mt-1">Import en cours…</p>}
              {config.video_url && config.video_type === 'upload' && (
                <div className="mt-3 border border-border aspect-video">
                  <video src={config.video_url} controls className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Button config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Texte du bouton</label>
            <input
              value={config.button_text}
              onChange={e => set('button_text', e.target.value)}
              className={inputClass}
              placeholder="Réserver Maintenant"
            />
          </div>
          <div>
            <label className={labelClass}>Lien du bouton</label>
            <div className="flex gap-2">
              <input
                value={config.button_link}
                onChange={e => set('button_link', e.target.value)}
                className={inputClass}
                placeholder="/boutique ou https://..."
              />
              {config.button_link && (
                <a href={config.button_link} target="_blank" rel="noopener noreferrer" className="flex items-center px-2 text-muted-foreground hover:text-foreground">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Preview info */}
        {enabled && config.video_url && (
          <div className="border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-body text-primary">
              ✓ La promotion est active. La vidéo remplacera la couverture de la page d'accueil avec le bouton « {config.button_text} ».
            </p>
          </div>
        )}

        {/* Save */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors disabled:opacity-50"
          >
            {saving ? '...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPromotion;
