// ============================================================
// YOUTUBE PLAYER — MOTOR REVOLUCIONÁRIO DUAL-DECK TRANSIÇÃO MÁGICA
// Pré-carregamento em memória (Pre-cuer) 20s antes do término
// Interpolação Harmônica S-Curve a 30ms (Mais de 180 micro-passos)
// Mixagem de DJ contínua, zero silêncio e sobreposição mágica de áudio
// ============================================================

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'

export function YouTubePlayer() {
  const { ready } = useYouTubeIframeApi()

  // Dois containers para os dois players simultâneos (Deck A e Deck B)
  const containerARef = useRef<HTMLDivElement | null>(null)
  const containerBRef = useRef<HTMLDivElement | null>(null)

  const playerARef = useRef<any>(null)
  const playerBRef = useRef<any>(null)

  // Deck ativo ('A' ou 'B')
  const activeDeckRef = useRef<'A' | 'B'>('A')
  const isCrossfadingRef = useRef<boolean>(false)
  const crossfadeTimerRef = useRef<any>(null)
  const progressTimerRef = useRef<any>(null)
  const lastLoadedIdRef = useRef<string | null>(null)
  const hasPreCuedRef = useRef<boolean>(false)

  const queueVideoId = usePlayerStore((s) =>
    s.source === 'youtube'
      ? s.youtubeVideo?.videoId || s.queue[s.queueIndex]?.videoId || null
      : null
  )

  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const isMuted = usePlayerStore((s) => s.isMuted)

  function getActivePlayer() {
    return activeDeckRef.current === 'A' ? playerARef.current : playerBRef.current
  }

  function getStandbyPlayer() {
    return activeDeckRef.current === 'A' ? playerBRef.current : playerARef.current
  }

  function stopProgressLoop() {
    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  function stopCrossfade() {
    if (crossfadeTimerRef.current !== null) {
      clearInterval(crossfadeTimerRef.current)
      crossfadeTimerRef.current = null
    }
    isCrossfadingRef.current = false
    usePlayerStore.getState().setIsCrossfading(false)
  }

  // ─── Loop de Progresso de Alta Fidelidade (100ms) ───────────
  function startProgressLoop() {
    stopProgressLoop()
    progressTimerRef.current = window.setInterval(() => {
      const active = getActivePlayer()
      if (!active?.getCurrentTime) return

      const store = usePlayerStore.getState()
      try {
        const current = active.getCurrentTime() || 0
        const duration = active.getDuration() || 0
        store.setCurrentTime(current)
        if (duration > 0) {
          store.setDuration(duration)
          store.setProgress((current / duration) * 100)
        }

        // ─── Transição Mágica Ultra-Fluida ───
        if (store.perfectTransition && duration > 12 && !isCrossfadingRef.current) {
          const remaining = duration - current

          // 1. Pré-busca da próxima faixa 20 segundos antes do fim
          if (remaining <= 20 && remaining > 15) {
            store.preResolveNextTrack()
          }

          // 2. Pré-engatilha (Pre-cue) o deck secundário no buffer 12s antes
          if (remaining <= 12 && remaining > 7 && !hasPreCuedRef.current) {
            hasPreCuedRef.current = true
            const standby = getStandbyPlayer()
            const { queue, queueIndex, isShuffled } = store
            const nextIdx = isShuffled ? Math.floor(Math.random() * queue.length) : (queueIndex + 1) % queue.length
            const nextItem = queue[nextIdx]
            if (nextItem?.videoId && standby?.cueVideoById) {
              try {
                standby.cueVideoById(nextItem.videoId)
                standby.setVolume(0)
              } catch {}
            }
          }

          // 3. Dispara a mixagem mágica contínua nos últimos 5.5 segundos
          if (remaining <= 5.5 && remaining > 0.3) {
            triggerSeamlessDJCrossfade(5200)
          }
        }
      } catch {}
    }, 100)
  }

  // ─── Executa a Transição Mágica DJ com Curva Harmônica S-Curve ────
  async function triggerSeamlessDJCrossfade(durationMs = 5200) {
    if (isCrossfadingRef.current) return

    const store = usePlayerStore.getState()
    const { queue, queueIndex, isShuffled, repeatMode, playQueueIndex } = store

    if (queue.length === 0) return

    if (repeatMode === 'one') {
      await playQueueIndex(queueIndex)
      return
    }

    // Próxima faixa
    let nextIndex: number
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = queueIndex + 1
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0
        else return
      }
    }

    let nextTrack = queue[nextIndex]
    if (!nextTrack) return

    // Se ainda não tiver videoId, tenta resolver na hora
    if (!nextTrack.videoId) {
      try {
        const { resolvePlayable } = await import('@/api/crossPlatformService')
        const resolved = await resolvePlayable(nextTrack)
        if (resolved?.videoId) {
          nextTrack = { ...nextTrack, videoId: resolved.videoId }
          const updatedQ = [...queue]
          updatedQ[nextIndex] = nextTrack
          store.setQueue(updatedQ, queueIndex)
        } else {
          await store.playNext()
          return
        }
      } catch {
        await store.playNext()
        return
      }
    }

    const activePlayer = getActivePlayer()
    const standbyPlayer = getStandbyPlayer()

    if (!standbyPlayer?.loadVideoById || !nextTrack.videoId) {
      await store.playNext()
      return
    }

    // Inicia a Transição Mágica
    isCrossfadingRef.current = true
    hasPreCuedRef.current = false
    store.setIsCrossfading(true)

    const baseVol = store.isMuted ? 0 : (store.volume ?? 50)
    const outgoingDeck = activeDeckRef.current
    const incomingDeck = outgoingDeck === 'A' ? 'B' : 'A'

    // Carrega a nova faixa no Deck em espera com volume ZERO e dá play imediato
    try {
      standbyPlayer.setVolume(0)
      standbyPlayer.loadVideoById(nextTrack.videoId)
      standbyPlayer.playVideo()
    } catch {}

    // Micro-interpolação S-Curve a cada 30ms (~175 passos ultrafinos)
    const stepInterval = 30
    const totalSteps = Math.max(20, Math.round(durationMs / stepInterval))
    let currentStep = 0

    if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current)

    crossfadeTimerRef.current = window.setInterval(() => {
      currentStep++
      const progressRatio = Math.min(1, currentStep / totalSteps)

      // Curva Harmônica S-Curve (Aumenta presença inicial da nova faixa enquanto a anterior suaviza)
      const outVol = Math.round(baseVol * Math.pow(Math.cos((progressRatio * Math.PI) / 2), 1.15))
      const inVol = Math.round(baseVol * Math.pow(Math.sin((progressRatio * Math.PI) / 2), 0.85))

      try {
        activePlayer?.setVolume(outVol)
        standbyPlayer?.setVolume(inVol)
      } catch {}

      if (currentStep >= totalSteps) {
        // Finaliza a Transição Mágica
        clearInterval(crossfadeTimerRef.current)
        crossfadeTimerRef.current = null

        try {
          activePlayer?.pauseVideo()
          activePlayer?.setVolume(0)
          standbyPlayer?.setVolume(baseVol)
        } catch {}

        // Alterna o deck principal
        activeDeckRef.current = incomingDeck
        isCrossfadingRef.current = false
        lastLoadedIdRef.current = nextTrack.videoId!

        usePlayerStore.setState({
          queueIndex: nextIndex,
          currentQueueItem: nextTrack,
          youtubeVideo: {
            id: nextTrack.id,
            videoId: nextTrack.videoId!,
            title: nextTrack.title,
            channelTitle: nextTrack.subtitle,
            thumbnailUrl: nextTrack.imageUrl,
            url: `https://www.youtube.com/watch?v=${nextTrack.videoId}`,
            addedAt: new Date().toISOString(),
          },
          isPlaying: true,
          isCrossfading: false,
        })

        startProgressLoop()
      }
    }, stepInterval)
  }

  // ─── Inicialização dos Players A e B ──────────────────────────
  useEffect(() => {
    if (!ready || !containerARef.current || !containerBRef.current) return

    const store = usePlayerStore.getState()
    const initialVol = store.isMuted ? 0 : (store.volume ?? 50)

    // Player A
    if (!playerARef.current) {
      playerARef.current = new window.YT.Player(containerARef.current, {
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
            try { e.target.setVolume(initialVol) } catch {}
            if (activeDeckRef.current === 'A' && queueVideoId) {
              lastLoadedIdRef.current = queueVideoId
              if (usePlayerStore.getState().isPlaying) {
                e.target.loadVideoById(queueVideoId)
              } else {
                e.target.cueVideoById(queueVideoId)
              }
            }
          },
          onStateChange: (e: any) => {
            const YTState = window.YT?.PlayerState || {}
            if (activeDeckRef.current === 'A' && e.data === YTState.PLAYING) {
              try {
                const dur = e.target.getDuration()
                if (dur > 0) usePlayerStore.getState().setDuration(dur)
              } catch {}
              usePlayerStore.getState().setIsPlaying(true)
              startProgressLoop()
            } else if (activeDeckRef.current === 'A' && e.data === YTState.ENDED) {
              if (!isCrossfadingRef.current) {
                stopProgressLoop()
                usePlayerStore.getState().playNext()
              }
            }
          },
          onError: () => {
            if (activeDeckRef.current === 'A') {
              usePlayerStore.getState().playNext()
            }
          },
        },
      })
    }

    // Player B (Deck de Espera e Mixagem)
    if (!playerBRef.current) {
      playerBRef.current = new window.YT.Player(containerBRef.current, {
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
            try { e.target.setVolume(0) } catch {}
          },
          onStateChange: (e: any) => {
            const YTState = window.YT?.PlayerState || {}
            if (activeDeckRef.current === 'B' && e.data === YTState.PLAYING) {
              try {
                const dur = e.target.getDuration()
                if (dur > 0) usePlayerStore.getState().setDuration(dur)
              } catch {}
              usePlayerStore.getState().setIsPlaying(true)
              startProgressLoop()
            } else if (activeDeckRef.current === 'B' && e.data === YTState.ENDED) {
              if (!isCrossfadingRef.current) {
                stopProgressLoop()
                usePlayerStore.getState().playNext()
              }
            }
          },
          onError: () => {
            if (activeDeckRef.current === 'B') {
              usePlayerStore.getState().playNext()
            }
          },
        },
      })
    }

    return () => {
      stopProgressLoop()
      stopCrossfade()
      try { playerARef.current?.destroy() } catch {}
      try { playerBRef.current?.destroy() } catch {}
      playerARef.current = null
      playerBRef.current = null
    }
  }, [ready])

  // ─── Carrega novo vídeo quando o usuário troca manualmente ───
  useEffect(() => {
    if (!queueVideoId) return
    if (isCrossfadingRef.current) return
    if (lastLoadedIdRef.current === queueVideoId) return

    lastLoadedIdRef.current = queueVideoId
    hasPreCuedRef.current = false
    const active = getActivePlayer()
    const standby = getStandbyPlayer()

    if (active?.loadVideoById) {
      try {
        standby?.pauseVideo()
        standby?.setVolume(0)

        const baseVol = usePlayerStore.getState().isMuted ? 0 : (usePlayerStore.getState().volume ?? 50)
        active.setVolume(baseVol)

        if (isPlaying) {
          active.loadVideoById(queueVideoId)
          active.playVideo()
        } else {
          active.cueVideoById(queueVideoId)
        }
        startProgressLoop()
      } catch {}
    }
  }, [queueVideoId, isPlaying])

  // ─── Sincroniza Play / Pause ─────────────────────────────────
  useEffect(() => {
    if (usePlayerStore.getState().source !== 'youtube') return
    const active = getActivePlayer()
    if (!active?.playVideo) return

    try {
      if (isPlaying) {
        active.playVideo()
        startProgressLoop()
      } else {
        active.pauseVideo()
        stopProgressLoop()
      }
    } catch {}
  }, [isPlaying])

  // ─── Sincroniza Volume ───────────────────────────────────────
  useEffect(() => {
    if (isCrossfadingRef.current) return
    const active = getActivePlayer()
    if (!active?.setVolume) return
    try {
      active.setVolume(isMuted ? 0 : (volume ?? 50))
    } catch {}
  }, [volume, isMuted])

  // ─── Seek via evento customizado ────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { seconds: number }
      const active = getActivePlayer()
      try {
        active?.seekTo(detail.seconds, true)
      } catch {}
    }
    window.addEventListener('yt-player-seek', handler)
    return () => window.removeEventListener('yt-player-seek', handler)
  }, [])

  // ─── Pular faixa suave com Transição Mágica acionada manualmente ──
  useEffect(() => {
    const handler = () => {
      if (usePlayerStore.getState().perfectTransition && !isCrossfadingRef.current) {
        triggerSeamlessDJCrossfade(1600)
      } else {
        usePlayerStore.getState().playNext()
      }
    }
    window.addEventListener('yt-player-smooth-next', handler)
    return () => window.removeEventListener('yt-player-smooth-next', handler)
  }, [])

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
      <div ref={containerARef} />
      <div ref={containerBRef} />
    </div>
  )
}
