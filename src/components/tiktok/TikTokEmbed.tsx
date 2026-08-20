import { buildTikTokEmbedUrl } from '@/api/tiktokService'
import type { TikTokVideo } from '@/types'

interface TikTokEmbedProps {
  video: TikTokVideo
  className?: string
}

export function TikTokEmbed({ video, className }: TikTokEmbedProps) {
  const embedSrc = buildTikTokEmbedUrl(video.postId)

  return (
    <div className={`flex flex-col items-center justify-center p-2 ${className || ''}`}>
      <div className="w-[325px] h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black relative">
        <iframe
          src={embedSrc}
          className="w-full h-full border-0"
          allow="encrypted-media; autoplay"
          allowFullScreen
          title={video.title || 'TikTok Player'}
        />
      </div>
      <div className="mt-3 text-center max-w-sm">
        <p className="text-white text-sm font-semibold truncate">{video.title || 'TikTok'}</p>
        <p className="text-white/40 text-xs">@{video.authorName}</p>
      </div>
    </div>
  )
}
