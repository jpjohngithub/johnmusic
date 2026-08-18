import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { X, ListMusic, Trash2, Play, Music } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const { 
    isQueueOpen, 
    toggleQueue, 
    queue, 
    queueIndex, 
    currentTrack, 
    playTrack, 
    removeFromQueue, 
    clearQueue 
  } = usePlayer();

  if (!isQueueOpen) return null;

  const currentPlaying = currentTrack || (queue.length > 0 ? queue[queueIndex] : null);
  const nextInQueue = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-700/80 h-full flex flex-col shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Fila de Reprodução</h2>
              <p className="text-xs text-slate-400">{queue.length} faixas na lista</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                className="p-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                title="Limpar fila"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </button>
            )}
            <button
              onClick={toggleQueue}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Now Playing */}
          {currentPlaying && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Tocando Agora
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <img 
                  src={currentPlaying.coverUrl} 
                  alt={currentPlaying.title} 
                  className="w-12 h-12 rounded-xl object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{currentPlaying.title}</h4>
                  <p className="text-xs text-emerald-400/80 truncate">{currentPlaying.artist}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next Up */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              A Seguir na Fila
            </h3>

            {nextInQueue.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Nenhuma música agendada a seguir.
              </div>
            ) : (
              <div className="space-y-2">
                {nextInQueue.map((track, idx) => {
                  const actualIdx = queueIndex + 1 + idx;
                  return (
                    <div 
                      key={`${track.id}-${actualIdx}`}
                      className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition-all"
                    >
                      <div 
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => playTrack(track, queue)}
                      >
                        <span className="text-xs font-mono text-slate-500 w-5 text-center">
                          {idx + 1}
                        </span>
                        <img 
                          src={track.coverUrl} 
                          alt={track.title} 
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => playTrack(track, queue)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                          title="Tocar Agora"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => removeFromQueue(actualIdx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                          title="Remover da fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
