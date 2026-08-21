// ============================================================
// PLAYER BAR — Barra de player persistente com HTML5 Audio Engine
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
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
} from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { formatSeconds } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { SpotifyIFramePlayer } from '@/components/spotify/SpotifyIFramePlayer'

// TikTok mini icon
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

interface PlayerBarProps {
  spotifyPlayer: {
    togglePlay: () => Promise<void>
    seek: (ms: number) => Promise<void>
    next: () => Promise<void>
    prev: () => Promise<void>
    setVolume: (v: number) => Promise<void>
    isReady: boolean
  } | null
  onExpandPlayer?: () => void
}

export function PlayerBar({ spotifyPlayer, onExpandPlayer }: PlayerBarProps) {
  const {
    source,
    isPlaying,
    audioTrack,
    spotifyTrack,
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
    setIsPlaying,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setProgress,
    setCurrentTime,
    setDuration,
    nextInQueue,
    prevInQueue,
  } = usePlayerStore()

  const [showEmbedDrawer, setShowEmbedDrawer] = useState(false)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // ─── HTML5 Audio Engine ───────────────────────────────────

  // Sincroniza áudio quando muda a faixa ou o estado isPlaying
  useEffect(() => {
    const audio = audioElementRef.current
    if (!audio) return

    if (source === 'audio' && audioTrack?.audioUrl) {
      if (audio.src !== audioTrack.audioUrl) {
        audio.src = audioTrack.audioUrl
        audio.load()
      }

      if (isPlaying) {
        audio.play().catch(() => {
          // autoplay policy
        })
      } else {
        audio.pause()
      }
    } else {
      audio.pause()
    }
  }, [source, audioTrack, isPlaying])

  // Volume
  useEffect(() => {
    const audio = audioElementRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Audio element event handlers
  const handleTimeUpdate = () => {
    const audio = audioElementRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  const handleLoadedMetadata = () => {
    const audio = audioElementRef.current
    if (!audio) return
    setDuration(audio.duration)
  }

  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      const audio = audioElementRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    } else {
      const next = nextInQueue()
      if (!next) {
        setIsPlaying(false)
      }
    }
  }

  // ─── Controls ─────────────────────────────────────────────

  const handlePlayPause = useCallback(async () => {
    if (source === 'spotify' && spotifyPlayer?.isReady) {
      await spotifyPlayer.togglePlay()
    } else {
      setIsPlaying(!isPlaying)
    }
  }, [source, spotifyPlayer, isPlaying, setIsPlaying])

  const handleNext = useCallback(async () => {
    if (source === 'spotify' && spotifyPlayer?.isReady) {
      await spotifyPlayer.next()
    } else {
      nextInQueue()
    }
  }, [source, spotifyPlayer, nextInQueue])

  const handlePrev = useCallback(async () => {
    if (source === 'spotify' && spotifyPlayer?.isReady) {
      await spotifyPlayer.prev()
    } else {
      prevInQueue()
    }
  }, [source, spotifyPlayer, prevInQueue])

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = Number(e.target.value)
      setProgress(pct)
      const newTime = (pct / 100) * duration
      setCurrentTime(newTime)

      if (source === 'audio' && audioElementRef.current) {
        audioElementRef.current.currentTime = newTime
      } else if (source === 'spotify' && spotifyPlayer?.isReady) {
        await spotifyPlayer.seek(newTime * 1000)
      }
    },
    [source, spotifyPlayer, duration, setProgress, setCurrentTime]
  )

  const handleVolumeChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      setVolume(v)
      if (source === 'spotify' && spotifyPlayer?.isReady) {
        await spotifyPlayer.setVolume(v)
      }
    },
    [source, spotifyPlayer, setVolume]
  )

  // ─── Current media info ───────────────────────────────────

  const currentTitle =
    source === 'audio'
      ? audioTrack?.title
      : source === 'spotify'
      ? (spotifySavedItem?.title || spotifyTrack?.name)
      : source === 'youtube'
      ? youtubeVideo?.title
      : tiktokVideo?.title

  const currentSubtitle =
    source === 'audio'
      ? `${audioTrack?.artist}${audioTrack?.album ? ` • ${audioTrack.album}` : ''}`
      : source === 'spotify'
      ? (spotifySavedItem?.subtitle || spotifyTrack?.artists.map((a) => a.name).join(', '))
      : source === 'youtube'
      ? youtubeVideo?.channelTitle
      : tiktokVideo?.authorName

  const currentImage =
    source === 'audio'
      ? audioTrack?.artworkUrl
      : source === 'spotify'
      ? (spotifySavedItem?.thumbnailUrl || spotifyTrack?.album.images[0]?.url)
      : source === 'youtube'
      ? youtubeVideo?.thumbnailUrl
      : tiktokVideo?.thumbnailUrl

  const sourceColor =
    source === 'spotify' || source === 'audio'
      ? 'text-spotify-green'
      : source === 'youtube'
      ? 'text-youtube-red'
      : 'text-tiktok-pink'

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  if (!source) return null

  return (
    <>
      {/* Hidden HTML5 Audio Element for Direct Playback */}
      <audio
        ref={audioElementRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Floating Spotify Embed Drawer (Sem Login) */}
      {source === 'spotify' && spotifySavedItem && (
        <div
          className={cn(
            'fixed bottom-24 right-6 z-40 w-96 rounded-2xl bg-[#121212] border border-white/10 shadow-2xl p-3 transition-all duration-300 transform',
            showEmbedDrawer ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
            <span className="text-xs font-bold text-spotify-green flex items-center gap-1.5">
              <Music2 size={14} /> Player Oficial Spotify
            </span>
            <button
              onClick={() => setShowEmbedDrawer(false)}
              className="text-white/40 hover:text-white text-xs"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <SpotifyIFramePlayer
            key={spotifySavedItem.spotifyId}
            spotifyUri={`spotify:${spotifySavedItem.type}:${spotifySavedItem.spotifyId}`}
            height={spotifySavedItem.type === 'track' ? 152 : 352}
          />
        </div>
      )}

      {/* Main Persistent Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-white/5 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">

          {/* Left: Track Info */}
          <div className="flex items-center gap-3 w-64 flex-shrink-0 min-w-0">
            <div className="relative flex-shrink-0">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={currentTitle || ''}
                  className={cn(
                    'w-12 h-12 rounded-md object-cover',
                    isPlaying && 'animate-spin-slow'
                  )}
                  style={isPlaying ? { borderRadius: '50%' } : {}}
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                  <Music2 size={20} className="text-white/30" />
                </div>
              )}
              {/* Source badge */}
              <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center', sourceColor)}>
                {(source === 'spotify' || source === 'audio') && <Music2 size={10} />}
                {source === 'youtube' && <Youtube size={10} />}
                {source === 'tiktok' && <TikTokIcon />}
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentTitle || 'Nenhuma faixa'}</p>
              <p className="text-white/50 text-xs truncate">{currentSubtitle || ''}</p>
            </div>

            {source === 'spotify' && spotifySavedItem && (
              <button
                onClick={() => setShowEmbedDrawer((v) => !v)}
                className="p-1.5 text-spotify-green hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Abrir Player Embutido"
              >
                {showEmbedDrawer ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            )}

            {onExpandPlayer && (
              <button
                onClick={onExpandPlayer}
                className="ml-auto p-1 text-white/30 hover:text-white transition-colors flex-shrink-0"
              >
                <ChevronUp size={16} />
              </button>
            )}
          </div>

          {/* Center: Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={cn('transition-colors', isShuffled ? 'text-spotify-green' : 'text-white/40 hover:text-white')}
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={handlePrev}
                className="text-white/70 hover:text-white transition-colors"
              >
                <SkipBack size={22} className="fill-current" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying ? (
                  <Pause size={18} className="text-black fill-black" />
                ) : (
                  <Play size={18} className="text-black fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="text-white/70 hover:text-white transition-colors"
              >
                <SkipForward size={22} className="fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={cn(
                  'transition-colors',
                  repeatMode !== 'none' ? 'text-spotify-green' : 'text-white/40 hover:text-white'
                )}
              >
                <RepeatIcon size={18} />
              </button>
            </div>

            {/* Progress bar (Direct Audio & Spotify) */}
            {duration > 0 && (
              <div className="w-full max-w-md flex items-center gap-2">
                <span className="text-white/40 text-xs w-10 text-right">{formatSeconds(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1 accent-white cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                  }}
                />
                <span className="text-white/40 text-xs w-10">{formatSeconds(duration)}</span>
              </div>
            )}
          </div>

          {/* Right: Volume & Links */}
          <div className="flex items-center gap-2 w-40 flex-shrink-0 justify-end">
            {(audioTrack?.externalUrl || spotifySavedItem?.url) && (
              <a
                href={audioTrack?.externalUrl || spotifySavedItem?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white p-1"
                title="Abrir no Spotify"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 accent-white cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
