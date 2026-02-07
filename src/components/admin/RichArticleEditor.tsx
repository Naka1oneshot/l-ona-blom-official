import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2,
  Heading3, Pilcrow, Eye, Type, Highlighter, X, Undo2, Redo2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ArticleRenderer from '@/components/ArticleRenderer';

interface Props {
  content: any;
  onChange: (json: any) => void;
  placeholder?: string;
}

const TEXT_COLORS = [
  { label: 'Défaut', value: '' },
  { label: 'Noir', value: '#000000' },
  { label: 'Blanc', value: '#ffffff' },
  { label: 'Magenta', value: '#981D70' },
  { label: 'Gris', value: '#737373' },
  { label: 'Rouge', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Ambre', value: '#d97706' },
  { label: 'Vert', value: '#16a34a' },
  { label: 'Bleu', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
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
  { label: 'Violet', value: '#ede9fe' },
  { label: 'Gris', value: '#e5e5e5' },
];

const ColorPicker = ({
  colors,
  currentColor,
  onSelect,
  label,
}: {
  colors: { label: string; value: string }[];
  currentColor: string;
  onSelect: (color: string) => void;
  label: string;
}) => (
  <div className="p-2 space-y-2">
    <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground">{label}</p>
    <div className="grid grid-cols-6 gap-1">
      {colors.map((c) => (
        <button
          key={c.value || 'default'}
          type="button"
          onClick={() => onSelect(c.value)}
          title={c.label}
          className={`w-7 h-7 rounded-sm border transition-all flex items-center justify-center ${
            currentColor === c.value
              ? 'border-foreground ring-1 ring-foreground/30 scale-110'
              : 'border-border hover:border-foreground/40 hover:scale-105'
          }`}
          style={{ background: c.value || 'transparent' }}
        >
          {!c.value && <X size={12} className="text-muted-foreground" />}
        </button>
      ))}
    </div>
  </div>
);

const ToolbarButton = ({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-sm transition-colors ${
      active
        ? 'bg-foreground text-background'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    {children}
  </button>
);

const EditorToolbar = ({ editor }: { editor: Editor }) => {
  const addLink = useCallback(() => {
    const url = prompt('URL du lien :');
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = prompt("URL de l'image :");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  const setBlock = (value: string) => {
    if (value === 'p') editor.chain().focus().setParagraph().run();
    else if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  const currentTextColor = editor.getAttributes('textStyle').color || '';
  const currentHighlight = editor.getAttributes('highlight').color || '';

  return (
    <div className="flex flex-wrap items-center gap-0.5 border border-border bg-muted/30 p-1.5 mb-0">
      <Select value={currentHeading} onValueChange={setBlock}>
        <SelectTrigger className="h-8 w-[140px] text-xs font-body border-border rounded-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="p">
            <span className="flex items-center gap-2"><Pilcrow size={14} /> Paragraphe</span>
          </SelectItem>
          <SelectItem value="h1">
            <span className="flex items-center gap-2"><Heading1 size={14} /> Titre (H1)</span>
          </SelectItem>
          <SelectItem value="h2">
            <span className="flex items-center gap-2"><Heading2 size={14} /> Sous-titre (H2)</span>
          </SelectItem>
          <SelectItem value="h3">
            <span className="flex items-center gap-2"><Heading3 size={14} /> Intertitre (H3)</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras">
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique">
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné">
        <UnderlineIcon size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text color */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Couleur du texte"
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <Type size={15} />
            <span
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full"
              style={{ background: currentTextColor || 'currentColor' }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ColorPicker
            colors={TEXT_COLORS}
            currentColor={currentTextColor}
            onSelect={(color) => {
              if (color) {
                editor.chain().focus().setColor(color).run();
              } else {
                editor.chain().focus().unsetColor().run();
              }
            }}
            label="Couleur du texte"
          />
        </PopoverContent>
      </Popover>

      {/* Highlight color */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Surlignage"
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <Highlighter size={15} />
            <span
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full"
              style={{ background: currentHighlight || 'transparent' }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ColorPicker
            colors={HIGHLIGHT_COLORS}
            currentColor={currentHighlight}
            onSelect={(color) => {
              if (color) {
                editor.chain().focus().toggleHighlight({ color }).run();
              } else {
                editor.chain().focus().unsetHighlight().run();
              }
            }}
            label="Surlignage"
          />
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
        <Quote size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton active={editor.isActive('link')} onClick={addLink} title="Lien">
        <LinkIcon size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image">
        <ImageIcon size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler (Ctrl+Z)">
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rétablir (Ctrl+Y)">
        <Redo2 size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Aperçu"
          >
            <Eye size={15} />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-display">Aperçu de l'article</DialogTitle>
          </DialogHeader>
          <div className="lb-article mt-4">
            <ArticleRenderer content={editor.getJSON()} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const RichArticleEditor = ({ content, onChange, placeholder }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Commencez à écrire…' }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'lb-article lb-editor-area outline-none min-h-[300px] px-6 py-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-border overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichArticleEditor;
