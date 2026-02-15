import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import TranslateButton from '@/components/admin/TranslateButton';

interface FaqItem {
  id: string;
  question_fr: string;
  question_en: string | null;
  answer_fr: string;
  answer_en: string | null;
  sort_order: number;
  is_active: boolean;
}

const AdminFAQ = () => {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('sort_order');
    if (error) { toast.error(error.message); return; }
    setItems((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from('faq_items')
      .insert({ question_fr: 'Nouvelle question', answer_fr: 'Réponse…', sort_order: maxOrder } as any)
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setItems(prev => [...prev, data as any]);
    setExpandedId((data as any).id);
    toast.success('Question ajoutée');
  };

  const handleUpdate = async (item: FaqItem) => {
    setSaving(item.id);
    const { error } = await supabase
      .from('faq_items')
      .update({
        question_fr: item.question_fr,
        question_en: item.question_en,
        answer_fr: item.answer_fr,
        answer_en: item.answer_en,
        is_active: item.is_active,
        sort_order: item.sort_order,
      } as any)
      .eq('id', item.id);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Enregistré');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;
    const { error } = await supabase.from('faq_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Supprimé');
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const updated = [...items];
    const tempOrder = updated[index].sort_order;
    updated[index].sort_order = updated[swapIndex].sort_order;
    updated[swapIndex].sort_order = tempOrder;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setItems(updated);
    // Save both
    await Promise.all([
      supabase.from('faq_items').update({ sort_order: updated[index].sort_order } as any).eq('id', updated[index].id),
      supabase.from('faq_items').update({ sort_order: updated[swapIndex].sort_order } as any).eq('id', updated[swapIndex].id),
    ]);
  };

  const updateField = (id: string, field: keyof FaqItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Chargement…</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display tracking-wider">FAQ</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="border border-border bg-card">
              {/* Header row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <GripVertical size={14} className="text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === items.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex-1 text-left text-sm font-body tracking-wider truncate"
                >
                  {item.question_fr || 'Sans titre'}
                </button>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5" title={item.is_active ? 'Visible' : 'Masqué'}>
                    {item.is_active ? <Eye size={13} className="text-muted-foreground" /> : <EyeOff size={13} className="text-muted-foreground" />}
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(v) => {
                        updateField(item.id, 'is_active', v);
                        supabase.from('faq_items').update({ is_active: v } as any).eq('id', item.id);
                      }}
                    />
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded form */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-2 border-t border-border space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Question FR</label>
                      <input
                        value={item.question_fr}
                        onChange={(e) => updateField(item.id, 'question_fr', e.target.value)}
                        className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Question EN</label>
                      <input
                        value={item.question_en || ''}
                        onChange={(e) => updateField(item.id, 'question_en', e.target.value)}
                        className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Réponse FR</label>
                      <textarea
                        value={item.answer_fr}
                        onChange={(e) => updateField(item.id, 'answer_fr', e.target.value)}
                        rows={4}
                        className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Réponse EN</label>
                      <textarea
                        value={item.answer_en || ''}
                        onChange={(e) => updateField(item.id, 'answer_en', e.target.value)}
                        rows={4}
                        className="w-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <TranslateButton
                      frFields={{
                        question_fr: item.question_fr,
                        answer_fr: item.answer_fr,
                      }}
                      onTranslated={(translations) => {
                        if (translations.question_en) updateField(item.id, 'question_en', translations.question_en);
                        if (translations.answer_en) updateField(item.id, 'answer_en', translations.answer_en);
                      }}
                    />
                    <button
                      onClick={() => handleUpdate(item)}
                      disabled={saving === item.id}
                      className="bg-primary text-primary-foreground px-5 py-2 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving === item.id ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">Aucune question. Cliquez sur « Ajouter » pour commencer.</p>
      )}
    </div>
  );
};

export default AdminFAQ;
