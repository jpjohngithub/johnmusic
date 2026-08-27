// ============================================================
// DOWNLOAD MODAL — DOWNLOAD DE MÚSICA EM MP3 DIRETO NO APLICATIVO
// Sistema integrado sem sair do site (Clicou Baixou)
// ============================================================

import { useState, useEffect } from 'react'
import {
  Download,
  Loader2,
  Music,
  X,
  Sparkles,
  Copy,
  Check,
  FileAudio,
  Radio,
  ExternalLink,
} from 'lucide-react'
import { resolvePlayable } from '@/api/crossPlatformService'
import {
  triggerBrowserDownload,
  sanitizeFilename,
  type DownloadSource,
} from '@/api/downloadService'
import { cn } from '@/lib/utils'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  item: DownloadSource | null
}

export function DownloadModal({ isOpen, onClose, item }: DownloadModalProps) {
  const [resolvedVideoId, setResolvedVideoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || !item) return

    let isMounted = true
    setIframeLoaded(false)

    async function loadAudioSource() {
      if (item?.videoId) {
        setResolvedVideoId(item.videoId)
        return
      }

      if (item?.audioUrl) {
        setResolvedVideoId(null)
        return
      }

      setIsLoading(true)
      try {
        const resolved = await resolvePlayable({
          id: item?.id || crypto.randomUUID(),
          title: item?.title || '',
          subtitle: item?.subtitle,
          source: (item?.source as any) || 'spotify',
          uri: item?.uri,
          durationMs: 0,
        } as any)

        if (isMounted) {
          if (resolved?.videoId) {
            setResolvedVideoId(resolved.videoId)
          } else {
            const { searchYouTubeKeyless } = await import('@/api/youtubeSearchService')
            const query = `${item?.subtitle || ''} ${item?.title || ''}`.trim()
            const matches = await searchYouTubeKeyless(query, 1)
            if (matches.length > 0 && isMounted) {
              setResolvedVideoId(matches[0].videoId)
            }
          }
        }
      } catch {
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAudioSource()

    return () => {
      isMounted = false
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

  const videoId = resolvedVideoId || item.videoId || ''
  const cleanTitle = sanitizeFilename(item.title || 'musica')
  const cleanArtist = sanitizeFilename(item.subtitle || 'JohnMusic')
  const filename = `${cleanArtist} - ${cleanTitle}.mp3`

  // Download direto para faixas com áudio nativo
  const handleDirectAudioDownload = () => {
    if (item.audioUrl) {
      triggerBrowserDownload(item.audioUrl, filename)
      onClose()
    }
  }

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(`${item.subtitle || ''} - ${item.title}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loaderEmbedUrl = videoId
    ? `https://loader.to/api/button/?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&f=mp3&color=1db954`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-spotify-green to-emerald-600 flex items-center justify-center shadow-lg shadow-spotify-green/20">
              <Download size={20} className="text-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Baixar MP3 Instantâneo
              </h2>
              <p className="text-xs text-white/50">
                Download direto sem sair do aplicativo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-hide">
          {/* Card da Música */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-white/10 shadow-md flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music size={22} className="text-white/30" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
              <p className="text-xs text-white/50 truncate mt-0.5">{item.subtitle || 'Artista'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 bg-spotify-green/10 text-spotify-green text-[10px] font-black uppercase rounded-full tracking-wider border border-spotify-green/30">
                  MP3 • 320 kbps
                </span>
                <span className="text-[10px] text-white/40">Áudio Puro</span>
              </div>
            </div>
          </div>

          {/* Download de Áudio Direto (quando disponível) */}
          {item.audioUrl && (
            <button
              onClick={handleDirectAudioDownload}
              className="w-full py-3.5 px-4 rounded-2xl bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-spotify-green/20 transition-all"
            >
              <Download size={18} />
              <span>Baixar Arquivo MP3 Agora</span>
            </button>
          )}

          {/* Carregando fonte */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={26} className="text-spotify-green animate-spin" />
              <p className="text-xs text-white/60">Preparando áudio em MP3 de alta fidelidade...</p>
            </div>
          )}

          {/* Botão de Download Integrado no Aplicativo */}
          {!isLoading && loaderEmbedUrl && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-spotify-green/30 bg-black/40 p-1">
                {!iframeLoaded && (
                  <div className="h-16 flex items-center justify-center gap-2 text-white/50 text-xs">
                    <Loader2 size={16} className="animate-spin text-spotify-green" />
                    <span>Carregando botão de download...</span>
                  </div>
                )}
                <iframe
                  src={loaderEmbedUrl}
                  title="Download MP3"
                  className={cn(
                    'w-full h-16 border-0 rounded-xl transition-opacity duration-300',
                    iframeLoaded ? 'opacity-100' : 'opacity-0 h-0'
                  )}
                  onLoad={() => setIframeLoaded(true)}
                  allow="autoplay"
                />
              </div>

              {/* Botões Rápidos Alternativos sem Redirecionamento */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://www.y2mate.com/youtube-mp3/${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs text-white/80 hover:text-white font-semibold"
                >
                  <FileAudio size={14} className="text-spotify-green" />
                  <span>Servidor 1 (320k)</span>
                </a>

                <a
                  href={`https://ytmp3.cc/en/youtube-to-mp3/${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs text-white/80 hover:text-white font-semibold"
                >
                  <Sparkles size={14} className="text-purple-400" />
                  <span>Servidor 2 (Rápido)</span>
                </a>
              </div>
            </div>
          )}

          {/* Copiar Nome da Música */}
          <button
            onClick={handleCopyTitle}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/5"
          >
            {copied ? <Check size={14} className="text-spotify-green" /> : <Copy size={14} />}
            <span>{copied ? 'Nome da música copiado!' : 'Copiar nome da faixa'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
