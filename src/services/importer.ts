import { Track, Playlist, Platform } from '../types';
import { extractYouTubeId, searchYouTube } from './api';

export interface ImportResult {
  type: 'track' | 'playlist';
  track?: Track;
  playlist?: Playlist;
}

export function detectUrlType(url: string): {
  platform: Platform | 'unknown';
  isPlaylist: boolean;
  id?: string;
} {
  const clean = url.trim();

  // TikTok
  if (clean.includes('tiktok.com')) {
    return { platform: 'tiktok', isPlaylist: false };
  }

  // YouTube Playlist
  if (clean.includes('youtube.com/playlist') || clean.includes('list=')) {
    const match = clean.match(/[?&]list=([^#&?]+)/);
    return { platform: 'youtube', isPlaylist: true, id: match ? match[1] : undefined };
  }

  // YouTube Video
  const ytId = extractYouTubeId(clean);
  if (ytId) {
    return { platform: 'youtube', isPlaylist: false, id: ytId };
  }

  // Spotify Playlist
  if (clean.includes('open.spotify.com/playlist/')) {
    const match = clean.match(/playlist\/([a-zA-Z0-9]+)/);
    return { platform: 'spotify', isPlaylist: true, id: match ? match[1] : undefined };
  }

  // Spotify Track
  if (clean.includes('open.spotify.com/track/')) {
    const match = clean.match(/track\/([a-zA-Z0-9]+)/);
    return { platform: 'spotify', isPlaylist: false, id: match ? match[1] : undefined };
  }

  return { platform: 'unknown', isPlaylist: false };
}

// 1. Import TikTok Audio
export async function importTikTokUrl(url: string): Promise<Track> {
  const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Não foi possível obter informações do TikTok');
  const json = await res.json();

  if (!json.data) throw new Error('Vídeo do TikTok não encontrado ou privado');
  const d = json.data;

  const audioUrl = d.music || d.music_info?.play || d.play;
  if (!audioUrl) throw new Error('Áudio do TikTok indisponível');

  return {
    id: `tt_${d.id || Date.now()}`,
    title: d.music_info?.title || d.title?.slice(0, 50) || 'Áudio Importado do TikTok',
    artist: d.music_info?.author || d.author?.nickname || 'Criador do TikTok',
    album: 'TikTok Sound Import',
    duration: d.music_info?.duration || d.duration || 60,
    coverUrl: d.music_info?.cover || d.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
    platform: 'tiktok',
    streamUrl: audioUrl,
    tiktokOriginalUrl: url
  };
}

// 2. Import YouTube Video
export async function importYouTubeUrl(url: string): Promise<Track> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Link do YouTube inválido');

  let title = 'Música do YouTube';
  let artist = 'YouTube';

  try {
    const noembed = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (noembed.ok) {
      const data = await noembed.json();
      if (data.title) {
        title = data.title;
        artist = data.author_name || 'YouTube';
      }
    }
  } catch (e) {
    console.warn('Oembed error:', e);
  }

  return {
    id: `yt_${videoId}`,
    title,
    artist,
    duration: 210,
    coverUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    platform: 'youtube',
    youtubeId: videoId
  };
}

// 3. Import Spotify Track (Resolve to YouTube for full song)
export async function importSpotifyTrackUrl(url: string): Promise<Track> {
  let title = 'Música do Spotify';
  let artist = 'Artista Spotify';
  let coverUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80';

  try {
    const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) {
        title = oembed.title;
      }
      if (oembed.thumbnail_url) {
        coverUrl = oembed.thumbnail_url;
      }
    }
  } catch (e) {
    console.warn('Spotify oembed error:', e);
  }

  // Resolve full audio via YouTube
  let matchedYtId = '';
  const ytResults = await searchYouTube(`${title} ${artist}`);
  if (ytResults.length > 0 && ytResults[0].youtubeId) {
    matchedYtId = ytResults[0].youtubeId;
  }

  return {
    id: `sp_imp_${Date.now()}`,
    title,
    artist,
    duration: 210,
    coverUrl,
    platform: 'spotify',
    youtubeId: matchedYtId || undefined
  };
}

// 4. Import YouTube Playlist
export async function importYouTubePlaylistUrl(url: string): Promise<Playlist> {
  const { id: playlistId } = detectUrlType(url);
  if (!playlistId) throw new Error('ID da playlist do YouTube não encontrado');

  const instances = ['https://pipedapi.kavin.rocks', 'https://api.invidious.io'];
  let tracks: Track[] = [];
  let playlistName = 'Playlist do YouTube';

  try {
    const res = await fetch(`https://pipedapi.kavin.rocks/playlists/${playlistId}`);
    if (res.ok) {
      const data = await res.json();
      playlistName = data.name || playlistName;
      if (Array.isArray(data.relatedStreams)) {
        tracks = data.relatedStreams.slice(0, 50).map((s: any) => {
          const vId = s.url?.replace('/watch?v=', '') || s.id;
          return {
            id: `yt_${vId}`,
            title: s.title,
            artist: s.uploaderName || 'YouTube',
            duration: s.duration || 180,
            coverUrl: s.thumbnail || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            platform: 'youtube' as Platform,
            youtubeId: vId
          };
        });
      }
    }
  } catch (e) {
    console.warn('Piped playlist fetch error:', e);
  }

  // If piped failed, try Invidious or create starter with title
  if (tracks.length === 0) {
    try {
      const noembed = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${playlistId}`);
      if (noembed.ok) {
        const d = await noembed.json();
        if (d.title) playlistName = d.title;
      }
    } catch {}
  }

  return {
    id: `pl_yt_${playlistId}_${Date.now()}`,
    name: playlistName,
    description: `Playlist importada do YouTube (${tracks.length} músicas)`,
    coverUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    tracks,
    createdAt: Date.now(),
    isCustom: true
  };
}

// 5. Import Spotify Playlist
export async function importSpotifyPlaylistUrl(url: string): Promise<Playlist> {
  let name = 'Playlist do Spotify';
  let coverUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80';

  try {
    const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) name = oembed.title;
      if (oembed.thumbnail_url) coverUrl = oembed.thumbnail_url;
    }
  } catch (e) {
    console.warn('Spotify playlist oembed error:', e);
  }

  return {
    id: `pl_sp_${Date.now()}`,
    name,
    description: `Playlist importada do Spotify`,
    coverUrl,
    tracks: [],
    createdAt: Date.now(),
    isCustom: true
  };
}

// Universal Import Handler
export async function importFromUrl(url: string): Promise<ImportResult> {
  const { platform, isPlaylist } = detectUrlType(url);

  if (platform === 'tiktok') {
    const track = await importTikTokUrl(url);
    return { type: 'track', track };
  }

  if (platform === 'youtube') {
    if (isPlaylist) {
      const playlist = await importYouTubePlaylistUrl(url);
      return { type: 'playlist', playlist };
    } else {
      const track = await importYouTubeUrl(url);
      return { type: 'track', track };
    }
  }

  if (platform === 'spotify') {
    if (isPlaylist) {
      const playlist = await importSpotifyPlaylistUrl(url);
      return { type: 'playlist', playlist };
    } else {
      const track = await importSpotifyTrackUrl(url);
      return { type: 'track', track };
    }
  }

  throw new Error('Formato de link não reconhecido. Suporta links do TikTok, YouTube e Spotify.');
}
