import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { ImageUpload, VideoUpload, MultiImageUpload } from '@/components/admin/ImageUpload';
import TranslateButton from '@/components/admin/TranslateButton';

interface Props {
  collection?: any;
  onSave: () => void;
  onCancel: () => void;
}

const AdminCollectionForm = ({ collection, onSave, onCancel }: Props) => {
  const isNew = !collection;
  const [form, setForm] = useState({
    reference_code: collection?.reference_code || '',
    slug: collection?.slug || '',
    title_fr: collection?.title_fr || '',
    title_en: collection?.title_en || '',
    subtitle_fr: collection?.subtitle_fr || '',
    subtitle_en: collection?.subtitle_en || '',
    narrative_fr: collection?.narrative_fr || '',
    narrative_en: collection?.narrative_en || '',
    cover_image: collection?.cover_image || '',
    cover_video: collection?.cover_video || '',
    gallery_images: collection?.gallery_images || [],
    featured_image_indexes: collection?.featured_image_indexes || [0, 1],
    tags: (collection?.tags || []).join(', '),
    published_at: collection?.published_at ? new Date(collection.published_at).toISOString().slice(0, 10) : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      reference_code: form.reference_code || null,
      slug: form.slug,
      title_fr: form.title_fr,
      title_en: form.title_en,
      subtitle_fr: form.subtitle_fr,
      subtitle_en: form.subtitle_en,
      narrative_fr: form.narrative_fr,
      narrative_en: form.narrative_en,
      cover_image: form.cover_image,
      cover_video: form.cover_video,
      gallery_images: form.gallery_images,
      featured_image_indexes: form.featured_image_indexes,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from('collections').insert(payload));
    } else {
      ({ error } = await supabase.from('collections').update(payload).eq('id', collection.id));
    }
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success(isNew ? 'Collection créée' : 'Collection mise à jour'); onSave(); }
  };

  const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";
  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-2 text-xs tracking-wider uppercase font-body text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Retour
      </button>
      <h1 className="text-display text-3xl mb-8">{isNew ? 'Nouvelle Collection' : 'Modifier la Collection'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <ImageUpload
          value={form.cover_image}
          onChange={(url) => set('cover_image', url)}
          label="Image de couverture"
          folder="collections"
        />

        <VideoUpload
          value={form.cover_video}
          onChange={(url) => set('cover_video', url)}
          label="Vidéo de couverture"
          folder="collections"
        />

        <MultiImageUpload
          value={form.gallery_images}
          onChange={(urls) => set('gallery_images', urls)}
          label="Galerie d'images"
          folder="collections"
        />

        {/* Reference code */}
        <div className="border border-border rounded-lg p-4 space-y-2">
          <div>
            <label className={labelClass}>Référence Collection</label>
            <input value={form.reference_code} onChange={e => set('reference_code', e.target.value)} className={`${inputClass} max-w-xs`} placeholder="COL001" />
          </div>
          <p className="flex items-start gap-1.5 text-[10px] text-amber-500/90 font-body leading-relaxed">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>Cette référence est utilisée comme identifiant unique lors de l'import Excel. La modifier dissociera cette collection des futures lignes du fichier utilisant l'ancienne référence.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Date de publication</label><input type="date" value={form.published_at} onChange={e => set('published_at', e.target.value)} className={inputClass} /></div>
        </div>

        <TranslateButton
          frFields={{
            title_fr: form.title_fr,
            subtitle_fr: form.subtitle_fr,
            narrative_fr: form.narrative_fr,
          }}
          onTranslated={(t) => setForm(p => ({ ...p, ...t }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Titre FR</label><input value={form.title_fr} onChange={e => set('title_fr', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Titre EN</label><input value={form.title_en} onChange={e => set('title_en', e.target.value)} className={inputClass} required /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Sous-titre FR</label><input value={form.subtitle_fr} onChange={e => set('subtitle_fr', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Sous-titre EN</label><input value={form.subtitle_en} onChange={e => set('subtitle_en', e.target.value)} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Récit FR</label><textarea value={form.narrative_fr} onChange={e => set('narrative_fr', e.target.value)} className={`${inputClass} min-h-[120px] resize-none`} /></div>
          <div><label className={labelClass}>Récit EN</label><textarea value={form.narrative_en} onChange={e => set('narrative_en', e.target.value)} className={`${inputClass} min-h-[120px] resize-none`} /></div>
        </div>

        <div><label className={labelClass}>Tags (séparés par virgule)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputClass} /></div>

        {/* Featured images picker */}
        {form.gallery_images.length > 0 && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <label className={labelClass}>Photos mises en avant sur /collections (sélectionnez {Math.min(2, form.gallery_images.length)})</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {form.gallery_images.map((img: string, idx: number) => {
                const isSelected = form.featured_image_indexes.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const maxPick = Math.min(2, form.gallery_images.length);
                      let next: number[];
                      if (isSelected) {
                        next = form.featured_image_indexes.filter((i: number) => i !== idx);
                      } else {
                        next = [...form.featured_image_indexes, idx];
                        if (next.length > maxPick) next = next.slice(-maxPick);
                      }
                      set('featured_image_indexes', next);
                    }}
                    className={`relative aspect-square overflow-hidden rounded border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-foreground/20'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-body font-semibold">
                          {form.featured_image_indexes.indexOf(idx) + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground font-body">Ces images apparaîtront comme miniatures sous la description sur la page Collections.</p>
          </div>
        )}

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

export default AdminCollectionForm;
