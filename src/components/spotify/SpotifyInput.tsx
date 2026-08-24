import { useState } from 'react'
import { Music2, Plus, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { createSpotifyItemFromUrl, isValidSpotifyUrl } from '@/api/spotifyUrlService'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import type { SpotifySavedItem } from '@/types'

interface SpotifyInputProps {
  onItemAdded?: (item: SpotifySavedItem) => void
  autoPlay?: boolean
}

export function SpotifyInput({ onItemAdded, autoPlay = true }: SpotifyInputProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<SpotifySavedItem | null>(null)

  const { addSpotifyItem } = useLibraryStore()
  const { playSpotifySavedItem } = usePlayerStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    if (!isValidSpotifyUrl(url)) {
      setError('URL inválida. Use links do Spotify como: open.spotify.com/track/... ou open.spotify.com/playlist/...')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { parseSpotifyUrl } = await import('@/api/spotifyUrlService')
      const parsed = parseSpotifyUrl(url.trim())

      if (parsed?.type === 'playlist' || parsed?.type === 'album') {
        const { importSpotifyPlaylist } = await import('@/api/playlistImportService')
        const pl = await importSpotifyPlaylist(url.trim())
        useLibraryStore.getState().addCustomPlaylist(pl)
        setUrl('')

        if (autoPlay && pl.items.length > 0) {
          const { playUniversal } = usePlayerStore.getState()
          const queueItems = pl.items.map((i) => ({
            id: i.id,
            source: 'spotify' as const,
            title: i.title,
            subtitle: i.subtitle,
            imageUrl: i.imageUrl,
            uri: i.uri,
            durationMs: i.durationMs,
          }))
          await playUniversal(queueItems, 0)
        }
        return
      }

      const item = await createSpotifyItemFromUrl(url.trim())
      addSpotifyItem(item)
      setLastAdded(item)
      setUrl('')

      if (autoPlay) {
        playSpotifySavedItem(item)
      }

      onItemAdded?.(item)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar URL do Spotify')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <Music2 size={20} className="text-spotify-green" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            placeholder="Cole qualquer link do Spotify (música, playlist, álbum) sem precisar de login..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-spotify-green/70 focus:ring-2 focus:ring-spotify-green/20 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-5 py-3.5 bg-spotify-green hover:bg-purple-400 active:scale-95 text-black rounded-xl font-bold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-spotify-green/20 flex-shrink-0"
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
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-spotify-green/20 text-spotify-green flex items-center justify-center flex-shrink-0">
                <Music2 size={20} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-spotify-green text-[11px] font-semibold">
                <Sparkles size={12} />
                <span>Salvo na sua Biblioteca!</span>
              </div>
              <p className="text-white text-xs font-semibold truncate">{lastAdded.title}</p>
              <p className="text-white/40 text-[10px] truncate">{lastAdded.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => playSpotifySavedItem(lastAdded)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
          >
            Tocar Agora
          </button>
        </div>
      )}
    </div>
  )
}
