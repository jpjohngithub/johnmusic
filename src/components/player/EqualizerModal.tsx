// ============================================================
// EQUALIZER MODAL — ESTÚDIO DE EQUALIZAÇÃO GRÁFICA (10 BANDAS)
// Presets: Mais Grave, Vocal Enhanced, Rock, Pop, Eletrônica, Acústico + Bass Boost e Espectro FFT
// ============================================================

import { useEffect, useRef } from 'react'
import {
  Sliders,
  Power,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  Flame,
  Music,
  Headphones,
  Volume2,
  X,
  AudioLines,
} from 'lucide-react'
import {
  useEqualizerStore,
  EQ_PRESETS,
  EQ_FREQUENCIES,
  EQ_LABELS,
  type EqPresetId,
} from '@/store/equalizerStore'
import { equalizerAudioService } from '@/api/equalizerAudioService'
import { cn } from '@/lib/utils'

interface EqualizerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EqualizerModal({ isOpen, onClose }: EqualizerModalProps) {
  const {
    isEnabled,
    currentPreset,
    gains,
    bassBoost,
    vocalClarity,
    spatial3d,
    preAmpGain,
    toggleEnabled,
    applyPreset,
    setBandGain,
    setBassBoost,
    setVocalClarity,
    setSpatial3d,
    setPreAmpGain,
    resetToFlat,
  } = useEqualizerStore()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Sincroniza o DSP sempre que os valores mudarem
  useEffect(() => {
    equalizerAudioService.syncWithStore()
  }, [isEnabled, gains, bassBoost, vocalClarity, spatial3d, preAmpGain])

  // Loop de renderização do Espectro de Áudio em Canvas
  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = 32
    const dataArray = new Uint8Array(bufferLength)

    const renderSpectrum = () => {
      equalizerAudioService.getSpectrumData(dataArray)

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      // Fundo suave do espectro
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      bgGradient.addColorStop(0, 'rgba(168, 85, 247, 0.05)')
      bgGradient.addColorStop(1, 'rgba(29, 185, 84, 0.02)')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Linha central de 0 dB
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Desenha curva de resposta de frequência combinada (Gains + FFT em tempo real)
      const barWidth = (width / gains.length)
      ctx.beginPath()

      gains.forEach((gain, i) => {
        const x = i * barWidth + barWidth / 2
        // Normaliza ganho de -12 a +12 para a altura do canvas
        const normalizedGain = (gain + 12) / 24
        // Adiciona um leve pulso do FFT em tempo real se ativo
        const fftValue = isEnabled ? (dataArray[i * 2] || 0) / 255 : 0
        const y = height - (normalizedGain * (height * 0.7) + (height * 0.15) + (fftValue * 15))

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          const prevX = (i - 1) * barWidth + barWidth / 2
          const prevNorm = (gains[i - 1] + 12) / 24
          const prevFft = isEnabled ? (dataArray[(i - 1) * 2] || 0) / 255 : 0
          const prevY = height - (prevNorm * (height * 0.7) + (height * 0.15) + (prevFft * 15))
          const cpX = (prevX + x) / 2
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
        }
      })

      // Gradiente da linha de frequência
      const lineGradient = ctx.createLinearGradient(0, 0, width, 0)
      lineGradient.addColorStop(0, '#10b981')
      lineGradient.addColorStop(0.5, '#a855f7')
      lineGradient.addColorStop(1, '#ec4899')

      ctx.strokeStyle = isEnabled ? lineGradient : 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 3
      ctx.stroke()

