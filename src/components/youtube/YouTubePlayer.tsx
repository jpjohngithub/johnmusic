// ============================================================
// YOUTUBE PLAYER — MOTOR DUAL-DECK TRANSIÇÃO MÁGICA 5.0 (DEEP OVERLAP AUTOMIX)
// Gatilho a 8.5s para transição sem silêncio de final de faixa + Entrada Enérgica
// Confirmed-Audio Handshake + Curva Acústica de Potência Estendida (6.5s)
// ============================================================

import { useEffect, useRef } from 'react'
import { useYouTubeIframeApi } from '@/hooks/useYouTubeIframeApi'
import { usePlayerStore } from '@/store/playerStore'
import { useHistoryStore } from '@/store/historyStore'
import { useEqualizerStore } from '@/store/equalizerStore'
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
      clearInterval(crossfadeRafRef.current as any)
      crossfadeRafRef.current = null
    }
    if (handshakeTimerRef.current !== null) {
      clearInterval(handshakeTimerRef.current)
      handshakeTimerRef.current = null
    }
    isCrossfadingRef.current = false
    usePlayerStore.getState().setIsCrossfading(false)
  }

  // ─── Loop de Monitoramento de Progresso de Alta Precisão (70ms) ───
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

          // ─── Automação de Transição Mágica a 8.5s (Antes do Silêncio Final) ───
          if (
            store.perfectTransition &&
            duration > 15 &&
            !isCrossfadingRef.current &&
            !hasTriggeredTransitionRef.current
          ) {
            const remaining = duration - current

            // Pré-busca em nuvem da próxima faixa a 20s do fim
            if (remaining <= 20 && remaining > 14) {
              store.preResolveNextTrack()
            }

            // Dispara o Crossfade Mágico enquanto a música A ainda está com energia musical total (8.5s)
            if (remaining <= 8.5 && remaining > 0.5) {
              hasTriggeredTransitionRef.current = true
              const nextTrack = store.getNextTrack()
              const nextIndex = store.getNextTrackIndex()
              if (nextTrack && nextIndex !== null) {
                performHandshakeCrossfade(nextTrack, nextIndex, 6500)
              }
            }
          }
        }
      } catch {}
    }, 70)
  }

  // ─── Motor de Transição Mágica com Handshake de Áudio Ativo ───────
  async function performHandshakeCrossfade(
    targetTrack: QueueItem,
    targetIndex: number,
    durationMs = 6500
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

    // Mantém a música atual no volume integral enquanto a nova carrega
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

    // ─── Handshake: Aguarda o Deck B realmente começar a reproduzir som ───
    let waitAttempts = 0
    const maxWaitAttempts = 28

    handshakeTimerRef.current = window.setInterval(() => {
      waitAttempts++
      let isReadyToCrossfade = false

      try {
        const standbyState = standbyPlayer.getPlayerState?.()
        const standbyTime = standbyPlayer.getCurrentTime?.() || 0
        if (standbyState === 1 || standbyTime > 0.05 || waitAttempts >= maxWaitAttempts) {
          isReadyToCrossfade = true
        }
      } catch {
        if (waitAttempts >= maxWaitAttempts) isReadyToCrossfade = true
      }

      if (isReadyToCrossfade) {
        clearInterval(handshakeTimerRef.current)
        handshakeTimerRef.current = null

        // Inicia a rampa de potência estendida
        startEqualPowerRamp(activePlayer, standbyPlayer, masterVol, incomingDeck, playableTrack, targetIndex, durationMs)
      }
    }, 80)
  }

  // ─── Rampa Acústica de Alta Energia (Potência Estendida) ───────────
  // Usa setInterval em vez de requestAnimationFrame para funcionar em abas em segundo plano
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
      clearInterval(crossfadeRafRef.current as any)
      crossfadeRafRef.current = null
    }

    const startTime = Date.now()
    let lastActiveVol = masterVol
    let lastStandbyVol = 0

    crossfadeRafRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1.0, elapsed / durationMs)

      const angle = (progress * Math.PI) / 2
      const outRatio = Math.pow(Math.cos(angle), 1.25)
      const inRatio = Math.pow(Math.sin(angle), 0.65)

      const outVol = Math.max(0, Math.min(100, Math.round(masterVol * outRatio)))
      const inVol = Math.max(0, Math.min(100, Math.round(masterVol * inRatio)))

      if (outVol !== lastActiveVol) {
        lastActiveVol = outVol
        try { activePlayer?.setVolume(outVol) } catch {}
      }
      if (inVol !== lastStandbyVol) {
        lastStandbyVol = inVol
        try { standbyPlayer?.setVolume(inVol) } catch {}
      }

      // Garante que o deck entrante continua tocando mesmo em segundo plano
      try {
        const standbyState = standbyPlayer?.getPlayerState?.()
        if (standbyState === 2 || standbyState === 5) {
          // Pausado ou buffering — força play
          standbyPlayer?.playVideo?.()
        }
      } catch {}

      if (progress >= 1.0) {
        // Conclusão da Transição Mágica
        clearInterval(crossfadeRafRef.current as any)
        crossfadeRafRef.current = null

        try {
          activePlayer?.pauseVideo()
          activePlayer?.setVolume(0)
          standbyPlayer?.setVolume(masterVol)
          standbyPlayer?.playVideo()
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
    }, 50) as any
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
            try {
              if (!store.isMuted && initialVol > 0) {
                e.target.unMute()
              }
              e.target.setVolume(initialVol)
            } catch {}

            const s = usePlayerStore.getState()
            const currentVid = s.youtubeVideo?.videoId || s.queue[s.queueIndex]?.videoId
            if (activeDeckRef.current === 'A' && currentVid) {
              lastLoadedIdRef.current = currentVid
              hasTriggeredTransitionRef.current = false
              if (s.isPlaying) {
                try {
                  e.target.loadVideoById(currentVid)
                  e.target.playVideo()
                } catch {}
              } else {
                try {
                  e.target.cueVideoById(currentVid)
                } catch {}
              }
            }
          },
          onStateChange: (e: any) => {
            const YTState = window.YT?.PlayerState || {}
            if (e.data === YTState.PLAYING) {
              try {
                const s = usePlayerStore.getState()
                if (!s.isMuted && (s.volume ?? 50) > 0) {
                  e.target.unMute()
                  e.target.setVolume(s.volume ?? 50)
                }
                const dur = e.target.getDuration()
                if (dur > 0) usePlayerStore.getState().setDuration(dur)
              } catch {}
              usePlayerStore.getState().setIsPlaying(true)
              startProgressLoop()
            } else if (e.data === YTState.CUED) {
              if (usePlayerStore.getState().isPlaying) {
                try { e.target.playVideo() } catch {}
              }
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
            if (e.data === YTState.PLAYING && activeDeckRef.current === 'B') {
              try {
                const s = usePlayerStore.getState()
                if (!s.isMuted && (s.volume ?? 50) > 0) {
                  e.target.unMute()
                  e.target.setVolume(s.volume ?? 50)
                }
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

  // ─── Carrega novo vídeo ou atualiza estado Play/Pause ────────────
  useEffect(() => {
    if (!queueVideoId) return

    const active = getActivePlayer()
    const standby = getStandbyPlayer()
    if (!active) return

    const currentStore = usePlayerStore.getState()
    const baseVol = currentStore.isMuted ? 0 : (currentStore.volume ?? 50)

    try {
      if (!currentStore.isMuted && baseVol > 0) {
        active.unMute?.()
      }
      active.setVolume?.(baseVol)

      if (lastLoadedIdRef.current !== queueVideoId) {
        stopCrossfade()
        lastLoadedIdRef.current = queueVideoId
        hasTriggeredTransitionRef.current = false

        standby?.pauseVideo?.()
        standby?.setVolume?.(0)

        if (isPlaying) {
          active.loadVideoById?.(queueVideoId)
          active.playVideo?.()
        } else {
          active.cueVideoById?.(queueVideoId)
        }
        startProgressLoop()
      } else {
        if (isPlaying) {
          active.playVideo?.()
          startProgressLoop()
        } else {
          active.pauseVideo?.()
          stopProgressLoop()
        }
      }
    } catch {}
  }, [queueVideoId, isPlaying, ready])

  // ─── Transição Mágica Disparada Manualmente pelos Botões ─────────
  useEffect(() => {
    const handleManualNext = () => {
      const store = usePlayerStore.getState()
      const nextTrack = store.getNextTrack()
      const nextIndex = store.getNextTrackIndex()
      if (nextTrack && nextIndex !== null) {
        performHandshakeCrossfade(nextTrack, nextIndex, 2600)
      } else {
        store.playNext()
      }
    }

    const handleManualPrev = () => {
      const store = usePlayerStore.getState()
      const prevTrack = store.getPrevTrack()
      const prevIndex = store.getPrevTrackIndex()
      if (prevTrack && prevIndex !== null) {
        performHandshakeCrossfade(prevTrack, prevIndex, 2600)
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

  const eqIsEnabled = useEqualizerStore((s) => s.isEnabled)
  const eqPreAmpGain = useEqualizerStore((s) => s.preAmpGain)
  const eqGains = useEqualizerStore((s) => s.gains)
  const eqBassBoost = useEqualizerStore((s) => s.bassBoost)
  const eqVocalClarity = useEqualizerStore((s) => s.vocalClarity)

  // ─── Sincronização de Volume & Equalização Dinâmica ──────────────
  useEffect(() => {
    if (isCrossfadingRef.current) return
    const active = getActivePlayer()
    if (!active?.setVolume) return
    try {
      let effectiveVol = isMuted ? 0 : (volume ?? 50)
      if (eqIsEnabled && effectiveVol > 0) {
        const avgGain = eqGains.reduce((a, b) => a + b, 0) / eqGains.length
        const totalGainDb = eqPreAmpGain + (avgGain * 0.45) + ((eqBassBoost / 100) * 3) + ((eqVocalClarity / 100) * 2)
        const multiplier = Math.pow(10, totalGainDb / 20)
        effectiveVol = Math.max(1, Math.min(100, Math.round(effectiveVol * multiplier)))
      }
      if (!isMuted && effectiveVol > 0) {
        active.unMute()
      } else {
        active.mute()
      }
      active.setVolume(effectiveVol)
    } catch {}
  }, [volume, isMuted, eqIsEnabled, eqPreAmpGain, eqGains, eqBassBoost, eqVocalClarity])

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

  // ─── Suporte a Reprodução em Segundo Plano (Page Visibility API) ───
  // Retoma automaticamente o áudio quando o usuário volta à aba ou janela
  useEffect(() => {
    let keepAliveTimer: any = null

    const resumePlayback = () => {
      const store = usePlayerStore.getState()
      if (store.source !== 'youtube' || !store.isPlaying) return

      const active = getActivePlayer()
      if (!active) return

      try {
        const state = active.getPlayerState?.()
        // Estados: 1=tocando, 2=pausado, 3=buffering, 5=cued, -1=não iniciado
        if (state === 2 || state === 5 || state === -1) {
          // Player parou em segundo plano — retoma com volume
          const s = usePlayerStore.getState()
          const vol = s.isMuted ? 0 : (s.volume ?? 50)
          if (!s.isMuted && vol > 0) {
            active.unMute?.()
          }
          active.setVolume?.(vol)
          active.playVideo?.()
        }
      } catch {}
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Usuário voltou à aba — pequeno delay para dar tempo ao browser
        setTimeout(resumePlayback, 300)
        setTimeout(resumePlayback, 1000)
      }
    }

    const handleWindowFocus = () => {
      setTimeout(resumePlayback, 200)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    // Keep-alive: a cada 15s verifica se o player ainda está rodando
    // Isso garante continuidade mesmo quando o browser throttle a aba
    keepAliveTimer = window.setInterval(() => {
      const store = usePlayerStore.getState()
      if (store.source !== 'youtube' || !store.isPlaying || isCrossfadingRef.current) return

      const active = getActivePlayer()
      if (!active) return

      try {
        const state = active.getPlayerState?.()
        if (state === 2 || state === 5 || state === -1) {
          const vol = store.isMuted ? 0 : (store.volume ?? 50)
          if (!store.isMuted && vol > 0) {
            active.unMute?.()
          }
          active.setVolume?.(vol)
          active.playVideo?.()
        }
      } catch {}
    }, 15000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      if (keepAliveTimer !== null) clearInterval(keepAliveTimer)
    }
  }, [ready])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        bottom: '0px',
        right: '0px',
        width: '200px',
        height: '120px',
        zIndex: -10,
        opacity: 0.02,
        pointerEvents: 'none',
      }}
    >
      <div ref={containerARef} />
      <div ref={containerBRef} />
    </div>
  )
}
