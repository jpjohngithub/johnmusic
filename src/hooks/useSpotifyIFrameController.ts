// ============================================================
// SPOTIFY IFRAME CONTROLLER HOOK — Controle externo do embed
// ============================================================

import { useRef, useCallback } from 'react'

export interface EmbedController {
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

// Hook para usar o controller externamente
export function useSpotifyIFrameController() {
  const controllerRef = useRef<EmbedController | null>(null)

  const setController = useCallback((controller: EmbedController) => {
    controllerRef.current = controller
  }, [])

  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay()
  }, [])

  const seek = useCallback((seconds: number) => {
    controllerRef.current?.seek(seconds)
  }, [])

  const loadUri = useCallback((uri: string) => {
    controllerRef.current?.loadUri(uri)
  }, [])

  return { setController, togglePlay, seek, loadUri, controllerRef }
}
