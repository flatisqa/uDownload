import { StateCreator } from 'zustand'
import type { DownloadJob } from '@shared/types/download'

export interface DownloadsSlice {
  jobs: DownloadJob[]
  addJob: (job: DownloadJob) => void
  updateJob: (id: string, updates: Partial<DownloadJob>) => void
  removeJob: (id: string) => void
  clearCompleted: () => void
}

export const createDownloadsSlice: StateCreator<DownloadsSlice> = (set) => ({
  jobs: [],

  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j))
    })),

  removeJob: (id) => set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),

  clearCompleted: () =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.status !== 'done' && j.status !== 'error')
    }))
})
