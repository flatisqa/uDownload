import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import Store from 'electron-store'

import { fetchMetadata } from '../services/MetadataService'
import { downloadQueue } from '../services/DownloadQueueManager'
import * as BinaryManager from '../services/BinaryManager'
import { clipboardWatcher } from '../services/ClipboardWatcher'
import type { DownloadOptions, AppConfig } from '@shared/types/download'
import { DEFAULT_CONFIG } from '@shared/types/download'

// Persistent settings store
const store = new (Store as any)({ defaults: DEFAULT_CONFIG })

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  // ─── Metadata ─────────────────────────────────────────────────────────────
  ipcMain.handle('download:fetchMetadata', async (_e, url: string, cookiesFromBrowser?: string) => {
    try {
      const data = await fetchMetadata(url, cookiesFromBrowser)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // ─── Download ──────────────────────────────────────────────────────────────
  ipcMain.handle('download:start', async (_e, url: string, options: DownloadOptions) => {
    try {
      const jobId = uuidv4()
      const job = {
        id: jobId,
        url,
        options,
        status: 'pending' as const,
        progress: 0,
        createdAt: Date.now()
      }
      downloadQueue.enqueue(job)
      return { success: true, data: jobId }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

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
      return { success: true, data }
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
  ipcMain.handle('dialog:openFolder', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      })
      if (result.canceled) return { success: false }
      return { success: true, data: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('shell:showInFolder', async (_e, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
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
    mainWindow.webContents.send('clipboard:linkDetected', url)
  })
}
