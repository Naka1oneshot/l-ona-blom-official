import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { EditorialBlock } from '@/types/editorial';
import { EDITORIAL_STYLES } from '@/types/editorial';
import MiniRichEditor from '@/components/admin/MiniRichEditor';

interface Props {
  blocks: EditorialBlock[];
  onChange: (blocks: EditorialBlock[]) => void;
  imageCount: number;
  customStyles?: { value: string; label: string }[];
  onCustomStylesChange?: (styles: { value: string; label: string }[]) => void;
}

const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";
const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

const EditorialBlocksBuilder: React.FC<Props> = ({ blocks, onChange, imageCount, customStyles = [], onCustomStylesChange }) => {
  const [newStyleLabel, setNewStyleLabel] = useState('');

  const allStyles = [
    ...EDITORIAL_STYLES,
    ...customStyles,
  ];

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

  const addCustomStyle = () => {
    const label = newStyleLabel.trim();
    if (!label) return;
    const value = `custom-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (allStyles.some(s => s.value === value)) return;
    onCustomStylesChange?.([...customStyles, { value, label }]);
    setNewStyleLabel('');
  };

  const removeCustomStyle = (value: string) => {
    onCustomStylesChange?.(customStyles.filter(s => s.value !== value));
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
              <MiniRichEditor
                value={block.body_fr}
                onChange={(html) => updateBlock(index, 'body_fr', html)}
                placeholder="Contenu narratif..."
              />
            </div>
            <div>
              <label className={labelClass}>Texte EN</label>
              <MiniRichEditor
                value={block.body_en}
                onChange={(html) => updateBlock(index, 'body_en', html)}
                placeholder="Narrative content (optional)..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Style</label>
              <select value={block.style} onChange={e => updateBlock(index, 'style', e.target.value)}
                className={inputClass}>
                {allStyles.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Taille police</label>
              <select value={block.font_size || 'base'} onChange={e => updateBlock(index, 'font_size', e.target.value)}
                className={inputClass}>
                <option value="sm">Petit</option>
                <option value="base">Normal</option>
                <option value="lg">Grand</option>
                <option value="xl">Très grand</option>
                <option value="2xl">Extra grand</option>
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

      {/* Custom styles management */}
      {onCustomStylesChange && (
        <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
          <label className={labelClass}>Styles personnalisés</label>
          <div className="flex gap-2">
            <input
              value={newStyleLabel}
              onChange={e => setNewStyleLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomStyle())}
              className={`${inputClass} flex-1`}
              placeholder="Nom du nouveau style…"
            />
            <button type="button" onClick={addCustomStyle}
              className="px-3 py-1.5 text-xs tracking-wider uppercase font-body border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              Créer
            </button>
          </div>
          {customStyles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customStyles.map(s => (
                <span key={s.value} className="inline-flex items-center gap-1.5 text-xs font-body bg-secondary px-2.5 py-1 rounded-full">
                  {s.label}
                  <button type="button" onClick={() => removeCustomStyle(s.value)} className="text-destructive/60 hover:text-destructive">
                    <Trash2 size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditorialBlocksBuilder;
