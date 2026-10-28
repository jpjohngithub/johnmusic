import React from 'react';
import { Platform } from '../types';
import { SpotifyIcon, YouTubeIcon, TikTokIcon } from './Icons';

export const PlatformBadge: React.FC<{ platform: Platform; size?: 'sm' | 'md' }> = ({
  platform,
  size = 'md'
}) => {
  const label = platform === 'spotify' ? 'Spotify' : platform === 'youtube' ? 'YouTube' : 'TikTok';
  const Icon = platform === 'spotify' ? SpotifyIcon : platform === 'youtube' ? YouTubeIcon : TikTokIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border border-purple-900/30 bg-[#160f22]/70 text-purple-300/90 ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5 opacity-80' : 'w-3 h-3 opacity-80'} />
      {label}
    </span>
  );
};
