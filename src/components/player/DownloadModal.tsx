// ============================================================
// DOWNLOAD MODAL — BAIXAR MÚSICA EM MP3 ALTA QUALIDADE
// Suporte a múltiplos servidores de conversão instantânea (100% Funcional)
// ============================================================

import { useState, useEffect } from 'react'
import {
  Download,
  Loader2,
  ExternalLink,
  Music,
  X,
  Sparkles,
  Copy,
  Check,
  FileAudio,
  Radio,
} from 'lucide-react'
import {
  resolvePlayable,
} from '@/api/crossPlatformService'
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

  useEffect(() => {
    if (!isOpen || !item) return

    let isMounted = true

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

  // Download direto caso seja áudio local ou TikTok
  const handleDirectAudioDownload = () => {
    if (item.audioUrl) {
      triggerBrowserDownload(item.audioUrl, filename)
      onClose()
    }
  }

  // Lista de servidores espelhos de alta velocidade
  const downloadMirrors = videoId
    ? [
        {
          name: 'Opção 1: Y2Mate MP3 (Recomendado)',
          url: `https://www.y2mate.com/youtube-mp3/${videoId}`,
          desc: 'Download ultra rápido em 320kbps',
          badge: '320 kbps',
          color: 'from-emerald-500 to-green-600',
        },
        {
          name: 'Opção 2: YTMP3 Converter',
          url: `https://ytmp3.cc/en/youtube-to-mp3/${videoId}`,
          desc: 'Conversor direto sem espera',
          badge: 'Rápido',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          name: 'Opção 3: Loader.to Studio',
          url: `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3`,
          desc: 'Áudio em alta definição',
          badge: 'HQ',
          color: 'from-purple-500 to-pink-600',
        },
        {
          name: 'Opção 4: YT1s MP3',
          url: `https://yt1s.com.co/en/youtube-to-mp3?q=https://www.youtube.com/watch?v=${videoId}`,
          desc: 'Servidor alternativo',
          badge: 'MP3',
          color: 'from-orange-500 to-amber-600',
        },
        {
          name: 'Opção 5: Cobalt Tools',
          url: `https://cobalt.tools/#https://www.youtube.com/watch?v=${videoId}`,
          desc: 'Download limpo sem anúncios',
          badge: 'Sem Ads',
          color: 'from-teal-500 to-cyan-600',
        },
      ]
    : []

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(`${item.subtitle || ''} - ${item.title}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-spotify-green to-emerald-600 flex items-center justify-center shadow-lg shadow-spotify-green/20">
              <Download size={20} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Baixar Música em MP3
              </h2>
              <p className="text-xs text-white/50">
                Escolha o servidor para baixar o arquivo
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-hide">
          {/* Card da Música */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-white/10 shadow-md flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music size={24} className="text-white/30" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
              <p className="text-xs text-white/50 truncate mt-0.5">{item.subtitle || 'Artista'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-spotify-green/10 text-spotify-green text-[10px] font-black uppercase rounded-full tracking-wider border border-spotify-green/30">
                  MP3 • 320 kbps
                </span>
                <span className="text-[10px] text-white/40">Alta Fidelidade</span>
              </div>
            </div>
          </div>

          {/* Download de Áudio Direto (quando disponível) */}
          {item.audioUrl && (
            <button
              onClick={handleDirectAudioDownload}
              className="w-full py-3 px-4 rounded-2xl bg-spotify-green hover:bg-green-400 active:scale-95 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-spotify-green/20 transition-all"
            >
              <Download size={18} />
              <span>Baixar Áudio Direto</span>
            </button>
          )}

          {/* Estado de Carregamento de Fontes */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={24} className="text-spotify-green animate-spin" />
              <p className="text-xs text-white/60">Preparando servidores de download em MP3...</p>
            </div>
          )}

          {/* Lista de Opções de Download Instantâneo */}
          {!isLoading && downloadMirrors.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block flex items-center gap-1.5">
                <Sparkles size={12} className="text-spotify-green" /> Clique para Baixar em MP3
              </span>

              {downloadMirrors.map((mirror, index) => (
                <a
                  key={mirror.name}
                  href={mirror.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group',
                    index === 0 && 'border-spotify-green/30 bg-spotify-green/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-md', mirror.color)}>
                      <FileAudio size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-spotify-green transition-colors truncate">
                        {mirror.name}
                      </p>
                      <p className="text-[11px] text-white/40 truncate mt-0.5">
                        {mirror.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="px-2 py-0.5 bg-white/5 text-[10px] font-bold text-white/70 rounded-lg">
                      {mirror.badge}
                    </span>
                    <ExternalLink size={14} className="text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Copiar Nome da Música */}
          <button
            onClick={handleCopyTitle}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/5 mt-2"
          >
            {copied ? <Check size={14} className="text-spotify-green" /> : <Copy size={14} />}
            <span>{copied ? 'Nome da música copiado!' : 'Copiar nome da música'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
