import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Move, Check, X } from 'lucide-react';

interface CoverFocalPickerProps {
  collectionId: string;
  currentFocal: string;
  coverImage: string;
  onChanged: (focal: string) => void;
  onActiveChange?: (active: boolean) => void;
}

const CoverFocalPicker = ({ collectionId, currentFocal, coverImage, onChanged, onActiveChange }: CoverFocalPickerProps) => {
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => parseFocal(currentFocal));
  const [dragStart, setDragStart] = useState<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setPosition(parseFocal(currentFocal));
  }, [currentFocal]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragStart({ x: e.clientX, y: e.clientY, posX: position.x, posY: position.y });
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    // Percentage delta relative to container size
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    // Invert: dragging right means we want to see more of the left = decrease x%
    setPosition({
      x: Math.max(0, Math.min(100, dragStart.posX - dx)),
      y: Math.max(0, Math.min(100, dragStart.posY - dy)),
    });
  }, [dragStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStart(null);
  }, []);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);

    const value = `${Math.round(position.x)}% ${Math.round(position.y)}%`;
    const { error } = await supabase
      .from('collections')
      .update({ cover_focal_point: value } as any)
      .eq('id', collectionId);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      onChanged(value);
      setActive(false);
      onActiveChange?.(false);
      toast.success('Cadrage mis à jour');
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition(parseFocal(currentFocal));
    setActive(false);
    onActiveChange?.(false);
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(true);
    onActiveChange?.(true);
  };

  if (!active) {
    return (
      <button
        onClick={handleActivate}
        className="absolute bottom-3 left-3 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white/90 hover:text-white px-3 py-1.5 rounded-full text-[11px] font-body tracking-wider uppercase transition-colors hover:bg-black/80"
      >
        <Move size={12} />
        Cadrer
      </button>
    );
  }

  return (
    <>
      {/* Draggable overlay */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-40 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* Crosshair indicator */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Frame border */}
          <div className="absolute inset-2 border-2 border-white/50 border-dashed rounded" />
          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-8 h-8 border-2 border-white/80 rounded-full shadow-lg" />
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full" />
          </div>
          {/* Position label */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-body px-2 py-0.5 rounded-full tracking-wider">
            {Math.round(position.x)}% × {Math.round(position.y)}%
          </div>
        </div>
      </div>

      {/* Save/Cancel controls */}
      <div
        className="absolute bottom-3 left-3 z-50 flex gap-1.5"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[11px] font-body tracking-wider uppercase hover:opacity-90 transition-opacity"
        >
          <Check size={12} />
          {saving ? 'Envoi…' : 'Valider'}
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-full text-[11px] font-body tracking-wider uppercase hover:bg-black/80 transition-colors"
        >
          <X size={12} />
          Annuler
        </button>
      </div>

      {/* Live preview: override the img object-position */}
      <style>{`
        [data-focal-active="${collectionId}"] img {
          object-position: ${position.x}% ${position.y}% !important;
          transition: none !important;
        }
      `}</style>
    </>
  );
};

function parseFocal(focal: string): { x: number; y: number } {
  if (!focal) return { x: 50, y: 50 };
  // Handle "X% Y%" format
  const match = focal.match(/(\d+)%?\s+(\d+)%?/);
  if (match) return { x: parseInt(match[1]), y: parseInt(match[2]) };
  // Handle legacy keywords
  switch (focal) {
    case 'top': return { x: 50, y: 0 };
    case 'bottom': return { x: 50, y: 100 };
    default: return { x: 50, y: 50 };
  }
}

export default CoverFocalPicker;
