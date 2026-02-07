import React from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { EditorialBlock } from '@/types/editorial';
import { EDITORIAL_STYLES } from '@/types/editorial';

interface Props {
  blocks: EditorialBlock[];
  onChange: (blocks: EditorialBlock[]) => void;
  imageCount: number;
}

const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

const EditorialBlocksBuilder: React.FC<Props> = ({ blocks, onChange, imageCount }) => {
  const addBlock = () => {
    const newBlock: EditorialBlock = {
      id: `blk-${Date.now()}`,
      title_fr: '',
      title_en: '',
      body_fr: '',
      body_en: '',
      image_index: null,
      style: 'default',
    };
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, field: string, value: any) => {
    const updated = blocks.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    onChange(updated);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const updated = [...blocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={labelClass}>Blocs éditoriaux (Scrollytelling)</label>
        <button
          type="button"
          onClick={addBlock}
          className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-body text-primary hover:text-primary/80 transition-colors"
        >
          <Plus size={14} /> Ajouter un bloc
        </button>
      </div>

      {blocks.length === 0 && (
        <p className="text-xs font-body text-muted-foreground italic py-4 text-center border border-dashed border-border rounded-lg">
          Aucun bloc éditorial. Les champs existants (histoire, matières, entretien) seront utilisés par défaut.
        </p>
      )}

      {blocks.map((block, index) => (
        <div key={block.id} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted-foreground" />
              <span className="text-xs font-body text-muted-foreground">
                Bloc {index + 1}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronUp size={14} />
              </button>
              <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronDown size={14} />
              </button>
              <button type="button" onClick={() => removeBlock(index)}
                className="p-1 text-destructive/60 hover:text-destructive transition-colors ml-2">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Titre FR *</label>
              <input value={block.title_fr} onChange={e => updateBlock(index, 'title_fr', e.target.value)}
                className={inputClass} placeholder="Titre du bloc" />
            </div>
            <div>
              <label className={labelClass}>Titre EN</label>
              <input value={block.title_en} onChange={e => updateBlock(index, 'title_en', e.target.value)}
                className={inputClass} placeholder="Block title (optional)" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Texte FR *</label>
              <textarea value={block.body_fr} onChange={e => updateBlock(index, 'body_fr', e.target.value)}
                className={`${inputClass} min-h-[100px] resize-y`} placeholder="Contenu narratif..." />
            </div>
            <div>
              <label className={labelClass}>Texte EN</label>
              <textarea value={block.body_en} onChange={e => updateBlock(index, 'body_en', e.target.value)}
                className={`${inputClass} min-h-[100px] resize-y`} placeholder="Narrative content (optional)..." />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Style</label>
              <select value={block.style} onChange={e => updateBlock(index, 'style', e.target.value)}
                className={inputClass}>
                {EDITORIAL_STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Image (index)</label>
              <select
                value={block.image_index ?? ''}
                onChange={e => updateBlock(index, 'image_index', e.target.value === '' ? null : Number(e.target.value))}
                className={inputClass}
              >
                <option value="">Auto (1ère)</option>
                {Array.from({ length: imageCount }, (_, i) => (
                  <option key={i} value={i}>Image #{i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditorialBlocksBuilder;
