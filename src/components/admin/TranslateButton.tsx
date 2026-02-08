import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditorialBlockForTranslation {
  id: string;
  title_fr: string;
  body_fr: string;
}

interface TranslateButtonProps {
  /** Map of FR field names to their current values */
  frFields: Record<string, string>;
  /** Optional editorial blocks to translate */
  editorialBlocks?: EditorialBlockForTranslation[];
  /** Callback receiving the translated EN fields */
  onTranslated: (translations: Record<string, string>) => void;
  /** Callback receiving translated editorial blocks (title_en, body_en by block id) */
  onEditorialTranslated?: (translations: Record<string, { title_en: string; body_en: string }>) => void;
}

const TranslateButton = ({ frFields, editorialBlocks, onTranslated, onEditorialTranslated }: TranslateButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    const nonEmpty = Object.fromEntries(
      Object.entries(frFields).filter(([_, v]) => v && v.trim())
    );

    // Build editorial block fields
    const editorialFields: Record<string, string> = {};
    if (editorialBlocks) {
      editorialBlocks.forEach((block) => {
        if (block.title_fr?.trim()) editorialFields[`eb_title_${block.id}`] = block.title_fr;
        if (block.body_fr?.trim()) editorialFields[`eb_body_${block.id}`] = block.body_fr;
      });
    }

    const allFields = { ...nonEmpty, ...editorialFields };

    if (Object.keys(allFields).length === 0) {
      toast.info('Aucun texte FR à traduire');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { texts: allFields },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.translations && Object.keys(data.translations).length > 0) {
        // Split standard fields vs editorial block fields
        const standardTranslations: Record<string, string> = {};
        const ebTranslations: Record<string, { title_en: string; body_en: string }> = {};

        for (const [key, value] of Object.entries(data.translations)) {
          if (key.startsWith('eb_title_')) {
            const blockId = key.replace('eb_title_', '');
            ebTranslations[blockId] = { ...ebTranslations[blockId], title_en: value as string };
          } else if (key.startsWith('eb_body_')) {
            const blockId = key.replace('eb_body_', '');
            ebTranslations[blockId] = { ...ebTranslations[blockId], body_en: value as string };
          } else {
            standardTranslations[key] = value as string;
          }
        }

        if (Object.keys(standardTranslations).length > 0) onTranslated(standardTranslations);
        if (Object.keys(ebTranslations).length > 0 && onEditorialTranslated) onEditorialTranslated(ebTranslations);

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
