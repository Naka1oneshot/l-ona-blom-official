import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface Props {
  collection?: any;
  onSave: () => void;
  onCancel: () => void;
}

const AdminCollectionForm = ({ collection, onSave, onCancel }: Props) => {
  const isNew = !collection;
  const [form, setForm] = useState({
    slug: collection?.slug || '',
    title_fr: collection?.title_fr || '',
    title_en: collection?.title_en || '',
    subtitle_fr: collection?.subtitle_fr || '',
    subtitle_en: collection?.subtitle_en || '',
    narrative_fr: collection?.narrative_fr || '',
    narrative_en: collection?.narrative_en || '',
    cover_image: collection?.cover_image || '',
    tags: (collection?.tags || []).join(', '),
    published_at: collection?.published_at ? new Date(collection.published_at).toISOString().slice(0, 10) : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      slug: form.slug,
      title_fr: form.title_fr,
      title_en: form.title_en,
      subtitle_fr: form.subtitle_fr,
      subtitle_en: form.subtitle_en,
      narrative_fr: form.narrative_fr,
      narrative_en: form.narrative_en,
      cover_image: form.cover_image,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Date de publication</label><input type="date" value={form.published_at} onChange={e => set('published_at', e.target.value)} className={inputClass} /></div>
        </div>

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

        <div><label className={labelClass}>Image de couverture (URL)</label><input value={form.cover_image} onChange={e => set('cover_image', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Tags (séparés par virgule)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputClass} /></div>

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
