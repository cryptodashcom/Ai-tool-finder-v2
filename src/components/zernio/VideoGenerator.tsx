'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Loader2, Video, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { VideoGenerationParams } from '@/lib/zernio/types';

interface VideoGeneratorProps {
  onVideoGenerated?: (urls: string[]) => void;
}

const STATUS_LABEL: Record<string, string> = {
  starting: 'Starting...',
  processing: 'Generating video...',
  completed: 'Done!',
  failed: 'Failed',
};

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<NonNullable<VideoGenerationParams['aspectRatio']>>('16:9');
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [outputs, setOutputs] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function poll(jobId: string) {
    try {
      const res = await fetch(`/api/zernio/media-status/${jobId}`);
      const data = await res.json();
      setStatus(data.status);

      if (data.status === 'completed') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setIsGenerating(false);
        setProgress(100);
        const urls: string[] = data.cloudinaryUrls ?? data.outputs ?? [];
        setOutputs(urls);
        onVideoGenerated?.(urls);
        toast.success('Video generated!');
      } else if (data.status === 'failed') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setIsGenerating(false);
        toast.error(data.error ?? 'Video generation failed');
      } else {
        setProgress((p) => Math.min(p + 7, 90));
      }
    } catch {
      // transient error — keep polling
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setOutputs([]);
    setProgress(5);
    setStatus('starting');

    try {
      const res = await fetch('/api/zernio/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: negativePrompt || undefined,
          aspectRatio,
          duration,
        } satisfies VideoGenerationParams),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start generation');

      setProgress(15);
      pollRef.current = setInterval(() => poll(data.jobId), 5000);
    } catch (err) {
      setIsGenerating(false);
      setProgress(0);
      toast.error(err instanceof Error ? err.message : 'Failed to generate video');
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vid-prompt">Prompt</Label>
        <Textarea
          id="vid-prompt"
          placeholder="Describe the video you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vid-neg">Negative Prompt</Label>
        <Textarea
          id="vid-neg"
          placeholder="What to avoid in the video..."
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select
            value={aspectRatio}
            onValueChange={(v) => setAspectRatio(v as NonNullable<VideoGenerationParams['aspectRatio']>)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">Landscape (16:9)</SelectItem>
              <SelectItem value="9:16">Portrait (9:16)</SelectItem>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Duration: {duration}s</Label>
          <Slider
            min={3}
            max={10}
            step={1}
            value={[duration]}
            onValueChange={([v]) => setDuration(v)}
            className="mt-3"
          />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {STATUS_LABEL[status] ?? 'Generating...'}
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Generate Video
          </>
        )}
      </Button>

      {isGenerating && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            Video generation typically takes 1–3 minutes
          </p>
        </div>
      )}

      {outputs.length > 0 && (
        <div className="space-y-3 pt-2">
          {outputs.map((url, i) => (
            <div key={i} className="rounded-lg overflow-hidden border">
              <video src={url} controls className="w-full" />
              <div className="flex justify-end p-2 bg-muted/40">
                <a href={url} download={`zernio-video-${i + 1}.mp4`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <Download className="mr-1.5 h-3 w-3" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
