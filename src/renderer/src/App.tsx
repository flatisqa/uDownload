import React, { useState, useEffect } from 'react'
import DownloaderPage from './pages/DownloaderPage'
import QueuePage from './pages/QueuePage'
import SettingsPage from './pages/SettingsPage'
import Titlebar from './components/Titlebar'
import { useStore } from './store'
import { useTranslation } from './i18n'

type Page = 'downloader' | 'queue' | 'settings'

function App(): React.ReactNode {
  const [page, setPage] = useState<Page>('downloader')
  const [toast, setToast] = useState<{ visible: boolean; url: string }>({ visible: false, url: '' })

  const isLoaded = useStore((s) => s.isLoaded)
  const settings = useStore((s) => s.settings)
  const t = useTranslation(settings.language)

  useEffect(() => {
    if (!useStore.getState().isLoaded) {
      useStore.getState().loadSettings()
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', isDark ? 'deep-space' : 'light')

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        if (useStore.getState().settings.theme === 'system') {
          root.setAttribute('data-theme', e.matches ? 'deep-space' : 'light')
        }
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      root.setAttribute('data-theme', settings.theme)
      return undefined
    }
  }, [settings.theme])

  useEffect(() => {
    const unsub = window.api.onClipboardLink((detected) => {
      setToast({ visible: true, url: detected })
      setTimeout(() => setToast((t) => (t.url === detected ? { ...t, visible: false } : t)), 8000)
    })

    // Download events
    const unsubProgress = window.api.onDownloadProgress((data: any) => {
      useStore.getState().updateJob(data.id, data)
    })
    const unsubCompleted = window.api.onDownloadCompleted((data: any) => {
      useStore.getState().updateJob(data.id, data)
    })
    const unsubError = window.api.onDownloadError((data: any) => {
      useStore.getState().updateJob(data.id, data)
    })

    return () => {
      unsub()
      unsubProgress()
      unsubCompleted()
      unsubError()
    }
  }, [])

  if (!isLoaded) return null

  return (
    <div className="app-layout">
      <Titlebar page={page} setPage={setPage} />
      <div className="main-flex">
        <main className="main-content">
          {page === 'downloader' && (
            <DownloaderPage
              onGoToSettings={() => setPage('settings')}
              onGoToQueue={() => setPage('queue')}
            />
          )}
          {page === 'queue' && <QueuePage />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Toast for Clipboard Intercept */}
      {toast.visible && (
        <div
          className="toast toast-enter"
          style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 999 }}
        >
          <div className="flex flex-col gap-6">
            <span style={{ fontSize: 13, fontWeight: 500 }}>{t('detectedLink')}</span>
            <span
              className="truncate"
              style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200 }}
            >
              {toast.url}
            </span>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => {
              setPage('downloader')
              setToast({ visible: false, url: '' })
            }}
          >
            {t('downloadNow')}
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: 6 }}
            onClick={() => setToast({ visible: false, url: '' })}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default App
