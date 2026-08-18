import type { Track } from '../types/music';

const SPOTIFY_CLIENT_ID_KEY = 'johnmusic_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'johnmusic_spotify_token';
const SPOTIFY_REFRESH_KEY = 'johnmusic_spotify_refresh';
const SPOTIFY_EXP_KEY = 'johnmusic_spotify_exp';

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

  // Generate Spotify OAuth Authorization URL with PKCE
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

  // Universal online track search
  public static async searchOnlineTracks(query: string): Promise<Track[]> {
    if (!query.trim()) return [];

    const token = this.getStoredToken();
    if (token) {
      try {
        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.tracks.items.map((item: any) => ({
            id: `spotify-${item.id}`,
            title: item.name,
            artist: item.artists.map((a: any) => a.name).join(', '),
            album: item.album?.name,
            duration: Math.round(item.duration_ms / 1000),
            audioUrl: item.preview_url || `https://open.spotify.com/track/${item.id}`,
            coverUrl: item.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            genre: 'Spotify Global',
            source: 'spotify' as const,
            spotifyUri: item.uri,
          }));
        }
      } catch (e) {
        console.warn('Spotify search failed, falling back to instant preview search:', e);
      }
    }

    // High quality instant music preview search via iTunes API
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`);
      if (res.ok) {
        const data = await res.json();
        return data.results.map((item: any) => ({
          id: `preview-${item.trackId}`,
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName,
          duration: Math.round(item.trackTimeMillis / 1000) || 30,
          audioUrl: item.previewUrl,
          coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
          genre: item.primaryGenreName || 'Pop / Rock',
          source: 'online' as const,
        }));
      }
    } catch (e) {
      console.error('Online preview search error:', e);
    }

    return [];
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
