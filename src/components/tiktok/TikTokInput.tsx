import { useState } from 'react'
import { Plus, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { createTikTokVideoFromUrl, isValidTikTokUrl } from '@/api/tiktokService'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import type { TikTokVideo } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

interface TikTokInputProps {
  onVideoAdded?: (video: TikTokVideo) => void
  autoPlay?: boolean
}

export function TikTokInput({ onVideoAdded, autoPlay = true }: TikTokInputProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<TikTokVideo | null>(null)

  const { addTikTokVideo } = useLibraryStore()
  const { playTikTokVideo } = usePlayerStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    if (!isValidTikTokUrl(url)) {
      setError('URL do TikTok inválida. Formato: tiktok.com/@usuario/video/ID ou link compartilhado')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const video = await createTikTokVideoFromUrl(url.trim())
      addTikTokVideo(video)
      setLastAdded(video)
      setUrl('')

      if (autoPlay) {
        playTikTokVideo(video)
      }

      onVideoAdded?.(video)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar URL do TikTok')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-tiktok-pink">
            <TikTokIcon />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            placeholder="Cole aqui a URL de um TikTok (música / dança / vídeo)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-tiktok-pink/70 focus:ring-2 focus:ring-tiktok-pink/20 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-tiktok-pink to-[#FE2C55] hover:opacity-90 active:scale-95 text-white rounded-xl font-bold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-tiktok-pink/20 flex-shrink-0"
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
            {lastAdded.thumbnailUrl ? (
              <img
                src={lastAdded.thumbnailUrl}
                alt={lastAdded.title}
                className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-12 h-16 rounded-lg bg-tiktok-pink/20 text-tiktok-pink flex items-center justify-center flex-shrink-0">
                <TikTokIcon />
              </div>
            )}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-tiktok-pink text-[11px] font-semibold">
                <Sparkles size={12} />
                <span>Capa e Áudio do TikTok Capturados!</span>
              </div>
              <p className="text-white text-xs font-semibold truncate">{lastAdded.title || 'Vídeo do TikTok'}</p>
              {lastAdded.soundTitle && (
                <p className="text-tiktok-pink text-[11px] font-medium truncate">
                  🎵 {lastAdded.soundTitle}
                </p>
              )}
              <p className="text-white/40 text-[10px] truncate">@{lastAdded.authorName}</p>
            </div>
          </div>
          <button
            onClick={() => playTikTokVideo(lastAdded)}
            className="px-4 py-2 bg-tiktok-pink hover:bg-pink-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex-shrink-0 shadow-md"
          >
            Tocar Áudio
          </button>
        </div>
      )}
    </div>
  )
}