      // Pontos brilhantes em cada banda
      gains.forEach((gain, i) => {
        const x = i * barWidth + barWidth / 2
        const normalizedGain = (gain + 12) / 24
        const fftValue = isEnabled ? (dataArray[i * 2] || 0) / 255 : 0
        const y = height - (normalizedGain * (height * 0.7) + (height * 0.15) + (fftValue * 15))

        ctx.fillStyle = isEnabled ? '#10b981' : '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(renderSpectrum)
    }

    renderSpectrum()

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isOpen, gains, isEnabled])

  if (!isOpen) return null

  const activePresetObj = EQ_PRESETS.find((p) => p.id === currentPreset)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-lg',
                isEnabled
                  ? 'bg-gradient-to-br from-spotify-green via-emerald-500 to-purple-600 shadow-spotify-green/20'
                  : 'bg-white/10 text-white/40'
              )}
            >
              <AudioLines size={20} className={isEnabled ? 'text-black' : 'text-white/40'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Equalizador Gráfico</h2>
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider border',
                    isEnabled
                      ? 'bg-spotify-green/10 text-spotify-green border-spotify-green/30'
                      : 'bg-white/5 text-white/40 border-white/10'
                  )}
                >
                  {isEnabled ? (activePresetObj?.name || 'Personalizado') : 'Desativado'}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Ajuste de frequências de estúdio, Bass Boost e clareza vocal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Power Liga / Desliga */}
            <button
              onClick={toggleEnabled}
              className={cn(
                'p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold',
                isEnabled
                  ? 'bg-spotify-green/20 text-spotify-green border-spotify-green/40 shadow-sm shadow-spotify-green/20'
                  : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              )}
              title={isEnabled ? 'Desativar Equalizador' : 'Ativar Equalizador'}
            >
              <Power size={14} className={cn(isEnabled && 'animate-pulse')} />
              <span>{isEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Reset Flat */}
            <button
              onClick={resetToFlat}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Restaurar Padrão (Flat)"
            >
              <RotateCcw size={16} />
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo Scrollável */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
          {/* Canvas do Espectro Gráfico */}
          <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 p-3">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-purple-400" /> Curva de Resposta de Frequência
              </span>
              <span className="text-[10px] font-mono text-white/40">+12dB / -12dB</span>
            </div>
            <canvas
              ref={canvasRef}
              width={560}
              height={90}
              className="w-full h-24 rounded-xl"
            />
          </div>

          {/* Seletor de Presets Rápidos */}
          <div>
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-3">
              Presets de Equalização
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {EQ_PRESETS.map((preset) => {
                const isCurrent = currentPreset === preset.id
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      'p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1 group',
                      isCurrent
                        ? 'bg-spotify-green/15 border-spotify-green/50 text-white shadow-md shadow-spotify-green/10'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-white/70 hover:text-white'
                    )}
                    title={preset.description}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {preset.icon}
                    </span>
                    <span className="text-xs font-bold truncate max-w-full">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Faders das 10 Bandas de Frequência */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Bandas Paramétricas (10 Bandas)
              </span>
              <span className="text-xs text-white/40 font-mono">
                {currentPreset === 'custom' ? 'Modo Manual' : activePresetObj?.name}
              </span>
            </div>

            <div className="grid grid-cols-10 gap-2 h-44 items-end pt-4 pb-2">
              {gains.map((gain, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-between group">
                  {/* Badge de Ganho dB */}
                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold transition-all',
                      gain > 0
                        ? 'text-spotify-green'
                        : gain < 0
                        ? 'text-purple-400'
                        : 'text-white/30'
                    )}
                  >
                    {gain > 0 ? `+${gain}` : gain}
                  </span>

                  {/* Slider Vertical */}
                  <div className="relative flex-1 flex items-center justify-center w-full my-1">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      disabled={!isEnabled}
                      onChange={(e) => setBandGain(idx, parseFloat(e.target.value))}
                      className="h-32 w-1.5 accent-spotify-green bg-white/10 rounded-full cursor-pointer appearance-none [writing-mode:vertical-lr] [direction:rtl]"
                    />
                  </div>

                  {/* Rótulo de Frequência */}
                  <span className="text-[10px] font-medium text-white/50 group-hover:text-white transition-colors truncate max-w-full">
                    {EQ_LABELS[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Controles de Realce Especiais: Bass Boost, Vocal Clarity & Som 3D */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bass Boost */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-xs font-bold text-white">Bass Boost</span>
                </div>
                <span className="text-xs font-mono font-bold text-orange-400">
                  {bassBoost}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bassBoost}
                disabled={!isEnabled}
                onChange={(e) => setBassBoost(Number(e.target.value))}
                className="w-full h-1.5 accent-orange-500 bg-white/10 rounded-full cursor-pointer"
              />
              <p className="text-[10px] text-white/40">Graves profundos e sub-ressonância</p>
            </div>

            {/* Vocal Enhanced */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-white">Realce Vocal</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {vocalClarity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={vocalClarity}
                disabled={!isEnabled}
                onChange={(e) => setVocalClarity(Number(e.target.value))}
                className="w-full h-1.5 accent-blue-500 bg-white/10 rounded-full cursor-pointer"
              />
              <p className="text-[10px] text-white/40">Presença harmônica e nitidez de voz</p>
            </div>

            {/* Som 3D Espacial */}
            <div
              onClick={() => isEnabled && setSpatial3d(!spatial3d)}
              className={cn(
                'p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between',
                spatial3d && isEnabled
                  ? 'bg-purple-900/30 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones size={16} className={spatial3d && isEnabled ? 'text-purple-400' : ''} />
                  <span className="text-xs font-bold text-white">Som 3D Espacial</span>
                </div>
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    spatial3d && isEnabled ? 'bg-purple-400 animate-ping' : 'bg-white/20'
                  )}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2">Palco sonoro tridimensional imersivo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
