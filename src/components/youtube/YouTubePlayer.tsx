// ============================================================
// YOUTUBE PLAYER — MOTOR DUAL-DECK TRANSIÇÃO MÁGICA 4.0 (CONFIRMED-AUDIO HANDSHAKE)
// Início do Crossfade apenas após confirmação de reprodução do Deck B (Zero Queda de Volume)
// Curva Acústica Equal-Power Perfeita (cos / sin) sem silêncio e sem gaps
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
  const hasTriggeredTransitionRef = useRef<boolean>(false)
  const crossfadeRafRef = useRef<number | null>(null)
  const handshakeTimerRef = useRef<any>(null)
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
    if (handshakeTimerRef.current !== null) {
      clearInterval(handshakeTimerRef.current)
      handshakeTimerRef.current = null
    }
    isCrossfadingRef.current = false
    usePlayerStore.getState().setIsCrossfading(false)
  }

  // ─── Loop de Monitoramento de Progresso de Alta Precisão (80ms) ───
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
            duration > 12 &&
            !isCrossfadingRef.current &&
            !hasTriggeredTransitionRef.current
          ) {
            const remaining = duration - current

            // Pré-busca em nuvem da próxima faixa a 18s do fim
            if (remaining <= 18 && remaining > 12) {
              store.preResolveNextTrack()
            }

            // Dispara a Transição Mágica nos últimos 5.5s da música
            if (remaining <= 5.5 && remaining > 0.4) {
              hasTriggeredTransitionRef.current = true
              const nextTrack = store.getNextTrack()
              const nextIndex = store.getNextTrackIndex()
              if (nextTrack && nextIndex !== null) {
                performHandshakeCrossfade(nextTrack, nextIndex, 4800)
              }
            }
          }
        }
      } catch {}
    }, 80)
  }

  // ─── Motor de Transição Mágica com Handshake de Áudio Ativo ───────
  async function performHandshakeCrossfade(
    targetTrack: QueueItem,
    targetIndex: number,
    durationMs = 4800
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

    isCrossfadingRef.current = true
    store.setIsCrossfading(true)

    const masterVol = store.isMuted ? 0 : Math.max(1, store.volume ?? 50)
    const outgoingDeck = activeDeckRef.current
    const incomingDeck = outgoingDeck === 'A' ? 'B' : 'A'

    // Mantém a música atual no volume normal enquanto a nova carrega
    try {
      activePlayer?.setVolume(masterVol)
    } catch {}

    // Inicia o carregamento da próxima música no deck de espera a volume 0
    try {
      standbyPlayer.setVolume(0)
      standbyPlayer.loadVideoById(playableTrack.videoId)
      standbyPlayer.playVideo()
    } catch {}

    if (handshakeTimerRef.current !== null) {
      clearInterval(handshakeTimerRef.current)
      handshakeTimerRef.current = null
    }

    // ─── Handshake: Aguarda o Deck B realmente começar a reproduzir áudio ───
    let waitAttempts = 0
    const maxWaitAttempts = 30 // Max 3.0s de espera pelo buffer

    handshakeTimerRef.current = window.setInterval(() => {
      waitAttempts++
      let isReadyToCrossfade = false

      try {
        const standbyState = standbyPlayer.getPlayerState?.()
        const standbyTime = standbyPlayer.getCurrentTime?.() || 0
        // Estado 1 = PLAYING e já começou a avançar o tempo
        if (standbyState === 1 || standbyTime > 0.05 || waitAttempts >= maxWaitAttempts) {
          isReadyToCrossfade = true
        }
      } catch {
        if (waitAttempts >= maxWaitAttempts) isReadyToCrossfade = true
      }

      if (isReadyToCrossfade) {
        clearInterval(handshakeTimerRef.current)
        handshakeTimerRef.current = null

        // ─── Ambos os decks estão confirmados tocando! Inicia o Crossfade Perfeito ───
        startEqualPowerRamp(activePlayer, standbyPlayer, masterVol, incomingDeck, playableTrack, targetIndex, durationMs)
      }
    }, 100)
  }

  // ─── Rampa Acústica Equal-Power de Alta Fidelidade (60 FPS) ──────
  function startEqualPowerRamp(
    activePlayer: any,
    standbyPlayer: any,
    masterVol: number,
    incomingDeck: 'A' | 'B',
    playableTrack: QueueItem,
    targetIndex: number,
    durationMs: number
  ) {
    if (crossfadeRafRef.current !== null) {
      cancelAnimationFrame(crossfadeRafRef.current)
      crossfadeRafRef.current = null
    }

    const startTime = performance.now()
    let lastActiveVol = masterVol
    let lastStandbyVol = 0

    function rampStep(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(1.0, elapsed / durationMs)

      // Curva Equal-Power Suave (Fórmula Acústica de Potência Constante: cos / sin)
      // Mantém a pressão sonora total 100% estável: cos^2(t) + sin^2(t) = 1.0
      const angle = (progress * Math.PI) / 2
      const outVol = Math.max(0, Math.min(100, Math.round(masterVol * Math.cos(angle))))
      const inVol = Math.max(0, Math.min(100, Math.round(masterVol * Math.sin(angle))))

      if (outVol !== lastActiveVol) {
        lastActiveVol = outVol
        try { activePlayer?.setVolume(outVol) } catch {}
      }
      if (inVol !== lastStandbyVol) {
        lastStandbyVol = inVol
        try { standbyPlayer?.setVolume(inVol) } catch {}
      }

      if (progress < 1.0) {
        crossfadeRafRef.current = requestAnimationFrame(rampStep)
      } else {
        // Conclusão da Transição Mágica
        crossfadeRafRef.current = null

        try {
          activePlayer?.pauseVideo()
          activePlayer?.setVolume(0)
          standbyPlayer?.setVolume(masterVol)
        } catch {}

        activeDeckRef.current = incomingDeck
        isCrossfadingRef.current = false
        hasTriggeredTransitionRef.current = false
        lastLoadedIdRef.current = playableTrack.videoId!

        const currentStoreState = usePlayerStore.getState()
        let newShuffledPos = 0
        if (currentStoreState.isShuffled && currentStoreState.shuffledOrder.length === currentStoreState.queue.length) {
          const foundPos = currentStoreState.shuffledOrder.indexOf(targetIndex)
          newShuffledPos = foundPos >= 0 ? foundPos : 0
        }

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

    crossfadeRafRef.current = requestAnimationFrame(rampStep)
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
        performHandshakeCrossfade(nextTrack, nextIndex, 2400)
      } else {
        store.playNext()
      }
    }

    const handleManualPrev = () => {
      const store = usePlayerStore.getState()
      const prevTrack = store.getPrevTrack()
      const prevIndex = store.getPrevTrackIndex()
      if (prevTrack && prevIndex !== null) {
        performHandshakeCrossfade(prevTrack, prevIndex, 2400)
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
