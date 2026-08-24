import { useState } from 'react'
import { Plus, Check, Music2, X, Sparkles, FolderPlus } from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import type { PlaylistItem } from '@/types'

interface AddToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  item: PlaylistItem | null
}

export function AddToPlaylistModal({ isOpen, onClose, item }: AddToPlaylistModalProps) {
  const { customPlaylists, addItemToCustomPlaylist, createCustomPlaylist } = useLibraryStore()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null)

  if (!isOpen || !item) return null

  const handleAddToPlaylist = (playlistId: string) => {
    addItemToCustomPlaylist(playlistId, item)
    setAddedPlaylistId(playlistId)
    setTimeout(() => {
      setAddedPlaylistId(null)
      onClose()
    }, 600)
  }

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return

    const newPl = createCustomPlaylist(newPlaylistName.trim())
    addItemToCustomPlaylist(newPl.id, item)
    setNewPlaylistName('')
    setShowCreateInput(false)
    setAddedPlaylistId(newPl.id)
    setTimeout(() => {
      setAddedPlaylistId(null)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-[#181818] border border-white/10 p-6 shadow-2xl space-y-5 animate-slide-up select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-spotify-green/20 text-spotify-green flex items-center justify-center flex-shrink-0">
              <Music2 size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white">Adicionar à Playlist</h2>
              <p className="text-white/40 text-xs truncate max-w-[240px]">
                {item.title} • {item.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Create Option */}
        {!showCreateInput ? (
          <button
            onClick={() => setShowCreateInput(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-spotify-green text-xs font-bold transition-all border border-spotify-green/20 hover:border-spotify-green/40"
          >
            <FolderPlus size={16} />
            <span>Criar Nova Playlist com Esta Música</span>
          </button>
        ) : (
          <form onSubmit={handleCreateAndAdd} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nome da nova playlist..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-spotify-green"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2.5 bg-spotify-green hover:bg-green-400 text-black text-xs font-bold rounded-xl disabled:opacity-40 transition-all"
              >
                Criar e Salvar
              </button>
            </div>
          </form>
        )}

        {/* Playlist List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider px-1">
            Suas Playlists ({customPlaylists.length})
          </p>

          {customPlaylists.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <Sparkles size={24} className="text-white/20 mx-auto" />
              <p className="text-white/50 text-xs">Você ainda não tem playlists criadas.</p>
            </div>
          ) : (
            customPlaylists.map((pl) => {
              const alreadyHas = pl.items.some((i) => i.id === item.id || i.title === item.title)
              const isAdded = addedPlaylistId === pl.id

              return (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music2 size={18} className="text-spotify-green" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold truncate group-hover:text-spotify-green transition-colors">
                        {pl.name}
                      </p>
                      <p className="text-white/40 text-[10px] truncate">
                        {pl.items.length} faixa(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 pl-2">
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-spotify-green text-xs font-bold animate-pulse">
                        <Check size={14} /> Salvo!
                      </span>
                    ) : alreadyHas ? (
                      <span className="text-white/30 text-[10px] font-medium">Já adicionada</span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-spotify-green group-hover:text-black text-white/50 text-xs font-bold transition-colors">
                        <Plus size={14} />
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
