// ============================================================
// YOUTUBE IFRAME API HOOK — Carrega a API uma única vez
// ============================================================

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: (() => void) | undefined
  }
}

let apiPromise: Promise<any> | null = null

function loadIframeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT)
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => reject(new Error('Falha ao carregar a YouTube IFrame API'))
    document.head.appendChild(script)
  })

  return apiPromise
}

export function useYouTubeIframeApi() {
  const [yt, setYt] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadIframeApi()
      .then((api) => {
        if (!cancelled) setYt(api)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { yt, ready: yt !== null, error }
}
