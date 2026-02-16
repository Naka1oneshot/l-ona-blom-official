import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    const { data } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id);
    setIds(new Set((data || []).map(r => r.product_id)));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (productId: string) => {
    if (!user) return false; // not logged in
    setLoading(true);
    const has = ids.has(productId);
    if (has) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      setIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
    } else {
      await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId });
      setIds(prev => new Set(prev).add(productId));
    }
    setLoading(false);
    return true;
  }, [user, ids]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  return { ids, has, toggle, loading, count: ids.size, reload: load };
}
