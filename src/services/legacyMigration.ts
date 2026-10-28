import { Playlist, Track, Platform } from '../types';

export function importLegacyPlaylists(): Playlist[] {
  const importedList: Playlist[] = [];
  const seenIds = new Set<string>();

  const convertLegacyItemToTrack = (item: any): Track => {
    const platform: Platform =
      item.source === 'spotify' || item.source === 'youtube' || item.source === 'tiktok'
        ? item.source
        : item.videoId
        ? 'youtube'
        : item.tiktokPostId || item.audioUrl
        ? 'tiktok'
        : 'youtube';

    return {
      id: item.id || `leg_trk_${item.videoId || Math.random()}`,
      title: item.title || 'Música Antiga',
      artist: item.subtitle || item.author || item.artist || 'Artista',
      album: item.album || 'JohnMusic Legacy',
      duration: item.durationMs ? Math.round(item.durationMs / 1000) : item.duration || 180,
      coverUrl: item.imageUrl || item.coverUrl || item.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      platform,
      youtubeId: item.videoId || undefined,
      streamUrl: item.audioUrl || item.backupAudioUrl || undefined
    };
  };

  // 1. Check zustand persist store 'johnmusic-library-v4'
  const keysToCheck = [
    'johnmusic-library-v4',
    'johnmusic-library-v3',
    'johnmusic-library-v2',
    'johnmusic-library-v1',
    'johnmusic-library',
    'johnmusic_playlists',
    'johnmusic_playlists_v2',
    'johnmusic_playlists_v1',
    'customPlaylists',
    'youtubePlaylists',
    'tiktokPlaylists'
  ];

  for (const key of keysToCheck) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      // Handle Zustand store format: { state: { customPlaylists, youtubePlaylists, ... } }
      const stateObj = parsed.state || parsed;

      // Check customPlaylists
      if (Array.isArray(stateObj.customPlaylists)) {
        for (const pl of stateObj.customPlaylists) {
          if (!seenIds.has(pl.id)) {
            seenIds.add(pl.id);
            const tracks: Track[] = Array.isArray(pl.items)
              ? pl.items.map(convertLegacyItemToTrack)
              : Array.isArray(pl.tracks)
              ? pl.tracks.map(convertLegacyItemToTrack)
              : [];

            const stableId = pl.id || `pl_leg_${(pl.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            importedList.push({
              id: stableId,
              name: pl.name || 'Playlist Recuperada',
              description: pl.description || 'Restaurada da versão anterior do JohnMusic',
              coverUrl: pl.coverUrl || tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
              tracks,
              createdAt: pl.createdAt ? new Date(pl.createdAt).getTime() : Date.now(),
              isCustom: true
            });
          }
        }
      }

      // Check youtubePlaylists
      if (Array.isArray(stateObj.youtubePlaylists)) {
        for (const pl of stateObj.youtubePlaylists) {
          const plId = pl.id || `pl_yt_${(pl.name || 'yt').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          if (!seenIds.has(plId)) {
            seenIds.add(plId);
            const tracks: Track[] = Array.isArray(pl.videos)
              ? pl.videos.map((v: any) => ({
                  id: `yt_${v.videoId || v.id}`,
                  title: v.title || 'Vídeo YouTube',
                  artist: v.author || 'YouTube',
                  duration: v.duration || 180,
                  coverUrl: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                  platform: 'youtube' as Platform,
                  youtubeId: v.videoId || v.id
                }))
              : [];

            importedList.push({
              id: plId,
              name: pl.name || 'YouTube Playlist Recuperada',
              description: 'Restaurada da biblioteca anterior do YouTube',
              coverUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
              tracks,
              createdAt: Date.now(),
              isCustom: true
            });
          }
        }
      }

      // Check tiktokPlaylists
      if (Array.isArray(stateObj.tiktokPlaylists)) {
        for (const pl of stateObj.tiktokPlaylists) {
          const plId = pl.id || `pl_tt_${(pl.name || 'tt').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          if (!seenIds.has(plId)) {
            seenIds.add(plId);
            const tracks: Track[] = Array.isArray(pl.videos)
              ? pl.videos.map((v: any) => ({
                  id: `tt_${v.id || v.videoId}`,
                  title: v.title || 'TikTok Audio',
                  artist: v.author || 'TikTok Creator',
                  duration: v.duration || 60,
                  coverUrl: v.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
                  platform: 'tiktok' as Platform,
                  streamUrl: v.musicUrl || v.audioUrl || v.play
                }))
              : [];

            importedList.push({
              id: plId,
              name: pl.name || 'TikTok Playlist Recuperada',
              description: 'Restaurada da biblioteca anterior do TikTok',
              coverUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
              tracks,
              createdAt: Date.now(),
              isCustom: true
            });
          }
        }
      }

      // Check raw arrays of playlists
      if (Array.isArray(stateObj) && key.toLowerCase().includes('playlist')) {
        for (const pl of stateObj) {
          if (pl && pl.name && !seenIds.has(pl.id)) {
            const stableId = pl.id || `pl_arr_${(pl.name || 'raw').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            seenIds.add(stableId);
            const rawTracks = pl.tracks || pl.items || [];
            importedList.push({
              id: stableId,
              name: pl.name,
              description: pl.description || 'Restaurada do histórico anterior',
              coverUrl: pl.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
              tracks: Array.isArray(rawTracks) ? rawTracks.map(convertLegacyItemToTrack) : [],
              createdAt: Date.now(),
              isCustom: true
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Error reading key ${key}:`, e);
    }
  }

  return importedList;
}
