// ============================================================
// YOUTUBE PLAYER — Wrapper do IFrame API sincronizado ao store
// ============================================================
// Player áudio-first: o vídeo roda num container discreto e
// todo o controle (play/pause/seek/volume/progresso) acontece
// pelo playerStore global.

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'

export function YouTubePlayer() {
  const { ready } = useYouTubeIframeApi()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const progressTimerRef = useRef<number | null>(null)

  // ID do vídeo a tocar: faixa atual quando source=youtube
  const queueVideoId = usePlayerStore((s) =>
    s.source === 'youtube'
      ? s.youtubeVideo?.videoId || s.queue[s.queueIndex]?.videoId || null
      : null
  )

  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const isMuted = usePlayerStore((s) => s.isMuted)

  function startProgressLoop(player: any) {
    stopProgressLoop()
    progressTimerRef.current = window.setInterval(() => {
      const store = usePlayerStore.getState()
      const current = player.getCurrentTime() || 0
      const duration = player.getDuration() || 0
      store.setCurrentTime(current)
      if (duration > 0) {
        store.setProgress((current / duration) * 100)
      }
    }, 500)
  }

  function stopProgressLoop() {
    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  function handleEnded() {
    const store = usePlayerStore.getState()
    if (store.repeatMode === 'one') {
      playerRef.current?.seekTo(0, true)
      playerRef.current?.playVideo()
    } else if (!store.nextInQueue()) {
      store.setIsPlaying(false)
    }
  }

  function onPlayerStateChange(e: any) {
    const store = usePlayerStore.getState()
    const YTState = window.YT?.PlayerState || {}

    if (e.data === YTState.PLAYING) {
      store.setDuration(e.target.getDuration())
      store.setIsPlaying(true)
      startProgressLoop(e.target)
    } else if (e.data === YTState.PAUSED) {
      store.setIsPlaying(false)
      stopProgressLoop()
    } else if (e.data === YTState.ENDED) {
      stopProgressLoop()
      handleEnded()
    }
  }

  // Cria o player quando a API fica pronta
  useEffect(() => {
    if (!ready || !containerRef.current || playerRef.current) return

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '180',
      width: '320',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (e: any) => {
          e.target.setVolume(usePlayerStore.getState().volume)
        },
        onStateChange: onPlayerStateChange,
      },
    })

    return () => {
      stopProgressLoop()
      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Carrega novo vídeo quando muda a faixa na fila
  useEffect(() => {
    const player = playerRef.current
    if (!player?.loadVideoById || !queueVideoId) return

    if (player.getVideoData?.().video_id !== queueVideoId) {
      player.loadVideoById(queueVideoId)
    }
  }, [queueVideoId])

  // Sincroniza play/pause
  useEffect(() => {
    const player = playerRef.current
    if (!player?.playVideo) return
    if (usePlayerStore.getState().source !== 'youtube') return

    if (isPlaying) {
      player.playVideo()
    } else {
      player.pauseVideo()
    }
  }, [isPlaying, queueVideoId])

  // Sincroniza volume
  useEffect(() => {
    const player = playerRef.current
    if (!player?.setVolume) return
    player.setVolume(isMuted ? 0 : volume)
  }, [volume, isMuted])

  // Seek via evento customizado (PlayerBar → aqui)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { seconds: number }
      playerRef.current?.seekTo(detail.seconds, true)
    }
    window.addEventListener('yt-player-seek', handler)
    return () => window.removeEventListener('yt-player-seek', handler)
  }, [])

  // Container discreto; o som continua tocando
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        bottom: '96px',
        right: '16px',
        width: '320px',
        height: '180px',
        zIndex: 30,
        opacity: 0.001,
        pointerEvents: 'none',
      }}
    >
      <div ref={containerRef} />
    </div>
  )
}
