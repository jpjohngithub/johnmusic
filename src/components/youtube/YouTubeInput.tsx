import { useState } from 'react'
import { Youtube, Plus, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { createYouTubeVideoFromUrl, isValidYouTubeUrl } from '@/api/youtubeService'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import type { YouTubeVideo } from '@/types'

interface YouTubeInputProps {
  onVideoAdded?: (video: YouTubeVideo) => void
  autoPlay?: boolean
}

export function YouTubeInput({ onVideoAdded, autoPlay = true }: YouTubeInputProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<YouTubeVideo | null>(null)

  const { addYouTubeVideo } = useLibraryStore()
  const { playYouTubeVideo } = usePlayerStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    if (!isValidYouTubeUrl(url)) {
      setError('URL inválida. Exemplos: youtube.com/watch?v=... ou youtu.be/...')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const video = await createYouTubeVideoFromUrl(url.trim())
      addYouTubeVideo(video)
      setLastAdded(video)
      setUrl('')

      if (autoPlay) {
        playYouTubeVideo(video)
      }

      onVideoAdded?.(video)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar URL')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <Youtube size={20} className="text-youtube-red" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            placeholder="Cole aqui a URL de qualquer música ou vídeo do YouTube..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-youtube-red/70 focus:ring-2 focus:ring-youtube-red/20 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-5 py-3.5 bg-youtube-red hover:bg-red-600 active:scale-95 text-white rounded-xl font-bold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-youtube-red/20 flex-shrink-0"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          <span>{isLoading ? 'Carregando...' : 'Adicionar'}</span>
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {lastAdded && (
        <div className="flex items-center justify-between gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={lastAdded.thumbnailUrl}
              alt={lastAdded.title}
              className="w-16 h-10 object-cover rounded-lg flex-shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-youtube-red text-[11px] font-semibold">
                <Sparkles size={12} />
                <span>Adicionado à sua Biblioteca</span>
              </div>
              <p className="text-white text-xs font-semibold truncate">{lastAdded.title}</p>
              <p className="text-white/40 text-[10px] truncate">{lastAdded.channelTitle}</p>
            </div>
          </div>
          <button
            onClick={() => playYouTubeVideo(lastAdded)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
          >
            Tocar Agora
          </button>
        </div>
      )}
    </div>
  )
}
