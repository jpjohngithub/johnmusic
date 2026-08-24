import { useState } from 'react'
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [clientId, setClientId] = useState(
    localStorage.getItem('custom_spotify_client_id') || ''
  )
  const [clientSecret, setClientSecret] = useState(
    localStorage.getItem('custom_spotify_client_secret') || ''
  )
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (clientId.trim()) {
      localStorage.setItem('custom_spotify_client_id', clientId.trim())
    } else {
      localStorage.removeItem('custom_spotify_client_id')
    }

    if (clientSecret.trim()) {
      localStorage.setItem('custom_spotify_client_secret', clientSecret.trim())
    } else {
      localStorage.removeItem('custom_spotify_client_secret')
    }

    localStorage.removeItem('spotify_app_token')
    localStorage.removeItem('spotify_app_token_exp')

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
      window.location.reload()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#181818] border border-white/10 p-6 shadow-2xl space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-spotify-green/20 text-spotify-green flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Chaves de Acesso Spotify</h2>
              <p className="text-white/40 text-xs">Conectar todas as músicas e APIs sem login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-white/70">
          <div className="flex items-center gap-1.5 text-spotify-green font-semibold">
            <Sparkles size={14} />
            <span>Acesso Total ao Catálogo Global do Spotify (+100M Músicas)</span>
          </div>
          <p>
            Ao fornecer seu <strong>Client ID</strong> e <strong>Client Secret</strong> do{' '}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-spotify-green hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              Spotify Dashboard <ExternalLink size={10} />
            </a>
            , o site conecta o <em>Client Credentials Flow</em> e desbloqueia busca em tempo real de todo o acervo do Spotify sem precisar que nenhum usuário faça login.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70">Spotify Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="ex: 4cOdK2wGLETKBW3PvgPWqT..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/30 focus:outline-none focus:border-spotify-green"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70">Spotify Client Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="ex: 8f7e6d5c4b3a21..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/30 focus:outline-none focus:border-spotify-green"
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-green-400 text-black text-xs font-bold transition-all shadow-lg shadow-spotify-green/20"
            >
              {saved ? <Check size={14} /> : <ShieldCheck size={14} />}
              <span>{saved ? 'Salvo!' : 'Salvar e Conectar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
