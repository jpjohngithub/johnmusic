import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { DEFAULT_TRACKS } from '../../data/defaultTracks';
import { TrackRow } from '../common/TrackRow';
import { TrackCard } from '../common/TrackCard';
import { Play, Sparkles, FileAudio, Flame } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { playTrack, setCurrentView, playlists, localTracks } = usePlayer();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia, John';
    if (hour < 18) return 'Boa tarde, John';
    return 'Boa noite, John';
  };

  const featuredTrack = DEFAULT_TRACKS[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/20 shadow-2xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Destaque Exclusivo no johnmusic</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {getGreeting()}!
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Pronto para a melhor experiência sonora? Ouça suas faixas sintetizadas, importe suas próprias músicas locais ou conecte o ecossistema Spotify.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => playTrack(featuredTrack, DEFAULT_TRACKS)}
                className="px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Tocar Mix em Destaque
              </button>

              <button
                onClick={() => setCurrentView('local-files')}
                className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center gap-2 transition-all"
              >
                <FileAudio className="w-4 h-4 text-indigo-400" />
                Músicas do PC ({localTracks.length})
              </button>
            </div>
          </div>

          {/* Featured Mini Artwork */}
          <div 
            onClick={() => playTrack(featuredTrack, DEFAULT_TRACKS)}
            className="group relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 cursor-pointer flex-shrink-0 self-center md:self-auto"
          >
            <img 
              src={featuredTrack.coverUrl} 
              alt={featuredTrack.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md">
              <div className="text-xs font-bold text-white truncate">{featuredTrack.title}</div>
              <div className="text-[10px] text-emerald-400 truncate">{featuredTrack.artist}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.slice(0, 3).map((pl) => (
            <div
              key={pl.id}
              onClick={() => setCurrentView('playlist', pl.id)}
              className="group flex items-center gap-4 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/30 cursor-pointer transition-all"
            >
              <img 
                src={pl.coverUrl} 
                alt={pl.title} 
                className="w-14 h-14 rounded-xl object-cover shadow flex-shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 truncate transition-colors">
                  {pl.title}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {pl.trackIds.length} músicas
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recomendados para Você</h2>
            <p className="text-xs text-slate-400">Coleção curada em alta definição de áudio</p>
          </div>
          <button
            onClick={() => setCurrentView('explore')}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Ver Tudo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {DEFAULT_TRACKS.map((track) => (
            <TrackCard key={track.id} track={track} allTracks={DEFAULT_TRACKS} />
          ))}
        </div>
      </div>

      {/* Top Tracks List */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Top Faixas do Momento</h2>
        <div className="space-y-1">
          {DEFAULT_TRACKS.map((track, idx) => (
            <TrackRow 
              key={track.id} 
              track={track} 
              index={idx} 
              allTracks={DEFAULT_TRACKS} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
