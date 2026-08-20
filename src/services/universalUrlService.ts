import type { Track } from '../types/music';
import { SpotifyService } from './spotifyService';

export interface ResolvedUrlTrack {
  track: Track;
  platform: 'youtube' | 'tiktok' | 'spotify' | 'direct';
}

export class UniversalUrlService {
  public static isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com\/(?:watch\?v=|shorts\/|music\.youtube\.com\/watch\?v=)|youtu\.be\/)/i.test(url);
  }

  public static isTikTokUrl(url: string): boolean {
    return /(?:tiktok\.com\/|vm\.tiktok\.com\/|vt\.tiktok\.com\/)/i.test(url);
  }

  public static isSpotifyUrl(url: string): boolean {
    return /(?:open\.spotify\.com\/(?:track|playlist|album)|spotify:(?:track|playlist|album):)/i.test(url);
  }

  public static isDirectAudioUrl(url: string): boolean {
    return /\.(mp3|wav|ogg|flac|m4a|aac)(\?.*)?$/i.test(url);
  }

  public static extractYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\\w-]{11})/);
    return match ? match[1] : null;
  }

  // ─── YouTube Audio Extraction ──────────────────────────────────────────────

  /**
   * Extracts a direct audio stream URL from a YouTube video.
   * Tries multiple sources:
   *   1. cobalt.tools public API (best quality, audio-only)
   *   2. Invidious API (audio m4a stream)
   *   3. Returns video URL as last resort (won't play as audio without backend)
   */
  public static async extractYouTubeAudio(videoId: string, videoUrl: string): Promise<string> {
    // 1. Try cobalt.tools API (free, no auth needed)
    const COBALT_INSTANCES = [
      'https://api.cobalt.tools',
      'https://cobalt.api.timelessnesses.me',
    ];

    for (const cobaltBase of COBALT_INSTANCES) {
      try {
        const res = await fetch(`${cobaltBase}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            url: videoUrl,
            downloadMode: 'audio',
            audioFormat: 'mp3',
            audioBitrate: '128',
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          // cobalt returns { status: 'stream'|'redirect'|'tunnel', url: '...' }
          if ((data.status === 'stream' || data.status === 'redirect' || data.status === 'tunnel') && data.url) {
            return data.url;
          }
        }
      } catch (e) {
        console.debug(`cobalt ${cobaltBase} failed:`, e);
      }
    }

    // 2. Try Invidious API for audio stream
    const INVIDIOUS_INSTANCES = [
      'https://invidious.privacydev.net',
      'https://vid.puffyan.us',
      'https://yt.cdaut.de',
    ];

    for (const inv of INVIDIOUS_INSTANCES) {
      try {
        const res = await fetch(`${inv}/api/v1/videos/${videoId}`, {
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const data = await res.json();
          // Find audio-only adaptive formats (itag 140 = m4a 128kbps, itag 251 = webm opus)
          const audioFormats: any[] = data.adaptiveFormats?.filter(
            (f: any) => f.type?.startsWith('audio/')
          ) || [];
          // Prefer m4a (itag 140), fallback to best available
          const m4a = audioFormats.find((f: any) => f.itag === 140);
          const best = m4a || audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (best?.url) return best.url;
        }
      } catch (e) {
        console.debug(`Invidious ${inv} failed:`, e);
      }
    }

    // 3. No extraction possible — return original URL (will fail to play as audio)
    return videoUrl;
  }

  // ─── TikTok Audio Extraction ───────────────────────────────────────────────

  public static async extractTikTokAudio(url: string): Promise<{
    audioUrl: string;
    title: string;
    artist: string;
    cover: string;
    duration: number;
  }> {
    // 1. Try TikWM API
    try {
      const res = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const tikData = await res.json();
        if (tikData.code === 0 && tikData.data) {
          const d = tikData.data;
          return {
            audioUrl: d.music || d.hdplay || d.play || url,
            title: (d.title || 'Som Viral do TikTok').substring(0, 80),
            artist: d.author?.nickname || d.music_info?.author || 'Criador do TikTok',
            cover: d.cover || d.music_info?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            duration: d.duration || 60,
          };
        }
      }
    } catch (e) {
      console.debug('TikWM failed:', e);
    }

    // 2. Try cobalt.tools for TikTok
    try {
      const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url, downloadMode: 'audio' }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        if ((data.status === 'stream' || data.status === 'redirect' || data.status === 'tunnel') && data.url) {
          return {
            audioUrl: data.url,
            title: 'Som do TikTok',
            artist: 'Criador do TikTok',
            cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            duration: 60,
          };
        }
      }
    } catch (e) {
      console.debug('cobalt TikTok failed:', e);
    }

    // 3. Fallback metadata via oEmbed
    let title = 'Som do TikTok';
    let artist = 'Criador do TikTok';
    let cover = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
    try {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title.substring(0, 70);
        if (data.author_name) artist = `@${data.author_name}`;
        if (data.thumbnail_url) cover = data.thumbnail_url;
      }
    } catch { /* ignore */ }

    return { audioUrl: url, title, artist, cover, duration: 60 };
  }

  // ─── Main Resolver ─────────────────────────────────────────────────────────

  public static async resolveTrackFromUrl(url: string): Promise<ResolvedUrlTrack | null> {
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;

    // 1. SPOTIFY (track / playlist / album)
    if (this.isSpotifyUrl(cleanUrl)) {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          const title = data.title || 'Música do Spotify';
          const cover = data.thumbnail_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';

          const track: Track = {
            id: `spotify-${Date.now()}`,
            title,
            artist: 'Spotify',
            album: 'Spotify',
            duration: 210,
            audioUrl: '',
            coverUrl: cover,
            genre: 'Spotify',
            source: 'spotify',
            externalUrl: cleanUrl,
            spotifyUri: cleanUrl,
          };

          // Resolve fallback audio
          const resolvedAudioUrl = await SpotifyService.ensurePlayableAudioUrl(track);
          track.audioUrl = resolvedAudioUrl;

          return { track, platform: 'spotify' };
        }
      } catch (err) {
        console.debug('Spotify oEmbed error:', err);
      }
    }

    // 2. TIKTOK
    if (this.isTikTokUrl(cleanUrl)) {
      const extracted = await this.extractTikTokAudio(cleanUrl);
      const track: Track = {
        id: `tiktok-${Date.now()}`,
        title: extracted.title,
        artist: extracted.artist,
        album: 'TikTok Audio',
        duration: extracted.duration,
        audioUrl: extracted.audioUrl,
        coverUrl: extracted.cover,
        genre: 'TikTok Viral',
        source: 'online',
        externalUrl: cleanUrl,
      };
      return { track, platform: 'tiktok' };
    }

    // 3. YOUTUBE
    if (this.isYouTubeUrl(cleanUrl)) {
      const videoId = this.extractYouTubeVideoId(cleanUrl) || '';
      let title = 'Vídeo do YouTube';
      let artist = 'YouTube';
      let thumb = videoId
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';

      // Get metadata via noembed
      try {
        const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data.title) title = data.title;
          if (data.author_name) artist = data.author_name;
          if (data.thumbnail_url) thumb = data.thumbnail_url;
        }
      } catch (e) { console.debug('noembed error:', e); }

      // Extract audio stream
      let audioUrl = cleanUrl;
      if (videoId) {
        audioUrl = await this.extractYouTubeAudio(videoId, cleanUrl);
      }

      const track: Track = {
        id: `yt-${videoId || Date.now()}`,
        title,
        artist,
        album: 'YouTube Audio',
        duration: 210,
        audioUrl,
        coverUrl: thumb,
        genre: 'YouTube',
        source: 'online',
        externalUrl: cleanUrl,
      };
      return { track, platform: 'youtube' };
    }

    // 4. DIRECT AUDIO URL
    if (this.isDirectAudioUrl(cleanUrl)) {
      const fileName = cleanUrl.split('/').pop()?.split('?')[0] || 'Áudio da Web';
      const cleanTitle = decodeURIComponent(fileName).replace(/\.[^/.]+$/, '');
      const track: Track = {
        id: `direct-${Date.now()}`,
        title: cleanTitle,
        artist: 'Web Audio',
        album: 'Links Diretos',
        duration: 180,
        audioUrl: cleanUrl,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        genre: 'Web Audio',
        source: 'online',
        externalUrl: cleanUrl,
      };
      return { track, platform: 'direct' };
    }

    return null;
  }
}
