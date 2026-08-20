import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Music2, Loader2, AlertCircle } from 'lucide-react'

interface CallbackProps {
  onHandleCallback: (code: string) => Promise<void>
}

export function Callback({ onHandleCallback }: CallbackProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const err = searchParams.get('error')

    if (err) {
      setError(`Autorização recusada: ${err}`)
      return
    }

    if (!code) {
      setError('Código de autorização não encontrado.')
      return
    }

    const processAuth = async () => {
      try {
        await onHandleCallback(code)
        navigate('/spotify', { replace: true })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao processar login')
      }
    }

    processAuth()
  }, [searchParams, onHandleCallback, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-spotify-green/10 border border-spotify-green/20 flex items-center justify-center text-spotify-green shadow-2xl">
        <Music2 size={40} className="animate-pulse" />
      </div>

      {error ? (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <AlertCircle size={16} />
            <span>Erro de Autenticação</span>
          </div>
          <p className="text-white/60 text-sm">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-spotify-green">
            <Loader2 size={20} className="animate-spin" />
            <h2 className="text-lg font-bold text-white">Conectando ao Spotify...</h2>
          </div>
          <p className="text-white/40 text-xs">
            Sincronizando suas playlists e biblioteca de músicas.
          </p>
        </div>
      )}
    </div>
  )
}
