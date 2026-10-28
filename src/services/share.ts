import { Playlist, Track, Platform } from '../types';

interface ShareTrackPayload {
  t: string; // title
  a: string; // artist
  c?: string; // cover
  p: Platform;
  y?: string; // youtubeId
  s?: string; // streamUrl
  d?: number; // duration
}

interface SharePlaylistPayload {
  n: string; // name
  desc?: string;
  cov?: string;
  tracks: ShareTrackPayload[];
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Generate universal share URL for any JohnMusic playlist
export function generatePlaylistShareUrl(playlist: Playlist): string {
  const payload: SharePlaylistPayload = {
    n: playlist.name,
    desc: playlist.description || '',
    cov: playlist.coverUrl || '',
    tracks: playlist.tracks.map(t => ({
      t: t.title,
      a: t.artist,
      c: t.coverUrl,
      p: t.platform,
      y: t.youtubeId,
      s: t.streamUrl,
      d: t.duration
    }))
  };

  const json = JSON.stringify(payload);
  const b64 = toBase64Url(json);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://johnmusic.netlify.app';
  return `${origin}/?playlist=${b64}`;
}

// Decode and import playlist from URL parameter
export function decodeSharedPlaylist(param: string): Playlist | null {
  try {
    let b64 = param.trim();
    if (b64.includes('playlist=')) {
      const match = b64.match(/playlist=([a-zA-Z0-9_-]+)/);
      if (match) b64 = match[1];
    } else if (b64.includes('share=')) {
      const match = b64.match(/share=([a-zA-Z0-9_-]+)/);
      if (match) b64 = match[1];
    }

    if (!b64) return null;

    const json = fromBase64Url(b64);
    const parsed = JSON.parse(json);

    // Support both new and legacy JohnMusic share formats
    const name = parsed.n || parsed.name || 'Playlist Compartilhada';
    const description = parsed.desc || parsed.description || 'Importada via link compartilhado';
    const coverUrl = parsed.cov || parsed.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80';

    const rawItems = parsed.tracks || parsed.items || [];
    const tracks: Track[] = rawItems.map((item: any, idx: number) => ({
      id: `shared_trk_${Date.now()}_${idx}`,
      title: item.t || item.title || 'Música',
      artist: item.a || item.subtitle || item.artist || 'Artista',
      album: item.album || 'JohnMusic Share',
      duration: item.d || (item.durationMs ? Math.round(item.durationMs / 1000) : 180),
      coverUrl: item.c || item.img || item.imageUrl || coverUrl,
      platform: (item.p || item.s || (item.v || item.videoId ? 'youtube' : 'spotify')) as Platform,
      youtubeId: item.y || item.v || item.videoId,
      streamUrl: item.s || item.audioUrl
    }));

    return {
      id: `pl_shared_${Date.now()}`,
      name,
      description: `${description} (${tracks.length} músicas)`,
      coverUrl,
      tracks,
      createdAt: Date.now(),
      isCustom: true
    };
  } catch (err) {
    console.error('Error decoding shared playlist:', err);
    return null;
  }
}
