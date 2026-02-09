import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_FONT_SCALE: Record<string, number> = {
  xs: 8,
  sm: 10,
  base: 12,
  lg: 14,
  xl: 16,
  '2xl': 18,
};

export function useEditorialFontScale() {
  const [scale, setScale] = useState<Record<string, number>>(DEFAULT_FONT_SCALE);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'editorial_font_scale')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object') {
          setScale({ ...DEFAULT_FONT_SCALE, ...(data.value as Record<string, number>) });
        }
      });
  }, []);

  return scale;
}
