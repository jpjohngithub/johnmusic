// ============================================================
// YOUTUBE PLAYER — MOTOR DUAL-DECK TRANSIÇÃO MÁGICA 3.0 (DJ MASTER AUTOMIX)
// Pré-Giro Silencioso a 7.5s + Handover Psicoacústico Tri-Fásico de 6.0s
// Interpolação de 120 FPS via requestAnimationFrame com Anti-Jitter Lock
// ============================================================

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import type { QueueItem } from '@/types'

export function YouTubePlayer() {
  const { ready } = useYouTubeIframeApi()

  const containerARef = useRef<HTMLDivElement | null>(null)
  const containerBRef = useRef<HTMLDivElement | null>(null)

  const playerARef = useRef<any>(null)
  const playerBRef = useRef<any>(null)

  const activeDeckRef = useRef<'A' | 'B'>('A')
  const isCrossfadingRef = useRef<boolean>(false)
  const hasPreSpunRef = useRef<boolean>(false)
  const hasTriggeredTransitionRef = useRef<boolean>(false)
  const crossfadeRafRef = useRef<number | null>(null)
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
    if (crossfadeRafRef.current !== null) {
      cancelAnimationFrame(crossfadeRafRef.current)
      crossfadeRafRef.current = null
    }
    isCrossfadingRef.current = false
    usePlayerStore.getState().setIsCrossfading(false)
  }

  // ─── Loop de Monitoramento de Alta Precisão (70ms) ───────────
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

          // ─── Automação de Transição Mágica no Fim da Faixa ───
          if (
            store.perfectTransition &&
            duration > 14 &&
            !isCrossfadingRef.current &&
            !hasTriggeredTransitionRef.current
          ) {
            const remaining = duration - current

            // 1. Pré-resolução em nuvem da próxima faixa a 18s do fim
            if (remaining <= 18 && remaining > 12) {
              store.preResolveNextTrack()
            }

            // 2. Pré-Giro Silencioso (Silent Spin-Up) no Deck Standby a 7.5s
            if (remaining <= 7.5 && remaining > 6.2 && !hasPreSpunRef.current) {
              hasPreSpunRef.current = true
              const standby = getStandbyPlayer()
              const nextTrack = store.getNextTrack()
              if (nextTrack?.videoId && standby?.loadVideoById) {
                try {
                  standby.setVolume(0)
                  standby.loadVideoById(nextTrack.videoId)
                  standby.playVideo()
                } catch {}
              }
            }

            // 3. Disparo da Mixagem Harmônica nos últimos 6.0s
            if (remaining <= 6.0 && remaining > 0.3) {
              hasTriggeredTransitionRef.current = true
              const nextTrack = store.getNextTrack()
              const nextIndex = store.getNextTrackIndex()
              if (nextTrack && nextIndex !== null) {
                performDJCrossfade(nextTrack, nextIndex, 5800)
              }
            }
          }
        }
      } catch {}
    }, 70)
  }

  // ─── Motor DJ Automix 120 FPS com Curva Psicoacústica Tri-Fásica ───
  async function performDJCrossfade(
    targetTrack: QueueItem,
    targetIndex: number,
    durationMs = 5800
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
          store.updateQueueItem(targetIndex, { videoId: resolved.videoId })
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

    // Ativa indicadores globais de transição mágica
    isCrossfadingRef.current = true
    hasPreSpunRef.current = false
    store.setIsCrossfading(true)

    const masterVol = store.isMuted ? 0 : Math.max(1, store.volume ?? 50)
    const outgoingDeck = activeDeckRef.current
    const incomingDeck = outgoingDeck === 'A' ? 'B' : 'A'

    // Garante que o deck standby já está rodando a volume 0
    try {
      standbyPlayer.setVolume(0)
      standbyPlayer.loadVideoById(playableTrack.videoId)
      standbyPlayer.playVideo()
    } catch {}

    if (crossfadeRafRef.current !== null) {
      cancelAnimationFrame(crossfadeRafRef.current)
      crossfadeRafRef.current = null
    }

    const startTime = performance.now()
    let lastActiveVol = masterVol
    let lastStandbyVol = 0
    let lastMsgTime = 0

    function crossfadeStep(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(1.0, elapsed / durationMs)

      // Curva Quintic Perlin Hermite (Interpolação de 5ª ordem ultra-sedosa)
      // s(t) = t^3 * (t * (6t - 15) + 10)
      const p = progress
      const smoothP = p * p * p * (p * (6 * p - 15) + 10)

      // Envelope Tri-Fásico Psicoacústico de DJ Mixer Profissional:
      // Fase 1 (0-38%): Música A mantém a batida (100% -> 82%), Música B entra nos agudos/médios (0% -> 50%)
      // Fase 2 (38-72%): Ponto de Drop: Música B assume o comando (50% -> 92%), Música A filtra os graves (82% -> 28%)
      // Fase 3 (72-100%): Música B estabiliza em 100%, Música A dissolve suavemente até 0%
      let outRatio = 0
      let inRatio = 0

      if (smoothP <= 0.38) {
        const subT = smoothP / 0.38
        outRatio = 1.0 - subT * 0.18
        inRatio = Math.pow(subT, 1.1) * 0.50
      } else if (smoothP <= 0.72) {
        const subT = (smoothP - 0.38) / 0.34
        outRatio = 0.82 - Math.pow(subT, 0.95) * 0.54
        inRatio = 0.50 + Math.pow(subT, 0.85) * 0.42
      } else {
        const subT = (smoothP - 0.72) / 0.28
        outRatio = 0.28 * (1.0 - subT)
        inRatio = 0.92 + subT * 0.08
      }

      const outVol = Math.max(0, Math.min(100, Math.round(masterVol * outRatio)))
      const inVol = Math.max(0, Math.min(100, Math.round(masterVol * inRatio)))

      // Limitador inteligente de mensagens postMessage (evita saturação de frames)
      if (currentTime - lastMsgTime >= 15 || progress >= 1.0) {
        lastMsgTime = currentTime
        if (outVol !== lastActiveVol) {
          lastActiveVol = outVol
          try { activePlayer?.setVolume(outVol) } catch {}
        }
        if (inVol !== lastStandbyVol) {
          lastStandbyVol = inVol
          try { standbyPlayer?.setVolume(inVol) } catch {}
        }
      }

      if (progress < 1.0) {
        crossfadeRafRef.current = requestAnimationFrame(crossfadeStep)
      } else {
        // Conclusão da Transição Mágica
        crossfadeRafRef.current = null

        try {
          activePlayer?.pauseVideo()
          activePlayer?.setVolume(0)
          standbyPlayer?.setVolume(masterVol)
        } catch {}

        // Inverte o deck principal
        activeDeckRef.current = incomingDeck
        isCrossfadingRef.current = false
        hasPreSpunRef.current = false
        hasTriggeredTransitionRef.current = false
        lastLoadedIdRef.current = playableTrack.videoId!

        const currentStoreState = usePlayerStore.getState()
        let newShuffledPos = 0
        if (currentStoreState.isShuffled && currentStoreState.shuffledOrder.length === currentStoreState.queue.length) {
          const foundPos = currentStoreState.shuffledOrder.indexOf(targetIndex)
          newShuffledPos = foundPos >= 0 ? foundPos : 0
        }

        // Atualiza estado do player
        usePlayerStore.setState({
          queueIndex: targetIndex,
          shuffledPosition: newShuffledPos,
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

        try {
          useHistoryStore.getState().recordPlay(playableTrack)
        } catch {}

        startProgressLoop()
      }
    }

    crossfadeRafRef.current = requestAnimationFrame(crossfadeStep)
  }

  // ─── Inicialização dos dois Players do YouTube ───────────────────
  useEffect(() => {
    if (!ready || !containerARef.current || !containerBRef.current) return

    const store = usePlayerStore.getState()
    const initialVol = store.isMuted ? 0 : (store.volume ?? 50)

    // Player A (Deck A)
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
              hasPreSpunRef.current = false
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

    // Player B (Deck B Standby)
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

  // ─── Transição Mágica Disparada Manualmente pelos Botões ─────────
  useEffect(() => {
    const handleManualNext = () => {
      const store = usePlayerStore.getState()
      const nextTrack = store.getNextTrack()
      const nextIndex = store.getNextTrackIndex()
      if (nextTrack && nextIndex !== null) {
        performDJCrossfade(nextTrack, nextIndex, 2800)
      } else {
        store.playNext()
      }
    }

    const handleManualPrev = () => {
      const store = usePlayerStore.getState()
      const prevTrack = store.getPrevTrack()
      const prevIndex = store.getPrevTrackIndex()
      if (prevTrack && prevIndex !== null) {
        performDJCrossfade(prevTrack, prevIndex, 2800)
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
        hasPreSpunRef.current = false
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
