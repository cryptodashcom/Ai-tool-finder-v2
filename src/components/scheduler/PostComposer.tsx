'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ZernioMediaPanel } from '@/components/zernio';
import { PlatformPicker } from './PlatformPicker';
import { MediaPreview } from './MediaPreview';
import { PLATFORMS, Platform, ScheduledPost } from './types';
import { toast } from 'sonner';
import { CalendarClock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostComposerProps {
  onScheduled?: (post: ScheduledPost) => void;
}

export function PostComposer({ onScheduled }: PostComposerProps) {
  const [platforms, setPlatforms] = useState<Platform[]>(['twitter']);
  const [caption, setCaption] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activePlatform = PLATFORMS.find((p) => platforms[0] === p.id);
  const maxChars = activePlatform?.maxChars ?? 280;
  const remaining = maxChars - caption.length;
  const isOverLimit = remaining < 0;

  function handleImageGenerated(urls: string[]) {
    setMediaUrls((prev) => [...prev, ...urls].slice(0, 4));
    setMediaType('image');
  }

  function handleVideoGenerated(urls: string[]) {
    setMediaUrls(urls.slice(0, 1));
    setMediaType('video');
  }

  function removeMedia(url: string) {
    const next = mediaUrls.filter((u) => u !== url);
    setMediaUrls(next);
    if (!next.length) setMediaType(null);
  }

  async function handleSchedule() {
    if (!caption.trim()) { toast.error('Caption is required'); return; }
    if (!platforms.length) { toast.error('Select at least one platform'); return; }
    if (!scheduledAt) { toast.error('Pick a date and time'); return; }
    if (isOverLimit) { toast.error('Caption exceeds character limit'); return; }

    setIsSaving(true);
    try {
      const post: ScheduledPost = {
        platforms,
        caption,
        mediaUrls,
        mediaType,
        scheduledAt,
        status: 'scheduled',
      };
      const res = await fetch('/api/scheduler/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      if (!res.ok) throw new Error('Failed to schedule post');
      toast.success('Post scheduled!');
      onScheduled?.(await res.json());
      setCaption('');
      setMediaUrls([]);
      setMediaType(null);
      setScheduledAt('');
    } catch {
      toast.error('Failed to schedule post');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
      {/* Composer */}
      <div className="space-y-4 rounded-xl border bg-background p-5 shadow-sm">
        <div className="space-y-2">
          <Label>Platforms</Label>
          <PlatformPicker selected={platforms} onChange={setPlatforms} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="caption">Caption</Label>
            <span className={cn('text-xs tabular-nums', isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground')}>
              {remaining}
            </span>
          </div>
          <Textarea
            id="caption"
            placeholder="What's happening?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        <MediaPreview urls={mediaUrls} type={mediaType} onRemove={removeMedia} />

        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="schedule-time">Schedule for</Label>
            <Input
              id="schedule-time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <Button onClick={handleSchedule} disabled={isSaving || isOverLimit} className="shrink-0">
            {isSaving ? (
              <><CalendarClock className="mr-2 h-4 w-4 animate-pulse" />Scheduling…</>
            ) : (
              <><Send className="mr-2 h-4 w-4" />Schedule</>
            )}
          </Button>
        </div>
      </div>

      {/* AI Media Panel */}
      <ZernioMediaPanel
        onImageGenerated={handleImageGenerated}
        onVideoGenerated={handleVideoGenerated}
      />
    </div>
  );
}
