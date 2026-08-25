// ============================================================
// YOUTUBE PLAYER — MOTOR DUAL-DECK TRANSIÇÃO MÁGICA ULTRA-FLUIDA
// 60 FPS Mixagem Equal-Power Suave para Fim de Música e Botões Next / Prev
// ============================================================

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'
import type { QueueItem } from '@/types'

export function YouTubePlayer() {
  const { ready } = useYouTubeIframeApi()

  const containerARef = useRef<HTMLDivElement | null>(null)
  const containerBRef = useRef<HTMLDivElement | null>(null)

  const playerARef = useRef<any>(null)
  const playerBRef = useRef<any>(null)

  const activeDeckRef = useRef<'A' | 'B'>('A')
  const isCrossfadingRef = useRef<boolean>(false)
  const hasTriggeredTransitionRef = useRef<boolean>(false)
  const crossfadeTimerRef = useRef<any>(null)
  const progressTimerRef = useRef<any>(null)
  const lastLoadedIdRef = useRef<string | null>(null)

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

  // ─── Loop de Monitoramento de Progresso de Alta Taxa (100ms) ───
  function startProgressLoop() {
    stopProgressLoop()
    progressTimerRef.current = window.setInterval(() => {
      const active = getActivePlayer()
      if (!active?.getCurrentTime) return

      const store = usePlayerStore.getState()
      try {
        const current = active.getCurrentTime() || 0
        const duration = active.getDuration() || 0

        if (duration > 0) {
          store.setCurrentTime(current)
          store.setDuration(duration)
          store.setProgress((current / duration) * 100)

          // ─── Disparo Automático no Fim da Música ───
          if (
            store.perfectTransition &&
            duration > 10 &&
            !isCrossfadingRef.current &&
            !hasTriggeredTransitionRef.current
          ) {
            const remaining = duration - current

            // Pré-busca da faixa a 18s do fim
            if (remaining <= 18 && remaining > 12) {
              store.preResolveNextTrack()
            }

            // Inicia crossfade ultra-fluido nos últimos 4.8s
            if (remaining <= 4.8 && remaining > 0.4) {
              hasTriggeredTransitionRef.current = true
              const nextTrack = store.getNextTrack()
              const nextIndex = store.getNextTrackIndex()
              if (nextTrack && nextIndex !== null) {
                performDJCrossfade(nextTrack, nextIndex, 4500)
              }
            }
          }
        }
      } catch {}
    }, 100)
  }

  // ─── Execução do Crossfade Dual-Deck a 60 FPS (25ms por passo) ───
  async function performDJCrossfade(
    targetTrack: QueueItem,
    targetIndex: number,
    durationMs = 4500
  ) {
    if (isCrossfadingRef.current) return

    const store = usePlayerStore.getState()

    // 1. Garante que a faixa alvo possui videoId do YouTube
    let playableTrack = { ...targetTrack }
    if (!playableTrack.videoId) {
      try {
        const { resolvePlayable } = await import('@/api/crossPlatformService')
        const resolved = await resolvePlayable(playableTrack)
        if (resolved?.videoId) {
          playableTrack.videoId = resolved.videoId
          const updatedQ = [...store.queue]
          updatedQ[targetIndex] = playableTrack
          store.setQueue(updatedQ, store.queueIndex)
        } else {
          await store.playQueueIndex(targetIndex)
          return
        }
      } catch {
        await store.playQueueIndex(targetIndex)
        return
      }
    }

    const activePlayer = getActivePlayer()
    const standbyPlayer = getStandbyPlayer()

    if (!standbyPlayer?.loadVideoById || !playableTrack.videoId) {
      await store.playQueueIndex(targetIndex)
      return
    }

    // Inicia status de crossfade
    isCrossfadingRef.current = true
    store.setIsCrossfading(true)

    const masterVol = store.isMuted ? 0 : Math.max(1, store.volume ?? 50)
    const outgoingDeck = activeDeckRef.current
    const incomingDeck = outgoingDeck === 'A' ? 'B' : 'A'

    // Carrega e dá play na faixa de entrada a volume 0 imediatamente
    try {
      standbyPlayer.setVolume(0)
      standbyPlayer.loadVideoById(playableTrack.videoId)
      standbyPlayer.playVideo()
    } catch {}

    // 60 FPS: Intervalo de 25ms por passo para ultra-fluidez
    const stepInterval = 25
    const totalSteps = Math.max(20, Math.round(durationMs / stepInterval))
    let currentStep = 0

    if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current)

    crossfadeTimerRef.current = window.setInterval(() => {
      currentStep++
      const t = Math.min(1, currentStep / totalSteps)

      // Curva Harmônica Suave Equal-Power (cos / sin com suavização Hermite)
      const smoothT = t * t * (3 - 2 * t)
      const outVolume = Math.round(masterVol * Math.cos((smoothT * Math.PI) / 2))
      const inVolume = Math.round(masterVol * Math.sin((smoothT * Math.PI) / 2))

      try {
        activePlayer?.setVolume(Math.max(0, Math.min(100, outVolume)))
        standbyPlayer?.setVolume(Math.max(0, Math.min(100, inVolume)))
      } catch {}

      if (currentStep >= totalSteps) {
        // Conclui a transição
        clearInterval(crossfadeTimerRef.current)
        crossfadeTimerRef.current = null

        try {
          activePlayer?.pauseVideo()
          activePlayer?.setVolume(0)
          standbyPlayer?.setVolume(masterVol)
        } catch {}

        // Inverte o deck ativo
        activeDeckRef.current = incomingDeck
        isCrossfadingRef.current = false
        hasTriggeredTransitionRef.current = false
        lastLoadedIdRef.current = playableTrack.videoId!

        // Atualiza o estado global sem reiniciar
        usePlayerStore.setState({
          queueIndex: targetIndex,
          currentQueueItem: playableTrack,
          youtubeVideo: {
            id: playableTrack.id,
            videoId: playableTrack.videoId!,
            title: playableTrack.title,
            channelTitle: playableTrack.subtitle,
            thumbnailUrl: playableTrack.imageUrl,
            url: `https://www.youtube.com/watch?v=${playableTrack.videoId}`,
            addedAt: new Date().toISOString(),
          },
          isPlaying: true,
          isCrossfading: false,
        })

        startProgressLoop()
      }
    }, stepInterval)
  }

  // ─── Inicialização dos dois Players do YouTube ───────────────────
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
              hasTriggeredTransitionRef.current = false
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
              if (!isCrossfadingRef.current && !hasTriggeredTransitionRef.current) {
                stopProgressLoop()
                usePlayerStore.getState().playNext()
              }
            }
          },
          onError: () => {
            if (activeDeckRef.current === 'A' && !isCrossfadingRef.current) {
              usePlayerStore.getState().playNext()
            }
          },
        },
      })
    }

    // Player B (Deck Standby)
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
              if (!isCrossfadingRef.current && !hasTriggeredTransitionRef.current) {
                stopProgressLoop()
                usePlayerStore.getState().playNext()
              }
            }
          },
          onError: () => {
            if (activeDeckRef.current === 'B' && !isCrossfadingRef.current) {
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

  // ─── Carrega novo vídeo quando o usuário seleciona manualmente ──
  useEffect(() => {
    if (!queueVideoId) return
    if (lastLoadedIdRef.current === queueVideoId) return

    stopCrossfade()
    lastLoadedIdRef.current = queueVideoId
    hasTriggeredTransitionRef.current = false

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

  // ─── Transição Mágica Disparada Manualmente pelos Botões ─────────
  useEffect(() => {
    const handleManualNext = () => {
      const store = usePlayerStore.getState()
      const nextTrack = store.getNextTrack()
      const nextIndex = store.getNextTrackIndex()
      if (nextTrack && nextIndex !== null) {
        performDJCrossfade(nextTrack, nextIndex, 1800)
      } else {
        store.playNext()
      }
    }

    const handleManualPrev = () => {
      const store = usePlayerStore.getState()
      const prevTrack = store.getPrevTrack()
      const prevIndex = store.getPrevTrackIndex()
      if (prevTrack && prevIndex !== null) {
        performDJCrossfade(prevTrack, prevIndex, 1800)
      } else {
        store.playPrev()
      }
    }

    window.addEventListener('yt-player-crossfade-next', handleManualNext)
    window.addEventListener('yt-player-crossfade-prev', handleManualPrev)

    return () => {
      window.removeEventListener('yt-player-crossfade-next', handleManualNext)
      window.removeEventListener('yt-player-crossfade-prev', handleManualPrev)
    }
  }, [])

  // ─── Sincronização Play / Pause ───────────────────────────────────
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

  // ─── Sincronização de Volume ─────────────────────────────────────
  useEffect(() => {
    if (isCrossfadingRef.current) return
    const active = getActivePlayer()
    if (!active?.setVolume) return
    try {
      active.setVolume(isMuted ? 0 : (volume ?? 50))
    } catch {}
  }, [volume, isMuted])

  // ─── Seek de Progresso ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { seconds: number }
      const active = getActivePlayer()
      try {
        hasTriggeredTransitionRef.current = false
        active?.seekTo(detail.seconds, true)
      } catch {}
    }
    window.addEventListener('yt-player-seek', handler)
    return () => window.removeEventListener('yt-player-seek', handler)
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
