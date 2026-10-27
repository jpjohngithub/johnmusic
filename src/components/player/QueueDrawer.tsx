import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SafeImage } from '../SafeImage';
import { PlatformBadge } from '../PlatformBadge';
import { X, Trash2, Disc3, Volume2 } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    queueIndex,
    currentTrack,
    activeDeck,
    isCrossfading,
    removeFromQueue,
    clearQueue,
    playTrack
  } = usePlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-md h-full bg-[#12131a]/95 border-l border-white/10 p-5 flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-purple-400 animate-spin" />
            <h3 className="font-bold text-lg text-white">Fila de Reprodução</h3>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
              Deck {activeDeck} {isCrossfading && '• Crossfade Ativo'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                title="Limpar Fila"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {queue.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Disc3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sua fila de reprodução está vazia.</p>
              <p className="text-xs mt-1">Toque em qualquer música para começar!</p>
            </div>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-900/30 border-purple-500/50 shadow-md'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900">
                      <SafeImage
                        src={track.coverUrl}
                        videoId={track.youtubeId}
                        alt={track.title}
                        fallbackText={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium truncate ${
                          isCurrent ? 'text-purple-300 font-bold' : 'text-slate-200'
                        }`}
                      >
                        {track.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <PlatformBadge platform={track.platform} size="sm" />
                        <span className="text-xs text-slate-400 truncate">{track.artist}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md font-mono">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        Tocando
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
