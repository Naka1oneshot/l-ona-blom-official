import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { MultiImageUpload } from '@/components/admin/ImageUpload';
import TranslateButton from '@/components/admin/TranslateButton';
import { useCategories } from '@/hooks/useCategories';
import EditorialBlocksBuilder from '@/components/product/EditorialBlocksBuilder';
import type { EditorialBlock } from '@/types/editorial';
import { STANDARD_SIZES, detectSizeSet, buildPriceBySizePayload } from '@/lib/pricing';
import type { SizeCode } from '@/types';

interface Props {
  product?: any;
  onSave: () => void;
  onCancel: () => void;
}

const AdminProductForm = ({ product, onSave, onCancel }: Props) => {
  const isNew = !product;
  const { groups } = useCategories();

  // Detect size set from existing product
  const existingSizeSet = product ? detectSizeSet(product.sizes || []) : 'standard';
  const existingPrices = product?.price_by_size_eur || {};

  const [form, setForm] = useState({
    reference_code: product?.reference_code || '',
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
    made_to_order: product?.made_to_order || false,
    made_to_order_min_days: product?.made_to_order_min_days || null,
    made_to_order_max_days: product?.made_to_order_max_days || null,
    made_to_measure: product?.made_to_measure || false,
    preorder: product?.preorder || false,
    preorder_ship_date_estimate: product?.preorder_ship_date_estimate || '',
    colors: (product?.colors || []).join(', '),
    materials: (product?.materials || []).join(', '),
    braiding_options: (product?.braiding_options || []).join(', '),
    braiding_colors: (product?.braiding_colors || []).join(', '),
    stock_qty: product?.stock_qty ?? '',
    images: product?.images || [],
    editorial_blocks_json: (product?.editorial_blocks_json || []) as EditorialBlock[],
  });

  const [sizeSet, setSizeSet] = useState<'TU' | 'standard'>(existingSizeSet);
  const [sizePrices, setSizePrices] = useState<Record<string, number>>(() => {
    const prices: Record<string, number> = {};
    if (existingSizeSet === 'TU') {
      prices['TU'] = existingPrices['TU'] || product?.base_price_eur || 0;
    } else {
      for (const s of STANDARD_SIZES) {
        prices[s] = existingPrices[s] || product?.base_price_eur || 0;
      }
    }
    return prices;
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSizeSetChange = (newSet: 'TU' | 'standard') => {
    setSizeSet(newSet);
    if (newSet === 'TU') {
      const currentMin = Math.min(...Object.values(sizePrices).filter(v => v > 0), sizePrices['TU'] || 0);
      setSizePrices({ TU: currentMin || 0 });
    } else {
      const currentTU = sizePrices['TU'] || 0;
      const prices: Record<string, number> = {};
      for (const s of STANDARD_SIZES) {
        prices[s] = sizePrices[s] || currentTU || 0;
      }
      setSizePrices(prices);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate editorial blocks
    for (const block of form.editorial_blocks_json) {
      if (!block.title_fr || !block.body_fr) {
        toast.error('Chaque bloc éditorial doit avoir un titre FR et un texte FR.');
        return;
      }
    }

    // Validate prices
    const activeSizes = sizeSet === 'TU' ? ['TU'] : STANDARD_SIZES;
    const hasAnyPrice = activeSizes.some(s => (sizePrices[s] || 0) > 0);
    if (!hasAnyPrice) {
      toast.error('Au moins un prix doit être renseigné.');
      return;
    }

    setSubmitting(true);

    const { sizes, price_by_size_eur, base_price_eur } = buildPriceBySizePayload(sizeSet, sizePrices);

    const payload = {
      reference_code: form.reference_code || null,
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
      base_price_eur,
      price_by_size_eur,
      sizes,
      made_to_order: form.made_to_order,
      made_to_order_min_days: form.made_to_order_min_days ? Number(form.made_to_order_min_days) : null,
      made_to_order_max_days: form.made_to_order_max_days ? Number(form.made_to_order_max_days) : null,
      made_to_measure: form.made_to_measure,
      preorder: form.preorder,
      preorder_ship_date_estimate: form.preorder_ship_date_estimate || null,
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      materials: form.materials.split(',').map(s => s.trim()).filter(Boolean),
      braiding_options: form.braiding_options.split(',').map(s => s.trim()).filter(Boolean),
      braiding_colors: form.braiding_colors.split(',').map(s => s.trim()).filter(Boolean),
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

  const sizesToShow = sizeSet === 'TU' ? ['TU' as SizeCode] : STANDARD_SIZES;

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

        {/* Reference code */}
        <div className="border border-border rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Référence Produit</label>
              <input value={form.reference_code} onChange={e => set('reference_code', e.target.value)} className={inputClass} placeholder="PRO001" />
            </div>
          </div>
          <p className="flex items-start gap-1.5 text-[10px] text-amber-500/90 font-body leading-relaxed">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>Cette référence est utilisée comme identifiant unique lors de l'import Excel. La modifier dissociera ce produit des futures lignes du fichier utilisant l'ancienne référence.</span>
          </p>
        </div>

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
              <p className="flex items-center gap-1 mt-1 text-[10px] text-amber-500 font-body">
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
          editorialBlocks={form.editorial_blocks_json}
          onTranslated={(t) => setForm(p => ({ ...p, ...t }))}
          onEditorialTranslated={(ebT) => {
            setForm(p => ({
              ...p,
              editorial_blocks_json: p.editorial_blocks_json.map(block => {
                const tr = ebT[block.id];
                if (!tr) return block;
                return { ...block, title_en: tr.title_en || block.title_en, body_en: tr.body_en || block.body_en };
              }),
            }));
          }}
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

        {/* SIZE SET + PRICING */}
        <div className="border border-border rounded-lg p-5 space-y-4">
          <label className={labelClass}>Tailles & Prix (EUR)</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
              <input
                type="radio"
                name="sizeSet"
                checked={sizeSet === 'TU'}
                onChange={() => handleSizeSetChange('TU')}
                className="accent-primary"
              />
              Taille unique (TU)
            </label>
            <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
              <input
                type="radio"
                name="sizeSet"
                checked={sizeSet === 'standard'}
                onChange={() => handleSizeSetChange('standard')}
                className="accent-primary"
              />
              Tailles standard (XS → 3XL)
            </label>
          </div>

          <div className={`grid gap-3 ${sizeSet === 'TU' ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 md:grid-cols-3'}`}>
            {sizesToShow.map(size => (
              <div key={size}>
                <label className={labelClass}>Prix {size} (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sizePrices[size] ? (sizePrices[size] / 100).toFixed(2) : ''}
                  onChange={e => {
                    const euros = parseFloat(e.target.value);
                    setSizePrices(p => ({ ...p, [size]: isNaN(euros) ? 0 : Math.round(euros * 100) }));
                  }}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Stock (vide = illimité)</label>
          <input type="number" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} className={`${inputClass} max-w-xs`} />
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
          <div><label className={labelClass}>Couleurs (séparées par virgule)</label><input value={form.colors} onChange={e => set('colors', e.target.value)} className={inputClass} placeholder="Noir, Ivoire" /></div>
          <div><label className={labelClass}>Matériaux (séparés par virgule)</label><input value={form.materials} onChange={e => set('materials', e.target.value)} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Options de tressage (séparées par virgule)</label><input value={form.braiding_options} onChange={e => set('braiding_options', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Couleurs de tressage (séparées par virgule)</label><input value={form.braiding_colors} onChange={e => set('braiding_colors', e.target.value)} className={inputClass} placeholder="Magenta, Noir, Blanc" /></div>
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
