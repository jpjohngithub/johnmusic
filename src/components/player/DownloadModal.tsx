// ============================================================
// DOWNLOAD MODAL — BAIXAR MÚSICA EM MP3 ALTA QUALIDADE
// Suporte a download direto em 1 clique e servidores espelho
// ============================================================

import { useState } from 'react'
import {
  Download,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Music,
  X,
  Sparkles,
  Copy,
  FileAudio,
} from 'lucide-react'
import {
  processTrackDownload,
  getExternalDownloadLinks,
  type DownloadSource,
} from '@/api/downloadService'
import { cn } from '@/lib/utils'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  item: DownloadSource | null
}

export function DownloadModal({ isOpen, onClose, item }: DownloadModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen || !item) return null

  const handleStartDownload = async () => {
    setIsDownloading(true)
    setErrorMessage(null)
    setDownloadSuccess(false)

    try {
      const res = await processTrackDownload(item)
      if (res.success) {
        setDownloadSuccess(true)
        setTimeout(() => setDownloadSuccess(false), 5000)
      } else {
        setErrorMessage(res.error || 'Erro ao processar o download da faixa.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao iniciar o download. Tente uma das opções alternativas abaixo.')
    } finally {
      setIsDownloading(false)
    }
  }

  const videoId = item.videoId || ''
  const externalMirrors = videoId ? getExternalDownloadLinks(videoId, item.title) : []

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(`${item.subtitle || ''} - ${item.title}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
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
                Baixar Música MP3
              </h2>
              <p className="text-xs text-white/50">
                Áudio de alta fidelidade para ouvir offline
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-hide">
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
                <span className="text-[10px] text-white/40">HQ Audio</span>
              </div>
            </div>
          </div>

          {/* Botão de Download Principal */}
          <button
            onClick={handleStartDownload}
            disabled={isDownloading}
            className={cn(
              'w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl',
              downloadSuccess
                ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                : 'bg-spotify-green hover:bg-green-400 active:scale-95 text-black shadow-spotify-green/20'
            )}
          >
            {isDownloading ? (
              <>
                <Loader2 size={18} className="animate-spin text-black" />
                <span>Processando Áudio MP3...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check size={18} className="text-black" />
                <span>Download Iniciado!</span>
              </>
            ) : (
              <>
                <Download size={18} className="text-black" />
                <span>Baixar MP3 Direto</span>
              </>
            )}
          </button>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <Check size={14} className="flex-shrink-0" />
              <span>O download começou! Verifique a pasta Downloads do seu computador.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Espelhos de Download Alternativos */}
          {externalMirrors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-2 flex items-center gap-1.5">
                <Sparkles size={12} className="text-purple-400" /> Servidores Espelho de Download
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {externalMirrors.map((mirror) => (
                  <a
                    key={mirror.name}
                    href={mirror.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between text-xs text-white/80 hover:text-white group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileAudio size={14} className="text-spotify-green flex-shrink-0" />
                      <span className="truncate">{mirror.name.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-white/40">{mirror.badge}</span>
                      <ExternalLink size={12} className="text-white/40 group-hover:text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Copiar Título */}
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
