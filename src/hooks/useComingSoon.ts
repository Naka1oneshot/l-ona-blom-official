import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComingSoonConfig {
  enabled: boolean;
  countdown_date: string; // ISO string
  message_fr: string;
  message_en: string;
  youtube_ids: string[];
  images: string[];
}

const DEFAULT_CONFIG: ComingSoonConfig = {
  enabled: false,
  countdown_date: '2026-02-13T17:00:00',
  message_fr: 'Notre site sera bientôt ouvert au public. Restez connectés.',
  message_en: 'Our site will be open to the public soon. Stay tuned.',
  youtube_ids: ['P_EsmWqLN6w', 'UPl-qZI1cPU'],
  images: Array.from({ length: 10 }, (_, i) => `/images/coming-soon/${i + 1}.jpeg`),
};

export function useComingSoon() {
  const [config, setConfig] = useState<ComingSoonConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'coming_soon')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object') {
          setConfig({ ...DEFAULT_CONFIG, ...(data.value as any) });
        }
        setLoading(false);
      });
  }, []);

  return { config, loading };
}
