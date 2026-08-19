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
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  }

  public static async resolveTrackFromUrl(url: string): Promise<ResolvedUrlTrack | null> {
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;

    // 1. SPOTIFY URL (Tracks, Playlists, Albums)
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
            album: 'Spotify Playlist & Tracks',
            duration: 210,
            audioUrl: '',
            coverUrl: cover,
            genre: 'Spotify',
            source: 'spotify',
            externalUrl: cleanUrl,
            spotifyUri: cleanUrl,
          };

          // Try to resolve playable stream
          const resolvedAudioUrl = await SpotifyService.ensurePlayableAudioUrl(track);
          track.audioUrl = resolvedAudioUrl;

          return { track, platform: 'spotify' };
        }
      } catch (err) {
        console.debug('Spotify oEmbed resolution error:', err);
      }
    }

    // 2. TIKTOK (Videos / Sounds) - Extract Real Direct MP3 Stream
    if (this.isTikTokUrl(cleanUrl)) {
      try {
        const tikwmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
        if (tikwmRes.ok) {
          const tikData = await tikwmRes.json();
          if (tikData.code === 0 && tikData.data) {
            const data = tikData.data;
            const audioStreamUrl = data.music || data.play || cleanUrl;
            const title = (data.title || 'Som Viral do TikTok').substring(0, 80);
            const artist = data.author?.nickname || data.music_info?.author || 'Criador do TikTok';
            const cover = data.cover || data.music_info?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
            const duration = data.duration || 60;

            const track: Track = {
              id: `tiktok-${data.id || Date.now()}`,
              title,
              artist,
              album: data.music_info?.title || 'TikTok Audio',
              duration,
              audioUrl: audioStreamUrl,
              coverUrl: cover,
              genre: 'TikTok Direct Audio',
              source: 'online',
              externalUrl: cleanUrl,
            };

            return { track, platform: 'tiktok' };
          }
        }
      } catch (err) {
        console.debug('TikWM resolver error:', err);
      }

      // Fallback via oEmbed
      let title = 'Som do TikTok';
      let artist = 'Criador do TikTok';
      let thumb = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';

      try {
        const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data.title) title = data.title.substring(0, 70);
          if (data.author_name) artist = `@${data.author_name}`;
          if (data.thumbnail_url) thumb = data.thumbnail_url;
        }
      } catch {}

      const track: Track = {
        id: `tiktok-${Date.now()}`,
        title,
        artist,
        album: 'TikTok Audio',
        duration: 60,
        audioUrl: cleanUrl,
        coverUrl: thumb,
        genre: 'TikTok Viral',
        source: 'online',
        externalUrl: cleanUrl,
      };

      return { track, platform: 'tiktok' };
    }

    // 3. YOUTUBE (Videos / Shorts / Music)
    if (this.isYouTubeUrl(cleanUrl)) {
      const videoId = this.extractYouTubeVideoId(cleanUrl) || 'dQw4w9WgXcQ';
      let title = 'Vídeo do YouTube';
      let artist = 'YouTube';
      let thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      try {
        const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data.title) title = data.title;
          if (data.author_name) artist = data.author_name;
          if (data.thumbnail_url) thumb = data.thumbnail_url;
        }
      } catch (e) {
        console.debug('YouTube oEmbed error:', e);
      }

      const track: Track = {
        id: `yt-${videoId}-${Date.now()}`,
        title,
        artist,
        album: 'YouTube Audio',
        duration: 210,
        audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
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
