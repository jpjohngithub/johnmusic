import React from 'react';
import { Platform } from '../types';
import { SpotifyIcon, YouTubeIcon, TikTokIcon } from './Icons';

export const PlatformBadge: React.FC<{ platform: Platform; size?: 'sm' | 'md' }> = ({
  platform,
  size = 'md'
}) => {
  if (platform === 'spotify') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-emerald-500/30 bg-emerald-950/60 text-emerald-400 shadow-sm backdrop-blur-md ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <SpotifyIcon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        Spotify
      </span>
    );
  }

  if (platform === 'youtube') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-red-500/30 bg-red-950/60 text-red-400 shadow-sm backdrop-blur-md ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <YouTubeIcon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        YouTube
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-400 shadow-sm backdrop-blur-md ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <TikTokIcon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      TikTok
    </span>
  );
};
