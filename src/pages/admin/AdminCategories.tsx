import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Group {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  group_id: string;
  sort_order: number;
  is_active: boolean;
}

const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

const AdminCategories = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group form
  const [groupForm, setGroupForm] = useState<Partial<Group> | null>(null);
  // Category form
  const [catForm, setCatForm] = useState<(Partial<Category> & { _groupId?: string }) | null>(null);
  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'category'; id: string; name: string; productCount: number } | null>(null);
  const [deleteAction, setDeleteAction] = useState<'reassign' | 'unset'>('unset');
  const [reassignCatId, setReassignCatId] = useState<string>('');

  // Uncategorized products
  const [uncategorizedProducts, setUncategorizedProducts] = useState<any[]>([]);
  const [showUncategorized, setShowUncategorized] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: g }, { data: c }, { data: uncat }] = await Promise.all([
      supabase.from('category_groups').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('id, name_fr, category, category_id').is('category_id', null),
    ]);
    setGroups((g || []) as Group[]);
    setCategories((c || []) as Category[]);
    setUncategorizedProducts(uncat || []);
    // Auto-expand all
    setExpandedGroups(new Set((g || []).map((x: any) => x.id)));
  }

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ===== GROUP CRUD =====
  const saveGroup = async () => {
    if (!groupForm?.name_fr) return;
    const slug = groupForm.slug || groupForm.name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const payload = { name_fr: groupForm.name_fr, name_en: groupForm.name_en || null, slug, sort_order: groupForm.sort_order ?? 0, is_active: groupForm.is_active ?? true };

    let error;
    if (groupForm.id) {
      ({ error } = await supabase.from('category_groups').update(payload).eq('id', groupForm.id));
    } else {
      ({ error } = await supabase.from('category_groups').insert(payload));
    }
    if (error) toast.error(error.message);
    else { toast.success('Groupe enregistré'); setGroupForm(null); load(); }
  };

  const confirmDeleteGroup = async (group: Group) => {
    // Count products in categories of this group
    const groupCats = categories.filter(c => c.group_id === group.id);
    if (groupCats.length === 0) {
      if (!confirm(`Supprimer le groupe "${group.name_fr}" ?`)) return;
      const { error } = await supabase.from('category_groups').delete().eq('id', group.id);
      if (error) toast.error(error.message); else { toast.success('Groupe supprimé'); load(); }
      return;
    }
    const catIds = groupCats.map(c => c.id);
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).in('category_id', catIds);
    setDeleteTarget({ type: 'group', id: group.id, name: group.name_fr, productCount: count || 0 });
    setDeleteAction('unset');
    setReassignCatId('');
  };

  // ===== CATEGORY CRUD =====
  const saveCat = async () => {
    if (!catForm?.name_fr || !catForm?.group_id) return;
    const slug = catForm.slug || catForm.name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const payload = { name_fr: catForm.name_fr, name_en: catForm.name_en || null, slug, group_id: catForm.group_id, sort_order: catForm.sort_order ?? 0, is_active: catForm.is_active ?? true };

    let error;
    if (catForm.id) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', catForm.id));
    } else {
      ({ error } = await supabase.from('categories').insert(payload));
    }
    if (error) toast.error(error.message);
    else { toast.success('Catégorie enregistrée'); setCatForm(null); load(); }
  };

  const confirmDeleteCat = async (cat: Category) => {
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', cat.id);
    setDeleteTarget({ type: 'category', id: cat.id, name: cat.name_fr, productCount: count || 0 });
    setDeleteAction('unset');
    setReassignCatId('');
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'category') {
      if (deleteAction === 'reassign' && reassignCatId) {
        await supabase.from('products').update({ category_id: reassignCatId }).eq('category_id', deleteTarget.id);
      }
      // ON DELETE SET NULL handles the rest
      const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
      if (error) { toast.error(error.message); return; }
    } else {
      // Group deletion: reassign all products from group's categories
      const groupCats = categories.filter(c => c.group_id === deleteTarget.id);
      const catIds = groupCats.map(c => c.id);
      if (deleteAction === 'reassign' && reassignCatId) {
        await supabase.from('products').update({ category_id: reassignCatId }).in('category_id', catIds);
      }
      // CASCADE will delete categories, ON DELETE SET NULL handles products
      const { error } = await supabase.from('category_groups').delete().eq('id', deleteTarget.id);
      if (error) { toast.error(error.message); return; }
    }

    toast.success('Supprimé');
    setDeleteTarget(null);
    load();
  };

  // Quick reassign uncategorized product
  const assignProduct = async (productId: string, catId: string) => {
    const { error } = await supabase.from('products').update({ category_id: catId }).eq('id', productId);
    if (error) toast.error(error.message);
    else { toast.success('Produit catégorisé'); load(); }
  };

  // Available categories for reassignment (excluding the one being deleted)
  const reassignOptions = categories.filter(c => deleteTarget ? c.id !== deleteTarget.id : true);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Catégories</h1>
        <button
          onClick={() => setGroupForm({ is_active: true, sort_order: groups.length })}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary transition-colors"
        >
          <Plus size={14} /> Nouveau Groupe
        </button>
      </div>

      {/* Uncategorized products alert */}
      {uncategorizedProducts.length > 0 && (
        <div className="border border-orange-500/30 bg-orange-500/5 p-4 mb-6">
          <button onClick={() => setShowUncategorized(!showUncategorized)} className="flex items-center gap-2 w-full text-left">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-sm font-body font-medium">{uncategorizedProducts.length} produit(s) sans catégorie</span>
            {showUncategorized ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
          </button>
          {showUncategorized && (
            <div className="mt-3 space-y-2">
              {uncategorizedProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-body flex-1 truncate">{p.name_fr}</span>
                  <select
                    className="border border-border bg-transparent px-2 py-1 text-xs font-body"
                    defaultValue=""
                    onChange={e => { if (e.target.value) assignProduct(p.id, e.target.value); }}
                  >
                    <option value="" disabled>Assigner…</option>
                    {groups.map(g => (
                      <optgroup key={g.id} label={g.name_fr}>
                        {categories.filter(c => c.group_id === g.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name_fr}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Groups & Categories list */}
      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.id} className="border border-border">
            <div className="flex items-center p-4 bg-muted/20">
              <button onClick={() => toggleExpand(group.id)} className="mr-3">
                {expandedGroups.has(group.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-body font-medium">{group.name_fr}</span>
                {!group.is_active && <span className="ml-2 text-[10px] text-muted-foreground">(masqué)</span>}
                <span className="ml-2 text-xs text-muted-foreground">— {categories.filter(c => c.group_id === group.id).length} cat.</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setGroupForm(group)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                <button onClick={() => confirmDeleteGroup(group)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                <button
                  onClick={() => setCatForm({ group_id: group.id, is_active: true, sort_order: categories.filter(c => c.group_id === group.id).length })}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  title="Ajouter catégorie"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
            {expandedGroups.has(group.id) && (
              <div className="divide-y divide-border">
                {categories.filter(c => c.group_id === group.id).map(cat => (
                  <div key={cat.id} className="flex items-center p-3 pl-12 hover:bg-muted/10">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-body">{cat.name_fr}</span>
                      {cat.name_en && <span className="ml-2 text-xs text-muted-foreground">({cat.name_en})</span>}
                      {!cat.is_active && <span className="ml-2 text-[10px] text-muted-foreground">(masqué)</span>}
                      <span className="ml-2 text-[10px] text-muted-foreground">/{cat.slug}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setCatForm(cat)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                      <button onClick={() => confirmDeleteCat(cat)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                {categories.filter(c => c.group_id === group.id).length === 0 && (
                  <p className="p-3 pl-12 text-xs text-muted-foreground font-body">Aucune catégorie.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Group Form Dialog */}
      <Dialog open={!!groupForm} onOpenChange={() => setGroupForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{groupForm?.id ? 'Modifier le groupe' : 'Nouveau groupe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className={labelClass}>Nom FR *</label><input value={groupForm?.name_fr || ''} onChange={e => setGroupForm(p => p ? { ...p, name_fr: e.target.value } : p)} className={inputClass} /></div>
            <div><label className={labelClass}>Nom EN</label><input value={groupForm?.name_en || ''} onChange={e => setGroupForm(p => p ? { ...p, name_en: e.target.value } : p)} className={inputClass} /></div>
            <div><label className={labelClass}>Slug</label><input value={groupForm?.slug || ''} onChange={e => setGroupForm(p => p ? { ...p, slug: e.target.value } : p)} className={inputClass} placeholder="auto-généré si vide" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Ordre</label><input type="number" value={groupForm?.sort_order ?? 0} onChange={e => setGroupForm(p => p ? { ...p, sort_order: Number(e.target.value) } : p)} className={inputClass} /></div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                  <input type="checkbox" checked={groupForm?.is_active ?? true} onChange={e => setGroupForm(p => p ? { ...p, is_active: e.target.checked } : p)} className="accent-primary" />
                  Actif
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupForm(null)}>Annuler</Button>
            <Button onClick={saveGroup}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={!!catForm} onOpenChange={() => setCatForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catForm?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className={labelClass}>Nom FR *</label><input value={catForm?.name_fr || ''} onChange={e => setCatForm(p => p ? { ...p, name_fr: e.target.value } : p)} className={inputClass} /></div>
            <div><label className={labelClass}>Nom EN</label><input value={catForm?.name_en || ''} onChange={e => setCatForm(p => p ? { ...p, name_en: e.target.value } : p)} className={inputClass} /></div>
            <div><label className={labelClass}>Slug</label><input value={catForm?.slug || ''} onChange={e => setCatForm(p => p ? { ...p, slug: e.target.value } : p)} className={inputClass} placeholder="auto-généré si vide" /></div>
            <div>
              <label className={labelClass}>Groupe *</label>
              <select value={catForm?.group_id || ''} onChange={e => setCatForm(p => p ? { ...p, group_id: e.target.value } : p)} className={inputClass}>
                <option value="" disabled>Choisir…</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name_fr}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Ordre</label><input type="number" value={catForm?.sort_order ?? 0} onChange={e => setCatForm(p => p ? { ...p, sort_order: Number(e.target.value) } : p)} className={inputClass} /></div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                  <input type="checkbox" checked={catForm?.is_active ?? true} onChange={e => setCatForm(p => p ? { ...p, is_active: e.target.checked } : p)} className="accent-primary" />
                  Actif
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatForm(null)}>Annuler</Button>
            <Button onClick={saveCat}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Supprimer « {deleteTarget?.name} »
            </DialogTitle>
          </DialogHeader>
          {deleteTarget && deleteTarget.productCount > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-body">
                <strong>{deleteTarget.productCount} produit(s)</strong> {deleteTarget.type === 'group' ? 'dans les catégories de ce groupe' : 'dans cette catégorie'} seront impactés.
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                  <input type="radio" name="deleteAction" checked={deleteAction === 'reassign'} onChange={() => setDeleteAction('reassign')} className="accent-primary" />
                  Réassigner à une autre catégorie
                </label>
                {deleteAction === 'reassign' && (
                  <select value={reassignCatId} onChange={e => setReassignCatId(e.target.value)} className={`${inputClass} ml-6`}>
                    <option value="" disabled>Choisir une catégorie…</option>
                    {groups.map(g => (
                      <optgroup key={g.id} label={g.name_fr}>
                        {reassignOptions.filter(c => c.group_id === g.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name_fr}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
                <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                  <input type="radio" name="deleteAction" checked={deleteAction === 'unset'} onChange={() => setDeleteAction('unset')} className="accent-primary" />
                  Laisser sans catégorie
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm font-body">Aucun produit impacté. Confirmer la suppression ?</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteAction === 'reassign' && !reassignCatId}
              onClick={executeDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
