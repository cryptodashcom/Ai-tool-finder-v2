'use client';

import { PostComposer } from '@/components/scheduler';

export default function SchedulerPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post Scheduler</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compose your post and generate AI images or videos with Zernio, then schedule across channels.
        </p>
      </div>
      <PostComposer />
    </div>
  );
}
