import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2,
  Heading3, Pilcrow, Eye
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
import ArticleRenderer from '@/components/ArticleRenderer';

interface Props {
  content: any; // TipTap JSON or null
  onChange: (json: any) => void;
  placeholder?: string;
}

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
    const url = prompt('URL de l\'image :');
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

  // Sync external content changes
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
