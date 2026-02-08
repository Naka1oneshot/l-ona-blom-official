import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold, Italic, Underline as UnderlineIcon,
  Highlighter, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, X,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const TEXT_COLORS = [
  { label: 'Défaut', value: '' },
  { label: 'Noir', value: '#000000' },
  { label: 'Blanc', value: '#ffffff' },
  { label: 'Magenta', value: '#981D70' },
  { label: 'Gris', value: '#737373' },
  { label: 'Rouge', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Vert', value: '#16a34a' },
  { label: 'Bleu', value: '#2563eb' },
  { label: 'Violet', value: '#7c3aed' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Aucun', value: '' },
  { label: 'Jaune', value: '#fef08a' },
  { label: 'Rose', value: '#fce7f3' },
  { label: 'Magenta clair', value: '#f0d0e4' },
  { label: 'Vert', value: '#dcfce7' },
  { label: 'Bleu', value: '#dbeafe' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Gris', value: '#e5e5e5' },
];

const ColorGrid = ({
  colors,
  current,
  onSelect,
  label,
}: {
  colors: { label: string; value: string }[];
  current: string;
  onSelect: (v: string) => void;
  label: string;
}) => (
  <div className="p-2 space-y-2">
    <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground">{label}</p>
    <div className="grid grid-cols-5 gap-1">
      {colors.map((c) => (
        <button
          key={c.value || 'default'}
          type="button"
          onClick={() => onSelect(c.value)}
          title={c.label}
          className={`w-6 h-6 rounded-sm border transition-all flex items-center justify-center ${
            current === c.value
              ? 'border-foreground ring-1 ring-foreground/30 scale-110'
              : 'border-border hover:border-foreground/40'
          }`}
          style={{ background: c.value || 'transparent' }}
        >
          {!c.value && <X size={10} className="text-muted-foreground" />}
        </button>
      ))}
    </div>
  </div>
);

const Btn = ({
  active, onClick, children, title,
}: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1 rounded-sm transition-colors ${
      active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    {children}
  </button>
);

const MiniToolbar = ({ editor }: { editor: Editor }) => {
  const textColor = editor.getAttributes('textStyle').color || '';
  const hlColor = editor.getAttributes('highlight').color || '';

  return (
    <div className="flex flex-wrap items-center gap-0.5 border border-border bg-muted/30 p-1 rounded-t-md">
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras">
        <Bold size={13} />
      </Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique">
        <Italic size={13} />
      </Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné">
        <UnderlineIcon size={13} />
      </Btn>

      <span className="w-px h-4 bg-border mx-0.5" />

      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="Couleur" className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
            <Type size={13} />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-[2px] rounded-full" style={{ background: textColor || 'currentColor' }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ColorGrid colors={TEXT_COLORS} current={textColor}
            onSelect={(c) => c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run()}
            label="Couleur du texte" />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="Surlignage" className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
            <Highlighter size={13} />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-[2px] rounded-full" style={{ background: hlColor || 'transparent' }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ColorGrid colors={HIGHLIGHT_COLORS} current={hlColor}
            onSelect={(c) => c ? editor.chain().focus().toggleHighlight({ color: c }).run() : editor.chain().focus().unsetHighlight().run()}
            label="Surlignage" />
        </PopoverContent>
      </Popover>

      <span className="w-px h-4 bg-border mx-0.5" />

      <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Gauche">
        <AlignLeft size={13} />
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrer">
        <AlignCenter size={13} />
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Droite">
        <AlignRight size={13} />
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justifier">
        <AlignJustify size={13} />
      </Btn>
    </div>
  );
};

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MiniRichEditor: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, blockquote: false, bulletList: false, orderedList: false, codeBlock: false, horizontalRule: false }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Texte…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[80px] px-3 py-2 text-sm font-body prose prose-sm max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <MiniToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default MiniRichEditor;
