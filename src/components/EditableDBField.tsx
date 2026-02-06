import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditableDBFieldProps {
  /** The Supabase table name */
  table: 'posts' | 'collections' | 'products';
  /** Row ID */
  id: string;
  /** Column name to update */
  field: string;
  /** Current value */
  value: string;
  /** Callback after successful save */
  onSaved?: (newValue: string) => void;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
}

/**
 * Inline editor that saves directly to a Supabase table field.
 * Only visible to admins.
 */
const EditableDBField = ({
  table,
  id,
  field,
  value: initialValue,
  onSaved,
  as: Tag = 'p',
  className = '',
  multiline = false,
}: EditableDBFieldProps) => {
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setValue(initialValue); }, [initialValue]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const { error } = await supabase
      .from(table)
      .update({ [field]: value })
      .eq('id', id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mis à jour');
      setEditing(false);
      onSaved?.(value);
    }
  }, [table, id, field, value, onSaved]);

  const handleCancel = () => {
    setValue(initialValue);
    setEditing(false);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (!isAdmin) {
    return <Tag className={className}>{initialValue}</Tag>;
  }

  if (!editing) {
    return (
      <div className="group/edit relative inline-block w-full">
        <Tag className={className}>{value}</Tag>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover/edit:opacity-100 transition-opacity shadow-lg z-50"
          title="Modifier"
        >
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${className} w-full bg-background/90 border-2 border-primary p-3 focus:outline-none resize-y min-h-[120px]`}
          onKeyDown={(e) => { if (e.key === 'Escape') handleCancel(); }}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${className} w-full bg-background/90 border-2 border-primary px-3 py-1 focus:outline-none`}
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

export default EditableDBField;
