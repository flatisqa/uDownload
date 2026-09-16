import React from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'

export interface ConflictInfo {
  exists: boolean
  isDirectory: boolean
  path: string
  name: string
}

interface ConfirmConflictModalProps {
  conflict: ConflictInfo
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmConflictModal: React.FC<ConfirmConflictModalProps> = ({
  conflict,
  onConfirm,
  onCancel
}) => {
  const settings = useStore((s) => s.settings)
  const t = useTranslation(settings.language)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '24px 28px',
          borderRadius: 16,
          backgroundColor: 'var(--bg-overlay, #141720)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0
            }}
          >
            ⚠️
          </div>
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}
            >
              {conflict.isDirectory ? t('conflictTitleFolder') : t('conflictTitleFile')}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                margin: '3px 0 0 0'
              }}
            >
              {conflict.isDirectory ? t('conflictDescFolder') : t('conflictDescFile')}
            </p>
          </div>
        </div>

        {/* Existing file / folder details */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13 }}>{conflict.isDirectory ? '📁' : '🎵'}</span>
            <span
              className="truncate"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent)'
              }}
            >
              {conflict.name}
            </span>
          </div>
          <div
            className="truncate"
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'monospace'
            }}
            title={conflict.path}
          >
            {conflict.path}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 4
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            {t('conflictCancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              backgroundColor: 'var(--status-warning, #eab308)',
              borderColor: 'var(--status-warning, #eab308)',
              color: '#000',
              fontWeight: 700
            }}
          >
            {t('conflictDownloadAnyway')}
          </button>
        </div>
      </div>
    </div>
  )
}
