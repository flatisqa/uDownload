import React from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'

interface ChaptersPanelProps {
  onDownload?: () => void
}

export const ChaptersPanel: React.FC<ChaptersPanelProps> = ({ onDownload }) => {
  const settings = useStore((s) => s.settings)
  const meta = useStore((s) => s.meta)
  const chapterMode = useStore((s) => s.chapterMode)
  const setChapterMode = useStore((s) => s.setChapterMode)
  const selectedChapters = useStore((s) => s.selectedChapters)
  const setSelectedChapters = useStore((s) => s.setSelectedChapters)

  const t = useTranslation(settings.language)

  if (meta?.isPlaylist || !meta?.chapters || meta.chapters.length === 0) {
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
        {t('chaptersTitle')}
      </p>

      <div className="flex gap-16" style={{ marginBottom: 16 }}>
        <label className="flex gap-8 items-center cursor-pointer" style={{ fontSize: 13 }}>
          <input
            type="radio"
            name="chapterMode"
            checked={chapterMode === 'single'}
            onChange={() => setChapterMode('single')}
          />
          <span>{t('chapterOptionSingle')}</span>
        </label>
        <label className="flex gap-8 items-center cursor-pointer" style={{ fontSize: 13 }}>
          <input
            type="radio"
            name="chapterMode"
            checked={chapterMode === 'selected'}
            onChange={() => setChapterMode('selected')}
          />
          <span>{t('chapterOptionSplit')}</span>
        </label>
      </div>

      <div
        className="flex items-center justify-between"
        style={{
          marginBottom: 12,
          opacity: chapterMode === 'single' ? 0.3 : 1,
          pointerEvents: chapterMode === 'single' ? 'none' : 'auto'
        }}
      >
        <div className="flex gap-8 items-center">
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={() =>
              setSelectedChapters(meta.chapters!.map((c) => `${c.startTime}-${c.endTime}`))
            }
          >
            {t('selectAll')}
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={() => setSelectedChapters([])}
          >
            {t('selectNone')}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {selectedChapters.length} {t('selected')}
          </span>
        </div>
      </div>

      <div
        style={{
          maxHeight: 200,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingRight: 8,
          opacity: chapterMode === 'single' ? 0.2 : 1,
          pointerEvents: chapterMode === 'single' ? 'none' : 'auto'
        }}
      >
        {meta.chapters.map((chap, idx) => (
          <label
            key={idx}
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
              checked={selectedChapters.includes(`${chap.startTime}-${chap.endTime}`)}
              onChange={(e) => {
                const tId = `${chap.startTime}-${chap.endTime}`
                if (e.target.checked) setSelectedChapters([...selectedChapters, tId])
                else setSelectedChapters(selectedChapters.filter((t) => t !== tId))
              }}
            />
            <span style={{ color: 'var(--text-secondary)', minWidth: 40 }}>
              {formatDuration(chap.startTime)}
            </span>
            <span className="truncate flex-1">{chap.title}</span>
          </label>
        ))}
      </div>

      {chapterMode === 'selected' && selectedChapters.length > 0 && onDownload && (
        <div
          className="flex items-center justify-end"
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <button
            className="btn btn-primary"
            onClick={onDownload}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: 14 }}>⬇</span>
            <span>
              {t('downloadSelectedTracks')} ({selectedChapters.length})
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
