import { Node, mergeAttributes } from '@tiptap/react';

export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'video' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, {
      controls: true,
      style: 'max-width:100%;border-radius:0;',
      playsinline: true,
    })];
  },
});
