import { useState } from 'react'
import { Plus, Download, Music2, Sparkles, X, Loader2, Check } from 'lucide-react'
import { importSpotifyPlaylist } from '@/api/playlistImportService'
import { isValidSpotifyUrl } from '@/api/spotifyUrlService'
import { useLibraryStore } from '@/store/libraryStore'
import { useNavigate } from 'react-router-dom'

interface PlaylistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlaylistModal({ isOpen, onClose }: PlaylistModalProps) {
  const [tab, setTab] = useState<'create' | 'import'>('create')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { createCustomPlaylist, addCustomPlaylist } = useLibraryStore()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newPl = createCustomPlaylist(name.trim(), description.trim())
    setName('')
    setDescription('')
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      onClose()
      navigate(`/playlist/${newPl.id}`)
    }, 400)
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!spotifyUrl.trim()) return

    if (!isValidSpotifyUrl(spotifyUrl)) {
      setError('URL inválida. Cole um link como: open.spotify.com/playlist/...')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const imported = await importSpotifyPlaylist(spotifyUrl.trim())
      addCustomPlaylist(imported)
      setSpotifyUrl('')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        navigate(`/playlist/${imported.id}`)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar playlist do Spotify')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#181818] border border-white/10 p-6 shadow-2xl space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-spotify-green to-emerald-400 text-black flex items-center justify-center font-bold">
              <Music2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Playlists</h2>
              <p className="text-white/40 text-xs">Criar nova ou importar do Spotify</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => { setTab('create'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'create'
                ? 'bg-spotify-green text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Plus size={14} />
            <span>Criar Playlist Nova</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('import'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'import'
                ? 'bg-spotify-green text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Download size={14} />
            <span>Importar do Spotify</span>
          </button>
        </div>

        {/* Form Create */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Nome da Playlist</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Minhas Músicas Favoritas"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/30 focus:outline-none focus:border-spotify-green"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Descrição (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Músicas para malhar, trabalhar, relaxar..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-spotify-green resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-green-400 active:scale-95 text-black text-xs font-bold transition-all disabled:opacity-40 shadow-lg shadow-spotify-green/20"
              >
                {success ? <Check size={14} /> : <Plus size={14} />}
                <span>{success ? 'Criada!' : 'Criar Playlist'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Form Import */}
        {tab === 'import' && (
          <form onSubmit={handleImport} className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs text-white/70">
              <div className="flex items-center gap-1.5 text-spotify-green font-semibold">
                <Sparkles size={14} />
                <span>Importação Direta de Playlist</span>
              </div>
              <p className="text-[11px] text-white/50">
                Cole o link de qualquer playlist do Spotify para trazê-la para o JohnMusic 2.0. As faixas e o player oficial serão importados automaticamente.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">URL da Playlist no Spotify</label>
              <input
                type="url"
                value={spotifyUrl}
                onChange={(e) => { setSpotifyUrl(e.target.value); setError(null) }}
                placeholder="https://open.spotify.com/playlist/37i9dQZF1DX..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/30 focus:outline-none focus:border-spotify-green"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !spotifyUrl.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-green-400 active:scale-95 text-black text-xs font-bold transition-all disabled:opacity-40 shadow-lg shadow-spotify-green/20"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : success ? <Check size={14} /> : <Download size={14} />}
                <span>{isLoading ? 'Importando...' : success ? 'Importada!' : 'Importar Playlist'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
