import React, { useRef } from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'

interface UrlInputPanelProps {
  handleFetch: () => void
  handleDownload: () => void
  onGoToSettings?: () => void
}

export const UrlInputPanel: React.FC<UrlInputPanelProps> = ({
  handleFetch,
  handleDownload,
  onGoToSettings
}) => {
  const url = useStore((s) => s.url)
  const setUrl = useStore((s) => s.setUrl)
  const step = useStore((s) => s.step)
  const error = useStore((s) => s.error)
  const meta = useStore((s) => s.meta)
  const resetDownloader = useStore((s) => s.resetDownloader)
  const settings = useStore((s) => s.settings)

  const t = useTranslation(settings.language)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      <div className="flex gap-8">
        <div className="input-wrap flex-1">
          <input
            ref={inputRef}
            className="input"
            placeholder={t('urlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            style={{ fontSize: 13 }}
          />
        </div>
        <button
          className="btn btn-ghost"
          onClick={resetDownloader}
          disabled={!url && !meta}
          style={{ padding: '0 16px', fontSize: 13, gap: 6 }}
        >
          <span style={{ fontSize: 16 }}>✕</span> {t('configClear')}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => handleFetch()}
          disabled={!url.trim() || step === 'fetching'}
        >
          {step === 'fetching' ? (
            '…'
          ) : (
            <>
              <span style={{ fontSize: 18 }}>⚡</span> {t('fetchBtn')}
            </>
          )}
        </button>
        {meta && step !== 'downloading' && (
          <button
            className="btn btn-primary"
            onClick={() => handleDownload()}
            style={{ background: 'var(--accent)', color: '#08090d', fontWeight: 700 }}
          >
            <span style={{ fontSize: 18 }}>⬇</span> {t('downloadBtn')}
          </button>
        )}
      </div>

      {error &&
        (error.includes('Sign in to confirm') ||
        error.includes("Sign in to confirm you're not a bot") ? (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8
            }}
          >
            <div className="flex items-center gap-12" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🤖</span>
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--status-error)',
                    margin: 0
                  }}
                >
                  {t('ytBotProtectionTitle')}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {t('ytBotProtectionDesc')}
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{
                fontSize: 12,
                padding: '6px 16px',
                background: 'var(--status-error)',
                borderColor: 'var(--status-error)'
              }}
              onClick={() => onGoToSettings && onGoToSettings()}
            >
              <span style={{ fontSize: 16 }}>⚙️</span>{' '}
              {t('settingsBtn') || 'Выбрать браузер в Настройках'}
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              borderLeft: '3px solid var(--status-error)'
            }}
          >
            <p
              style={{
                color: 'var(--status-error)',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4
              }}
            >
              {t('errorOccurred')}
            </p>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                wordBreak: 'break-all',
                maxHeight: 100,
                overflowY: 'auto'
              }}
            >
              {error}
            </p>
          </div>
        ))}
    </div>
  )
}
