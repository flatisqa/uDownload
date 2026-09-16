import { StateCreator } from 'zustand'
import type { AppConfig } from '@shared/types/download'
import { DEFAULT_CONFIG } from '@shared/types/download'

export interface SettingsSlice {
  settings: AppConfig
  isLoaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppConfig>) => Promise<void>
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: DEFAULT_CONFIG,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const res = await window.api.getSettings()
      if (res.success && res.data) {
        const data = res.data
        set({ settings: data, isLoaded: true })
        if (data.defaultPresetId && data.presets) {
          const defPreset = data.presets.find((p) => p.id === data.defaultPresetId)
          if (defPreset) {
            const updates: Record<string, unknown> = {}
            if (defPreset.options.format) updates.format = defPreset.options.format
            if (defPreset.options.audioQuality)
              updates.audioQuality = defPreset.options.audioQuality
            if (defPreset.options.videoQuality)
              updates.videoQuality = defPreset.options.videoQuality
            set(updates as unknown as Partial<SettingsSlice>)
          }
        }
      } else {
        // Fallback to defaults so the app isn't stuck in loading state
        set({ isLoaded: true })
      }
    } catch {
      set({ isLoaded: true })
    }
  },

  updateSettings: async (updates) => {
    const next = { ...get().settings, ...updates }
    set({ settings: next })
    await window.api.setSettings(updates)
  }
})
