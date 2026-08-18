import type { Playlist, Track, EqualizerPreset } from '../types/music';

// Initial clean state: no dummy/pre-fixed songs
export const DEFAULT_TRACKS: Track[] = [];

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-favorites',
    title: 'Músicas Curtidas',
    description: 'Sua coleção pessoal de músicas favoritas no johnmusic.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    trackIds: [],
    createdAt: Date.now(),
    isSystem: true,
  }
];

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'Padrão (Flat)', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost (Super Graves)', gains: [8, 5, 1, 0, -1] },
  { name: 'Eletrônica / EDM', gains: [6, 4, -1, 3, 5] },
  { name: 'Rock & Metal', gains: [5, 3, -2, 4, 6] },
  { name: 'Pop Hits', gains: [2, 4, 5, 2, 3] },
  { name: 'Vocal Claro', gains: [-3, 1, 6, 4, 1] },
  { name: 'Jazz & Acústico', gains: [3, 2, 1, 3, 4] },
  { name: 'Chillout / Lofi', gains: [4, 2, -2, -1, -3] },
];
