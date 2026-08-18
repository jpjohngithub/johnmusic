import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { TrackRow } from '../common/TrackRow';
import { Heart, Play, Shuffle } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const { favorites, playTrack } = usePlayer();

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  const handleShuffleAll = () => {
    if (favorites.length > 0) {
      const rand = Math.floor(Math.random() * favorites.length);
      playTrack(favorites[rand], favorites);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-pink-950/60 via-purple-950/40 to-slate-900 border border-pink-500/20 shadow-2xl">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          <Heart className="w-24 h-24 fill-white" />
        </div>

        <div className="space-y-3 min-w-0 flex-1 text-center md:text-left">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Coleção Pessoal
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Músicas Curtidas
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Todas as faixas que você marcou com coração no johnmusic salvas no seu dispositivo.
          </p>

          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400 font-semibold pt-1">
            <span className="text-white font-bold">{favorites.length} faixas salvas</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold text-sm shadow-xl shadow-pink-500/30 flex items-center gap-2.5 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Tocar Favoritos
          </button>

          <button
            onClick={handleShuffleAll}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Tocar em ordem aleatória"
          >
            <Shuffle className="w-5 h-5 text-pink-400" />
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-slate-300">Você ainda não favoritou nenhuma música.</p>
            <p className="text-xs text-slate-500 mt-1">
              Clique no coração em qualquer música para adicioná-la a esta lista!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {favorites.map((track, idx) => (
              <TrackRow 
                key={track.id} 
                track={track} 
                index={idx} 
                allTracks={favorites} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
