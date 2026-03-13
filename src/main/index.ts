import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Linux: fix SUID sandbox requirement in development
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
}

import { registerIpcHandlers } from './ipc/handlers'
import { getStatus, downloadYtdlp } from './services/BinaryManager'
import { clipboardWatcher } from './services/ClipboardWatcher'
import Store from 'electron-store'
import windowStateKeeper from 'electron-window-state'
import { DEFAULT_CONFIG } from '@shared/types/download'

// electron-context-menu is pure ESM, use dynamic import
import('electron-context-menu').then((mod) => {
  mod.default({
    showSaveImageAs: true,
    showCopyImage: true,
    showCopyImageAddress: true,
    showInspectElement: !app.isPackaged
  })
})

const store = new Store({ defaults: DEFAULT_CONFIG })

function createWindow(): BrowserWindow {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1100,
    defaultHeight: 760
  })

  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#08090d',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // Per electron-ipc skill:
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  mainWindowState.manage(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.mediafetch.pro')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()

  // Register all IPC handlers
  registerIpcHandlers(mainWindow)

  // Check and auto-download yt-dlp if missing
  const binaryStatus = await getStatus()
  if (!binaryStatus.ytdlp) {
    mainWindow.webContents.once('did-finish-load', async () => {
      mainWindow.webContents.send('download:progress', {
        id: '__init__',
        status: 'fetching_meta',
        progress: 0,
        speed: 'Downloading yt-dlp...'
      })
      try {
        await downloadYtdlp()
        mainWindow.webContents.send('download:completed', { id: '__init__' })
      } catch (e) {
        mainWindow.webContents.send('download:error', { id: '__init__', error: String(e) })
      }
    })
  }

  // Init clipboard watcher from settings
  if (store.get('clipboardWatcher')) {
    clipboardWatcher.start()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  clipboardWatcher.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
