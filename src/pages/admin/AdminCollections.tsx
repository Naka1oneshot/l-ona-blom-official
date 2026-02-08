import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminCollectionForm from './AdminCollectionForm';

const AdminCollections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collections, setCollections] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && collections.length > 0) {
      const c = collections.find(x => x.id === editId);
      if (c) { setEditing(c); setSearchParams({}, { replace: true }); }
    }
  }, [collections, searchParams]);

  async function load() {
    const { data } = await supabase.from('collections').select('*').order('created_at', { ascending: false });
    setCollections(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette collection ?')) return;
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Collection supprimée'); load(); }
  }

  if (creating || editing) {
    return (
      <AdminCollectionForm
        collection={editing}
        onSave={() => { setCreating(false); setEditing(null); load(); }}
        onCancel={() => { setCreating(false); setEditing(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Collections</h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:bg-primary transition-colors">
          <Plus size={14} /> Nouvelle
        </button>
      </div>

      <div className="border border-border divide-y divide-border">
        {collections.length === 0 && <p className="p-6 text-sm text-muted-foreground font-body">Aucune collection.</p>}
        {collections.map(c => (
          <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate">
                {c.reference_code && <span className="text-muted-foreground font-normal mr-1.5">{c.reference_code}</span>}
                {c.title_fr}
              </p>
              <p className="text-xs text-muted-foreground font-body">{c.subtitle_fr}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => setEditing(c)} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCollections;
