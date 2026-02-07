import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditableTextProps {
  /** Unique key for this text block, stored in site_settings */
  settingsKey: string;
  /** Default text if nothing is saved in DB */
  defaultText: string;
  /** 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'blockquote' */
  as?: keyof JSX.IntrinsicElements;
  /** Additional className for the rendered element */
  className?: string;
  /** Use textarea instead of input for multiline */
  multiline?: boolean;
}

/**
 * Renders text that admins can click to edit inline.
 * Values are stored per-language in site_settings as JSON: { fr: "...", en: "..." }
 */
const EditableText = ({
  settingsKey,
  defaultText,
  as: Tag = 'p',
  className = '',
  multiline = false,
}: EditableTextProps) => {
  const { isAdmin } = useAuth();
  const { language } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultText);
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Load saved value from site_settings
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', settingsKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object') {
          const vals = data.value as Record<string, string>;
          setSavedValues(vals);
          if (vals[language]) setValue(vals[language]);
        }
      });
  }, [settingsKey]);

  // Update displayed value when language changes
  useEffect(() => {
    if (savedValues[language]) {
      setValue(savedValues[language]);
    } else {
      setValue(defaultText);
    }
  }, [language, savedValues, defaultText]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const newValues = { ...savedValues, [language]: value };

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: settingsKey, value: newValues as any },
        { onConflict: 'key' }
      );

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSavedValues(newValues);
      toast.success('Texte mis à jour');
      setEditing(false);
    }
  }, [settingsKey, value, savedValues, language]);

  const handleCancel = () => {
    setValue(savedValues[language] || defaultText);
    setEditing(false);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-resize textarea on open
      if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
        const el = inputRef.current;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }
    }
  }, [editing, multiline]);

  // Non-admin: just render the text
  if (!isAdmin) {
    return <Tag className={className}>{value}</Tag>;
  }

  // Admin in view mode
  if (!editing) {
    return (
      <div className="group/edit relative inline-block w-full">
        <Tag className={className}>{value}</Tag>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover/edit:opacity-100 transition-opacity shadow-lg z-50"
          title="Modifier ce texte"
        >
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  // Admin in edit mode
  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            // Auto-resize
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
          }}
          className={`${className} w-full bg-background/90 border-2 border-primary p-3 focus:outline-none resize-y min-h-[80px] max-h-[300px] overflow-y-auto text-foreground`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
          style={{ height: 'auto' }}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${className} w-full bg-background/90 border-2 border-primary px-3 py-1 focus:outline-none text-foreground`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
      )}
      <div className="flex gap-1 mt-1 justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-luxury-magenta-light transition-colors"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default EditableText;
