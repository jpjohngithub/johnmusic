// ============================================================
// EQUALIZER AUDIO SERVICE — MOTOR DSP WEB AUDIO API (10 BANDAS + HARMONIC BOOSTER)
// Processamento em tempo real com Filtros Biquad, Bass Boost Ativo, Vocal Enhancer e Visualizador FFT
// ============================================================

import { EQ_FREQUENCIES, useEqualizerStore } from '@/store/equalizerStore'

class EqualizerAudioService {
  private ctx: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private preAmpNode: GainNode | null = null
  private filters: BiquadFilterNode[] = []
  private bassBoostNode: BiquadFilterNode | null = null
  private vocalNode: BiquadFilterNode | null = null
  private analyserNode: AnalyserNode | null = null
  private isInitialized = false
  private currentElement: HTMLAudioElement | null = null
  private bassSynthOsc: OscillatorNode | null = null
  private bassSynthGain: GainNode | null = null

  public initContext() {
    if (this.ctx && this.isInitialized) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
      return
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    this.ctx = new AudioContextClass()

    // 1. Pre-Amp Gain Node
    this.preAmpNode = this.ctx.createGain()
    this.preAmpNode.gain.value = 1.0

    // 2. Analyser Node para o Espectro Visualizador
    this.analyserNode = this.ctx.createAnalyser()
    this.analyserNode.fftSize = 64
    this.analyserNode.smoothingTimeConstant = 0.85

    // 3. Cria as 10 bandas de filtro Biquad Paramétrico
    this.filters = EQ_FREQUENCIES.map((freq, index) => {
      const filter = this.ctx!.createBiquadFilter()
      filter.frequency.value = freq

      if (index === 0) {
        filter.type = 'lowshelf'
      } else if (index === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf'
      } else {
        filter.type = 'peaking'
        filter.Q.value = 1.4
      }

      filter.gain.value = 0
      return filter
    })

    // 4. Bass Boost Dedicado (Filtro Ressonante Sub-Grave a 65Hz)
    this.bassBoostNode = this.ctx.createBiquadFilter()
    this.bassBoostNode.type = 'lowshelf'
    this.bassBoostNode.frequency.value = 65
    this.bassBoostNode.gain.value = 0

    // 5. Vocal Enhancer Dedicado (Filtro de Presença Harmônica a 3.2kHz)
    this.vocalNode = this.ctx.createBiquadFilter()
    this.vocalNode.type = 'peaking'
    this.vocalNode.frequency.value = 3200
    this.vocalNode.Q.value = 1.8
    this.vocalNode.gain.value = 0

    // 6. Encadeamento Serial dos Filtros
    let previousNode: AudioNode = this.preAmpNode

    for (const filter of this.filters) {
      previousNode.connect(filter)
      previousNode = filter
    }

    previousNode.connect(this.bassBoostNode)
    this.bassBoostNode.connect(this.vocalNode)
    this.vocalNode.connect(this.analyserNode)
    this.analyserNode.connect(this.ctx.destination)

    this.isInitialized = true
    this.syncWithStore()
  }

  // Conecta o elemento <audio> HTML5 ao circuito DSP do Equalizador
  public attachAudioElement(audioEl: HTMLAudioElement) {
    if (!audioEl) return
    this.initContext()
    if (!this.ctx) return

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }

      if (this.currentElement !== audioEl) {
        this.currentElement = audioEl
        try {
          this.sourceNode = this.ctx.createMediaElementSource(audioEl)
          this.sourceNode.connect(this.preAmpNode!)
        } catch {
          // Source already connected to element
        }
      }
    } catch {}
  }

  // Sincroniza parâmetros DSP com o estado do EqualizerStore
  public syncWithStore() {
    this.initContext()
    if (!this.ctx || !this.isInitialized) return

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }

    const { isEnabled, gains, preAmpGain, bassBoost, vocalClarity } = useEqualizerStore.getState()
    const now = this.ctx.currentTime

    // Pre-Amp
    if (this.preAmpNode) {
      const preAmpLinear = isEnabled ? Math.pow(10, preAmpGain / 20) : 1.0
      this.preAmpNode.gain.setTargetAtTime(preAmpLinear, now, 0.03)
    }

    // 10 Bandas de Frequência
    this.filters.forEach((filter, i) => {
      const targetGain = isEnabled ? (gains[i] || 0) : 0
      filter.gain.setTargetAtTime(targetGain, now, 0.03)
    })

    // Bass Boost (0-100 -> 0dB a +14dB de ganho sub-grave)
    if (this.bassBoostNode) {
      const bassGain = isEnabled ? (bassBoost / 100) * 14 : 0
      this.bassBoostNode.gain.setTargetAtTime(bassGain, now, 0.03)
    }

    // Vocal Enhancer (0-100 -> 0dB a +10dB de ganho harmônico)
    if (this.vocalNode) {
      const vocalGain = isEnabled ? (vocalClarity / 100) * 10 : 0
      this.vocalNode.gain.setTargetAtTime(vocalGain, now, 0.03)
    }
  }

  // Toca um tom harmônico de confirmação acústica ao selecionar um preset
  public playPresetAcousticFeedback(presetId: string) {
    try {
      this.initContext()
      if (!this.ctx) return

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const now = this.ctx.currentTime

      if (presetId === 'bass_boost') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(60, now)
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.35)
      } else if (presetId === 'vocal_enhanced') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25)
      } else if (presetId === 'electronic' || presetId === 'spatial_3d') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.3)
      } else {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(330, now)
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.2)
      }

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.38)
    } catch {}
  }

  // Obtém dados de frequência em tempo real para desenhar o espectro visual
  public getSpectrumData(outputArray: any): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(outputArray)
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }
}

export const equalizerAudioService = new EqualizerAudioService()
