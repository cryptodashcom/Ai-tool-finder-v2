'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Video } from 'lucide-react';
import { ImageGenerator } from './ImageGenerator';
import { VideoGenerator } from './VideoGenerator';

interface ZernioMediaPanelProps {
  onImageGenerated?: (urls: string[]) => void;
  onVideoGenerated?: (urls: string[]) => void;
}

export function ZernioMediaPanel({ onImageGenerated, onVideoGenerated }: ZernioMediaPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold">
            Z
          </span>
          Zernio AI Media
        </CardTitle>
        <CardDescription>
          Generate AI images and videos for your content workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="image">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="image" className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
          </TabsList>
          <TabsContent value="image">
            <ImageGenerator onImageGenerated={onImageGenerated} />
          </TabsContent>
          <TabsContent value="video">
            <VideoGenerator onVideoGenerated={onVideoGenerated} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
