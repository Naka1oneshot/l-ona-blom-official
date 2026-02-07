import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { MultiImageUpload } from '@/components/admin/ImageUpload';
import TranslateButton from '@/components/admin/TranslateButton';
import { useCategories } from '@/hooks/useCategories';
import EditorialBlocksBuilder from '@/components/product/EditorialBlocksBuilder';
import type { EditorialBlock } from '@/types/editorial';

interface Props {
  product?: any;
  onSave: () => void;
  onCancel: () => void;
}

const AdminProductForm = ({ product, onSave, onCancel }: Props) => {
  const isNew = !product;
  const { groups } = useCategories();
  const [form, setForm] = useState({
    slug: product?.slug || '',
    status: product?.status || 'draft',
    category: product?.category || '',
    category_id: product?.category_id || '',
    name_fr: product?.name_fr || '',
    name_en: product?.name_en || '',
    description_fr: product?.description_fr || '',
    description_en: product?.description_en || '',
    story_fr: product?.story_fr || '',
    story_en: product?.story_en || '',
    materials_fr: product?.materials_fr || '',
    materials_en: product?.materials_en || '',
    care_fr: product?.care_fr || '',
    care_en: product?.care_en || '',
    base_price_eur: product?.base_price_eur || 0,
    made_to_order: product?.made_to_order || false,
    made_to_order_min_days: product?.made_to_order_min_days || null,
    made_to_order_max_days: product?.made_to_order_max_days || null,
    made_to_measure: product?.made_to_measure || false,
    preorder: product?.preorder || false,
    preorder_ship_date_estimate: product?.preorder_ship_date_estimate || '',
    sizes: (product?.sizes || []).join(', '),
    colors: (product?.colors || []).join(', '),
    materials: (product?.materials || []).join(', '),
    braiding_options: (product?.braiding_options || []).join(', '),
    stock_qty: product?.stock_qty ?? '',
    images: product?.images || [],
    editorial_blocks_json: (product?.editorial_blocks_json || []) as EditorialBlock[],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate editorial blocks
    for (const block of form.editorial_blocks_json) {
      if (!block.title_fr || !block.body_fr) {
        toast.error('Chaque bloc éditorial doit avoir un titre FR et un texte FR.');
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      slug: form.slug,
      status: form.status,
      category: form.category,
      category_id: form.category_id || null,
      name_fr: form.name_fr,
      name_en: form.name_en,
      description_fr: form.description_fr,
      description_en: form.description_en,
      story_fr: form.story_fr,
      story_en: form.story_en,
      materials_fr: form.materials_fr,
      materials_en: form.materials_en,
      care_fr: form.care_fr,
      care_en: form.care_en,
      base_price_eur: Number(form.base_price_eur),
      made_to_order: form.made_to_order,
      made_to_order_min_days: form.made_to_order_min_days ? Number(form.made_to_order_min_days) : null,
      made_to_order_max_days: form.made_to_order_max_days ? Number(form.made_to_order_max_days) : null,
      made_to_measure: form.made_to_measure,
      preorder: form.preorder,
      preorder_ship_date_estimate: form.preorder_ship_date_estimate || null,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      materials: form.materials.split(',').map(s => s.trim()).filter(Boolean),
      braiding_options: form.braiding_options.split(',').map(s => s.trim()).filter(Boolean),
      stock_qty: form.stock_qty === '' ? null : Number(form.stock_qty),
      images: form.images,
      editorial_blocks_json: form.editorial_blocks_json.length > 0 ? JSON.parse(JSON.stringify(form.editorial_blocks_json)) : null,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from('products').insert(payload));
    } else {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id));
    }

    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success(isNew ? 'Produit créé' : 'Produit mis à jour'); onSave(); }
  };

  const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";
  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-2 text-xs tracking-wider uppercase font-body text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Retour
      </button>
      <h1 className="text-display text-3xl mb-8">{isNew ? 'Nouveau Produit' : 'Modifier le Produit'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Images upload */}
        <MultiImageUpload
          value={form.images}
          onChange={(urls) => set('images', urls)}
          label="Photos du produit"
          folder="products"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} required /></div>
          <div>
            <label className={labelClass}>Statut</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Catégorie</label>
            <select value={form.category_id} onChange={e => {
              const catId = e.target.value;
              const allCats = groups.flatMap(g => g.categories);
              const cat = allCats.find(c => c.id === catId);
              set('category_id', catId);
              if (cat) set('category', cat.slug);
            }} className={inputClass}>
              <option value="">— Aucune —</option>
              {groups.map(g => (
                <optgroup key={g.id} label={g.name_fr}>
                  {g.categories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
                </optgroup>
              ))}
            </select>
            {!form.category_id && (
              <p className="flex items-center gap-1 mt-1 text-[10px] text-orange-500 font-body">
                <AlertTriangle size={10} /> Aucune catégorie assignée
              </p>
            )}
          </div>
        </div>

        <TranslateButton
          frFields={{
            name_fr: form.name_fr,
            description_fr: form.description_fr,
            story_fr: form.story_fr,
            materials_fr: form.materials_fr,
            care_fr: form.care_fr,
          }}
          onTranslated={(t) => setForm(p => ({ ...p, ...t }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Nom FR</label><input value={form.name_fr} onChange={e => set('name_fr', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Nom EN</label><input value={form.name_en} onChange={e => set('name_en', e.target.value)} className={inputClass} required /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Description FR</label><textarea value={form.description_fr} onChange={e => set('description_fr', e.target.value)} className={`${inputClass} min-h-[80px] resize-none`} /></div>
          <div><label className={labelClass}>Description EN</label><textarea value={form.description_en} onChange={e => set('description_en', e.target.value)} className={`${inputClass} min-h-[80px] resize-none`} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Histoire FR</label><textarea value={form.story_fr} onChange={e => set('story_fr', e.target.value)} className={`${inputClass} min-h-[80px] resize-none`} /></div>
          <div><label className={labelClass}>Histoire EN</label><textarea value={form.story_en} onChange={e => set('story_en', e.target.value)} className={`${inputClass} min-h-[80px] resize-none`} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Matières FR</label><input value={form.materials_fr} onChange={e => set('materials_fr', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Matières EN</label><input value={form.materials_en} onChange={e => set('materials_en', e.target.value)} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Entretien FR</label><input value={form.care_fr} onChange={e => set('care_fr', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Entretien EN</label><input value={form.care_en} onChange={e => set('care_en', e.target.value)} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Prix EUR (centimes)</label><input type="number" value={form.base_price_eur} onChange={e => set('base_price_eur', e.target.value)} className={inputClass} required /></div>
          <div><label className={labelClass}>Stock (vide = illimité)</label><input type="number" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} className={inputClass} /></div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
            <input type="checkbox" checked={form.made_to_order} onChange={e => set('made_to_order', e.target.checked)} className="accent-primary" />
            Sur commande
          </label>
          <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
            <input type="checkbox" checked={form.made_to_measure} onChange={e => set('made_to_measure', e.target.checked)} className="accent-primary" />
            Sur mesure
          </label>
          <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
            <input type="checkbox" checked={form.preorder} onChange={e => set('preorder', e.target.checked)} className="accent-primary" />
            Précommande
          </label>
        </div>

        {form.made_to_order && (
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Délai min (jours)</label><input type="number" value={form.made_to_order_min_days || ''} onChange={e => set('made_to_order_min_days', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Délai max (jours)</label><input type="number" value={form.made_to_order_max_days || ''} onChange={e => set('made_to_order_max_days', e.target.value)} className={inputClass} /></div>
          </div>
        )}

        {form.preorder && (
          <div><label className={labelClass}>Date estimée d'envoi</label><input type="date" value={form.preorder_ship_date_estimate} onChange={e => set('preorder_ship_date_estimate', e.target.value)} className={inputClass} /></div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Tailles (séparées par virgule)</label><input value={form.sizes} onChange={e => set('sizes', e.target.value)} className={inputClass} placeholder="34, 36, 38, 40" /></div>
          <div><label className={labelClass}>Couleurs (séparées par virgule)</label><input value={form.colors} onChange={e => set('colors', e.target.value)} className={inputClass} placeholder="Noir, Ivoire" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Matériaux (séparés par virgule)</label><input value={form.materials} onChange={e => set('materials', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Options de tressage (séparées par virgule)</label><input value={form.braiding_options} onChange={e => set('braiding_options', e.target.value)} className={inputClass} /></div>
        </div>

        {/* Editorial Blocks Builder */}
        <div className="border-t border-border pt-8 mt-8">
          <EditorialBlocksBuilder
            blocks={form.editorial_blocks_json}
            onChange={(blocks) => set('editorial_blocks_json', blocks)}
            imageCount={form.images.length}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors disabled:opacity-50">
            {submitting ? '...' : isNew ? 'Créer' : 'Enregistrer'}
          </button>
          <button type="button" onClick={onCancel} className="border border-foreground/20 px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:border-foreground transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
