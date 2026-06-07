'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContentEditor } from '@/components/zernio';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, featuredImage }),
      });
      if (!res.ok) throw new Error('Failed to save post');
      toast.success('Post created!');
      router.push('/admin/blog');
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving…' : 'Publish Post'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Post title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold h-12"
        />
      </div>

      {featuredImage && (
        <div className="rounded-lg overflow-hidden border max-h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featuredImage} alt="Featured" className="w-full h-64 object-cover" />
        </div>
      )}

      <ContentEditor
        onChange={setContent}
        onImageGenerated={(urls) => {
          setFeaturedImage((prev) => prev || urls[0]);
        }}
      />
    </div>
  );
}
