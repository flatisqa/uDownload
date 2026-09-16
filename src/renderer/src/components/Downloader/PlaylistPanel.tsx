import React from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'

export const PlaylistPanel: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const meta = useStore((s) => s.meta)
  const selectedPlaylistItems = useStore((s) => s.selectedPlaylistItems)
  const setSelectedPlaylistItems = useStore((s) => s.setSelectedPlaylistItems)

  const t = useTranslation(settings.language)

  if (!meta?.isPlaylist || !meta.playlistItems || meta.playlistItems.length === 0) {
    return null
  }

  const formatDuration = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      <p className="heading-sm" style={{ marginBottom: 12 }}>
        {t('playlistTracks')}
      </p>
      <div className="flex gap-8 items-center" style={{ marginBottom: 12 }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 8px', fontSize: 11 }}
          onClick={() => setSelectedPlaylistItems(meta.playlistItems!.map((i) => i.id))}
        >
          {t('selectAll')}
        </button>
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 8px', fontSize: 11 }}
          onClick={() => setSelectedPlaylistItems([])}
        >
          {t('selectNone')}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {selectedPlaylistItems.length} selected
        </span>
      </div>
      <div
        style={{
          maxHeight: 200,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingRight: 8
        }}
      >
        {meta.playlistItems.map((item, idx) => (
          <label
            key={item.id}
            className="flex gap-8 items-center"
            style={{
              fontSize: 12,
              padding: '4px 8px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={selectedPlaylistItems.includes(item.id)}
              onChange={(e) => {
                if (e.target.checked) setSelectedPlaylistItems([...selectedPlaylistItems, item.id])
                else setSelectedPlaylistItems(selectedPlaylistItems.filter((id) => id !== item.id))
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{idx + 1}.</span>
            <span className="truncate flex-1">{item.title}</span>
            {item.duration > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {formatDuration(item.duration)}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
