import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteFeature {
  key: string;
  enabled: boolean;
  config: Record<string, any>;
}

export function useSiteFeature(key: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['site_feature', key],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_features')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      return data as SiteFeature | null;
    },
    staleTime: 60_000,
  });

  return {
    feature: data ?? null,
    isLoading,
    enabled: data?.enabled ?? false,
    config: data?.config ?? {},
  };
}
