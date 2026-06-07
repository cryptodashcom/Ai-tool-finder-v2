import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs: { src: string }) => ReturnType;
    };
  }
}

export const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, { controls: true, class: 'w-full rounded-lg my-2' }),
    ];
  },

  addCommands() {
    return {
      insertVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
