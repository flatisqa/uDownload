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
        set({ settings: res.data, isLoaded: true })
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
