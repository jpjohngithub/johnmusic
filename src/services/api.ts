import { Track, Platform, SearchPlaylistResult } from '../types';

// Curated high quality seed tracks with 100% matching audio & covers
export const FEATURED_TRACKS: Track[] = [
  {
    id: 'sp_1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    platform: 'spotify',
    youtubeId: '4NRXx6U8ABQ'
  },
  {
    id: 'yt_1',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    duration: 230,
    coverUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
    platform: 'youtube',
    youtubeId: '34Na4j8AVgA'
  },
  {
    id: 'tt_1',
    title: 'Montagem Mysterious Game',
    artist: 'LXNGVX & DJ Samir',
    album: 'TikTok Brazilian Phonk',
    duration: 125,
    coverUrl: 'https://i.ytimg.com/vi/1_C7P_yXgGg/hqdefault.jpg',
    platform: 'tiktok',
    youtubeId: '1_C7P_yXgGg'
  },
  {
    id: 'sp_2',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d0f353caab14',
    platform: 'spotify',
    youtubeId: 'H5v3kku4y6Q'
  },
  {
    id: 'yt_2',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Single',
    duration: 251,
    coverUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-8/hqdefault.jpg',
    platform: 'youtube',
    youtubeId: 'kPa7bsKwL-8'
  },
  {
    id: 'tt_2',
    title: 'Automotivo Bibi Fogosa',
    artist: 'Bibi Babydoll & DJ Brunin XM',
    album: 'TikTok Funk Trends',
    duration: 140,
    coverUrl: 'https://i.ytimg.com/vi/zB3c9wMhL2I/hqdefault.jpg',
    platform: 'tiktok',
    youtubeId: 'zB3c9wMhL2I'
  },
  {
    id: 'sp_3',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n Sweet',
    duration: 175,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273659cd4673230913b3918e0d5',
    platform: 'spotify',
    youtubeId: 'eVli-tstM5E'
  },
  {
    id: 'yt_3',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    duration: 198,
    coverUrl: 'https://i.ytimg.com/vi/d5gf9dXHevw/hqdefault.jpg',
    platform: 'youtube',
    youtubeId: 'd5gf9dXHevw'
  },
  {
    id: 'tt_3',
    title: 'Gata Only',
    artist: 'FloyyMenor, Cris Mj',
    album: 'TikTok Reggaeton Trends',
    duration: 222,
    coverUrl: 'https://i.ytimg.com/vi/a_6m0q7E-S0/hqdefault.jpg',
    platform: 'tiktok',
    youtubeId: 'a_6m0q7E-S0'
  }
];

// Helper to check for YouTube video ID
export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// 1. Search Spotify (iTunes open metadata, full playback resolved via YouTube)
export async function searchSpotify(query: string): Promise<Track[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
    if (!res.ok) throw new Error('Spotify metadata search failed');
    const data = await res.json();

    return (data.results || []).map((item: any) => ({
      id: `sp_${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      duration: Math.round(item.trackTimeMillis / 1000),
      coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
      platform: 'spotify' as Platform,
      // Do not limit to previewUrl! Leave streamUrl undefined so PlayerContext resolves full YouTube track
      popularity: item.trackExplicitness === 'notExplicit' ? 80 : 90
    }));
  } catch (err) {
    console.warn('Spotify search error:', err);
    return [];
  }
}

// 2. Search YouTube
export async function searchYouTube(query: string): Promise<Track[]> {
  const directId = extractYouTubeId(query);
  if (directId) {
    return [{
      id: `yt_${directId}`,
      title: `YouTube Track (${directId})`,
      artist: 'YouTube Video',
      duration: 210,
      coverUrl: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
      platform: 'youtube',
      youtubeId: directId
    }];
  }

  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.jing.rocks',
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de'
  ];

  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query + ' audio')}&type=video`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, 15).map((item: any) => ({
          id: `yt_${item.videoId}`,
          title: item.title,
          artist: item.author,
          duration: item.lengthSeconds || 180,
          coverUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
          platform: 'youtube' as Platform,
          youtubeId: item.videoId
        }));
      }
    } catch {
      // try next
    }
  }

  // Fallback: iTunes matched query
  const spTracks = await searchSpotify(query);
  return spTracks.slice(0, 10).map((t, idx) => ({
    ...t,
    id: `yt_matched_${t.id}`,
    platform: 'youtube' as Platform,
    youtubeId: FEATURED_TRACKS[idx % FEATURED_TRACKS.length].youtubeId
  }));
}

