import React from 'react';
import { Track, Platform } from '../types';
import { FEATURED_TRACKS } from '../services/api';
import { TrackCard } from '../components/TrackCard';
import { TrackRow } from '../components/TrackRow';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistContext';
import { SafeImage } from '../components/SafeImage';
import { Play, Sparkles, Layers, Disc3 } from 'lucide-react';

interface HomeViewProps {
  onOpenMergeModal: () => void;
  onAddToPlaylist: (track: Track) => void;
  onSelectPlaylist: (id: string) => void;
  onNavigateSearch: (filter: Platform | 'all') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenMergeModal,
  onAddToPlaylist,
  onSelectPlaylist,
  onNavigateSearch
}) => {
  const { playTrack } = usePlayer();
  const { playlists } = usePlaylists();

  const spotifyTracks = FEATURED_TRACKS.filter(t => t.platform === 'spotify');
  const youtubeTracks = FEATURED_TRACKS.filter(t => t.platform === 'youtube');
  const tiktokTracks = FEATURED_TRACKS.filter(t => t.platform === 'tiktok');

  const handlePlayAll = () => {
    if (FEATURED_TRACKS.length > 0) {
      playTrack(FEATURED_TRACKS[0], FEATURED_TRACKS);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-br from-purple-900/60 via-indigo-950/70 to-[#0b0c10] border border-purple-500/20 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 border border-purple-400/30 text-purple-300 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Spotify + YouTube + TikTok Unificados
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Todas as músicas do mundo. <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Sem login.</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Transição contínua Dual-Deck DJ, sem silêncio, download direto em MP3 e fusão de playlists em um só lugar.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-900/40 active:scale-95 transition-transform"
            >
              <Play className="w-5 h-5 fill-white" />
              Tocar Mega Mix Unificado
            </button>

            <button
              onClick={onOpenMergeModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-lg active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              Mesclar Playlists
            </button>
          </div>
        </div>
      </div>

      {/* Featured Playlists Carousel */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-purple-400" />
            Playlists em Destaque
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.slice(0, 4).map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer backdrop-blur-md"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
                <SafeImage
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="font-bold text-sm text-white truncate">{pl.name}</h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">{pl.tracks.length} músicas</p>
            </div>
          ))}
        </div>
      </section>

      {/* Destaques Multiplataforma Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Top Músicas Globais
          </h3>
          <button
            onClick={() => onNavigateSearch('all')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            Ver mais
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {FEATURED_TRACKS.slice(0, 6).map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onAddToPlaylist={onAddToPlaylist}
              playlistContextTracks={FEATURED_TRACKS}
            />
          ))}
        </div>
      </section>

      {/* Three Column Platform Showcases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spotify Column */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/20">
            <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              Spotify Music
            </span>
            <button
              onClick={() => onNavigateSearch('spotify')}
              className="text-[11px] text-slate-400 hover:text-emerald-400"
            >
              Explorar
            </button>
          </div>
          <div className="space-y-2">
            {spotifyTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onAddToPlaylist={onAddToPlaylist}
                playlistContextTracks={spotifyTracks}
              />
            ))}
          </div>
        </div>

        {/* YouTube Column */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-red-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-500/20">
            <span className="font-bold text-sm text-red-400 flex items-center gap-2">
              YouTube Music
            </span>
            <button
              onClick={() => onNavigateSearch('youtube')}
              className="text-[11px] text-slate-400 hover:text-red-400"
            >
              Explorar
            </button>
          </div>
          <div className="space-y-2">
            {youtubeTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onAddToPlaylist={onAddToPlaylist}
                playlistContextTracks={youtubeTracks}
              />
            ))}
          </div>
        </div>

        {/* TikTok Column */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-cyan-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/20">
            <span className="font-bold text-sm text-cyan-400 flex items-center gap-2">
              TikTok Trends
            </span>
            <button
              onClick={() => onNavigateSearch('tiktok')}
              className="text-[11px] text-slate-400 hover:text-cyan-400"
            >
              Explorar
            </button>
          </div>
          <div className="space-y-2">
            {tiktokTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onAddToPlaylist={onAddToPlaylist}
                playlistContextTracks={tiktokTracks}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
