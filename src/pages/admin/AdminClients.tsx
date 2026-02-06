import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminClients = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return !q || p.email?.toLowerCase().includes(q) || p.first_name?.toLowerCase().includes(q) || p.last_name?.toLowerCase().includes(q);
  });

  return (
    <div>
      <h1 className="text-display text-3xl mb-8">Clients</h1>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom ou email…"
        className="w-full max-w-sm border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors mb-6"
      />
      <div className="border border-border divide-y divide-border">
        {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground font-body">Aucun client.</p>}
        {filtered.map(p => (
          <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate">
                {p.first_name || ''} {p.last_name || ''}
                {!p.first_name && !p.last_name && <span className="text-muted-foreground italic">Sans nom</span>}
              </p>
              <p className="text-xs text-muted-foreground font-body">{p.email}</p>
            </div>
            <div className="text-xs text-muted-foreground font-body ml-4">
              {new Date(p.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground font-body mt-4">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default AdminClients;
