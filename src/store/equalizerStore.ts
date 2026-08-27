// ============================================================
// EQUALIZER STORE — ESTADO GLOBAL E PRESETS DE EQUALIZAÇÃO
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EqBand {
  frequency: number
  gain: number // -12dB a +12dB
  type: 'lowshelf' | 'peaking' | 'highshelf'
  label: string
}

export type EqPresetId =
  | 'flat'
  | 'bass_boost'
  | 'vocal_enhanced'
  | 'electronic'
  | 'rock'
  | 'pop'
  | 'acoustic'
  | 'treble_boost'
  | 'spatial_3d'
  | 'custom'

export interface EqPreset {
  id: EqPresetId
  name: string
  icon: string
  description: string
  gains: number[] // 10 bandas: [32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz]
  bassBoost: number // 0 a 100
  vocalClarity: number // 0 a 100
  spatial3d: boolean
}

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
export const EQ_LABELS = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz']

export const EQ_PRESETS: EqPreset[] = [
  {
    id: 'flat',
    name: 'Padrão (Flat)',
    icon: '🎛️',
    description: 'Resposta neutra de estúdio sem alterações de frequência.',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    vocalClarity: 0,
    spatial3d: false,
  },
  {
    id: 'bass_boost',
    name: 'Mais Grave (Bass Boost)',
    icon: '🔊',
    description: 'Sub-graves pesados e graves intensos com impacto para Funk, Trap e EDM.',
    gains: [9, 8, 6, 4, 1, 0, 0, 1, 2, 2],
    bassBoost: 80,
    vocalClarity: 10,
    spatial3d: false,
  },
  {
    id: 'vocal_enhanced',
    name: 'Vocal Enhanced (Realce de Voz)',
    icon: '🎤',
    description: 'Vozes límpidas e cristalinas com médios encorpados e redução de ruído de grave.',
    gains: [-3, -2, 0, 3, 6, 7, 5, 4, 2, 1],
    bassBoost: 0,
    vocalClarity: 90,
    spatial3d: false,
  },
  {
    id: 'electronic',
    name: 'Eletrônica & Dance',
    icon: '⚡',
    description: 'Graves pulsantes e agudos brilhantes para pistas de dança e baladas.',
    gains: [7, 6, 4, 1, -1, 2, 4, 6, 7, 6],
    bassBoost: 60,
    vocalClarity: 20,
    spatial3d: true,
  },
  {
    id: 'rock',
    name: 'Rock & Metal',
    icon: '🎸',
    description: 'Guitarras potentes, bateria com pegada forte e médios encorpados.',
    gains: [5, 4, 2, 0, -2, 2, 4, 5, 5, 4],
    bassBoost: 40,
    vocalClarity: 30,
    spatial3d: false,
  },
  {
    id: 'pop',
    name: 'Pop & R&B',
    icon: '🎹',
    description: 'Equilíbrio polido com vocais aveludados e graves suaves.',
    gains: [3, 2, 1, 2, 4, 4, 3, 3, 4, 3],
    bassBoost: 30,
    vocalClarity: 50,
    spatial3d: false,
  },
  {
    id: 'acoustic',
    name: 'Acústico & Clássico',
    icon: '🎻',
    description: 'Arejamento natural e espacialidade para violão, piano e orquestras.',
    gains: [2, 2, 1, 1, 2, 3, 4, 5, 6, 5],
    bassBoost: 10,
    vocalClarity: 40,
    spatial3d: true,
  },
  {
    id: 'treble_boost',
    name: 'Mais Agudos (Treble Boost)',
    icon: '✨',
    description: 'Acentua pratos de bateria e detalhes em alta frequência com nitidez.',
    gains: [-4, -3, -2, 0, 1, 3, 5, 7, 9, 10],
    bassBoost: 0,
    vocalClarity: 30,
    spatial3d: false,
  },
  {
    id: 'spatial_3d',
    name: 'Imersão 3D Espacial',
    icon: '🌌',
    description: 'Alargamento de palco sonoro tridimensional para fones de ouvido.',
    gains: [4, 3, 1, 0, 1, 2, 4, 6, 7, 8],
    bassBoost: 40,
    vocalClarity: 50,
    spatial3d: true,
  },
]

interface EqualizerState {
  isEnabled: boolean
  currentPreset: EqPresetId
  gains: number[] // 10 valores de -12 a +12
  bassBoost: number // 0 a 100
  vocalClarity: number // 0 a 100
  spatial3d: boolean
  preAmpGain: number // -12 a +12 dB

  // Actions
  toggleEnabled: () => void
  setIsEnabled: (enabled: boolean) => void
  applyPreset: (presetId: EqPresetId) => void
  setBandGain: (bandIndex: number, gain: number) => void
  setBassBoost: (val: number) => void
  setVocalClarity: (val: number) => void
  setSpatial3d: (val: boolean) => void
  setPreAmpGain: (val: number) => void
  resetToFlat: () => void
}

export const useEqualizerStore = create<EqualizerState>()(
  persist(
    (set, get) => ({
      isEnabled: true,
      currentPreset: 'flat',
      gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bassBoost: 0,
      vocalClarity: 0,
      spatial3d: false,
      preAmpGain: 0,

      toggleEnabled: () => {
        const next = !get().isEnabled
        set({ isEnabled: next })
      },

      setIsEnabled: (enabled) => set({ isEnabled: enabled }),

      applyPreset: (presetId) => {
        if (presetId === 'custom') {
          set({ currentPreset: 'custom' })
          return
        }
        const preset = EQ_PRESETS.find((p) => p.id === presetId)
        if (!preset) return

        set({
          currentPreset: presetId,
          gains: [...preset.gains],
          bassBoost: preset.bassBoost,
          vocalClarity: preset.vocalClarity,
          spatial3d: preset.spatial3d,
        })
      },

      setBandGain: (bandIndex, gain) => {
        const gains = [...get().gains]
        if (bandIndex >= 0 && bandIndex < gains.length) {
          gains[bandIndex] = Math.max(-12, Math.min(12, Math.round(gain * 10) / 10))
          set({ gains, currentPreset: 'custom' })
        }
      },

      setBassBoost: (val) => {
        set({ bassBoost: Math.max(0, Math.min(100, val)), currentPreset: 'custom' })
      },

      setVocalClarity: (val) => {
        set({ vocalClarity: Math.max(0, Math.min(100, val)), currentPreset: 'custom' })
      },

      setSpatial3d: (val) => {
        set({ spatial3d: val, currentPreset: 'custom' })
      },

      setPreAmpGain: (val) => {
        set({ preAmpGain: Math.max(-12, Math.min(12, val)) })
      },

      resetToFlat: () => {
        set({
          currentPreset: 'flat',
          gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          bassBoost: 0,
          vocalClarity: 0,
          spatial3d: false,
          preAmpGain: 0,
        })
      },
    }),
    {
      name: 'johnmusic-equalizer-v1',
    }
  )
)
