import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranslateButtonProps {
  /** Map of FR field names to their current values, e.g. { title_fr: "Mon titre", description_fr: "..." } */
  frFields: Record<string, string>;
  /** Callback receiving the translated EN fields, e.g. { title_en: "My title", description_en: "..." } */
  onTranslated: (translations: Record<string, string>) => void;
}

const TranslateButton = ({ frFields, onTranslated }: TranslateButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    const nonEmpty = Object.fromEntries(
      Object.entries(frFields).filter(([_, v]) => v && v.trim())
    );

    if (Object.keys(nonEmpty).length === 0) {
      toast.info('Aucun texte FR à traduire');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { texts: nonEmpty },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.translations && Object.keys(data.translations).length > 0) {
        onTranslated(data.translations);
        toast.success('Traduction automatique appliquée');
      } else {
        toast.warning('Aucune traduction reçue');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      toast.error(err.message || 'Erreur de traduction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading}
      className="flex items-center gap-2 border border-primary/40 px-4 py-2 text-xs tracking-[0.15em] uppercase font-body text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
      {loading ? 'Traduction…' : 'Traduire FR → EN'}
    </button>
  );
};

export default TranslateButton;
