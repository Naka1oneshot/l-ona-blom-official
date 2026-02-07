import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Video } from './admin/tiptap-video';
import { useMemo } from 'react';

interface Props {
  content: any;
  className?: string;
}

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Link.configure({ openOnClick: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
  Image.configure({ inline: false }),
  Video,
  Underline,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
];

const ArticleRenderer = ({ content, className = '' }: Props) => {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      return generateHTML(content, extensions);
    } catch {
      return '';
    }
  }, [content]);

  if (!html) return null;

  return (
    <div
      className={`lb-article ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default ArticleRenderer;
