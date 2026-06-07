'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaPreviewProps {
  urls: string[];
  type: 'image' | 'video' | null;
  onRemove: (url: string) => void;
}

export function MediaPreview({ urls, type, onRemove }: MediaPreviewProps) {
  if (!urls.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {urls.map((url, i) => (
        <div key={i} className="relative rounded-lg overflow-hidden border group aspect-video bg-muted">
          {type === 'video' ? (
            <video src={url} className="w-full h-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
          )}
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(url)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
