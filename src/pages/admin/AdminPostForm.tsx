import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import TranslateButton from '@/components/admin/TranslateButton';
import RichArticleEditor from '@/components/admin/RichArticleEditor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Props {
  post?: any;
  onSave: () => void;
  onCancel: () => void;
}

const AdminPostForm = ({ post, onSave, onCancel }: Props) => {
  const isNew = !post;
  const [form, setForm] = useState({
    slug: post?.slug || '',
    title_fr: post?.title_fr || '',
    title_en: post?.title_en || '',
    lead_fr: post?.lead_fr || '',
    lead_en: post?.lead_en || '',
    content_fr_json: post?.content_fr_json || null,
    content_en_json: post?.content_en_json || null,
    cover_image: post?.cover_image || '',
    tags: (post?.tags || []).join(', '),
    published_at: post?.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : '',
    category: post?.category || 'article',
    event_date: post?.event_date ? new Date(post.event_date).toISOString().slice(0, 16) : '',
    event_link: post?.event_link || '',
    event_location: post?.event_location || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload: any = {
      slug: form.slug,
      title_fr: form.title_fr,
      title_en: form.title_en,
      lead_fr: form.lead_fr,
      lead_en: form.lead_en,
      content_fr_json: form.content_fr_json,
      content_en_json: form.content_en_json,
      // Keep plain-text fallback for backwards compat / excerpts
      content_fr: extractPlainText(form.content_fr_json),
      content_en: extractPlainText(form.content_en_json),
      cover_image: form.cover_image,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      category: form.category,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      event_link: form.event_link || '',
      event_location: form.event_location || '',
    };
    let error;
    if (isNew) {
      ({ error } = await supabase.from('posts').insert(payload));
    } else {
      ({ error } = await supabase.from('posts').update(payload).eq('id', post.id));
    }
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success(isNew ? 'Article créé' : 'Article mis à jour'); onSave(); }
  };

  const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";
  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-2 text-xs tracking-wider uppercase font-body text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Retour
      </button>
      <h1 className="text-display text-3xl mb-8">{isNew ? 'Nouvel Article' : "Modifier l'Article"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <ImageUpload
          value={form.cover_image}
          onChange={(url) => set('cover_image', url)}
          label="Image de couverture"
          folder="posts"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Date de publication</label><input type="date" value={form.published_at} onChange={e => set('published_at', e.target.value)} className={inputClass} /></div>
          <div>
            <label className={labelClass}>Catégorie</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
              <option value="article">Article</option>
              <option value="interview">Interview</option>
              <option value="event">Événement</option>
            </select>
          </div>
        </div>

        {form.category === 'event' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Date de l'événement</label>
              <input type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lieu / Adresse</label>
              <input value={form.event_location} onChange={e => set('event_location', e.target.value)} className={inputClass} placeholder="Ex: 12 Rue de la Paix, 75002 Paris" />
            </div>
            <div>
              <label className={labelClass}>Lien billetterie (URL)</label>
              <input type="url" value={form.event_link} onChange={e => set('event_link', e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
          </div>
        )}

        {/* Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Titre FR</label><input value={form.title_fr} onChange={e => set('title_fr', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Titre EN</label><input value={form.title_en} onChange={e => set('title_en', e.target.value)} className={inputClass} required /></div>
        </div>

        {/* Leads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Chapô FR</label><textarea value={form.lead_fr} onChange={e => set('lead_fr', e.target.value)} className={`${inputClass} min-h-[60px] resize-none`} placeholder="Introduction de l'article…" /></div>
          <div><label className={labelClass}>Chapô EN</label><textarea value={form.lead_en} onChange={e => set('lead_en', e.target.value)} className={`${inputClass} min-h-[60px] resize-none`} placeholder="Article introduction…" /></div>
        </div>

        {/* Rich content editor with FR/EN tabs */}
        <div>
          <label className={labelClass}>Contenu de l'article</label>
          <Tabs defaultValue="fr" className="mt-2">
            <TabsList className="bg-transparent gap-1 mb-2">
              <TabsTrigger value="fr" className="text-xs tracking-[0.15em] uppercase font-body px-4 py-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none border border-foreground/20 data-[state=active]:border-foreground transition-all">
                Français
              </TabsTrigger>
              <TabsTrigger value="en" className="text-xs tracking-[0.15em] uppercase font-body px-4 py-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-none border border-foreground/20 data-[state=active]:border-foreground transition-all">
                English
              </TabsTrigger>
            </TabsList>
            <TabsContent value="fr">
              <RichArticleEditor
                content={form.content_fr_json}
                onChange={(json) => set('content_fr_json', json)}
                placeholder="Rédigez le contenu de l'article en français…"
              />
            </TabsContent>
            <TabsContent value="en">
              <RichArticleEditor
                content={form.content_en_json}
                onChange={(json) => set('content_en_json', json)}
                placeholder="Write article content in English…"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div><label className={labelClass}>Tags (séparés par virgule)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputClass} /></div>

        <TranslateButton
          frFields={{
            title_fr: form.title_fr,
            lead_fr: form.lead_fr,
            content_fr: extractPlainText(form.content_fr_json),
          }}
          onTranslated={(translations) => {
            setForm(prev => ({
              ...prev,
              ...(translations.title_en && { title_en: translations.title_en }),
              ...(translations.lead_en && { lead_en: translations.lead_en }),
            }));
          }}
        />

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

/** Extract plain text from TipTap JSON for excerpts/fallback */
function extractPlainText(json: any): string {
  if (!json || !json.content) return '';
  const texts: string[] = [];
  function walk(node: any) {
    if (node.text) texts.push(node.text);
    if (node.content) node.content.forEach(walk);
  }
  walk(json);
  return texts.join(' ');
}

export default AdminPostForm;
