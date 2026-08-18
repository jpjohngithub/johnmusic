import type { Track, SpotifyAlbum, SpotifyPlaylistCard } from '../types/music';

const SPOTIFY_CLIENT_ID_KEY = 'johnmusic_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'johnmusic_spotify_token';
const SPOTIFY_REFRESH_KEY = 'johnmusic_spotify_refresh';
const SPOTIFY_EXP_KEY = 'johnmusic_spotify_exp';

const FALLBACK_SPOTIFY_NEW_RELEASES: SpotifyAlbum[] = [
  {
    id: 'alb-1',
    name: 'Hit Me Hard and Soft',
    artist: 'Billie Eilish',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    releaseDate: '2024',
    totalTracks: 10,
    spotifyUri: 'spotify:album:7aJuG4MyANZwYmaZaGQizZ'
  },
  {
    id: 'alb-2',
    name: 'The Tortured Poets Department',
    artist: 'Taylor Swift',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    releaseDate: '2024',
    totalTracks: 16,
    spotifyUri: 'spotify:album:1Mo4aZ8swT3o1DcMdfep57'
  },
  {
    id: 'alb-3',
    name: 'Short n\' Sweet',
    artist: 'Sabrina Carpenter',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    releaseDate: '2024',
    totalTracks: 12,
    spotifyUri: 'spotify:album:4ca81014e7'
  },
  {
    id: 'alb-4',
    name: 'BRAT',
    artist: 'Charli xcx',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    releaseDate: '2024',
    totalTracks: 15,
    spotifyUri: 'spotify:album:2lIZef49wP6'
  },
  {
    id: 'alb-5',
    name: 'Radical Optimism',
    artist: 'Dua Lipa',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    releaseDate: '2024',
    totalTracks: 11,
    spotifyUri: 'spotify:album:01a4e21d'
  },
  {
    id: 'alb-6',
    name: 'Cowboy Carter',
    artist: 'Beyoncé',
    coverUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    releaseDate: '2024',
    totalTracks: 27,
    spotifyUri: 'spotify:album:6v19c11'
  }
];

const FALLBACK_SPOTIFY_FEATURED_PLAYLISTS: SpotifyPlaylistCard[] = [
  {
    id: '37i9dQZF1DXcBWIGoYBM5M',
    name: 'Today\'s Top Hits',
    description: 'Sabrina Carpenter is on top of the Hottest 50! Todas as músicas em alta no Spotify.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    totalTracks: 50,
    spotifyUri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
    owner: 'Spotify'
  },
  {
    id: '37i9dQZF1DX0FOF1IZbBh9',
    name: 'Top Brasil & Hits',
    description: 'Os maiores sucessos que estão bombando nos fones de todo o Brasil.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    totalTracks: 50,
    spotifyUri: 'spotify:playlist:37i9dQZF1DX0FOF1IZbBh9',
    owner: 'Spotify'
  },
  {
    id: '37i9dQZF1DX4JAvHpjipBk',
    name: 'New Music Friday',
    description: 'Os melhores lançamentos da semana reunidos em um só lugar.',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    totalTracks: 100,
    spotifyUri: 'spotify:playlist:37i9dQZF1DX4JAvHpjipBk',
    owner: 'Spotify'
  },
  {
    id: '37i9dQZF1DX1lVhptIYRda',
    name: 'Hot Hits Brasil',
    description: 'As mais tocadas nas rádios e streamings do país.',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    totalTracks: 60,
    spotifyUri: 'spotify:playlist:37i9dQZF1DX1lVhptIYRda',
    owner: 'Spotify'
  },
  {
    id: '37i9dQZF1DXdLEN7aqioXM',
    name: 'Mega Hits Eletrônica',
    description: 'Batidas aceleradas, festivais e a melhor vibe do EDM mundial.',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    totalTracks: 75,
    spotifyUri: 'spotify:playlist:37i9dQZF1DXdLEN7aqioXM',
    owner: 'Spotify'
  },
  {
    id: '37i9dQZF1DX4sWSpwq3LiO',
    name: 'Peaceful Piano & Lofi',
    description: 'Piano acústico relaxante para foco, estudo e trabalho.',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    totalTracks: 120,
    spotifyUri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
    owner: 'Spotify'
  }
];

export class SpotifyService {
  public static getStoredClientId(): string {
    return localStorage.getItem(SPOTIFY_CLIENT_ID_KEY) || '';
  }

