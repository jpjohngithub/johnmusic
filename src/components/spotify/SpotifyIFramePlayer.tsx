// ============================================================
// SPOTIFY IFRAME API PLAYER — Player oficial via iFrame API
// Controle programático, sem necessidade de login do usuário
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react'

// Spotify iFrame API types
declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIFrameAPI) => void
    SpotifyIframeApi?: SpotifyIFrameAPI
  }
}

interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri?: string; url?: string; width?: string | number; height?: string | number },
    callback: (controller: EmbedController) => void
  ): void
}

interface EmbedController {
  togglePlay(): void
  play(): void
  pause(): void
  seek(seconds: number): void
  restart(): void
  loadUri(uri: string): void
  destroy(): void
  addListener(event: string, callback: (data: unknown) => void): void
  removeListener(event: string, callback: (data: unknown) => void): void
}

interface PlaybackUpdateEvent {
  data: {
    isPaused: boolean
    isBuffering: boolean
    duration: number
    position: number
  }
}

interface SpotifyIFramePlayerProps {
  spotifyUri?: string
  spotifyUrl?: string
  height?: number
  onPlaybackUpdate?: (isPaused: boolean, position: number, duration: number) => void
  onReady?: (controller: EmbedController) => void
  autoPlay?: boolean
}

// Carrega o script da Spotify iFrame API (singleton)
let apiLoadPromise: Promise<SpotifyIFrameAPI> | null = null

function loadSpotifyIFrameApi(): Promise<SpotifyIFrameAPI> {
  if (apiLoadPromise) return apiLoadPromise

  apiLoadPromise = new Promise((resolve) => {
    if (window.SpotifyIframeApi) {
      resolve(window.SpotifyIframeApi)
      return
    }

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      window.SpotifyIframeApi = IFrameAPI
      resolve(IFrameAPI)
    }

    const script = document.createElement('script')
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    document.head.appendChild(script)
  })

  return apiLoadPromise
}

export function SpotifyIFramePlayer({
  spotifyUri,
  spotifyUrl,
  height = 152,
  onPlaybackUpdate,
  onReady,
  autoPlay = false,
}: SpotifyIFramePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<EmbedController | null>(null)
  const [isReady, setIsReady] = useState(false)

  const initPlayer = useCallback(async () => {
    if (!containerRef.current) return
    if (!spotifyUri && !spotifyUrl) return

    // Destruir controller anterior se existir
    if (controllerRef.current) {
      try { controllerRef.current.destroy() } catch { /* ignore */ }
      controllerRef.current = null
      setIsReady(false)
    }

    // Limpar o container
    const container = containerRef.current
    container.innerHTML = ''

    // Criar elemento filho para o iframe
    const embedEl = document.createElement('div')
    container.appendChild(embedEl)

    const IFrameAPI = await loadSpotifyIFrameApi()

    const options: { uri?: string; url?: string; height: number } = {
      height,
    }

    if (spotifyUri) options.uri = spotifyUri
    else if (spotifyUrl) options.url = spotifyUrl

    IFrameAPI.createController(embedEl, options, (controller) => {
      controllerRef.current = controller
      setIsReady(true)
      onReady?.(controller)

      // Ouvir atualizações de playback
      if (onPlaybackUpdate) {
        controller.addListener('playback_update', (e) => {
          const event = e as PlaybackUpdateEvent
          if (event?.data) {
            onPlaybackUpdate(
              event.data.isPaused,
              event.data.position,
              event.data.duration
            )
          }
        })
      }

      if (autoPlay) {
        setTimeout(() => {
          try { controller.togglePlay() } catch { /* ignore */ }
        }, 500)
      }
    })
  }, [spotifyUri, spotifyUrl, height, onPlaybackUpdate, onReady, autoPlay])

  useEffect(() => {
    initPlayer()

    return () => {
      if (controllerRef.current) {
        try { controllerRef.current.destroy() } catch { /* ignore */ }
        controllerRef.current = null
      }
    }
  }, [initPlayer])

  // Expõe o controller via ref publicamente
  useEffect(() => {
    if (isReady && controllerRef.current) {
      onReady?.(controllerRef.current)
    }
  }, [isReady, onReady])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ minHeight: height }}
    />
  )
}
