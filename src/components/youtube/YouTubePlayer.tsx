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
  const fadeInTimerRef = useRef<number | null>(null)
  const isTransitioningRef = useRef<boolean>(false)
  const hasTriggeredSeamlessNextRef = useRef<boolean>(false)

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

        // ─── Transição Perfeita (Crossfade suave + Zero silêncio) ───
        if (store.perfectTransition && duration > 10) {
          const remaining = duration - current

          // 1. Pré-busca / pré-resolução da próxima faixa 15 segundos antes do fim
          if (remaining <= 15 && remaining > 13) {
            store.preResolveNextTrack()
          }

          // 2. Crossfade Fade-Out nos últimos 3.5 segundos da música
          if (remaining <= 3.5 && remaining > 0.8 && !hasTriggeredSeamlessNextRef.current) {
            const baseVol = store.isMuted ? 0 : (store.volume ?? 50)
            const fadeFactor = Math.max(0.08, (remaining - 0.8) / 2.7)
            const currentFadeVol = Math.round(baseVol * fadeFactor)
            try {
              player.setVolume(currentFadeVol)
            } catch {}
          }

          // 3. Dispara a próxima música nos últimos 0.8s para cortar o silêncio final
          if (remaining <= 0.8 && !hasTriggeredSeamlessNextRef.current && !isTransitioningRef.current) {
            hasTriggeredSeamlessNextRef.current = true
            stopProgressLoop()
            handleEnded()
          }
        }
      } catch {}
    }, 400)
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
      hasTriggeredSeamlessNextRef.current = false
      const targetVol = store.isMuted ? 0 : (store.volume ?? 50)

      if (store.perfectTransition) {
        // Fade-in suave do início da música
        let step = 0
        if (fadeInTimerRef.current) clearInterval(fadeInTimerRef.current)
        fadeInTimerRef.current = window.setInterval(() => {
          step++
          const volRatio = Math.min(1, 0.2 + (step / 6) * 0.8)
          try {
            e.target.setVolume(Math.round(targetVol * volRatio))
          } catch {}
          if (step >= 6) {
            if (fadeInTimerRef.current) clearInterval(fadeInTimerRef.current)
          }
        }, 150)
      } else {
        try {
          e.target.setVolume(targetVol)
        } catch {}
      }

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
          try {
            player.setVolume(usePlayerStore.getState().isMuted ? 0 : (usePlayerStore.getState().volume ?? 50))
            player.playVideo()
          } catch {}
        } else {
          player.cueVideoById(queueVideoId)
          try {
            player.setVolume(usePlayerStore.getState().isMuted ? 0 : (usePlayerStore.getState().volume ?? 50))
          } catch {}
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
