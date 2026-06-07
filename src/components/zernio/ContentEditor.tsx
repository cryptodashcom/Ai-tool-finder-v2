'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { VideoNode } from '@/lib/tiptap/video-node';
import { ZernioMediaPanel } from '@/components/zernio';

interface ContentEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  onImageGenerated?: (urls: string[]) => void;
  onVideoGenerated?: (urls: string[]) => void;
}

export function ContentEditor({
  initialContent = '',
  onChange,
  onImageGenerated,
  onVideoGenerated,
}: ContentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image, VideoNode],
    content: initialContent,
    onUpdate({ editor: e }) {
      onChange?.(e.getHTML());
    },
  });

  function handleImageGenerated(urls: string[]) {
    urls.forEach((src) => editor?.chain().focus().setImage({ src }).run());
    onImageGenerated?.(urls);
  }

  function handleVideoGenerated(urls: string[]) {
    urls.forEach((src) => editor?.chain().focus().insertVideo({ src }).run());
    onVideoGenerated?.(urls);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
      <div className="rounded-lg border bg-background min-h-[400px] p-4 prose prose-sm max-w-none focus-within:ring-1 focus-within:ring-ring">
        <EditorContent editor={editor} className="outline-none" />
      </div>

      <ZernioMediaPanel
        onImageGenerated={handleImageGenerated}
        onVideoGenerated={handleVideoGenerated}
      />
    </div>
  );
}
