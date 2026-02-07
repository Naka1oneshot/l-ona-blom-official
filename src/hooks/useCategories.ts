import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryGroup {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  group_id: string;
  sort_order: number;
  is_active: boolean;
}

export interface GroupWithCategories extends CategoryGroup {
  categories: Category[];
}

export function useCategories() {
  const [groups, setGroups] = useState<GroupWithCategories[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: gData }, { data: cData }] = await Promise.all([
      supabase.from('category_groups').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);

    const groupList = (gData || []) as CategoryGroup[];
    const catList = (cData || []) as Category[];

    const merged: GroupWithCategories[] = groupList.map(g => ({
      ...g,
      categories: catList.filter(c => c.group_id === g.id),
    }));

    setGroups(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return { groups, loading, reload: load };
}
