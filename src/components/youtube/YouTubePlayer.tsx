// ============================================================
// YOUTUBE PLAYER — Wrapper do IFrame API sincronizado ao store
// Motor de áudio em segundo plano com suporte contínuo a filas
// e transição sem interrupção de reprodução contínua
// ============================================================

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'

export function YouTubePlayer() {
  const { ready } = useYouTubeIframeApi()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const progressTimerRef = useRef<number | null>(null)
  const isTransitioningRef = useRef<boolean>(false)

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
      try {
        const current = player.getCurrentTime() || 0
        const duration = player.getDuration() || 0
        store.setCurrentTime(current)
        if (duration > 0) {
          store.setProgress((current / duration) * 100)
        }
      } catch {}
    }, 500)
  }

  function stopProgressLoop() {
    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  async function handleEnded() {
    const store = usePlayerStore.getState()
    if (store.repeatMode === 'one') {
      try {
        playerRef.current?.seekTo(0, true)
        playerRef.current?.playVideo()
      } catch {}
    } else {
      await store.playNext()
    }
  }

  function onPlayerStateChange(e: any) {
    const store = usePlayerStore.getState()
    const YTState = window.YT?.PlayerState || {}

    if (e.data === YTState.PLAYING) {
      isTransitioningRef.current = false
      try {
        store.setDuration(e.target.getDuration())
      } catch {}
      store.setIsPlaying(true)
      startProgressLoop(e.target)
    } else if (e.data === YTState.PAUSED) {
      // Ignora evento transitório de pause disparado durante carregamento de nova faixa
      if (!isTransitioningRef.current) {
        store.setIsPlaying(false)
        stopProgressLoop()
      }
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
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (e: any) => {
          const store = usePlayerStore.getState()
          try {
            e.target.setVolume(store.isMuted ? 0 : store.volume)
            const currentVid =
              store.source === 'youtube'
                ? store.youtubeVideo?.videoId || store.queue[store.queueIndex]?.videoId || null
                : null
            if (currentVid) {
              if (store.isPlaying) {
                isTransitioningRef.current = true
                e.target.loadVideoById(currentVid)
                try { e.target.playVideo() } catch {}
              } else {
                e.target.cueVideoById(currentVid)
              }
            }
          } catch {}
        },
        onStateChange: onPlayerStateChange,
        onError: (e: any) => {
          console.warn('YouTube error code:', e.data, '- Skipping unavailable video')
          usePlayerStore.getState().playNext()
        },
      },
    })

    return () => {
      stopProgressLoop()
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy()
        } catch {}
        playerRef.current = null
      }
    }
  }, [ready])

  // Carrega novo vídeo quando muda a faixa na fila
  useEffect(() => {
    const player = playerRef.current
    if (!player?.loadVideoById || !queueVideoId) return

    try {
      const currentId = player.getVideoData?.()?.video_id
      if (currentId !== queueVideoId) {
        isTransitioningRef.current = true
        if (isPlaying) {
          player.loadVideoById(queueVideoId)
          try { player.playVideo() } catch {}
        } else {
          player.cueVideoById(queueVideoId)
        }
        setTimeout(() => {
          isTransitioningRef.current = false
        }, 2000)
      }
    } catch {}
  }, [queueVideoId, isPlaying])

  // Sincroniza play/pause
  useEffect(() => {
    const player = playerRef.current
    if (!player?.playVideo) return
    if (usePlayerStore.getState().source !== 'youtube') return

    try {
      if (isPlaying) {
        player.playVideo()
      } else {
        player.pauseVideo()
      }
    } catch {}
  }, [isPlaying, queueVideoId])

  // Sincroniza volume
  useEffect(() => {
    const player = playerRef.current
    if (!player?.setVolume) return
    try {
      player.setVolume(isMuted ? 0 : volume)
    } catch {}
  }, [volume, isMuted])

  // Seek via evento customizado (PlayerBar → aqui)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { seconds: number }
      try {
        playerRef.current?.seekTo(detail.seconds, true)
      } catch {}
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
