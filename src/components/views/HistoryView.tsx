import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { TrackRow } from '../common/TrackRow';
import { History, Play, Music } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history, playTrack } = usePlayer();

  const handlePlayAll = () => {
    if (history.length > 0) {
      playTrack(history[0], history);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-cyan-400" />
            Histórico de Reprodução
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Faixas que você escutou recentemente nesta sessão do johnmusic.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            Tocar Histórico
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma música tocada recentemente.</p>
            <p className="text-xs text-slate-500 mt-1">Dê play em qualquer música para começar a registrar seu histórico.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((track, idx) => (
              <TrackRow 
                key={`hist-${track.id}-${idx}`} 
                track={track} 
                index={idx} 
                allTracks={history} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
