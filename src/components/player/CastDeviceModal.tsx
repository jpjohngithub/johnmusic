// ============================================================
// CAST DEVICE MODAL — TRANSMITIR PARA OUTRO DISPOSITIVO
// Suporte a Google Cast, Smart TV, Spotify Connect, AirPlay, Bluetooth e QR Code Mobile
// ============================================================

import { useState, useEffect } from 'react'
import {
  Tv,
  Cast,
  Smartphone,
  Laptop,
  Speaker,
  Headphones,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  Radio,
  Volume2,
  Share2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAvailableDevices, transferPlayback } from '@/api/spotifyService'
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth'
import { usePlayerStore } from '@/store/playerStore'
import { cn } from '@/lib/utils'
import type { SpotifyDevice } from '@/types'

interface CastDeviceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CastDeviceModal({ isOpen, onClose }: CastDeviceModalProps) {
  const { isAuthenticated } = useSpotifyAuth()
  const { currentQueueItem, youtubeVideo, audioTrack, spotifySavedItem } = usePlayerStore()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'devices' | 'qrcode' | 'audio'>('devices')
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])
  const [selectedOutput, setSelectedOutput] = useState<string>('default')
  const [transferringId, setTransferringId] = useState<string | null>(null)
  const [castMessage, setCastMessage] = useState<string | null>(null)

  // Dispositivos do Spotify Connect
  const {
    data: devicesData,
    isLoading: loadingDevices,
    refetch: refetchDevices,
  } = useQuery({
    queryKey: ['spotify-devices'],
    queryFn: getAvailableDevices,
    enabled: isOpen && isAuthenticated,
    refetchInterval: isOpen ? 5000 : false,
  })

  const spotifyDevices: SpotifyDevice[] = devicesData?.devices || []

  // Lista saídas de áudio do sistema (Bluetooth, fones, alto-falantes)
  useEffect(() => {
    if (!isOpen) return
    async function loadAudioOutputs() {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const outputs = devices.filter((d) => d.kind === 'audiooutput')
          setAudioOutputs(outputs)
        }
      } catch {}
    }
    loadAudioOutputs()
  }, [isOpen])

  // Dispara Transmissão Nativa do Navegador (Google Cast / Presentation API / AirPlay)
  const handleNativeCast = async () => {
    setCastMessage(null)

    // 1. Tenta acionar Presentation API nativa (Chromecast / Smart TV)
    if ('PresentationRequest' in window) {
      try {
        const presentationRequest = new (window as any).PresentationRequest([
          window.location.href,
        ])
        await presentationRequest.start()
        setCastMessage('Transmitindo via Google Cast!')
        return
      } catch (err: any) {
        if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
          // Fallback
        }
      }
    }

    // 2. Tenta acionar RemotePlayback API (AirPlay / Cast em elemento de mídia)
    const mediaEl = document.querySelector('video, audio') as any
    if (mediaEl?.remote?.prompt) {
      try {
        await mediaEl.remote.prompt()
        setCastMessage('Transmitindo para dispositivo remoto!')
        return
      } catch {}
    }

    // 3. Fallback: Mensagem explicativa amigável
    setCastMessage(
      'Para transmitir para Chromecast ou Smart TV: use o menu do navegador (três pontos > Transmitir) ou selecione um dispositivo Spotify Connect abaixo.'
    )
  };

  // Transfere reprodução para dispositivo Spotify Connect
  const handleTransferSpotify = async (device: SpotifyDevice) => {
    if (!device.id) return
    setTransferringId(device.id)
    try {
      await transferPlayback(device.id, true)
      await refetchDevices()
    } catch {
      // ignore
    } finally {
      setTransferringId(null)
    }
  }

  // Gera URL de compartilhamento / sincronização da sessão atual
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const currentTitle =
    currentQueueItem?.title ||
    youtubeVideo?.title ||
    audioTrack?.title ||
    spotifySavedItem?.title ||
    'JohnMusic'
  const currentSubtitle =
    currentQueueItem?.subtitle ||
    youtubeVideo?.channelTitle ||
    audioTrack?.artist ||
    'Tocando agora'

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}&color=ffffff&bgcolor=000000&margin=10`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  // Ícone por tipo de dispositivo
  const getDeviceIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('computer')) return <Laptop size={20} className="text-white" />
    if (t.includes('smartphone') || t.includes('phone')) return <Smartphone size={20} className="text-white" />
    if (t.includes('tv')) return <Tv size={20} className="text-white" />
    if (t.includes('speaker') || t.includes('cast') || t.includes('echo')) return <Speaker size={20} className="text-white" />
    return <Speaker size={20} className="text-white" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Aura Glow */}
        <div className="relative p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-spotify-green to-emerald-600 flex items-center justify-center shadow-lg shadow-spotify-green/20">
              <Cast size={20} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Transmitir Dispositivo
              </h2>
              <p className="text-xs text-white/50">
                Toque em Smart TVs, Chromecast, Celular ou Caixas de Som
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

        {/* Tabs de Transmissão */}
        <div className="flex border-b border-white/5 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('devices')}
            className={cn(
              'pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5',
              activeTab === 'devices'
                ? 'text-spotify-green border-spotify-green'
                : 'text-white/40 border-transparent hover:text-white'
            )}
          >
            <Cast size={14} /> Dispositivos & TV
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={cn(
              'pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5',
              activeTab === 'qrcode'
                ? 'text-spotify-green border-spotify-green'
                : 'text-white/40 border-transparent hover:text-white'
            )}
          >
            <QrCode size={14} /> Celular / QR Code
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={cn(
              'pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5',
              activeTab === 'audio'
                ? 'text-spotify-green border-spotify-green'
                : 'text-white/40 border-transparent hover:text-white'
            )}
          >
            <Headphones size={14} /> Fone & Bluetooth
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-hide">
          {/* TAB 1: DISPOSITIVOS & SMART TV */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {/* Botão de Google Cast / Smart TV Direto */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Tv size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chromecast & Smart TV</h3>
                    <p className="text-xs text-white/50">Transmitir tela e áudio do navegador</p>
                  </div>
                </div>
                <button
                  onClick={handleNativeCast}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                >
                  <Cast size={14} />
                  Transmitir
                </button>
              </div>

              {castMessage && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed animate-in fade-in">
                  💡 {castMessage}
                </div>
              )}

              {/* Spotify Connect Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-spotify-green animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Spotify Connect (Dispositivos na Rede)
                    </span>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => refetchDevices()}
                      disabled={loadingDevices}
                      className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
                      title="Atualizar lista de dispositivos"
                    >
                      <RefreshCw size={12} className={cn(loadingDevices && 'animate-spin')} />
                      Atualizar
                    </button>
                  )}
                </div>

                {!isAuthenticated ? (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                    <p className="text-xs text-white/60">
                      Conecte sua conta Spotify para transmitir diretamente para Amazon Echo, PS5, Smart TVs e outros celulares via Spotify Connect.
                    </p>
                  </div>
                ) : spotifyDevices.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                    <Speaker size={28} className="mx-auto text-white/20 mb-1" />
                    <p className="text-xs font-medium text-white/60">
                      Nenhum dispositivo Spotify Connect ativo no momento.
                    </p>
                    <p className="text-[11px] text-white/40">
                      Abra o Spotify no seu celular, TV ou Echo Dot para ele aparecer aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {spotifyDevices.map((device) => {
                      const isActive = device.is_active
                      const isBusy = transferringId === device.id

                      return (
                        <div
                          key={device.id || device.name}
                          onClick={() => !isActive && handleTransferSpotify(device)}
                          className={cn(
                            'p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer',
                            isActive
                              ? 'bg-spotify-green/10 border-spotify-green/40 shadow-sm shadow-spotify-green/20'
                              : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 hover:border-white/20'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                isActive ? 'bg-spotify-green text-black' : 'bg-white/10 text-white'
                              )}
                            >
                              {getDeviceIcon(device.type)}
                            </div>
                            <div className="min-w-0">
                              <p className={cn('text-sm font-bold truncate', isActive ? 'text-spotify-green' : 'text-white')}>
                                {device.name}
                              </p>
                              <p className="text-[11px] text-white/40 truncate">
                                {device.type} • {isActive ? 'Tocando agora neste dispositivo' : 'Disponível na rede'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <span className="px-2.5 py-1 bg-spotify-green/20 text-spotify-green text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-ping" />
                                Ativo
                              </span>
                            ) : (
                              <button
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all"
                              >
                                {isBusy ? 'Conectando...' : 'Conectar'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE & CELULAR */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                <div className="p-3 bg-black rounded-2xl border border-white/10 shadow-2xl mb-3">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code de Transmissão"
                    className="w-44 h-44 rounded-xl"
                  />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Escaneie com a câmera do celular
                </h3>
                <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-4">
                  Abra o JohnMusic instantaneamente no seu smartphone, tablet ou qualquer outro dispositivo conectado ao mesmo WiFi.
                </p>

                <div className="w-full flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="bg-transparent text-xs text-white/70 flex-1 px-2 focus:outline-none select-all font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all',
                      copied
                        ? 'bg-spotify-green text-black'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    )}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FONES & SAÍDA DE ÁUDIO BLUETOOTH */}
          {activeTab === 'audio' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Dispositivos de Saída (Bluetooth / Alto-falantes)
                </span>
              </div>

              {audioOutputs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                  <Headphones size={24} className="mx-auto text-white/20 mb-1" />
                  <p className="text-xs text-white/60">
                    O áudio está sendo reproduzido no dispositivo padrão do sistema operacional.
                  </p>
                  <p className="text-[11px] text-white/40">
                    Conecte uma caixa Bluetooth ou fone de ouvido pelo painel do seu sistema (Windows / Mac / Android).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {audioOutputs.map((out, idx) => (
                    <div
                      key={out.deviceId || idx}
                      onClick={() => setSelectedOutput(out.deviceId)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer',
                        selectedOutput === out.deviceId
                          ? 'bg-purple-900/20 border-purple-500/40 text-purple-300'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                          <Speaker size={16} />
                        </div>
                        <span className="text-sm font-medium">
                          {out.label || `Dispositivo de Saída #${idx + 1}`}
                        </span>
                      </div>
                      {selectedOutput === out.deviceId && (
                        <Check size={16} className="text-purple-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tocando Agora Footer Badge */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {currentQueueItem?.imageUrl || youtubeVideo?.thumbnailUrl || audioTrack?.artworkUrl ? (
                <img
                  src={
                    currentQueueItem?.imageUrl ||
                    youtubeVideo?.thumbnailUrl ||
                    audioTrack?.artworkUrl
                  }
                  alt={currentTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Radio size={16} className="text-white/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentTitle}</p>
              <p className="text-[11px] text-white/40 truncate">{currentSubtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
