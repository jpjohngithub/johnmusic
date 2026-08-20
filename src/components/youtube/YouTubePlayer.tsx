import { useRef, useEffect } from 'react'
import { buildYouTubeEmbedUrl } from '@/api/youtubeService'
import { usePlayerStore } from '@/store/playerStore'
import type { YouTubeVideo } from '@/types'

interface YouTubePlayerProps {
  video: YouTubeVideo
  autoPlay?: boolean
  onEnd?: () => void
}

export function YouTubePlayer({ video, onEnd }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { setIsPlaying } = usePlayerStore()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'onStateChange') {
          // 1 = playing, 2 = paused, 0 = ended
          if (data.info === 1) setIsPlaying(true)
          else if (data.info === 2) setIsPlaying(false)
          else if (data.info === 0) {
            setIsPlaying(false)
            onEnd?.()
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onEnd, setIsPlaying])

  const embedUrl = buildYouTubeEmbedUrl(video.videoId)

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 aspect-video relative">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  )
}
