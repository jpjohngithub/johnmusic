import { useState } from 'react'
import { Trash2, Play, Plus, Search, ListPlus, Music2, Sparkles } from 'lucide-react'
import { TikTokInput } from '@/components/tiktok/TikTokInput'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { AddToPlaylistModal } from '@/components/playlist/AddToPlaylistModal'
import { cn } from '@/lib/utils'
import type { PlaylistItem, QueueItem, TikTokVideo } from '@/types'

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" />
  </svg>
)

export function TikTokLibrary() {
  const [filter, setFilter] = useState('')
  const [modalItem, setModalItem] = useState<PlaylistItem | null>(null)
  const { tiktokVideos, removeTikTokVideo } = useLibraryStore()
  const { currentQueueItem, isPlaying, isResolving, playUniversal } = usePlayerStore()

  const handlePlayTikTok = async (video: TikTokVideo) => {
    const queueItem: QueueItem = {
      id: video.id,
      source: 'tiktok',
      title: video.title || 'Vídeo do TikTok',
      subtitle: video.soundTitle ? `Som: ${video.soundTitle} • @${video.authorName}` : `@${video.authorName}`,
      imageUrl: video.thumbnailUrl,
      audioUrl: video.audioUrl,
      tiktokPostId: video.postId,
      tiktokUrl: video.url,
      durationMs: (video.durationSeconds || 30) * 1000,
    }
    await playUniversal([queueItem], 0)
  }

  const filteredVideos = tiktokVideos.filter((v) =>
    (v.title || '').toLowerCase().includes(filter.toLowerCase()) ||
    (v.soundTitle || '').toLowerCase().includes(filter.toLowerCase()) ||
    (v.authorName || '').toLowerCase().includes(filter.toLowerCase())
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
            <span className="text-tiktok-pink"><TikTokIcon /></span>
            <span>Biblioteca TikTok</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {tiktokVideos.length} som(ns) e vídeo(s) com capa original, nome do vídeo e nome do áudio
          </p>
        </div>
      </div>

      {/* Input box */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-3">
        <h2 className="text-white font-bold text-base flex items-center gap-2">
          <Plus size={18} className="text-tiktok-pink" />
          <span>Adicionar Novo Link do TikTok</span>
        </h2>
        <TikTokInput />
      </div>

      {/* Search and Filters */}
      {tiktokVideos.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por vídeo ou áudio..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-tiktok-pink/50"
            />
          </div>
          <span className="text-white/40 text-xs">{filteredVideos.length} resultados</span>
        </div>
      )}

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredVideos.map((video) => {
            const isCurrentPlaying =
              currentQueueItem?.tiktokPostId === video.postId &&
              (isPlaying || isResolving)

            return (
              <div
                key={video.id}
                className={cn(
                  'group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border flex flex-col justify-between space-y-2',
                  isCurrentPlaying ? 'border-tiktok-pink/50 bg-tiktok-pink/5' : 'border-white/5'
                )}
              >
                {/* Vertical Thumbnail (Capa oficial do vídeo) */}
                <div
                  onClick={() => handlePlayTikTok(video)}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/60 cursor-pointer shadow-md flex items-center justify-center"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-tiktok-pink/40">
                      <Music2 size={32} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-tiktok-pink flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                      <Play size={18} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info (Nome do Vídeo + Nome do Áudio) */}
                <div className="space-y-0.5">
                  <p
                    onClick={() => handlePlayTikTok(video)}
                    className="text-white text-xs font-semibold truncate hover:underline cursor-pointer"
                    title={video.title}
                  >
                    {video.title || 'Vídeo do TikTok'}
                  </p>
                  {video.soundTitle && (
                    <p className="text-tiktok-pink text-[11px] font-medium truncate flex items-center gap-1" title={video.soundTitle}>
                      <span className="text-[10px]">🎵</span>
                      <span>{video.soundTitle}</span>
                    </p>
                  )}
                  <p className="text-white/40 text-[10px] truncate">@{video.authorName}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <button
                    onClick={() =>
                      setModalItem({
                        id: video.id,
                        source: 'tiktok',
                        title: video.title || 'Vídeo do TikTok',
                        subtitle: video.soundTitle ? `Som: ${video.soundTitle} • @${video.authorName}` : `@${video.authorName}`,
                        imageUrl: video.thumbnailUrl,
                        tiktokPostId: video.postId,
                        url: video.url,
                        addedAt: video.addedAt,
                      })
                    }
                    className="p-1.5 rounded-lg text-white/40 hover:text-tiktok-pink hover:bg-white/5 transition-colors"
                    title="Adicionar à Playlist"
                  >
                    <ListPlus size={14} />
                  </button>
                  <button
                    onClick={() => removeTikTokVideo(video.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Remover da Biblioteca"
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
          <div className="w-16 h-16 rounded-full bg-tiktok-pink/10 flex items-center justify-center text-tiktok-pink">
            <Sparkles size={28} />
          </div>
          <p className="text-white/60 text-sm">Nenhum som do TikTok adicionado ainda.</p>
          <p className="text-white/30 text-xs">Cole uma URL acima para capturar a capa, nome do vídeo e o áudio exato.</p>
        </div>
      )}
    </div>
  )
}
