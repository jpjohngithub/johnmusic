import type { Track, SpotifyAlbum, SpotifyPlaylistCard } from '../types/music';

const SPOTIFY_CLIENT_ID_KEY = 'johnmusic_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'johnmusic_spotify_token';
const SPOTIFY_REFRESH_KEY = 'johnmusic_spotify_refresh';
const SPOTIFY_EXP_KEY = 'johnmusic_spotify_exp';

const STREAM_URL_CACHE = new Map<string, string>();

// ─── Fallback Data (used before OAuth login) ──────────────────────────────

const FALLBACK_SPOTIFY_NEW_RELEASES: SpotifyAlbum[] = [
  { id: 'alb-1', name: 'Hit Me Hard and Soft', artist: 'Billie Eilish', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80', releaseDate: '2024', totalTracks: 10, spotifyUri: 'spotify:album:7aJuG4MyANZwYmaZaGQizZ' },
  { id: 'alb-2', name: 'The Tortured Poets Department', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', releaseDate: '2024', totalTracks: 16, spotifyUri: 'spotify:album:1Mo4aZ8swT3o1DcMdfep57' },
  { id: 'alb-3', name: "Short n' Sweet", artist: 'Sabrina Carpenter', coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', releaseDate: '2024', totalTracks: 12, spotifyUri: 'spotify:album:4ca81014e7' },
  { id: 'alb-4', name: 'BRAT', artist: 'Charli xcx', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', releaseDate: '2024', totalTracks: 15, spotifyUri: 'spotify:album:2lIZef49wP6' },
  { id: 'alb-5', name: 'Radical Optimism', artist: 'Dua Lipa', coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80', releaseDate: '2024', totalTracks: 11, spotifyUri: 'spotify:album:01a4e21d' },
  { id: 'alb-6', name: '333', artist: 'Matuê', coverUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80', releaseDate: '2024', totalTracks: 12, spotifyUri: 'spotify:album:6v19c11' }
];

const FALLBACK_SPOTIFY_FEATURED_PLAYLISTS: SpotifyPlaylistCard[] = [
  { id: '37i9dQZF1DXcBWIGoYBM5M', name: "Today's Top Hits", description: 'Sabrina Carpenter, Billie Eilish, Matuê e todos os sucessos em alta.', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80', totalTracks: 50, spotifyUri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M', owner: 'Spotify' },
  { id: '37i9dQZF1DX0FOF1IZbBh9', name: 'Top Brasil & Hits', description: 'Os maiores sucessos que estão bombando nos fones de todo o Brasil.', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', totalTracks: 50, spotifyUri: 'spotify:playlist:37i9dQZF1DX0FOF1IZbBh9', owner: 'Spotify' },
  { id: '37i9dQZF1DX4JAvHpjipBk', name: 'New Music Friday', description: 'Os melhores lançamentos da semana reunidos em um só lugar.', coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', totalTracks: 100, spotifyUri: 'spotify:playlist:37i9dQZF1DX4JAvHpjipBk', owner: 'Spotify' },
  { id: '37i9dQZF1DX1lVhptIYRda', name: 'Hot Hits Brasil', description: 'As mais tocadas nas rádios e streamings do país.', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', totalTracks: 60, spotifyUri: 'spotify:playlist:37i9dQZF1DX1lVhptIYRda', owner: 'Spotify' },
  { id: '37i9dQZF1DXdLEN7aqioXM', name: 'Mega Hits Eletrônica', description: 'Batidas aceleradas, festivais e a melhor vibe do EDM mundial.', coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80', totalTracks: 75, spotifyUri: 'spotify:playlist:37i9dQZF1DXdLEN7aqioXM', owner: 'Spotify' },
  { id: '37i9dQZF1DX4sWSpwq3LiO', name: 'Peaceful Piano & Lofi', description: 'Piano acústico relaxante para foco, estudo e trabalho.', coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', totalTracks: 120, spotifyUri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO', owner: 'Spotify' }
];

// ─── Helper: map API track item → Track ────────────────────────────────────

function mapSpotifyTrack(item: any, fallbackCoverUrl?: string): Track | null {
  if (!item) return null;
  return {
    id: `spotify-${item.id}`,
    title: item.name,
    artist: item.artists?.map((a: any) => a.name).join(', ') || 'Vários Artistas',
    album: item.album?.name || '',
    duration: Math.round((item.duration_ms || 0) / 1000) || 180,
    audioUrl: item.preview_url || '',
    coverUrl: item.album?.images?.[0]?.url || fallbackCoverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    genre: 'Spotify',
    source: 'spotify' as const,
    spotifyUri: item.uri,
    spotifyId: item.id,
    externalUrl: item.external_urls?.spotify,
  };
}

export class SpotifyService {
  // ─── Token / Auth Helpers ─────────────────────────────────────────────────

  public static getStoredClientId(): string {
    return localStorage.getItem(SPOTIFY_CLIENT_ID_KEY) || '';
  }

  public static setStoredClientId(clientId: string) {
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, clientId.trim());
  }

  public static getStoredToken(): string | null {
    const exp = Number(localStorage.getItem(SPOTIFY_EXP_KEY));
    if (exp && Date.now() > exp) return null;
    return localStorage.getItem(SPOTIFY_TOKEN_KEY);
  }

  public static setToken(token: string, expiresInSeconds: number, refreshToken?: string) {
    localStorage.setItem(SPOTIFY_TOKEN_KEY, token);
    localStorage.setItem(SPOTIFY_EXP_KEY, String(Date.now() + expiresInSeconds * 1000));
    if (refreshToken) localStorage.setItem(SPOTIFY_REFRESH_KEY, refreshToken);
  }

  public static disconnect() {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    localStorage.removeItem(SPOTIFY_REFRESH_KEY);
    localStorage.removeItem(SPOTIFY_EXP_KEY);
  }

  public static parseSpotifyUrl(input: string): { type: 'track' | 'playlist' | 'album' | 'artist'; id: string } | null {
    const clean = input.trim();
    const uriMatch = clean.match(/^spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)$/);
    if (uriMatch) return { type: uriMatch[1] as any, id: uriMatch[2] };
    const urlMatch = clean.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
    if (urlMatch) return { type: urlMatch[1] as any, id: urlMatch[2] };
    return null;
  }

  // ─── User Data (requires OAuth) ──────────────────────────────────────────

  /** Get the authenticated user's profile */
  public static async getUserProfile(): Promise<{ displayName: string; email?: string; product?: string; images?: { url: string }[] } | null> {
    const token = this.getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        displayName: data.display_name || data.id,
        email: data.email,
        product: data.product, // 'premium' | 'free'
        images: data.images,
      };
    } catch {
      return null;
    }
  }

  /** Get ALL playlists of the authenticated user (paginates automatically) */
  public static async getUserPlaylists(): Promise<SpotifyPlaylistCard[]> {
    const token = this.getStoredToken();
    if (!token) return [];

    const playlists: SpotifyPlaylistCard[] = [];
    let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';

    while (url) {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) break;
        const data = await res.json();
        data.items?.forEach((item: any) => {
          if (!item) return;
          playlists.push({
            id: item.id,
            name: item.name,
            description: item.description || '',
            coverUrl: item.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
            totalTracks: item.tracks?.total || 0,
            spotifyUri: item.uri,
            owner: item.owner?.display_name || 'Spotify',
          });
        });
        url = data.next || null;
      } catch {
        break;
      }
    }

    return playlists;
  }

  /** Get the user's saved/liked tracks (paginates up to 200) */
  public static async getUserSavedTracks(limit = 200): Promise<Track[]> {
    const token = this.getStoredToken();
    if (!token) return [];

    const tracks: Track[] = [];
    let url: string | null = 'https://api.spotify.com/v1/me/tracks?limit=50';

    while (url && tracks.length < limit) {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) break;
        const data = await res.json();
        data.items?.forEach((entry: any) => {
          const mapped = mapSpotifyTrack(entry.track);
          if (mapped) tracks.push(mapped);
        });
        url = data.next || null;
      } catch {
        break;
      }
    }

    return tracks;
  }

  /** Get the user's top tracks (short/medium/long term) */
  public static async getUserTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term'): Promise<Track[]> {
    const token = this.getStoredToken();
    if (!token) return [];
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map(mapSpotifyTrack).filter(Boolean) as Track[];
    } catch {
      return [];
    }
  }

  /** Get recently played tracks */
  public static async getRecentlyPlayed(): Promise<Track[]> {
    const token = this.getStoredToken();
    if (!token) return [];
    try {
      const res = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=50',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const seen = new Set<string>();
      return (data.items || [])
        .map((entry: any) => mapSpotifyTrack(entry.track))
        .filter((t: Track | null): t is Track => {
          if (!t) return false;
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
    } catch {
      return [];
    }
  }

  // ─── Catalog (works with & without auth) ─────────────────────────────────

  /** Search Spotify catalog (uses Spotify API if authed, fallback iTunes + Audius) */
  public static async searchTracks(query: string): Promise<Track[]> {
    if (!query.trim()) return [];
    const token = this.getStoredToken();

    if (token) {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=30`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.tracks?.items || []).map(mapSpotifyTrack).filter(Boolean) as Track[];
          if (mapped.length > 0) return mapped;
        }
      } catch (e) {
        console.debug('Spotify search error:', e);
      }
    }

    return this.searchOnlineTracks(query);
  }

  public static async getNewReleases(): Promise<SpotifyAlbum[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=12', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.albums.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            artist: item.artists.map((a: any) => a.name).join(', '),
            coverUrl: item.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            releaseDate: item.release_date,
            totalTracks: item.total_tracks,
            spotifyUri: item.uri,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch Spotify new releases via token:', err);
      }
    }
    try {
      const res = await fetch('https://itunes.apple.com/search?term=2024+hits&media=music&entity=album&limit=8');
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) {
          return data.results.map((item: any) => ({
            id: `album-${item.collectionId}`,
            name: item.collectionName,
            artist: item.artistName,
            coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
            releaseDate: item.releaseDate?.substring(0, 4) || '2024',
            totalTracks: item.trackCount || 10,
            spotifyUri: `spotify:album:${item.collectionId}`,
          }));
        }
      }
    } catch (e) { console.debug(e); }
    return FALLBACK_SPOTIFY_NEW_RELEASES;
  }

  public static async getFeaturedPlaylists(): Promise<SpotifyPlaylistCard[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.playlists.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || 'Playlist oficial do Spotify',
            coverUrl: item.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            totalTracks: item.tracks?.total || 50,
            spotifyUri: item.uri,
            owner: item.owner?.display_name || 'Spotify',
          }));
        }
      } catch (err) {
        console.warn('Featured playlists token fetch error:', err);
      }
    }
    return FALLBACK_SPOTIFY_FEATURED_PLAYLISTS;
  }

  /** Get ALL tracks in a playlist (full pagination, up to 500 tracks) */
  public static async getPlaylistTracks(playlistId: string, playlistTitle = 'Spotify Playlist'): Promise<Track[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const tracks: Track[] = [];
        let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,items(track(id,name,artists,album,duration_ms,preview_url,uri,external_urls))`;

        while (url) {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) break;
          const data = await res.json();
          data.items?.forEach((entry: any) => {
            const mapped = mapSpotifyTrack(entry.track);
            if (mapped) tracks.push(mapped);
          });
          url = data.next || null;
        }

        if (tracks.length > 0) return tracks;
      } catch (err) {
        console.warn('getPlaylistTracks error:', err);
      }
    }

    // Fallback to online search for unauthenticated users
    try {
      const query = playlistTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Top Hits';
      const tracks = await this.searchOnlineTracks(query);
      if (tracks.length > 0) return tracks;
    } catch (e) { console.debug(e); }

    return [];
  }

  /** Get ALL tracks in an album */
  public static async getAlbumTracks(albumId: string, albumTitle = 'Spotify Album', artistName = ''): Promise<Track[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        // First get album details for cover art
        let coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
        try {
          const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (albumRes.ok) {
            const albumData = await albumRes.json();
            coverUrl = albumData.images?.[0]?.url || coverUrl;
          }
        } catch { /* ignore */ }

        const tracks: Track[] = [];
        let url: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

        while (url) {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) break;
          const data = await res.json();
          data.items?.forEach((item: any) => {
            if (!item) return;
            tracks.push({
              id: `spotify-${item.id}`,
              title: item.name,
              artist: item.artists?.map((a: any) => a.name).join(', ') || artistName,
              album: albumTitle,
              duration: Math.round((item.duration_ms || 0) / 1000) || 180,
              audioUrl: item.preview_url || '',
              coverUrl,
              genre: 'Spotify Album',
              source: 'spotify' as const,
              spotifyUri: item.uri,
              spotifyId: item.id,
              externalUrl: item.external_urls?.spotify,
            });
          });
          url = data.next || null;
        }

        if (tracks.length > 0) return tracks;
      } catch (err) {
        console.warn('getAlbumTracks error:', err);
      }
    }

    return this.searchOnlineTracks(`${artistName} ${albumTitle}`);
  }

  // ─── Fallback Stream Resolver ─────────────────────────────────────────────

  /**
   * Guarantees a playable audio URL for any track.
   * For Spotify tracks with an SDK active → let the SDK handle it (return preview_url as UI metadata only).
   * For everyone else → resolve via iTunes/Audius.
   */
  public static async ensurePlayableAudioUrl(track: Track): Promise<string> {
    // Already has a direct, trusted URL
    if (track.audioUrl && (
      track.audioUrl.startsWith('blob:') ||
      track.audioUrl.startsWith('data:') ||
      track.audioUrl.includes('tiktokcdn') ||
      track.audioUrl.includes('audius.co') ||
      track.audioUrl.includes('cobalt') ||
      track.audioUrl.includes('invidious')
    )) return track.audioUrl;

    // Direct mp3/m4a/etc
    if (track.audioUrl && /\.(mp3|wav|ogg|flac|m4a|aac)(\?.*)?$/i.test(track.audioUrl)) {
      return track.audioUrl;
    }

    const cacheKey = `${track.artist}::${track.title}`.toLowerCase();
    if (STREAM_URL_CACHE.has(cacheKey)) return STREAM_URL_CACHE.get(cacheKey)!;

    // Search iTunes for a preview
    try {
      const cleanTitle = track.title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const cleanArtist = track.artist.split(',')[0].trim();
      const q = `${cleanArtist} ${cleanTitle}`;
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=3`
      );
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        const match = data.results?.find((r: any) => r.previewUrl) || data.results?.[0];
        if (match?.previewUrl) {
          STREAM_URL_CACHE.set(cacheKey, match.previewUrl);
          return match.previewUrl;
        }
      }
    } catch (e) { console.debug('iTunes preview fallback error:', e); }

    // Search Audius for a full stream
    try {
      const cleanTitle = track.title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const q = `${track.artist.split(',')[0]} ${cleanTitle}`;
      const audiusRes = await fetch(
        `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=johnmusic`
      );
      if (audiusRes.ok) {
        const data = await audiusRes.json();
        if (data.data?.length > 0) {
          const url = `https://discoveryprovider.audius.co/v1/tracks/${data.data[0].id}/stream?app_name=johnmusic`;
          STREAM_URL_CACHE.set(cacheKey, url);
          return url;
        }
      }
    } catch (e) { console.debug('Audius fallback error:', e); }

    return track.audioUrl || '';
  }

  // ─── Online Catalog Search (iTunes + Audius) ──────────────────────────────

  public static async searchOnlineTracks(query: string): Promise<Track[]> {
    if (!query.trim()) return [];
    const tracksList: Track[] = [];

    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        data.results?.forEach((item: any) => {
          if (item.previewUrl) {
            tracksList.push({
              id: `itunes-${item.trackId}`,
              title: item.trackName,
              artist: item.artistName,
              album: item.collectionName,
              duration: Math.round(item.trackTimeMillis / 1000) || 210,
              audioUrl: item.previewUrl,
              coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
              genre: item.primaryGenreName || 'Pop / Rock',
              source: 'online' as const,
              externalUrl: item.trackViewUrl,
            });
          }
        });
      }
    } catch (e) { console.debug('Catalog search error:', e); }

    try {
      const audiusRes = await fetch(
        `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=johnmusic`
      );
      if (audiusRes.ok) {
        const audiusData = await audiusRes.json();
        audiusData.data?.slice(0, 10).forEach((t: any) => {
          const cover = t.artwork?.['480x480'] || t.artwork?.['150x150'] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
          if (!tracksList.some(item => item.title.toLowerCase() === t.title.toLowerCase())) {
            tracksList.push({
              id: `audius-${t.id}`,
              title: t.title,
              artist: t.user?.name || 'Artista',
              album: t.genre || 'Música Completa',
              duration: t.duration || 180,
              audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=johnmusic`,
              coverUrl: cover,
              genre: t.genre || 'Música Completa',
              source: 'online',
            });
          }
        });
      }
    } catch (e) { console.debug('Audius search error:', e); }

    return tracksList;
  }

  // ─── OAuth PKCE Helpers ───────────────────────────────────────────────────

  public static async getAuthUrl(clientId: string, redirectUri: string): Promise<string> {
    const codeVerifier = this.generateRandomString(64);
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);

    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-top-read',
      'user-read-recently-played',
      'streaming',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public static async exchangeCodeForToken(code: string, clientId: string, redirectUri: string) {
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier') || '';
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    const data = await response.json();
    if (data.access_token) {
      this.setToken(data.access_token, data.expires_in, data.refresh_token);
      return data;
    }
    throw new Error(data.error_description || 'Failed to exchange Spotify token');
  }

  private static generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  private static async sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    return window.crypto.subtle.digest('SHA-256', encoder.encode(plain));
  }

  private static base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}
