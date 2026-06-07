'use client';

import { PLATFORMS, Platform } from './types';
import { cn } from '@/lib/utils';

interface PlatformPickerProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

const ICONS: Record<Platform, string> = {
  twitter: 'X',
  linkedin: 'in',
  facebook: 'f',
};

const COLORS: Record<Platform, string> = {
  twitter: 'bg-black text-white',
  linkedin: 'bg-[#0077B5] text-white',
  facebook: 'bg-[#1877F2] text-white',
};

export function PlatformPicker({ selected, onChange }: PlatformPickerProps) {
  function toggle(id: Platform) {
    onChange(
      selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    );
  }

  return (
    <div className="flex gap-2">
      {PLATFORMS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => toggle(p.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
            selected.includes(p.id)
              ? cn(COLORS[p.id], 'border-transparent shadow-sm')
              : 'bg-muted text-muted-foreground border-border hover:border-foreground/30'
          )}
        >
          <span className={cn(
            'inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold',
            selected.includes(p.id) ? 'bg-white/20' : COLORS[p.id]
          )}>
            {ICONS[p.id]}
          </span>
          {p.label}
        </button>
      ))}
    </div>
  );
}
