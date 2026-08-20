/**
 * SpotifyWebPlaybackService
 *
 * Manages the Spotify Web Playback SDK — the only legal way to play
 * full-length Spotify tracks directly in a browser (requires Premium).
 *
 * Flow:
 *   1. loadSDK()           — inject <script> from Spotify CDN
 *   2. initialize(token)   — create Spotify.Player device
 *   3. play(spotifyUri)    — stream any track/playlist/album fully
 */




export type SpotifySDKState = {
  isReady: boolean;
  isPlaying: boolean;
  isPremium: boolean;
  deviceId: string | null;
  currentTrackUri: string | null;
  currentTrackName: string | null;
  currentArtistName: string | null;
  currentCoverUrl: string | null;
  positionMs: number;
  durationMs: number;
  volume: number;
};

type SDKStateListener = (state: SpotifySDKState) => void;

class SpotifyWebPlaybackServiceClass {
  private player: Spotify.Player | null = null;
  private deviceId: string | null = null;
  private token: string | null = null;
  private sdkLoaded = false;
  private sdkReady = false;
  private stateListeners: SDKStateListener[] = [];
  private stateInterval: ReturnType<typeof setInterval> | null = null;

  private internalState: SpotifySDKState = {
    isReady: false,
    isPlaying: false,
    isPremium: false,
    deviceId: null,
    currentTrackUri: null,
    currentTrackName: null,
    currentArtistName: null,
    currentCoverUrl: null,
    positionMs: 0,
    durationMs: 0,
    volume: 0.8,
  };

  // ─── Public API ────────────────────────────────────────────────────────────

  public onStateChange(listener: SDKStateListener): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  public getState(): SpotifySDKState {
    return { ...this.internalState };
  }

  public isActive(): boolean {
    return this.sdkReady && this.deviceId !== null;
  }

  /** Load the SDK script and initialize the player with an access token */
  public async initialize(token: string): Promise<boolean> {
    this.token = token;

    try {
      await this.loadSDK();
      await this.createPlayer(token);
      return true;
    } catch (err) {
      console.warn('[SpotifySDK] init failed:', err);
      return false;
    }
  }