  public static setStoredClientId(clientId: string) {
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, clientId.trim());
  }

  public static getStoredToken(): string | null {
    const exp = Number(localStorage.getItem(SPOTIFY_EXP_KEY));
    if (exp && Date.now() > exp) {
      return null;
    }
    return localStorage.getItem(SPOTIFY_TOKEN_KEY);
  }

  public static setToken(token: string, expiresInSeconds: number, refreshToken?: string) {
    localStorage.setItem(SPOTIFY_TOKEN_KEY, token);
    localStorage.setItem(SPOTIFY_EXP_KEY, String(Date.now() + expiresInSeconds * 1000));
    if (refreshToken) {
      localStorage.setItem(SPOTIFY_REFRESH_KEY, refreshToken);
    }
  }

  public static disconnect() {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    localStorage.removeItem(SPOTIFY_REFRESH_KEY);
    localStorage.removeItem(SPOTIFY_EXP_KEY);
  }

  public static parseSpotifyUrl(input: string): { type: 'track' | 'playlist' | 'album' | 'artist'; id: string } | null {
    const clean = input.trim();
    
    const uriMatch = clean.match(/^spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)$/);
    if (uriMatch) {
      return { type: uriMatch[1] as any, id: uriMatch[2] };
    }

    const urlMatch = clean.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
      return { type: urlMatch[1] as any, id: urlMatch[2] };
    }

    return null;
  }

  public static async getNewReleases(): Promise<SpotifyAlbum[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=12', {
          headers: { Authorization: `Bearer ${token}` }
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
            spotifyUri: item.uri
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
        if (data.results && data.results.length > 0) {
          return data.results.map((item: any) => ({
            id: `album-${item.collectionId}`,
            name: item.collectionName,
            artist: item.artistName,
            coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
            releaseDate: item.releaseDate?.substring(0, 4) || '2024',
            totalTracks: item.trackCount || 10,
            spotifyUri: `spotify:album:${item.collectionId}`
          }));
        }
      }
    } catch (e) {
      console.debug(e);
    }

    return FALLBACK_SPOTIFY_NEW_RELEASES;
  }

  public static async getFeaturedPlaylists(): Promise<SpotifyPlaylistCard[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
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
            owner: item.owner?.display_name || 'Spotify'
          }));
        }
      } catch (err) {
        console.warn('Featured playlists token fetch error:', err);
      }
    }

    return FALLBACK_SPOTIFY_FEATURED_PLAYLISTS;
  }

  public static async getPlaylistTracks(playlistId: string, playlistTitle: string = 'Spotify Playlist'): Promise<Track[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=30`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.items.map((entry: any) => {
            const item = entry.track;
            if (!item) return null;
            return {
              id: `spotify-${item.id}`,
              title: item.name,
              artist: item.artists?.map((a: any) => a.name).join(', ') || 'Vários Artistas',
              album: item.album?.name,
              duration: Math.round(item.duration_ms / 1000) || 180,
              audioUrl: item.preview_url || `https://open.spotify.com/track/${item.id}`,
              coverUrl: item.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
              genre: 'Spotify Playlist',
              source: 'spotify' as const,
              spotifyUri: item.uri,
              spotifyId: item.id,
              externalUrl: item.external_urls?.spotify
            };
          }).filter(Boolean) as Track[];
        }
      } catch (err) {
        console.warn(err);
      }
    }

    try {
      const query = playlistTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Top Hits';
      const tracks = await this.searchOnlineTracks(query);
      if (tracks.length > 0) return tracks;
    } catch (e) {
      console.debug(e);
    }

    return [];
  }

  public static async getAlbumTracks(albumId: string, albumTitle: string = 'Spotify Album', artistName: string = ''): Promise<Track[]> {
    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=30`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.items.map((item: any) => ({
            id: `spotify-${item.id}`,
            title: item.name,
            artist: item.artists?.map((a: any) => a.name).join(', ') || artistName,
            album: albumTitle,
            duration: Math.round(item.duration_ms / 1000) || 180,
            audioUrl: item.preview_url || `https://open.spotify.com/track/${item.id}`,
            coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            genre: 'Spotify Album',
            source: 'spotify' as const,
            spotifyUri: item.uri,
            spotifyId: item.id,
            externalUrl: item.external_urls?.spotify
          }));
        }
      } catch (err) {
        console.warn(err);
      }
    }

    return this.searchOnlineTracks(`${artistName} ${albumTitle}`);
  }

  // Search online tracks with 100% Full Audio streaming integration
  public static async searchOnlineTracks(query: string): Promise<Track[]> {
    if (!query.trim()) return [];

    const tracksList: Track[] = [];

    // 1. Search Audius for 100% full length streaming tracks
    try {
      const audiusRes = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=johnmusic`);
      if (audiusRes.ok) {
        const audiusData = await audiusRes.json();
        if (audiusData.data && Array.isArray(audiusData.data)) {
          audiusData.data.slice(0, 15).forEach((t: any) => {
            const cover = t.artwork?.['480x480'] || t.artwork?.['150x150'] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
            tracksList.push({
              id: `audius-${t.id}`,
              title: t.title,
              artist: t.user?.name || 'Artista',
              album: t.genre || 'Full Track (100%)',
              duration: t.duration || 180,
              audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=johnmusic`,
              coverUrl: cover,
              genre: t.genre || 'Música Completa',
              source: 'online',
            });
          });
        }
      }
    } catch (e) {
      console.debug('Audius search error:', e);
    }

    // 2. Also search iTunes / Spotify for rich global catalog
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`);
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          data.results.forEach((item: any) => {
            // Only add if not already in list
            if (!tracksList.some(t => t.title.toLowerCase() === item.trackName.toLowerCase())) {
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
                externalUrl: item.trackViewUrl
              });
            }
          });
        }
      }
    } catch (e) {
      console.debug('Catalog search error:', e);
    }

    return tracksList;
  }

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
      'streaming'
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
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    };

    const response = await fetch('https://accounts.spotify.com/api/token', payload);
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
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private static async sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  private static base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}
