// ============================================================
// DJ AUDIO FX SERVICE — MOTOR HARMÔNICO DE TRANSIÇÃO MÁGICA
// Síntese de áudio procedural via Web Audio API (Filtros Espaciais,
// Riser Sub-harmônico e Shimmer de Fusão Sonora para Transição DJ)
// ============================================================

class DJAudioFXService {
  private ctx: AudioContext | null = null

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * Dispara o efeito sonoro de transição mágica interestelar (Harmonic DJ Sweep).
   * Cria uma cola sonora cinematográfica que conecta harmonicamente duas músicas.
   */
  public playMagicTransitionSweep(durationSec = 5.0) {
    try {
      const ctx = this.initContext()
      if (!ctx) return

      const now = ctx.currentTime

      // 1. Oscilador Sub-Harmônico Suave (Warm Sub Drone)
      const subOsc = ctx.createOscillator()
      const subGain = ctx.createGain()
      subOsc.type = 'sine'
      subOsc.frequency.setValueAtTime(55, now) // A1 note
      subOsc.frequency.exponentialRampToValueAtTime(110, now + durationSec * 0.7) // Riser até A2

      subGain.gain.setValueAtTime(0.0001, now)
      subGain.gain.exponentialRampToValueAtTime(0.035, now + durationSec * 0.35)
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

      subOsc.connect(subGain)
      subGain.connect(ctx.destination)

      // 2. Shimmer Filtro Espacial (Pink noise com Bandpass Filter Sweep)
      const bufferSize = ctx.sampleRate * Math.min(durationSec, 5)
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let b0 = 0, b1 = 0, b2 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99 * b0 + white * 0.05
        b1 = 0.95 * b1 + white * 0.08
        b2 = 0.85 * b2 + white * 0.12
        output[i] = (b0 + b1 + b2) * 0.15
      }

      const noiseNode = ctx.createBufferSource()
      noiseNode.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.setValueAtTime(3.5, now)
      filter.frequency.setValueAtTime(300, now)
      filter.frequency.exponentialRampToValueAtTime(3200, now + durationSec * 0.65)
      filter.frequency.exponentialRampToValueAtTime(600, now + durationSec)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.0001, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.022, now + durationSec * 0.45)
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

      noiseNode.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      // Inicia os nós
      subOsc.start(now)
      noiseNode.start(now)

      subOsc.stop(now + durationSec + 0.1)
      noiseNode.stop(now + durationSec + 0.1)
    } catch {
      // Navegadores sem suporte a Web Audio continuam normalmente
    }
  }
}

export const djAudioFX = new DJAudioFXService()
