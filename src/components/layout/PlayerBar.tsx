// ============================================================
// PLAYER BAR — Barra de player persistente e unificada
// Suporte contínuo para Spotify, YouTube, TikTok e Áudio
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronUp,
  ChevronDown,
  Music2,
  Youtube,
  ExternalLink,
  Loader2,
  Sparkles,
  ListMusic,
} from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { formatSeconds, cn } from '@/lib/utils'
import { YouTubePlayer } from '@/components/youtube/YouTubePlayer'
import { QueueDrawer } from '@/components/player/QueueDrawer'

// TikTok mini icon
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

interface PlayerBarProps {
  spotifyPlayer?: any
  onExpandPlayer?: () => void
}

export function PlayerBar({ onExpandPlayer }: PlayerBarProps) {
  const {
    source,
    isPlaying,
    isResolving,
    currentQueueItem,
    audioTrack,
    spotifySavedItem,
    youtubeVideo,
    tiktokVideo,
    volume,
    isMuted,
    progress,
    currentTime,
    duration,
    isShuffled,
    repeatMode,
    perfectTransition,
    isCrossfading,
    queue,
    queueIndex,
    togglePerfectTransition,
    getNextTrack,
    setIsPlaying,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setProgress,
    setCurrentTime,
    setDuration,
    playNext,
    playPrev,
  } = usePlayerStore()

  const [showEmbedDrawer, setShowEmbedDrawer] = useState(false)
  const [showQueueDrawer, setShowQueueDrawer] = useState(false)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const nextTrack = getNextTrack()

  // ─── HTML5 Audio Engine ───────────────────────────────────
  useEffect(() => {
    const audio = audioElementRef.current
    if (!audio) return

    if (source === 'audio' && audioTrack?.audioUrl) {
      if (audio.src !== audioTrack.audioUrl) {
        audio.src = audioTrack.audioUrl
        audio.load()
      }

      if (isPlaying) {
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
    } else {
      audio.pause()
    }
  }, [source, audioTrack, isPlaying])

  // Volume do áudio direto
  useEffect(() => {
    const audio = audioElementRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const handleTimeUpdate = () => {
    const audio = audioElementRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
    setProgress((audio.currentTime / audio.duration) * 100)

    // ─── Transição Perfeita no Áudio HTML5 ───
    if (perfectTransition && audio.duration > 10) {
      const remaining = audio.duration - audio.currentTime
      if (remaining <= 15 && remaining > 13) {
        usePlayerStore.getState().preResolveNextTrack()
      }
      if (remaining <= 3.5 && remaining > 0.6) {
        const baseVol = isMuted ? 0 : volume / 100
        const fadeRatio = Math.max(0.08, (remaining - 0.6) / 2.9)
        audio.volume = baseVol * fadeRatio
      }
      if (remaining <= 0.6) {
        playNext()
      }
    }
  }

  const handleLoadedMetadata = () => {
    const audio = audioElementRef.current
    if (!audio) return
    setDuration(audio.duration)
  }

  const handleAudioEnded = async () => {
    if (repeatMode === 'one') {
      const audio = audioElementRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    } else {
      await playNext()
    }
  }

  // ─── Controls ─────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const handleNextTrack = useCallback(async () => {
    if (source === 'youtube' && perfectTransition) {
      window.dispatchEvent(new CustomEvent('yt-player-crossfade-next'))
    } else {
      await playNext()
    }
  }, [source, perfectTransition, playNext])

  const handlePrevTrack = useCallback(async () => {
    if (source === 'youtube' && perfectTransition) {
      window.dispatchEvent(new CustomEvent('yt-player-crossfade-prev'))
    } else {
      await playPrev()
    }
  }, [source, perfectTransition, playPrev])

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = Number(e.target.value)
      setProgress(pct)
      const newTime = (pct / 100) * duration
      setCurrentTime(newTime)

      if (source === 'audio' && audioElementRef.current) {
        audioElementRef.current.currentTime = newTime
      } else if (source === 'youtube') {
        window.dispatchEvent(
          new CustomEvent('yt-player-seek', { detail: { seconds: newTime } })
        )
      }
    },
    [source, duration, setProgress, setCurrentTime]
  )

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      setVolume(v)
    },
    [setVolume]
  )

  // ─── Current media info ───────────────────────────────────
  const effectiveSource = currentQueueItem?.source || source

  const currentTitle =
    currentQueueItem?.title ||
    audioTrack?.title ||
    spotifySavedItem?.title ||
    youtubeVideo?.title ||
    tiktokVideo?.title

  const currentSubtitle =
    currentQueueItem?.subtitle ||
    (audioTrack ? `${audioTrack.artist}${audioTrack.album ? ` • ${audioTrack.album}` : ''}` : null) ||
    spotifySavedItem?.subtitle ||
    youtubeVideo?.channelTitle ||
    tiktokVideo?.authorName

  const currentImage =
    currentQueueItem?.imageUrl ||
    audioTrack?.artworkUrl ||
    spotifySavedItem?.thumbnailUrl ||
    youtubeVideo?.thumbnailUrl ||
    tiktokVideo?.thumbnailUrl

  const sourceColor =
    effectiveSource === 'spotify'
      ? 'text-spotify-green'
      : effectiveSource === 'youtube'
      ? 'text-youtube-red'
      : effectiveSource === 'tiktok'
      ? 'text-tiktok-pink'
      : 'text-spotify-green'

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  if (!source && !currentQueueItem) return null

  return (
    <>
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioElementRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Main Persistent Universal Bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t px-4 py-3 select-none transition-all duration-500',
          isCrossfading
            ? 'border-purple-500/60 shadow-[0_-8px_30px_rgba(168,85,247,0.25)]'
            : 'border-white/10'
        )}
      >
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">

          {/* Left: Track Info & Platform Badge */}
          <div className="flex items-center gap-3 w-64 flex-shrink-0 min-w-0">
            <div className="relative flex-shrink-0">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={currentTitle || ''}
                  className={cn(
                    'w-12 h-12 rounded-xl object-cover shadow-md',
                    isPlaying && 'animate-spin-slow'
                  )}
                  style={isPlaying ? { borderRadius: '50%' } : {}}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Music2 size={20} className="text-white/30" />
                </div>
              )}

              {/* Source platform badge */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-lg',
                  sourceColor
                )}
                title={`Origem: ${effectiveSource?.toUpperCase()}`}
              >
                {effectiveSource === 'spotify' && <Music2 size={10} />}
                {effectiveSource === 'youtube' && <Youtube size={10} />}
                {effectiveSource === 'tiktok' && <TikTokIcon />}
                {effectiveSource === 'audio' && <Music2 size={10} />}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-sm font-bold truncate">
                  {currentTitle || 'Nenhuma faixa'}
                </p>
                {isResolving && (
                  <Loader2 size={12} className="text-spotify-green animate-spin flex-shrink-0" />
                )}
                {isCrossfading && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/30 to-emerald-500/30 border border-purple-400/50 text-[10px] font-black text-purple-200 animate-pulse flex-shrink-0 shadow-lg shadow-purple-500/30">
                    <Sparkles size={11} className="text-purple-300" />
                    <span>Mixando</span>
                  </span>
                )}
              </div>
              {currentSubtitle ? (
                <Link
                  to={`/search?q=${encodeURIComponent(currentSubtitle)}`}
                  className="text-white/50 hover:text-spotify-green hover:underline text-xs truncate transition-colors block"
                  title={`Ver outras músicas de ${currentSubtitle}`}
                >
                  {currentSubtitle}
                </Link>
              ) : null}

              {nextTrack && (
                <button
                  onClick={() => setShowQueueDrawer(true)}
                  className="flex items-center gap-1 mt-0.5 text-[11px] text-white/40 hover:text-purple-300 transition-colors truncate max-w-[280px] group text-left"
                  title={`Próxima: ${nextTrack.title} — ${nextTrack.subtitle} (Clique para ver a fila completa)`}
                >
                  <span className="font-bold text-purple-400 group-hover:underline flex items-center gap-0.5 flex-shrink-0">
                    <Sparkles size={10} /> A Seguir:
                  </span>
                  <span className="truncate">{nextTrack.title}</span>
                </button>
              )}
            </div>

            {onExpandPlayer && (
              <button
                onClick={onExpandPlayer}
                className="ml-auto p-1 text-white/30 hover:text-white transition-colors flex-shrink-0"
              >
                <ChevronUp size={16} />
              </button>
            )}
          </div>

          {/* Center: Universal Playback Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={cn(
                  'transition-colors p-1',
                  isShuffled ? 'text-spotify-green' : 'text-white/40 hover:text-white'
                )}
                title="Aleatório"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={handlePrevTrack}
                className="text-white/70 hover:text-white transition-colors p-1"
                title="Faixa Anterior"
              >
                <SkipBack size={22} className="fill-current" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={isResolving}
                className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 active:scale-95 flex items-center justify-center transition-all shadow-lg"
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isResolving ? (
                  <Loader2 size={18} className="text-black animate-spin" />
                ) : isPlaying ? (
                  <Pause size={18} className="text-black fill-black" />
                ) : (
                  <Play size={18} className="text-black fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                className="text-white/70 hover:text-white transition-colors p-1"
                title="Próxima Faixa (com Transição Mágica se ativa)"
              >
                <SkipForward size={22} className="fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={cn(
                  'transition-colors p-1',
                  repeatMode !== 'none' ? 'text-spotify-green' : 'text-white/40 hover:text-white'
                )}
                title={repeatMode === 'one' ? 'Repetir uma' : repeatMode === 'all' ? 'Repetir tudo' : 'Não repetir'}
              >
                <RepeatIcon size={18} />
              </button>

              <button
                onClick={togglePerfectTransition}
                className={cn(
                  'transition-all p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold',
                  perfectTransition
                    ? 'text-purple-300 bg-purple-500/20 border border-purple-500/40 shadow-sm shadow-purple-500/30 scale-105'
                    : 'text-white/30 hover:text-white hover:bg-white/5 border border-transparent'
                )}
                title={
                  perfectTransition
                    ? 'Transição Mágica ATIVADA: Mixagem mágica ultra-fluida, zero silêncio e sobreposição harmônica'
                    : 'Ativar Transição Mágica (Mixagem fluida contínua entre músicas)'
                }
              >
                <Sparkles size={16} className={cn(perfectTransition && 'animate-pulse text-purple-400')} />
              </button>
            </div>

            {/* Progress bar — Sempre visível incondicionalmente com tempo decorrido e total */}
            <div className="w-full max-w-md flex items-center gap-2">
              <span className="text-white/40 text-xs w-10 text-right font-mono">
                {formatSeconds(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={progress || 0}
                onChange={handleSeek}
                className="flex-1 h-1 accent-spotify-green cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #1db954 ${progress || 0}%, rgba(255,255,255,0.2) ${progress || 0}%)`,
                }}
              />
              <span className="text-white/40 text-xs w-10 font-mono">
                {formatSeconds(duration > 0 ? duration : (currentQueueItem?.durationMs ? Math.round(currentQueueItem.durationMs / 1000) : 0))}
              </span>
            </div>
          </div>

          {/* Right: Volume & Queue */}
          <div className="flex items-center gap-3 w-48 flex-shrink-0 justify-end">
            <button
              onClick={() => setShowQueueDrawer((v) => !v)}
              className={cn(
                'p-2 rounded-lg transition-all relative flex items-center justify-center',
                showQueueDrawer
                  ? 'bg-spotify-green/20 text-spotify-green border border-spotify-green/40 shadow-sm shadow-spotify-green/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
              title="Fila de Reprodução & A Seguir (Ver próximas músicas)"
            >
              <ListMusic size={19} />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 min-w-[15px] h-4 bg-spotify-green text-black font-black text-[9px] rounded-full flex items-center justify-center shadow">
                  {queue.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 sm:w-24 h-1 accent-white cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drawer de Fila de Reprodução & A Seguir */}
      <QueueDrawer
        isOpen={showQueueDrawer}
        onClose={() => setShowQueueDrawer(false)}
      />
    </>
  )
}
