import React from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'

interface VideoPreviewCardProps {
  onGoToMetaEditor?: () => void
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({ onGoToMetaEditor }) => {
  const meta = useStore((s) => s.meta)
  const customThumbnail = useStore((s) => s.customThumbnail)
  const customTitle = useStore((s) => s.customTitle)
  const settings = useStore((s) => s.settings)

  const t = useTranslation(settings.language)

  if (!meta) return null

  // Helper inside component to avoid prop drilling if possible,
  // or just copy from DownloaderPage
  const formatDuration = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
      onClick={() => onGoToMetaEditor?.()}
    >
      <div className="flex gap-16">
        {(customThumbnail || meta.thumbnail) && (
          <div style={{ position: 'relative' }}>
            <img
              src={customThumbnail ? `file://${customThumbnail}` : meta.thumbnail}
              alt={meta.title}
              style={{
                width: 140,
                height: 90,
                objectFit: 'cover',
                borderRadius: 8,
                flexShrink: 0
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: 'rgba(0,0,0,0.6)',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 8,
                color: 'white',
                backdropFilter: 'blur(4px)'
              }}
            >
              ✎ EDIT
            </div>
          </div>
        )}
        <div className="flex flex-col gap-8 flex-1" style={{ minWidth: 0 }}>
          <div className="flex items-start justify-between gap-8">
            <h2 className="heading-lg truncate flex-1">{customTitle || meta.title}</h2>
            <button
              className="btn btn-ghost"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                height: 'auto',
                background: 'rgba(255,255,255,0.03)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                onGoToMetaEditor?.()
              }}
            >
              <span style={{ fontSize: 14 }}>✎</span> {t('editMetadataBtn')}
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{meta.author}</p>
          <div className="flex gap-8 items-center" style={{ marginTop: 4 }}>
            {meta.duration > 0 && (
              <span className="badge badge-pending">{formatDuration(meta.duration)}</span>
            )}
            {meta.isPlaylist && (
              <span className="badge badge-download">
                Playlist · {meta.playlistItems?.length} tracks
              </span>
            )}
            {(meta.chapters?.length ?? 0) > 0 && (
              <span className="badge badge-convert">{meta.chapters?.length} chapters</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
