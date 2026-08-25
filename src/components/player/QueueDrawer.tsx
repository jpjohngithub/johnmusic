// ============================================================
// QUEUE DRAWER — FILA DE REPRODUÇÃO & A SEGUIR (UP NEXT)
// Visualização completa da faixa atual, próxima música e fila
// ============================================================

import { useEffect, useRef } from 'react'
import {
  ListMusic,
  X,
  Play,
  Trash2,
  Sparkles,
  Music2,
  Youtube,
  Shuffle,
  Volume2,
} from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { formatMs, cn } from '@/lib/utils'

interface QueueDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
  const {
    queue,
    queueIndex,
    currentQueueItem,
    isPlaying,
    isShuffled,
    perfectTransition,
    playQueueIndex,
    removeFromQueue,
    clearQueue,
    toggleShuffle,
  } = usePlayerStore()

  const drawerRef = useRef<HTMLDivElement | null>(null)

  // Fecha ao pressionar Escape ou clicar fora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Calcula faixas a seguir
  const upcomingTracks = queue.slice(queueIndex + 1)
  const nextTrack = upcomingTracks[0] || null
  const restOfQueue = upcomingTracks.slice(1)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 bottom-24 w-full sm:w-[420px] bg-neutral-900/95 border-l border-white/10 backdrop-blur-xl shadow-2xl z-50 flex flex-col animate-slide-left text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-spotify-green/20 border border-spotify-green/40 flex items-center justify-center text-spotify-green">
              <ListMusic size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Fila de Reprodução</h2>
              <p className="text-white/40 text-xs">
                {queue.length} {queue.length === 1 ? 'música' : 'músicas'} na lista
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={cn(
                'p-2 rounded-lg transition-colors text-xs flex items-center gap-1 border',
                isShuffled
                  ? 'bg-spotify-green/20 text-spotify-green border-spotify-green/40'
                  : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
              )}
              title={isShuffled ? 'Aleatório Ativado' : 'Ativar Aleatório'}
            >
              <Shuffle size={14} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Fechar Fila"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* 1. TOCANDO AGORA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-spotify-green flex items-center gap-1.5">
                <Volume2 size={13} className="animate-pulse" />
                Tocando Agora
              </span>
              {perfectTransition && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles size={10} className="text-purple-400" />
                  Transição Mágica
                </span>
              )}
            </div>

            {currentQueueItem ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-spotify-green/15 via-white/5 to-transparent border border-spotify-green/30 flex items-center gap-3.5 shadow-lg">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 relative">
                  {currentQueueItem.imageUrl ? (
                    <img
                      src={currentQueueItem.imageUrl}
                      alt={currentQueueItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Music2 size={24} />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                      <span className="w-1 h-3 bg-spotify-green rounded-full animate-[bounce_0.6s_infinite]" />
                      <span className="w-1 h-5 bg-spotify-green rounded-full animate-[bounce_0.8s_infinite]" />
                      <span className="w-1 h-2 bg-spotify-green rounded-full animate-[bounce_0.5s_infinite]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-sm truncate">{currentQueueItem.title}</p>
                  <p className="text-white/60 text-xs truncate mt-0.5">{currentQueueItem.subtitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                      Faixa #{queueIndex + 1}
                    </span>
                    {currentQueueItem.durationMs && (
                      <span className="text-white/40 text-[11px]">
                        {formatMs(currentQueueItem.durationMs)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center text-white/40 text-xs">
                Nenhuma música tocando no momento.
              </div>
            )}
          </div>

          {/* 2. A SEGUIR (PRÓXIMA FAIXA) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-400" />
                A Seguir (Próxima)
              </span>
              {nextTrack && (
                <span className="text-white/40 text-xs">
                  Faixa #{queueIndex + 2} de {queue.length}
                </span>
              )}
            </div>

            {nextTrack ? (
              <div
                onClick={() => playQueueIndex(queueIndex + 1)}
                className="group p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-white/5 to-transparent border border-purple-500/30 hover:border-purple-400/60 cursor-pointer transition-all flex items-center gap-3.5 shadow-md hover:scale-[1.01]"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 relative">
                  {nextTrack.imageUrl ? (
                    <img
                      src={nextTrack.imageUrl}
                      alt={nextTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Music2 size={20} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={16} className="text-white fill-white ml-0.5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40">
                      Próxima
                    </span>
                    <p className="text-white font-bold text-sm truncate group-hover:text-purple-300 transition-colors">
                      {nextTrack.title}
                    </p>
                  </div>
                  <p className="text-white/60 text-xs truncate mt-0.5">{nextTrack.subtitle}</p>
                </div>

                {nextTrack.durationMs && (
                  <span className="text-white/40 text-xs font-mono">
                    {formatMs(nextTrack.durationMs)}
                  </span>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center text-white/40 text-xs">
                Fim da fila. Adicione mais músicas ou ative a repetição.
              </div>
            )}
          </div>

          {/* 3. RESTANTE DA FILA */}
          {restOfQueue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Próximas Faixas ({restOfQueue.length})
                </span>
                <button
                  onClick={clearQueue}
                  className="text-white/30 hover:text-red-400 text-xs transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Limpar
                </button>
              </div>

              <div className="space-y-1.5">
                {restOfQueue.map((track, idx) => {
                  const absoluteIdx = queueIndex + 2 + idx
                  return (
                    <div
                      key={`${track.id}-${absoluteIdx}`}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                      onClick={() => playQueueIndex(absoluteIdx)}
                    >
                      <span className="text-white/30 font-mono text-xs w-6 text-center group-hover:hidden">
                        {absoluteIdx + 1}
                      </span>
                      <button className="w-6 hidden group-hover:flex items-center justify-center text-spotify-green">
                        <Play size={14} className="fill-current" />
                      </button>

                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                        {track.imageUrl ? (
                          <img
                            src={track.imageUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <Music2 size={16} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-xs truncate group-hover:text-spotify-green transition-colors">
                          {track.title}
                        </p>
                        <p className="text-white/50 text-[11px] truncate">{track.subtitle}</p>
                      </div>

                      {track.durationMs && (
                        <span className="text-white/30 text-xs font-mono">
                          {formatMs(track.durationMs)}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromQueue(track.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all rounded hover:bg-white/10"
                        title="Remover da fila"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