  /** Play a Spotify URI (track, album, playlist, artist) */
  public async play(spotifyUri: string): Promise<void> {
    if (!this.deviceId || !this.token) {
      console.warn('[SpotifySDK] Not ready — device or token missing');
      return;
    }

    const isTrack = spotifyUri.startsWith('spotify:track:');
    const body = isTrack
      ? JSON.stringify({ uris: [spotifyUri] })
      : JSON.stringify({ context_uri: spotifyUri });

    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body,
      }
    );
  }

  /** Play a Spotify URI starting at a specific track offset index */
  public async playWithOffset(contextUri: string, offsetIndex: number): Promise<void> {
    if (!this.deviceId || !this.token) return;

    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: contextUri,
          offset: { position: offsetIndex },
        }),
      }
    );
  }

  /** Play a specific track within a context (playlist/album) */
  public async playTrackInContext(contextUri: string, trackUri: string): Promise<void> {
    if (!this.deviceId || !this.token) return;

    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: contextUri,
          offset: { uri: trackUri },
        }),
      }
    );
  }

  public async pause(): Promise<void> {
    await this.player?.pause();
  }

  public async resume(): Promise<void> {
    await this.player?.resume();
  }

  public async seek(positionMs: number): Promise<void> {
    await this.player?.seek(positionMs);
  }

  public async setVolume(volume: number): Promise<void> {
    const clamped = Math.max(0, Math.min(1, volume));
    await this.player?.setVolume(clamped);
    this.internalState.volume = clamped;
  }

  public async nextTrack(): Promise<void> {
    await this.player?.nextTrack();
  }

  public async prevTrack(): Promise<void> {
    await this.player?.previousTrack();
  }

  public async disconnect(): Promise<void> {
    if (this.stateInterval) {
      clearInterval(this.stateInterval);
      this.stateInterval = null;
    }
    this.player?.disconnect();
    this.player = null;
    this.deviceId = null;
    this.sdkReady = false;
    this.token = null;
    this.updateState({ isReady: false, deviceId: null });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private loadSDK(): Promise<void> {
    if (this.sdkLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 15000;
      const timer = setTimeout(() => reject(new Error('Spotify SDK load timeout')), TIMEOUT_MS);

      window.onSpotifyWebPlaybackSDKReady = () => {
        clearTimeout(timer);
        this.sdkLoaded = true;
        resolve();
      };

      // Check if SDK already loaded
      if (window.Spotify) {
        clearTimeout(timer);
        this.sdkLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Failed to load Spotify SDK script'));
      };
      document.head.appendChild(script);
    });
  }

  private createPlayer(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 20000;
      const timer = setTimeout(() => reject(new Error('Spotify Player init timeout')), TIMEOUT_MS);

      try {
        const player = new window.Spotify.Player({
          name: 'johnmusic Player',
          getOAuthToken: (cb) => cb(token),
          volume: 0.8,
        });

        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          clearTimeout(timer);
          this.deviceId = device_id;
          this.sdkReady = true;
          this.updateState({ isReady: true, deviceId: device_id, isPremium: true });
          console.info('[SpotifySDK] Ready on device:', device_id);
          this.startStatePolling();
          resolve();
        });

        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.warn('[SpotifySDK] Device offline:', device_id);
          this.deviceId = null;
          this.sdkReady = false;
          this.updateState({ isReady: false, deviceId: null });
        });

        player.addListener('initialization_error', ({ message }: { message: string }) => {
          clearTimeout(timer);
          console.error('[SpotifySDK] Initialization error:', message);
          reject(new Error(message));
        });

        player.addListener('authentication_error', ({ message }: { message: string }) => {
          clearTimeout(timer);
          console.error('[SpotifySDK] Auth error:', message);
          reject(new Error('Spotify authentication failed: ' + message));
        });

        player.addListener('account_error', ({ message }: { message: string }) => {
          clearTimeout(timer);
          this.updateState({ isPremium: false });
          console.error('[SpotifySDK] Account error (Premium required):', message);
          reject(new Error('Spotify Premium required: ' + message));
        });

        player.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
          if (!state) return;
          this.syncStateFromSDK(state);
        });

        player.connect().then((success: boolean) => {
          if (!success) {
            clearTimeout(timer);
            reject(new Error('Spotify player.connect() returned false'));
          }
        });

        this.player = player;
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  private startStatePolling(): void {
    if (this.stateInterval) clearInterval(this.stateInterval);
    // Poll every 500ms to keep currentTime in sync
    this.stateInterval = setInterval(async () => {
      if (!this.player || !this.sdkReady) return;
      try {
        const state = await this.player.getCurrentState();
        if (state) {
          this.syncStateFromSDK(state);
        }
      } catch {
        // ignore polling errors
      }
    }, 500);
  }

  private syncStateFromSDK(state: Spotify.PlaybackState): void {
    const track = state.track_window?.current_track;
    this.updateState({
      isPlaying: !state.paused,
      currentTrackUri: track?.uri ?? null,
      currentTrackName: track?.name ?? null,
      currentArtistName: track?.artists?.map((a: any) => a.name).join(', ') ?? null,
      currentCoverUrl: track?.album?.images?.[0]?.url ?? null,
      positionMs: state.position,
      durationMs: state.duration,
    });
  }

  private updateState(partial: Partial<SpotifySDKState>): void {
    this.internalState = { ...this.internalState, ...partial };
    const snapshot = { ...this.internalState };
    this.stateListeners.forEach(l => l(snapshot));
  }
}

export const SpotifyWebPlaybackService = new SpotifyWebPlaybackServiceClass();
