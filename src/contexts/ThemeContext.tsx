import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { themeTokens, getDefaultThemeValues } from '@/lib/defaultTheme';

interface ThemeContextValue {
  /** Current merged theme values (defaults + overrides from DB) */
  values: Record<string, string>;
  /** Whether theme has loaded from DB */
  loaded: boolean;
  /** Save new values to DB (admin only) */
  save: (newValues: Record<string, string>) => Promise<void>;
  /** Reset to defaults in DB */
  reset: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

function applyThemeToDom(values: Record<string, string>) {
  const root = document.documentElement;
  for (const token of themeTokens) {
    const val = values[token.cssVar] ?? token.defaultValue;
    root.style.setProperty(`--${token.cssVar}`, val);
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const defaults = getDefaultThemeValues();
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [loaded, setLoaded] = useState(false);

  // Load theme from site_settings on mount
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'theme')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object') {
          const merged = { ...defaults, ...(data.value as Record<string, string>) };
          setValues(merged);
          applyThemeToDom(merged);
        } else {
          applyThemeToDom(defaults);
        }
        setLoaded(true);
      });
  }, []);

  const save = useCallback(async (newValues: Record<string, string>) => {
    // Only persist values that differ from defaults
    const overrides: Record<string, string> = {};
    for (const [k, v] of Object.entries(newValues)) {
      if (v !== defaults[k]) overrides[k] = v;
    }

    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'theme')
      .maybeSingle();

    if (existing) {
      await supabase.from('site_settings').update({ value: overrides as any }).eq('id', existing.id);
    } else {
      await supabase.from('site_settings').insert({ key: 'theme', value: overrides as any });
    }

    const merged = { ...defaults, ...overrides };
    setValues(merged);
    applyThemeToDom(merged);
  }, [defaults]);

  const reset = useCallback(async () => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'theme')
      .maybeSingle();

    if (existing) {
      await supabase.from('site_settings').update({ value: {} as any }).eq('id', existing.id);
    }

    setValues(defaults);
    applyThemeToDom(defaults);
  }, [defaults]);

  return (
    <ThemeContext.Provider value={{ values, loaded, save, reset }}>
      {children}
    </ThemeContext.Provider>
  );
};