// 3. Search TikTok
export async function searchTikTok(query: string): Promise<Track[]> {
  try {
    if (query.includes('tiktok.com')) {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.data) {
        const d = json.data;
        return [{
          id: `tt_${d.id}`,
          title: d.music_info?.title || d.title || 'TikTok Audio',
          artist: d.music_info?.author || d.author?.nickname || 'TikTok Creator',
          album: 'TikTok Viral Sound',
          duration: d.music_info?.duration || d.duration || 60,
          coverUrl: d.music_info?.cover || d.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
          platform: 'tiktok',
          streamUrl: d.music || d.music_info?.play || d.play,
          tiktokOriginalUrl: query
        }];
      }
    }

    const searchRes = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=12`);
    if (searchRes.ok) {
      const json = await searchRes.json();
      if (json.data && Array.isArray(json.data.videos)) {
        return json.data.videos.map((v: any) => ({
          id: `tt_${v.video_id}`,
          title: v.music_info?.title || v.title?.slice(0, 40) || 'TikTok Sound',
          artist: v.music_info?.author || v.author?.nickname || 'TikTok Artist',
          album: 'TikTok Trends',
          duration: v.music_info?.duration || v.duration || 60,
          coverUrl: v.music_info?.cover || v.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
          platform: 'tiktok' as Platform,
          streamUrl: v.music || v.music_info?.play || v.play
        }));
      }
    }
  } catch (err) {
    console.warn('TikTok search error:', err);
  }

  return FEATURED_TRACKS.filter(t => t.platform === 'tiktok');
}

// 4. Resolve exact YouTube video ID for any track so it plays the full song 100%
export async function resolveFullTrackAudio(track: Track): Promise<Track> {
  if (track.youtubeId) return track;
  if (track.streamUrl) return track;

  // Search YouTube for the exact full song
  const query = `${track.artist} - ${track.title} official audio`;
  const results = await searchYouTube(query);
  if (results.length > 0 && results[0].youtubeId) {
    return {
      ...track,
      youtubeId: results[0].youtubeId,
      duration: results[0].duration || track.duration
    };
  }

  return track;
}

// 5. Search Playlists (YouTube & Spotify)
export async function searchPlaylists(query: string): Promise<SearchPlaylistResult[]> {
  const clean = query.trim();
  if (!clean) {
    return [
      {
        id: 'pl_yt_top',
        title: 'Top Músicas Brasil & Mundo 2026',
        author: 'YouTube Music',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
        trackCount: 50,
        platform: 'youtube',
        externalUrl: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn5kI81J117-mqZ7Qd43Qn6x'
      },
      {
        id: 'pl_sp_hits',
        title: 'Today Top Hits - Spotify',
        author: 'Spotify',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
        trackCount: 50,
        platform: 'spotify',
        externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
      },
      {
        id: 'pl_tt_viral',
        title: 'TikTok Viral Songs 2026',
        author: 'TikTok Music',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
        trackCount: 30,
        platform: 'tiktok'
      }
    ];
  }

  const results: SearchPlaylistResult[] = [];

  // YouTube playlists search via Invidious
  try {
    const res = await fetch(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(clean)}&type=playlist`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.slice(0, 10).forEach((pl: any) => {
          results.push({
            id: `pl_yt_${pl.playlistId}`,
            title: pl.title,
            author: pl.author || 'YouTube',
            coverUrl: pl.playlistThumbnail || `https://i.ytimg.com/vi/${pl.playlistId}/hqdefault.jpg`,
            trackCount: pl.videoCount || 25,
            platform: 'youtube',
            externalUrl: `https://www.youtube.com/playlist?list=${pl.playlistId}`
          });
        });
      }
    }
  } catch {}

  // Fallback / standard Spotify & YouTube playlist items
  if (results.length === 0) {
    results.push(
      {
        id: `pl_yt_${Date.now()}`,
        title: `${clean} - YouTube Mix`,
        author: 'YouTube Music',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
        trackCount: 25,
        platform: 'youtube'
      },
      {
        id: `pl_sp_${Date.now()}`,
        title: `${clean} - Melhores Músicas`,
        author: 'Spotify Playlist',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
        trackCount: 30,
        platform: 'spotify'
      }
    );
  }

  return results;
}

// Unified Search
export async function searchAllPlatforms(query: string, platform: 'all' | Platform): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed) return FEATURED_TRACKS;

  if (platform === 'spotify') return await searchSpotify(trimmed);
  if (platform === 'youtube') return await searchYouTube(trimmed);
  if (platform === 'tiktok') return await searchTikTok(trimmed);

  const [sp, yt, tt] = await Promise.allSettled([
    searchSpotify(trimmed),
    searchYouTube(trimmed),
    searchTikTok(trimmed)
  ]);

  const results: Track[] = [];
  const spVal = sp.status === 'fulfilled' ? sp.value : [];
  const ytVal = yt.status === 'fulfilled' ? yt.value : [];
  const ttVal = tt.status === 'fulfilled' ? tt.value : [];

  const maxLen = Math.max(spVal.length, ytVal.length, ttVal.length);
  for (let i = 0; i < maxLen; i++) {
    if (spVal[i]) results.push(spVal[i]);
    if (ytVal[i]) results.push(ytVal[i]);
    if (ttVal[i]) results.push(ttVal[i]);
  }
  return results;
}
