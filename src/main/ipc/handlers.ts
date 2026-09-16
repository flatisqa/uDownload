import { ipcMain, dialog, BrowserWindow, shell, app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import Store from 'electron-store'
import fs from 'fs'
import path from 'path'
import os from 'os'

import { fetchMetadata } from '../services/MetadataService'
import { downloadQueue } from '../services/DownloadQueueManager'
import * as BinaryManager from '../services/BinaryManager'
import { clipboardWatcher } from '../services/ClipboardWatcher'
import {
  detectSilenceTracks,
  parseTextTracklist,
  cancelActiveDetection
} from '../services/TrackDetectionService'
import type {
  DownloadOptions,
  AppConfig,
  DownloadJob,
  PlaylistProgress,
  SilenceDetectOptions
} from '@shared/types/download'
import { DEFAULT_CONFIG } from '@shared/types/download'

// Persistent settings store
const store = new Store<AppConfig>({ defaults: DEFAULT_CONFIG })

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ─── Metadata ─────────────────────────────────────────────────────────────
  ipcMain.handle(
    'download:fetchMetadata',
    async (
      _e,
      url: string,
      cookiesFromBrowser?: string,
      cookiesManual?: string,
      cookiesFilePath?: string
    ) => {
      try {
        console.log('[IPC] fetchMetadata called with:', {
          url,
          cookiesFromBrowser,
          cookiesManual,
          cookiesFilePath
        })
        const data = await fetchMetadata(url, cookiesFromBrowser, cookiesManual, cookiesFilePath)
        console.log('[IPC] fetchMetadata success:', data.title)
        return { success: true, data }
      } catch (error) {
        console.error('[IPC] fetchMetadata error:', error)
        return { success: false, error: String(error) }
      }
    }
  )

  // ─── Download ──────────────────────────────────────────────────────────────
  ipcMain.handle(
    'download:start',
    async (_e, url: string, options: DownloadOptions, playlistProgress?: PlaylistProgress) => {
      try {
        const jobId = uuidv4()
        const job: DownloadJob = {
          id: jobId,
          url,
          options,
          status: 'pending' as const,
          progress: 0,
          createdAt: Date.now(),
          playlistProgress
        }
        downloadQueue.enqueue(job)
        return { success: true, data: jobId }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('download:cancel', async (_e, jobId: string) => {
    try {
      downloadQueue.cancel(jobId)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('download:resume', async (_e, jobId: string) => {
    try {
      downloadQueue.resume(jobId)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Binary management ─────────────────────────────────────────────────────
  ipcMain.handle('binary:getStatus', async () => {
    try {
      const data = await BinaryManager.getStatus()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('binary:checkAndUpdate', async () => {
    try {
      const msg = await BinaryManager.checkAndUpdate()
      return { success: true, data: msg }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Settings ──────────────────────────────────────────────────────────────
  ipcMain.handle('settings:get', async () => {
    try {
      const data = store.store as AppConfig
      const defaultAudio = path.join(os.homedir(), 'Music')
      const defaultVideo = path.join(os.homedir(), 'Videos')
      const effectiveAudio = data.outputDirectoryAudio?.trim() || defaultAudio
      const effectiveVideo = data.outputDirectoryVideo?.trim() || defaultVideo

      if (!data.outputDirectoryAudio) store.set('outputDirectoryAudio', effectiveAudio)
      if (!data.outputDirectoryVideo) store.set('outputDirectoryVideo', effectiveVideo)

      const effectiveData: AppConfig = {
        ...DEFAULT_CONFIG,
        ...data,
        outputDirectoryAudio: effectiveAudio,
        outputDirectoryVideo: effectiveVideo
      }
      return { success: true, data: effectiveData }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('settings:set', async (_e, updates: Partial<AppConfig>) => {
    try {
      for (const [key, value] of Object.entries(updates)) {
        store.set(key, value)
      }
      // Apply concurrency change if needed
      if (updates.concurrentDownloads) {
        downloadQueue.setConcurrency(updates.concurrentDownloads)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Clipboard ─────────────────────────────────────────────────────────────
  ipcMain.handle('clipboard:toggle', async (_e, enabled: boolean) => {
    try {
      clipboardWatcher.setEnabled(enabled)
      store.set('clipboardWatcher', enabled)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Dialog ────────────────────────────────────────────────────────────────
  // Folder picker
  ipcMain.handle('dialog:openFolder', async (_e, defaultPath?: string) => {
    try {
      let resolvedPath: string | undefined = undefined
      if (defaultPath && typeof defaultPath === 'string') {
        const trimmed = defaultPath.trim()
        if (fs.existsSync(trimmed)) {
          resolvedPath = trimmed
        } else {
          const parent = path.dirname(trimmed)
          if (fs.existsSync(parent)) {
            resolvedPath = parent
          }
        }
      }
      const result = await dialog.showOpenDialog(mainWindow, {
        defaultPath: resolvedPath,
        properties: ['openDirectory']
      })
      if (result.canceled) return { success: false }
      return { success: true, data: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('shell:showInFolder', async (_e, targetPath: string) => {
    try {
      if (!targetPath) return { success: false, error: 'Path is empty' }
      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath)
        if (stats.isDirectory()) {
          await shell.openPath(targetPath)
          return { success: true }
        }
      } else if (!path.extname(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true })
        await shell.openPath(targetPath)
        return { success: true }
      }
      shell.showItemInFolder(targetPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('dialog:openImage', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
      })
      if (result.canceled) return { success: false }
      return { success: true, data: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('dialog:openTxtFile', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Cookies file', extensions: ['txt'] }]
      })
      if (result.canceled) return { success: false }
      return { success: true, data: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Filesystem utilities ──────────────────────────────────────────────────
  ipcMain.handle('fs:pathExists', (_e, dirPath: string) => {
    try {
      return fs.existsSync(dirPath)
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:sanitizeName', (_e, name: string) => {
    // Replace characters not allowed in folder names
    return name.replace(/[\\/:*?"<>|]/g, '_').trim()
  })

  ipcMain.handle(
    'fs:checkConflict',
    (
      _e,
      outputPath: string,
      title: string,
      isPlaylistOrAlbum: boolean,
      format: string
    ): { exists: boolean; isDirectory: boolean; path: string; name: string } => {
      try {
        let targetOutputDir = outputPath?.trim() || ''
        const config = store.store as Partial<AppConfig>
        const defaultAudio =
          config?.outputDirectoryAudio?.trim() || path.join(os.homedir(), 'Music')
        const defaultVideo =
          config?.outputDirectoryVideo?.trim() || path.join(os.homedir(), 'Videos')
        const defaultBaseDir = format === 'audio' ? defaultAudio : defaultVideo

        const isBareRoot = Boolean(
          targetOutputDir && /^\/[^/]+$/.test(targetOutputDir) && !fs.existsSync(targetOutputDir)
        )

        if (!targetOutputDir || isBareRoot || !path.isAbsolute(targetOutputDir)) {
          targetOutputDir = defaultBaseDir
        }

        const sanitized = title.replace(/[\\/:*?"<>|]/g, '_').trim()
        if (isPlaylistOrAlbum) {
          // If targetOutputDir already points to the album/playlist directory, check it directly
          let dirPath = path.join(targetOutputDir, sanitized)
          if (
            path.basename(targetOutputDir).toLowerCase() === sanitized.toLowerCase() &&
            fs.existsSync(targetOutputDir)
          ) {
            dirPath = targetOutputDir
          }

          if (fs.existsSync(dirPath)) {
            const stats = fs.statSync(dirPath)
            if (stats.isDirectory()) {
              const files = fs.readdirSync(dirPath)
              if (files.length > 0) {
                return {
                  exists: true,
                  isDirectory: true,
                  path: dirPath,
                  name: path.basename(dirPath)
                }
              }
            }
          }
        } else {
          const audioExts = ['opus', 'mp3', 'flac', 'aac', 'm4a', 'wav', 'ogg']
          const videoExts = ['mp4', 'mkv', 'webm', 'mov']
          const checkExts = format === 'audio' ? audioExts : [...videoExts, ...audioExts]

          for (const ext of checkExts) {
            const filePath = path.join(targetOutputDir, `${sanitized}.${ext}`)
            if (fs.existsSync(filePath)) {
              return {
                exists: true,
                isDirectory: false,
                path: filePath,
                name: `${sanitized}.${ext}`
              }
            }
          }
        }
        return { exists: false, isDirectory: false, path: '', name: '' }
      } catch {
        return { exists: false, isDirectory: false, path: '', name: '' }
      }
    }
  )

  // ─── Window Management ─────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow.close()
  })

  // ─── App Info ──────────────────────────────────────────────────────────────
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  // ─── Track Detection & Silence Analysis ──────────────────────────────────
  ipcMain.handle(
    'audio:detectTracks',
    async (
      _e,
      url: string,
      totalDuration: number,
      cookies?: {
        cookiesFromBrowser?: string
        cookiesManual?: string
        cookiesFilePath?: string
      },
      options?: SilenceDetectOptions
    ) => {
      try {
        const tracks = await detectSilenceTracks(
          url,
          totalDuration,
          cookies,
          options,
          (progress) => {
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send('audio:detectProgress', progress)
            }
          }
        )
        return { success: true, data: tracks }
      } catch (error) {
        console.error('[IPC] audio:detectTracks error:', error)
        return { success: false, error: String(error) }
      }
    }
  )

  ipcMain.handle('audio:cancelDetectTracks', () => {
    cancelActiveDetection()
    return { success: true }
  })

  ipcMain.handle('audio:parseTracklist', async (_e, text: string, totalDuration: number) => {
    try {
      const tracks = parseTextTracklist(text, totalDuration)
      return { success: true, data: tracks }
    } catch (error) {
      console.error('[IPC] audio:parseTracklist error:', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Forward queue events to renderer ─────────────────────────────────────
  downloadQueue.on('progress', (data) => {
    mainWindow.webContents.send('download:progress', data)
  })
  downloadQueue.on('completed', (data) => {
    mainWindow.webContents.send('download:completed', data)
  })
  downloadQueue.on('error', (data) => {
    mainWindow.webContents.send('download:error', data)
  })

  // ─── Forward clipboard events to renderer ─────────────────────────────────
  clipboardWatcher.on('linkDetected', (url: string) => {
    // Send to all windows to ensure it reaches the active one even after window recreations
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('clipboard:linkDetected', url)
      }
    })
  })
}
