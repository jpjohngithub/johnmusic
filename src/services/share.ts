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

// Shorten URL via public zero-auth shorteners (is.gd / tinyurl) with instant fallback
export async function shortenUrl(longUrl: string): Promise<string> {
  // 1. Try is.gd (super fast JSON API)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.shorturl) return data.shorturl;
    }
  } catch {}

  // 2. Try tinyurl
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.startsWith('http')) return text.trim();
    }
  } catch {}

  // 3. Fallback: direct compact URL
  return longUrl;
}

// Generate universal share URL for any JohnMusic playlist (ultra-compact + shortened)
export async function generatePlaylistShareUrl(playlist: Playlist): Promise<string> {
  // Ultra-compact array structure [name, [ [title, artist, ytId], ... ]]
  const compactPayload = [
    playlist.name,
    playlist.tracks.map(t => [
      t.title,
      t.artist,
      t.youtubeId || ''
    ])
  ];

  const json = JSON.stringify(compactPayload);
  const b64 = toBase64Url(json);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://johnmusic.netlify.app';
  const directUrl = `${origin}/?p=${b64}`;

  // Shorten to ~20 characters via is.gd / tinyurl with automatic fallback to directUrl
  return await shortenUrl(directUrl);
}

// Decode and import playlist from URL parameter
export function decodeSharedPlaylist(param: string): Playlist | null {
  try {
    let b64 = param.trim();
    const match = b64.match(/(?:[?&]|^)(?:p|playlist|share)=([a-zA-Z0-9_-]+)/);
    if (match) b64 = match[1];

    if (!b64) return null;

    const json = fromBase64Url(b64);
    const parsed = JSON.parse(json);

    // Format 1: Ultra-compact format [name, [ [title, artist, ytId], ... ]]
    if (Array.isArray(parsed) && typeof parsed[0] === 'string' && Array.isArray(parsed[1])) {
      const name = parsed[0] || 'Playlist Compartilhada';
      const rawTracks = parsed[1];
      const tracks: Track[] = rawTracks.map((row: any, idx: number) => {
        const title = Array.isArray(row) ? row[0] : (row.t || row.title || 'Música');
        const artist = Array.isArray(row) ? row[1] : (row.a || row.artist || 'Artista');
        const ytId = Array.isArray(row) ? (row[2] || undefined) : (row.y || row.videoId);
        return {
          id: `shared_trk_${Date.now()}_${idx}`,
          title,
          artist,
          album: 'JohnMusic Share',
          duration: 180,
          coverUrl: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
          platform: 'youtube' as Platform,
          youtubeId: ytId
        };
      });

      return {
        id: `pl_shared_${Date.now()}`,
        name,
        description: `Importada via link curto (${tracks.length} músicas)`,
        coverUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
        tracks,
        createdAt: Date.now(),
        isCustom: true
      };
    }

    // Format 2 & 3: Legacy payloads
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
      coverUrl: item.c || item.img || item.imageUrl || (item.y ? `https://i.ytimg.com/vi/${item.y}/hqdefault.jpg` : coverUrl),
      platform: (item.p || (item.y ? 'youtube' : 'spotify')) as Platform,
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
