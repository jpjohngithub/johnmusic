import { useState } from 'react'
import { Youtube, Trash2, Play, Plus, Search, ExternalLink } from 'lucide-react'
import { YouTubeInput } from '@/components/youtube/YouTubeInput'
import { YouTubePlayer } from '@/components/youtube/YouTubePlayer'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import type { YouTubeVideo } from '@/types'

export function YouTubeLibrary() {
  const [filter, setFilter] = useState('')
  const { youtubeVideos, removeYouTubeVideo } = useLibraryStore()
  const { source, youtubeVideo, playYouTubeVideo } = usePlayerStore()

  const filteredVideos = youtubeVideos.filter((v) =>
    v.title.toLowerCase().includes(filter.toLowerCase()) ||
    v.channelTitle.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Youtube size={34} className="text-youtube-red" />
            <span>Biblioteca YouTube</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {youtubeVideos.length} vídeo(s) e música(s) adicionados por URL
          </p>
        </div>
      </div>

      {/* Input box */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-3">
        <h2 className="text-white font-bold text-base flex items-center gap-2">
          <Plus size={18} className="text-youtube-red" />
          <span>Adicionar Nova Música ou Vídeo do YouTube</span>
        </h2>
        <YouTubeInput />
      </div>

      {/* Active YouTube Player */}
      {source === 'youtube' && youtubeVideo && (
        <section className="p-6 rounded-3xl bg-black/80 border border-white/10 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-youtube-red font-bold text-sm">
              <Youtube size={18} />
              <span>Tocando Agora: {youtubeVideo.title}</span>
            </div>
            <a
              href={youtubeVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <span>Abrir no YouTube</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="max-w-4xl mx-auto">
            <YouTubePlayer video={youtubeVideo} />
          </div>
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
              placeholder="Filtrar vídeos..."
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
            const isCurrentPlaying = source === 'youtube' && youtubeVideo?.id === video.id

            return (
              <div
                key={video.id}
                className={`group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border flex flex-col justify-between ${
                  isCurrentPlaying ? 'border-youtube-red/50 bg-youtube-red/5' : 'border-white/5'
                }`}
              >
                {/* Thumbnail */}
                <div
                  onClick={() => playYouTubeVideo(video)}
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
                <div className="mt-3 space-y-1">
                  <p
                    onClick={() => playYouTubeVideo(video)}
                    className="text-white text-sm font-semibold truncate hover:underline cursor-pointer"
                  >
                    {video.title}
                  </p>
                  <p className="text-white/40 text-xs truncate">{video.channelTitle}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
                  <span className="text-[10px] text-white/30">
                    {new Date(video.addedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => removeYouTubeVideo(video.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
              ? 'Nenhum vídeo adicionado ainda. Cole uma URL acima!'
              : 'Nenhum vídeo encontrado para esta busca.'}
          </p>
        </div>
      )}
    </div>
  )
}
