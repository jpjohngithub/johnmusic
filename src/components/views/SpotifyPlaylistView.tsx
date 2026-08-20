import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SpotifyService } from '../../services/spotifyService';
import { SpotifyWebPlaybackService } from '../../services/SpotifyWebPlaybackService';
import type { Track, SpotifyPlaylistCard, SpotifyAlbum } from '../../types/music';
import { TrackRow } from '../common/TrackRow';
import { Play, Shuffle, Radio, Loader2, Sparkles, ExternalLink, Music2, Zap } from 'lucide-react';
import { SpotifyEmbedModal } from '../player/SpotifyEmbedModal';

interface SpotifyPlaylistViewProps {
  item: SpotifyPlaylistCard | SpotifyAlbum | null;
  type: 'playlist' | 'album';
}

export const SpotifyPlaylistView: React.FC<SpotifyPlaylistViewProps> = ({ item, type }) => {
  const { playTrack, isSpotifySDKReady } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);
  const [embedMode, setEmbedMode] = useState<boolean>(false);

  useEffect(() => {
    if (!item) return;
    let isMounted = true;
    setIsLoading(true);
    setTracks([]);

    const load = async () => {
      let fetched: Track[] = [];
      if (type === 'playlist') {
        const pl = item as SpotifyPlaylistCard;
        fetched = await SpotifyService.getPlaylistTracks(pl.id, pl.name);
      } else {
        const alb = item as SpotifyAlbum;
        fetched = await SpotifyService.getAlbumTracks(alb.id, alb.name, alb.artist);
      }
      if (isMounted) {
        setTracks(fetched);
        setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [item, type]);

  if (!item) return null;

  const title = 'name' in item ? item.name : 'Spotify';
  const artistOrOwner = 'artist' in item ? item.artist : 'owner' in item ? item.owner : 'Spotify Oficial';
  const coverUrl = item.coverUrl;
  const uri = item.spotifyUri;

  const handlePlayAll = async () => {
    if (tracks.length === 0) return;

    // If SDK is ready, play the full context (playlist/album) via Spotify
    if (isSpotifySDKReady && tracks[0].spotifyUri) {
      try {
        await SpotifyWebPlaybackService.play(item.spotifyUri);
        // Also set the queue locally for UI sync
        playTrack(tracks[0], tracks);
        return;
      } catch (e) {
        console.warn('SDK play failed, falling back to audio engine:', e);
      }
    }

    playTrack(tracks[0], tracks);
  };

  const handleShuffleAll = async () => {
    if (tracks.length === 0) return;
    const rand = Math.floor(Math.random() * tracks.length);

    if (isSpotifySDKReady && tracks[rand].spotifyUri) {
      try {
        await SpotifyWebPlaybackService.playWithOffset(item.spotifyUri, rand);
        playTrack(tracks[rand], tracks);
        return;
      } catch (e) {
        console.warn('SDK shuffle failed:', e);
      }
    }

    playTrack(tracks[rand], tracks);
  };

  const embedUrl = `https://open.spotify.com/embed/${type}/${item.id}?utm_source=generator&theme=0`;

  const totalDurationMin = tracks.length > 0 
    ? Math.round(tracks.reduce((acc, t) => acc + t.duration, 0) / 60)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-green-950/70 via-slate-900 to-slate-950 border border-green-500/30 shadow-2xl">
        <img 
          src={coverUrl} 
          alt={title} 
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl flex-shrink-0 border border-slate-700"
        />

        <div className="space-y-3 min-w-0 flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30">
            <Radio className="w-3.5 h-3.5" />
            Spotify {type === 'album' ? 'Álbum Oficial' : 'Playlist Oficial'}
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            {'description' in item ? item.description : `Álbum por ${artistOrOwner}`}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 font-medium pt-1">
            <span className="text-white font-bold">{artistOrOwner}</span>
            <span>•</span>
            {isLoading ? (
              <span className="text-slate-500">Carregando faixas...</span>
            ) : (
              <>
                <span className="text-green-400 font-semibold">{tracks.length} músicas</span>
                {totalDurationMin > 0 && (
                  <>
                    <span>•</span>
                    <span>{totalDurationMin} min</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* SDK status badge */}
          {isSpotifySDKReady ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-300 text-[11px] font-semibold">
              <Zap className="w-3 h-3" />
              Músicas Completas Ativas (Premium)
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-semibold">
              <Radio className="w-3 h-3" />
              Prévias de 30s (conecte Premium para músicas completas)
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            disabled={tracks.length === 0 || isLoading}
            onClick={handlePlayAll}
            className="px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-xl shadow-green-500/30 flex items-center gap-2.5 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            {isSpotifySDKReady ? 'Tocar Tudo (Completo)' : 'Tocar Tudo'}
          </button>

          <button
            disabled={tracks.length === 0 || isLoading}
            onClick={handleShuffleAll}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 transition-colors"
            title="Ordem aleatória"
          >
            <Shuffle className="w-5 h-5 text-green-400" />
          </button>

          <button
            onClick={() => setEmbedMode(!embedMode)}
            className={`px-4 py-3 rounded-2xl font-semibold text-xs border transition-all flex items-center gap-2 ${
              embedMode 
                ? 'bg-green-500/20 text-green-300 border-green-500/40' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Radio className="w-4 h-4 text-green-400" />
            {embedMode ? 'Ver Lista de Faixas' : 'Player Oficial Spotify'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEmbedOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Music2 className="w-4 h-4 text-green-400" />
            Janela Spotify
          </button>

          <a
            href={`https://open.spotify.com/${type}/${item.id}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir no Spotify
          </a>
        </div>
      </div>

      {/* Interactive Content */}
      {embedMode ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden animate-slide-up">
          <iframe
            src={embedUrl}
            width="100%"
            height="480"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl"
          />
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              <p className="text-xs text-slate-400">Sincronizando todas as faixas do Spotify...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">Nenhuma faixa encontrada.</p>
              <button
                onClick={() => setEmbedMode(true)}
                className="mt-3 px-4 py-2 bg-green-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Abrir Player Spotify Integrado
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, idx) => (
                <TrackRow 
                  key={`${track.id}-${idx}`} 
                  track={track} 
                  index={idx} 
                  allTracks={tracks} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      <SpotifyEmbedModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
        spotifyUriOrUrl={uri}
        title={title}
      />
    </div>
  );
};
