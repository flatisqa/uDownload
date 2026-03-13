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
    const res = await window.api.getSettings()
    if (res.success && res.data) {
      set({ settings: res.data, isLoaded: true })
    }
  },

  updateSettings: async (updates) => {
    const next = { ...get().settings, ...updates }
    set({ settings: next })
    await window.api.setSettings(updates)
  }
})
