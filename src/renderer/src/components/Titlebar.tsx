import './Titlebar.css'
import type { ReactElement } from 'react'
import { useTranslation } from '../i18n'
import { useStore } from '../store'

type Page = 'downloader' | 'queue' | 'settings'

interface TitlebarProps {
  page: Page
  setPage: (page: Page) => void
}

export default function Titlebar({ page, setPage }: TitlebarProps): ReactElement {
  const settings = useStore((s) => s.settings)
  const t = useTranslation(settings.language)

  const handleMinimize = (): void => window.api.minimizeWindow()
  const handleMaximize = (): void => window.api.maximizeWindow()
  const handleClose = (): void => window.api.closeWindow()

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region" />
      <div className="titlebar-content">
        <div className="titlebar-logo">
          <span style={{ color: 'var(--accent)', marginRight: 6 }}>⬇</span>
          MediaFetch Pro
        </div>

        <div className="titlebar-nav">
          <button
            className={`titlebar-nav-item ${page === 'downloader' ? 'active' : ''}`}
            onClick={() => setPage('downloader')}
          >
            {t('navDownloader')}
          </button>
          <button
            className={`titlebar-nav-item ${page === 'queue' ? 'active' : ''}`}
            onClick={() => setPage('queue')}
          >
            {t('navQueue')}
          </button>
          <button
            className={`titlebar-nav-item ${page === 'settings' ? 'active' : ''}`}
            onClick={() => setPage('settings')}
          >
            {t('navSettings')}
          </button>
        </div>

        <div className="titlebar-controls">
          <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path fill="currentColor" d="M1 4h8v2H1z" />
            </svg>
          </button>
          <button className="titlebar-btn" onClick={handleMaximize} title="Maximize">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path fill="currentColor" d="M1 1h8v8H1V1zm1 1v6h6V2H2z" />
            </svg>
          </button>
          <button className="titlebar-btn close-btn" onClick={handleClose} title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                fill="currentColor"
                d="M1 1l8 8m0-8L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
