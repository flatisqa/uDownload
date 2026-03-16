import React, { useState, useEffect } from 'react'
import DownloaderPage from './pages/DownloaderPage'
import QueuePage from './pages/QueuePage'
import SettingsPage from './pages/SettingsPage'
import Titlebar from './components/Titlebar'
import MetadataEditorPage from './pages/MetadataEditorPage'
import { useStore } from './store'

type Page = 'downloader' | 'queue' | 'settings' | 'edit-metadata'

function App(): React.ReactNode {
  const [page, setPage] = useState<Page>('downloader')

  const isLoaded = useStore((s) => s.isLoaded)
  const settings = useStore((s) => s.settings)

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
      // Support instant auto-fetch by updating store
      useStore.getState().setUrl(detected)
      useStore.getState().setMeta(null)
      useStore.getState().setStep('idle')
      // Switch to downloader page if we are somewhere else
      setPage('downloader')
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
      {page !== 'edit-metadata' && <Titlebar page={page} setPage={setPage} />}
      <div className="main-flex">
        <main className="main-content">
          {page === 'downloader' && (
            <DownloaderPage
              onGoToSettings={() => setPage('settings')}
              onGoToQueue={() => setPage('queue')}
              onGoToMetaEditor={() => setPage('edit-metadata')}
            />
          )}
          {page === 'queue' && <QueuePage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'edit-metadata' && <MetadataEditorPage onBack={() => setPage('downloader')} />}
        </main>
      </div>
    </div>
  )
}

export default App
