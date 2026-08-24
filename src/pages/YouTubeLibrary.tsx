import { useState } from 'react'
import { Youtube, Trash2, Play, Plus, Search, ListPlus } from 'lucide-react'
import { YouTubeInput } from '@/components/youtube/YouTubeInput'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { searchYouTubeKeyless, matchToSearchResult } from '@/api/youtubeSearchService'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem, YouTubeSearchResult, YouTubeVideo } from '@/types'

export function YouTubeLibrary() {
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)

  const { youtubeVideos, removeYouTubeVideo } = useLibraryStore()
  const { currentQueueItem, isPlaying, isResolving, playUniversal } = usePlayerStore()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const matches = await searchYouTubeKeyless(query.trim(), 20)
      setResults(matches.map(matchToSearchResult))
    } finally {
      setSearching(false)
    }
  }

  async function handlePlayVideo(video: YouTubeVideo) {
    const queueItem: QueueItem = {
      id: video.id,
      source: 'youtube',
      title: video.title,
      subtitle: video.channelTitle,
      imageUrl: video.thumbnailUrl,
      videoId: video.videoId,
    }
    await playUniversal([queueItem], 0)
  }

  async function handlePlayResult(r: YouTubeSearchResult) {
    const queueItem: QueueItem = {
      id: `yt-${r.videoId}`,
      source: 'youtube',
      title: r.title,
      subtitle: r.channelTitle,
      imageUrl: r.thumbnailUrl,
      videoId: r.videoId,
    }
    await playUniversal([queueItem], 0)
  }

  const filteredVideos = youtubeVideos.filter((v) =>
    v.title.toLowerCase().includes(filter.toLowerCase()) ||
    v.channelTitle.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-16">
      {/* Modal Adicionar à Playlist */}
      <AddToPlaylistModal
        isOpen={modalItem !== null}
        onClose={() => setModalItem(null)}
        item={modalItem}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Youtube size={34} className="text-youtube-red" />
            <span>Biblioteca YouTube</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {youtubeVideos.length} vídeo(s) salvos • busca e reprodução unificada
          </p>
        </div>
      </div>

      {/* Search box */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar músicas no YouTube..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-youtube-red/50"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="px-5 py-2.5 rounded-lg bg-youtube-red hover:bg-red-600 disabled:opacity-40 transition-colors text-white text-sm font-bold"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
        <details className="group">
          <summary className="cursor-pointer text-white/50 hover:text-white text-xs flex items-center gap-1.5 list-none select-none">
            <Plus size={14} /> Prefere colar uma URL do YouTube? Clique aqui
          </summary>
          <div className="pt-3">
            <YouTubeInput />
          </div>
        </details>
      </div>

      {/* Search results */}
      {results !== null && (
        <section className="space-y-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Search size={18} className="text-youtube-red" />
            Resultados para "{query}"
          </h2>
          {results.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhum resultado encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 flex flex-col justify-between space-y-2"
                >
                  <div
                    onClick={() => handlePlayResult(r)}
                    className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer shadow-md"
                  >
                    <img
                      src={r.thumbnailUrl}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-youtube-red flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                        <Play size={20} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p
                      onClick={() => handlePlayResult(r)}
                      className="text-white text-sm font-semibold line-clamp-2 hover:underline cursor-pointer"
                    >
                      {r.title}
                    </p>
                    <p className="text-white/40 text-xs truncate mt-0.5">{r.channelTitle}</p>
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-white/5">
                    <button
                      onClick={() =>
                        setModalItem({
                          id: `yt-${r.videoId}`,
                          source: 'youtube',
                          title: r.title,
                          subtitle: r.channelTitle,
                          imageUrl: r.thumbnailUrl,
                          videoId: r.videoId,
                          url: r.url,
                          addedAt: new Date().toISOString(),
                        })
                      }
                      className="p-1 text-white/40 hover:text-spotify-green text-xs flex items-center gap-1 transition-colors"
                      title="Adicionar à Playlist"
                    >
                      <ListPlus size={14} />
                      <span className="text-[10px]">Adicionar à Playlist</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Search and Filters */}
      {youtubeVideos.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar vídeos salvos..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-youtube-red/50"
            />
          </div>
          <span className="text-white/40 text-xs">{filteredVideos.length} resultados</span>
        </div>
      )}

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVideos.map((video) => {
            const isCurrentPlaying =
              currentQueueItem?.videoId === video.videoId &&
              (isPlaying || isResolving)

            return (
              <div
                key={video.id}
                className={cn(
                  'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border flex flex-col justify-between space-y-2',
                  isCurrentPlaying ? 'border-youtube-red/50 bg-youtube-red/5' : 'border-white/5'
                )}
              >
                {/* Thumbnail */}
                <div
                  onClick={() => handlePlayVideo(video)}
                  className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer shadow-md"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-youtube-red flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                      <Play size={20} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <p
                    onClick={() => handlePlayVideo(video)}
                    className="text-white text-sm font-semibold truncate hover:underline cursor-pointer"
                  >
                    {video.title}
                  </p>
                  <p className="text-white/40 text-xs truncate mt-0.5">{video.channelTitle}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() =>
                      setModalItem({
                        id: video.id,
                        source: 'youtube',
                        title: video.title,
                        subtitle: video.channelTitle,
                        imageUrl: video.thumbnailUrl,
                        videoId: video.videoId,
                        url: video.url,
                        addedAt: video.addedAt,
                      })
                    }
                    className="p-1 rounded-lg text-white/40 hover:text-spotify-green transition-colors"
                    title="Adicionar à Playlist"
                  >
                    <ListPlus size={14} />
                  </button>
                  <button
                    onClick={() => removeYouTubeVideo(video.id)}
                    className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover da biblioteca"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-youtube-red/10 text-youtube-red flex items-center justify-center">
            <Youtube size={32} />
          </div>
          <p className="text-white/60 text-sm font-medium">
            {youtubeVideos.length === 0
              ? 'Nenhum vídeo adicionado ainda. Cole uma URL acima ou faça uma busca!'
              : 'Nenhum vídeo encontrado para esta busca.'}
          </p>
        </div>
      )}
    </div>
  )
}
