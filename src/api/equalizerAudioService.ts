// ============================================================
// EQUALIZER AUDIO SERVICE — MOTOR DSP WEB AUDIO API (10 BANDAS)
// Processamento em tempo real com Filtros Biquad, Bass Boost, Vocal Enhancer e Visualizador FFT
// ============================================================

import { EQ_FREQUENCIES, useEqualizerStore } from '@/store/equalizerStore'

class EqualizerAudioService {
  private ctx: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private preAmpNode: GainNode | null = null
  private filters: BiquadFilterNode[] = []
  private bassBoostNode: BiquadFilterNode | null = null
  private vocalNode: BiquadFilterNode | null = null
  private spatialDelayLeft: DelayNode | null = null
  private spatialDelayRight: DelayNode | null = null
  private mergerNode: ChannelMergerNode | null = null
  private splitterNode: ChannelSplitterNode | null = null
  private analyserNode: AnalyserNode | null = null
  private isInitialized = false
  private currentElement: HTMLAudioElement | null = null

  private initContext() {
    if (this.ctx && this.isInitialized) return

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

    // 4. Bass Boost Dedicado (Filtro Ressonante Sub-Grave a 80Hz)
    this.bassBoostNode = this.ctx.createBiquadFilter()
    this.bassBoostNode.type = 'lowshelf'
    this.bassBoostNode.frequency.value = 80
    this.bassBoostNode.gain.value = 0

    // 5. Vocal Enhancer Dedicado (Filtro de Presença Harmônica a 3.2kHz)
    this.vocalNode = this.ctx.createBiquadFilter()
    this.vocalNode.type = 'peaking'
    this.vocalNode.frequency.value = 3200
    this.vocalNode.Q.value = 1.8
    this.vocalNode.gain.value = 0

    // 6. Encadeamento Serial dos Filtros
    // PreAmp -> Filter[0] -> ... -> Filter[9] -> BassBoost -> Vocal -> Analyser -> Destination
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
    if (this.currentElement === audioEl && this.sourceNode) return

    try {
      this.initContext()
      if (!this.ctx) return

      // Resume context se estiver suspenso por política de autoplay
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }

      // Se já existia um elemento anterior conectado, reconecta
      if (this.currentElement !== audioEl) {
        this.currentElement = audioEl
        this.sourceNode = this.ctx.createMediaElementSource(audioEl)
        this.sourceNode.connect(this.preAmpNode!)
      }
    } catch {
      // Ignora erro se createMediaElementSource já foi chamado no elemento
    }
  }

  // Sincroniza parâmetros DSP com o estado do EqualizerStore
  public syncWithStore() {
    if (!this.ctx || !this.isInitialized) return

    const { isEnabled, gains, preAmpGain, bassBoost, vocalClarity } = useEqualizerStore.getState()
    const now = this.ctx.currentTime

    // Pre-Amp
    if (this.preAmpNode) {
      const preAmpLinear = isEnabled ? Math.pow(10, preAmpGain / 20) : 1.0
      this.preAmpNode.gain.setTargetAtTime(preAmpLinear, now, 0.05)
    }

    // 10 Bandas de Frequência
    this.filters.forEach((filter, i) => {
      const targetGain = isEnabled ? gains[i] || 0 : 0
      filter.gain.setTargetAtTime(targetGain, now, 0.05)
    })

    // Bass Boost (0-100 -> 0dB a +10dB)
    if (this.bassBoostNode) {
      const bassGain = isEnabled ? (bassBoost / 100) * 10 : 0
      this.bassBoostNode.gain.setTargetAtTime(bassGain, now, 0.05)
    }

    // Vocal Enhancer (0-100 -> 0dB a +8dB)
    if (this.vocalNode) {
      const vocalGain = isEnabled ? (vocalClarity / 100) * 8 : 0
      this.vocalNode.gain.setTargetAtTime(vocalGain, now, 0.05)
    }
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
