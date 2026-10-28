import { Track, Platform, SearchPlaylistResult } from '../types';

export const CANONICAL_TRACK_YOUTUBE_IDS: Record<string, string> = {
  'montagem mysterious game': 'dJM5DN1mMls',
  'automotivo bibi fogosa': 'PgF29M69QXg',
  'gata only': '-r687V8yqKY',
  'die with a smile': 'kPa7bsKwL-c',
  'birds of a feather': 'V9PVRfjEBTI',
  'blinding lights': '4NRXx6U8ABQ',
  'starboy': '34Na4j8AVgA',
  'as it was': 'H5v3kku4y6Q',
  'espresso': 'eVli-tstM5E'
};

export function getCanonicalYoutubeId(title: string): string | null {
  const clean = (title || '').toLowerCase().trim();
  for (const [name, id] of Object.entries(CANONICAL_TRACK_YOUTUBE_IDS)) {
    if (clean.includes(name) || name.includes(clean)) {
      return id;
    }
  }
  return null;
}

// Curated high quality seed tracks with verified official audio & real album art
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
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
    platform: 'youtube',
    youtubeId: '34Na4j8AVgA'
  },
  {
    id: 'tt_1',
    title: 'Montagem Mysterious Game',
    artist: 'LXNGVX & DJ Samir',
    album: 'TikTok Brazilian Phonk',
    duration: 125,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bc/b3/85/bcb38516-3182-f15e-4ba9-4b1e122dd094/67.jpg/600x600bb.jpg',
    platform: 'tiktok',
    youtubeId: 'dJM5DN1mMls'
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
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b27382ea2e9e1858aa012c58977a',
    platform: 'youtube',
    youtubeId: 'kPa7bsKwL-c'
  },
  {
    id: 'tt_2',
    title: 'Automotivo Bibi Fogosa',
    artist: 'Bibi Babydoll & DJ Brunin XM',
    album: 'TikTok Funk Trends',
    duration: 140,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/0c/4e/b8/0c4eb8aa-d999-5042-005c-3d596d3c9c81/5063341826598_cover.jpg/600x600bb.jpg',
    platform: 'tiktok',
    youtubeId: 'PgF29M69QXg'
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
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62',
    platform: 'youtube',
    youtubeId: 'V9PVRfjEBTI'
  },
  {
    id: 'tt_3',
    title: 'Gata Only',
    artist: 'FloyyMenor, Cris Mj',
    album: 'TikTok Reggaeton Trends',
    duration: 222,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ff/1b/f4/ff1bf4af-9b8e-b616-2dce-8c41cd292d68/5063535181519_cover.jpg/600x600bb.jpg',
    platform: 'tiktok',
    youtubeId: '-r687V8yqKY'
  }
];

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// 1. Search Spotify
export async function searchSpotify(query: string): Promise<Track[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
    if (!res.ok) throw new Error('Spotify metadata search failed');
    const data = await res.json();

    return (data.results || []).map((item: any) => {
      const canonicalYt = getCanonicalYoutubeId(item.trackName);
      return {
        id: `sp_${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        duration: Math.round(item.trackTimeMillis / 1000),
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
        platform: 'spotify' as Platform,
        youtubeId: canonicalYt || undefined,
        streamUrl: undefined,
        popularity: item.trackExplicitness === 'notExplicit' ? 80 : 90
      };
    });
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

  // 1. Primary Invidious / YouTube Search (Open CORS & API)
  try {
    const res = await fetch(`https://yt.chocolatemoo53.com/api/v1/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const videos = data.filter((item: any) => item.type === 'video' && item.videoId);
        if (videos.length > 0) {
          return videos.slice(0, 15).map((item: any) => ({
            id: `yt_${item.videoId}`,
            title: item.title,
            artist: item.author || 'YouTube',
            duration: item.lengthSeconds || 180,
            coverUrl: (item.videoThumbnails && item.videoThumbnails[0]?.url)
              ? (item.videoThumbnails[0].url.startsWith('http') ? item.videoThumbnails[0].url : `https://yt-comp1.chocolatemoo53.com${item.videoThumbnails[0].url}`)
              : `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            platform: 'youtube' as Platform,
            youtubeId: item.videoId
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Invidious search fallback:', err);
  }

  // 2. Piped fallback
  try {
    const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        return data.items.slice(0, 15).map((item: any) => {
          const vId = item.url?.replace('/watch?v=', '') || item.id;
          return {
            id: `yt_${vId}`,
            title: item.title,
            artist: item.uploaderName || 'YouTube',
            duration: item.duration || 180,
            coverUrl: item.thumbnail || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            platform: 'youtube' as Platform,
            youtubeId: vId
          };
        });
      }
    }
  } catch {}

  // 3. Fallback: Search Spotify metadata, then map canonical IDs
  const spTracks = await searchSpotify(query);
  return spTracks.map(t => {
    const canon = getCanonicalYoutubeId(t.title);
    return {
      ...t,
      id: `yt_resolved_${t.id}`,
      platform: 'youtube' as Platform,
      youtubeId: canon || undefined,
      streamUrl: undefined
    };
  });
}

// 3. Search TikTok with unblocked audio streams
export async function searchTikTok(query: string): Promise<Track[]> {
  try {
    if (query.includes('tiktok.com')) {
      // 1. Try direct TikWM API (without www) for direct MP3 audio stream
      try {
        const twRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(query)}`);
        if (twRes.ok) {
          const twJson = await twRes.json();
          if (twJson.data && twJson.data.music) {
            const d = twJson.data;
            return [{
              id: `tt_${d.id || Date.now()}`,
              title: d.music_info?.title || d.title || 'TikTok Audio',
              artist: d.music_info?.author || d.author?.nickname || 'TikTok Creator',
              album: 'TikTok Viral Sound',
              duration: d.music_info?.duration || d.duration || 60,
              coverUrl: d.music_info?.cover || d.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
              platform: 'tiktok',
              streamUrl: d.music,
              tiktokOriginalUrl: query
            }];
          }
        }
      } catch (e) {
        console.warn('TikWM direct fetch fallback:', e);
      }

      // 2. Use TikTok official oEmbed fallback
      const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(query)}`);
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        const cleanTitle = (odata.title || 'TikTok Viral').replace(/#\S+/g, '').trim();
        const author = odata.author_name || 'TikTok Creator';

        return [{
          id: `tt_${Date.now()}`,
          title: cleanTitle,
          artist: author,
          album: 'TikTok Audio',
          duration: 60,
          coverUrl: odata.thumbnail_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
          platform: 'tiktok',
          tiktokOriginalUrl: query
        }];
      }
    }
  } catch (err) {
    console.warn('TikTok query error:', err);
  }

  // Pre-seed matching for popular TikTok phonk/sounds
  const lowerQ = query.toLowerCase();
  const directMatches = FEATURED_TRACKS.filter(t =>
    t.platform === 'tiktok' ||
    t.title.toLowerCase().includes(lowerQ) ||
    t.artist.toLowerCase().includes(lowerQ)
  );
  if (directMatches.length > 0) {
    return directMatches;
  }

  return FEATURED_TRACKS.filter(t => t.platform === 'tiktok');
}

// 4. Recommendations for Playlist (Spotify-like style/genre matching)
export async function getRecommendedTracksForPlaylist(
  tracks: Track[],
  seedOffset = 0
): Promise<Track[]> {
  try {
    const existingIds = new Set(tracks.map(t => t.id));
    const existingTitles = new Set(tracks.map(t => t.title.toLowerCase().trim()));

    // Collect artist names from playlist
    const artists = Array.from(new Set(tracks.map(t => t.artist).filter(Boolean)));
    const fallbackSeeds = ['The Weeknd', 'Billie Eilish', 'Travis Scott', 'Phonk', 'Dua Lipa', 'Post Malone', 'Funk', 'Ariana Grande'];

    let seedTerm = fallbackSeeds[seedOffset % fallbackSeeds.length];
    if (artists.length > 0) {
      seedTerm = artists[(seedOffset) % artists.length];
    }

    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(seedTerm)}&entity=song&limit=20`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        const candidates: Track[] = data.results
          .filter((item: any) => {
            const title = (item.trackName || '').toLowerCase().trim();
            return !existingIds.has(`sp_${item.trackId}`) && !existingTitles.has(title) && item.previewUrl;
          })
          .map((item: any) => ({
            id: `rec_${item.trackId}`,
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName,
            duration: Math.round(item.trackTimeMillis / 1000),
            coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
            platform: 'spotify' as Platform,
            streamUrl: item.previewUrl
          }));

        if (candidates.length > 0) {
          return candidates.slice(0, 6);
        }
      }
    }
  } catch (e) {
    console.warn('Recommendation fetch failed:', e);
  }

  // Fallback candidates
  return FEATURED_TRACKS.filter(t => !tracks.some(pt => pt.id === t.id)).slice(0, 5);
}

// 4. Resolve exact YouTube video ID for any track
export async function resolveFullTrackAudio(track: Track, force = false): Promise<Track> {
  const canonicalId = getCanonicalYoutubeId(track.title);
  if (canonicalId) {
    return {
      ...track,
      youtubeId: canonicalId,
      streamUrl: undefined
    };
  }
  if (track.youtubeId && !force) return track;
  if (track.streamUrl && !force && !track.streamUrl.includes('itunes.apple.com')) return track;

  const query = `${track.artist} - ${track.title}`;
  const results = await searchYouTube(query);
  const found = results.find(r => r.youtubeId);
  if (found && found.youtubeId) {
    return {
      ...track,
      youtubeId: found.youtubeId,
      duration: found.duration || track.duration
    };
  }

  return track;
}

// 5. Search Playlists (YouTube Music & Spotify)
export async function searchPlaylists(query: string): Promise<SearchPlaylistResult[]> {
  const clean = query.trim();
  const results: SearchPlaylistResult[] = [];

  // If query is provided, search Invidious & Piped playlists (Open CORS)
  if (clean) {
    try {
      const res = await fetch(`https://yt.chocolatemoo53.com/api/v1/search?q=${encodeURIComponent(clean)}&type=playlist`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.filter((item: any) => item.type === 'playlist' && item.playlistId).slice(0, 8).forEach((item: any) => {
            results.push({
              id: `pl_yt_${item.playlistId}`,
              title: item.title,
              author: item.author || 'YouTube Music',
              coverUrl: item.playlistThumbnail || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80`,
              trackCount: item.videoCount || 20,
              platform: 'youtube',
              externalUrl: `https://www.youtube.com/playlist?list=${item.playlistId}`
            });
          });
        }
      }
    } catch {}

    try {
      const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(clean)}&filter=playlists`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.items)) {
          data.items.slice(0, 8).forEach((item: any) => {
            const plId = item.url?.replace('/playlist?list=', '') || item.id;
            results.push({
              id: `pl_yt_${plId}`,
              title: item.title,
              author: item.uploaderName || 'YouTube Music',
              coverUrl: item.thumbnail || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80`,
              trackCount: item.videos || 25,
              platform: 'youtube',
              externalUrl: `https://www.youtube.com/playlist?list=${plId}`
            });
          });
        }
      }
    } catch {}

    // Search Spotify/iTunes Albums (Compilations/Playlists)
    try {
      const albumRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(clean)}&entity=album&limit=8`);
      if (albumRes.ok) {
        const data = await albumRes.json();
        if (Array.isArray(data?.results)) {
          data.results.forEach((album: any) => {
            results.push({
              id: `pl_sp_${album.collectionId}`,
              title: album.collectionName,
              author: album.artistName || 'Spotify',
              coverUrl: album.artworkUrl100 ? album.artworkUrl100.replace('100x100bb', '600x600bb') : '',
              trackCount: album.trackCount || 12,
              platform: 'spotify',
              externalUrl: `https://open.spotify.com/album/${album.collectionId}`
            });
          });
        }
      }
    } catch {}
  }

  // Pre-loaded popular playlists for Spotify & YouTube Music
  const POPULAR_PLAYLISTS: SearchPlaylistResult[] = [
    {
      id: 'pl_yt_top_br',
      title: 'Top Hits Brasil 2026',
      author: 'YouTube Music',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
      trackCount: 50,
      platform: 'youtube',
      externalUrl: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn5kI81J117-mqZ7Qd43Qn6x'
    },
    {
      id: 'pl_sp_today_hits',
      title: "Today's Top Hits - Global",
      author: 'Spotify',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
      trackCount: 50,
      platform: 'spotify',
      externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
    },
    {
      id: 'pl_yt_funk_2026',
      title: 'Mega Funk & Phonk Brasil',
      author: 'YouTube Music',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      trackCount: 40,
      platform: 'youtube',
      externalUrl: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn6OPOk_2v6xNnI-r2wD5kXF'
    },
    {
      id: 'pl_sp_viral_br',
      title: 'As Mais Tocadas no Brasil',
      author: 'Spotify',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      trackCount: 50,
      platform: 'spotify',
      externalUrl: 'https://open.spotify.com/playlist/37i9dQZEVXbMXbN3b9iqyt'
    },
    {
      id: 'pl_tt_viral_trends',
      title: 'TikTok Viral Songs 2026',
      author: 'TikTok Trends',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80',
      trackCount: 35,
      platform: 'tiktok'
    }
  ];

  if (results.length === 0) {
    if (clean) {
      // Filter popular by keyword
      const matched = POPULAR_PLAYLISTS.filter(p =>
        p.title.toLowerCase().includes(clean.toLowerCase()) ||
        p.author.toLowerCase().includes(clean.toLowerCase())
      );
      if (matched.length > 0) return matched;
    }
    return POPULAR_PLAYLISTS;
  }

  return results;
}

// 6. Unified Search
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
