// ============================================================
// YOUTUBE PLAYER — MOTOR INTERESTELAR DUAL-DECK TRANSIÇÃO MÁGICA
// Pré-Giro de Hardware a Volume Zero (Early Spin-up a 10s)
// Síntese Harmônica Web Audio (Filtros Espaciais + Riser Sub-Harmônico)
// Envelope Tri-Fásico de Pressão Sonora Psicoacústica de Alta Fidelidade
// ============================================================

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'
import { djAudioFX } from '@/api/djAudioFxService'

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
  const hasPreSpunRef = useRef<boolean>(false)

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

  // ─── Loop de Progresso de Alta Precisão (100ms) ─────────────
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

        // ─── Transição Mágica de Outro Mundo ───
        if (store.perfectTransition && duration > 14 && !isCrossfadingRef.current) {
          const remaining = duration - current

          // 1. Pré-resolução em nuvem 22 segundos antes do fim
          if (remaining <= 22 && remaining > 16) {
            store.preResolveNextTrack()
          }

          // 2. Pré-Giro de Hardware (Early Spin-up) a 10s: Começa a decodificar o vídeo com volume 0
          if (remaining <= 10.0 && remaining > 6.5 && !hasPreSpunRef.current) {
            hasPreSpunRef.current = true
            const standby = getStandbyPlayer()
            const nextItem = store.getNextTrack()
            if (nextItem?.videoId && standby?.loadVideoById) {
              try {
                standby.setVolume(0)
                standby.loadVideoById(nextItem.videoId)
                standby.playVideo()
              } catch {}
            }
          }

          // 3. Dispara a Transição Mágica Harmônica nos últimos 6.0 segundos
          if (remaining <= 6.0 && remaining > 0.3) {
            triggerSeamlessDJCrossfade(6000)
          }
        }
      } catch {}
    }, 100)
  }

  // ─── Executa a Transição Mágica Harmônica Tri-Fásica ─────────
  async function triggerSeamlessDJCrossfade(durationMs = 6000) {
    if (isCrossfadingRef.current) return

    const store = usePlayerStore.getState()
    const { queue, queueIndex, repeatMode, playQueueIndex, getNextTrackIndex, getNextTrack } = store

    if (queue.length === 0) return

    if (repeatMode === 'one') {
      await playQueueIndex(queueIndex)
      return
    }

    // Próxima faixa determinística
    const nextIndex = getNextTrackIndex()
    if (nextIndex === null) return

    let nextTrack = getNextTrack()
    if (!nextTrack) return

    // Se ainda não tiver videoId, resolve na hora
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

    // Inicia a Transição Mágica de Outro Mundo
    isCrossfadingRef.current = true
    hasPreSpunRef.current = false
    store.setIsCrossfading(true)

    // Dispara a síntese harmônica de transição interestelar (Sweep & Sub Riser)
    djAudioFX.playMagicTransitionSweep(durationMs / 1000)

    const baseVol = store.isMuted ? 0 : (store.volume ?? 50)
    const outgoingDeck = activeDeckRef.current
    const incomingDeck = outgoingDeck === 'A' ? 'B' : 'A'

    // Garante que o Deck de entrada está rodando
    try {
      standbyPlayer.setVolume(0)
      standbyPlayer.playVideo()
    } catch {}

    // Envelope Tri-Fásico de Alta Fidelidade (40ms por passo)
    const stepInterval = 40
    const totalSteps = Math.max(25, Math.round(durationMs / stepInterval))
    let currentStep = 0

    if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current)

    crossfadeTimerRef.current = window.setInterval(() => {
      currentStep++
      const progressRatio = Math.min(1, currentStep / totalSteps)

      // Envelope Tri-Fásico Psicoacústico:
      // Fase 1 (0-35%): Faixa A mantém corpo (100% -> 80%), Faixa B entra com brilho (0% -> 45%)
      // Fase 2 (35-75%): Faixa B assume liderança (45% -> 90%), Faixa A desce gradualmente (80% -> 25%)
      // Fase 3 (75-100%): Faixa B estabiliza em 100%, Faixa A evapora para 0%
      let outRatio = 0
      let inRatio = 0

      if (progressRatio <= 0.35) {
        const subP = progressRatio / 0.35
        outRatio = 1.0 - subP * 0.2
        inRatio = Math.pow(subP, 1.2) * 0.45
      } else if (progressRatio <= 0.75) {
        const subP = (progressRatio - 0.35) / 0.4
        outRatio = 0.8 - Math.pow(subP, 0.9) * 0.55
        inRatio = 0.45 + Math.pow(subP, 0.8) * 0.45
      } else {
        const subP = (progressRatio - 0.75) / 0.25
        outRatio = 0.25 * (1.0 - subP)
        inRatio = 0.9 + subP * 0.1
      }

      const outVol = Math.round(baseVol * Math.max(0, Math.min(1, outRatio)))
      const inVol = Math.round(baseVol * Math.max(0, Math.min(1, inRatio)))

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
    hasPreSpunRef.current = false
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
        triggerSeamlessDJCrossfade(1800)
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
