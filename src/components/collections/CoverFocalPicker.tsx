import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface CoverFocalPickerProps {
  collectionId: string;
  currentFocal: string;
  onChanged: (focal: string) => void;
}

const options = [
  { value: 'top', label: 'Haut' },
  { value: 'center', label: 'Centre' },
  { value: 'bottom', label: 'Bas' },
] as const;

const CoverFocalPicker = ({ collectionId, currentFocal, onChanged }: CoverFocalPickerProps) => {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (value: string) => {
    if (value === currentFocal || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from('collections')
      .update({ cover_focal_point: value } as any)
      .eq('id', collectionId);

    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      onChanged(value);
      toast.success('Point focal mis à jour');
    }
  };

  return (
    <div
      className="absolute bottom-3 left-3 z-50 flex gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSelect(opt.value)}
          disabled={saving}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body tracking-wider uppercase transition-colors ${
            currentFocal === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {currentFocal === opt.value && <Check size={10} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default CoverFocalPicker;
