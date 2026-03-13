import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createDownloadsSlice, DownloadsSlice } from './slices/downloads'
import { createSettingsSlice, SettingsSlice } from './slices/settings'
import { createDownloaderSlice, DownloaderSlice } from './slices/downloader'

type AppStore = DownloadsSlice & SettingsSlice & DownloaderSlice

export const useStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createDownloadsSlice(...a),
      ...createSettingsSlice(...a),
      ...createDownloaderSlice(...a)
    }),
    { name: 'MediaFetchStore' }
  )
)

// Point selectors — per zustand-store skill (no full store destructuring)
export const useJobs = () => useStore((s) => s.jobs)
export const useSettings = () => useStore((s) => s.settings)
export const useSettingsLoaded = () => useStore((s) => s.isLoaded)
