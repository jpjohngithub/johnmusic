import React from 'react';
import { Track, Platform } from '../types';
import { FEATURED_TRACKS } from '../services/api';
import { TrackCard } from '../components/TrackCard';
import { TrackRow } from '../components/TrackRow';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistContext';
import { SafeImage } from '../components/SafeImage';
import { Play, Sparkles, Layers, Disc3, Radio, Link2 } from 'lucide-react';

interface HomeViewProps {
  onOpenMergeModal: () => void;
  onOpenRecognizerModal: () => void;
  onOpenImportModal: () => void;
  onAddToPlaylist: (track: Track) => void;
  onSelectPlaylist: (id: string) => void;
  onNavigateSearch: (filter: Platform | 'all') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenMergeModal,
  onOpenRecognizerModal,
  onOpenImportModal,
  onAddToPlaylist,
  onSelectPlaylist,
  onNavigateSearch
}) => {
  const { playTrack } = usePlayer();
  const { playlists } = usePlaylists();

  const spotifyPl = playlists.find(p => p.id === 'pl_spotify_hits');
  const youtubePl = playlists.find(p => p.id === 'pl_youtube_trends');
  const tiktokPl = playlists.find(p => p.id === 'pl_tiktok_viral');

  const spotifyTracks = (spotifyPl && spotifyPl.tracks.length > 0) ? spotifyPl.tracks : FEATURED_TRACKS.filter(t => t.platform === 'spotify');
  const youtubeTracks = (youtubePl && youtubePl.tracks.length > 0) ? youtubePl.tracks : FEATURED_TRACKS.filter(t => t.platform === 'youtube');
  const tiktokTracks = (tiktokPl && tiktokPl.tracks.length > 0) ? tiktokPl.tracks : FEATURED_TRACKS.filter(t => t.platform === 'tiktok');

  const handlePlayAll = () => {
    if (FEATURED_TRACKS.length > 0) {
      playTrack(FEATURED_TRACKS[0], FEATURED_TRACKS);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Minimalist Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-[#0f0a17] border border-purple-900/40 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800/40 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Spotify + YouTube + TikTok Unificados
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Todas as suas músicas. <span className="text-purple-400">Sem limites.</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
            Transição contínua Dual-Deck DJ, áudios 100% completos do Spotify, extração de som do TikTok e identificação estilo Shazam.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Tocar Mega Mix
            </button>

            <button
              onClick={onOpenRecognizerModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800/40 active:scale-95 transition-all"
            >
              <Radio className="w-4 h-4 text-purple-400" />
              Ouvir do PC (Shazam)
            </button>

            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#160f22] hover:bg-purple-950 text-slate-300 border border-purple-900/30 active:scale-95 transition-all"
            >
              <Link2 className="w-4 h-4 text-purple-400" />
              Importar Link
            </button>

            <button
              onClick={onOpenMergeModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-transparent hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4" />
              Mesclar Playlists
            </button>
          </div>
        </div>
      </div>

      {/* Featured Playlists */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-purple-400" />
            Playlists em Destaque
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {playlists.slice(0, 4).map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group p-3 rounded-2xl bg-[#0f0a17]/50 hover:bg-[#160f22] border border-purple-900/20 hover:border-purple-600/30 transition-all cursor-pointer"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-2.5 bg-black shadow-md">
                <SafeImage
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="font-bold text-xs text-white truncate">{pl.name}</h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{pl.tracks.length} músicas</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Tracks Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Mais Tocadas (Áudios Oficiais)
          </h3>
          <button
            onClick={() => onNavigateSearch('all')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            Ver catálogo completo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spotify Column */}
        <div className="p-4 rounded-2xl bg-[#0f0a17]/60 border border-purple-900/30">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-900/20">
            <span className="font-bold text-xs text-purple-300 flex items-center gap-2">
              Spotify (Músicas Completas)
            </span>
            <button
              onClick={() => onNavigateSearch('spotify')}
              className="text-[10px] text-slate-500 hover:text-purple-400"
            >
              Ver mais
            </button>
          </div>
          <div className="space-y-1.5">
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
        <div className="p-4 rounded-2xl bg-[#0f0a17]/60 border border-purple-900/30">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-900/20">
            <span className="font-bold text-xs text-purple-300 flex items-center gap-2">
              YouTube Music (Áudio Contínuo)
            </span>
            <button
              onClick={() => onNavigateSearch('youtube')}
              className="text-[10px] text-slate-500 hover:text-purple-400"
            >
              Ver mais
            </button>
          </div>
          <div className="space-y-1.5">
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
        <div className="p-4 rounded-2xl bg-[#0f0a17]/60 border border-purple-900/30">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-900/20">
            <span className="font-bold text-xs text-purple-300 flex items-center gap-2">
              TikTok Trends (Sem Travamento)
            </span>
            <button
              onClick={() => onNavigateSearch('tiktok')}
              className="text-[10px] text-slate-500 hover:text-purple-400"
            >
              Ver mais
            </button>
          </div>
          <div className="space-y-1.5">
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
