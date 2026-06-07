'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ImageIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { ImageGenerationParams } from '@/lib/zernio/types';

interface ImageGeneratorProps {
  onImageGenerated?: (urls: string[]) => void;
}

const RATIO_SIZES: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
};

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<NonNullable<ImageGenerationParams['style']>>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<string[]>([]);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/zernio/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: negativePrompt || undefined,
          style,
          ...RATIO_SIZES[aspectRatio],
        } satisfies ImageGenerationParams),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      const urls: string[] = data.cloudinaryUrls ?? data.outputs ?? [];
      setOutputs(urls);
      onImageGenerated?.(urls);
      toast.success('Image generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="img-prompt">Prompt</Label>
        <Textarea
          id="img-prompt"
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="img-neg">Negative Prompt</Label>
        <Input
          id="img-neg"
          placeholder="What to avoid in the image..."
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={style}
            onValueChange={(v) => setStyle(v as NonNullable<ImageGenerationParams['style']>)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photorealistic">Photorealistic</SelectItem>
              <SelectItem value="illustration">Illustration</SelectItem>
              <SelectItem value="digital-art">Digital Art</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
              <SelectItem value="16:9">Landscape (16:9)</SelectItem>
              <SelectItem value="9:16">Portrait (9:16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>

      {outputs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {outputs.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Generated image ${i + 1}`} className="w-full h-auto" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a
                  href={url}
                  download={`zernio-image-${i + 1}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white p-2"
                >
                  <Download className="h-4 w-4 text-black" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
