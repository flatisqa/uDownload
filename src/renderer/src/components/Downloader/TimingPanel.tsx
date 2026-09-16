import React from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'

export const TimingPanel: React.FC = () => {
  const settings = useStore((s) => s.settings)
  const meta = useStore((s) => s.meta)
  const timeFrom = useStore((s) => s.timeFrom)
  const setTimeFrom = useStore((s) => s.setTimeFrom)
  const timeTo = useStore((s) => s.timeTo)
  const setTimeTo = useStore((s) => s.setTimeTo)

  const t = useTranslation(settings.language)

  if (meta?.isPlaylist) {
    return null
  }

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      <p className="heading-sm" style={{ marginBottom: 12 }}>
        {t('timingCrop')}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>{t('timeHelper')}</p>
      <div className="flex gap-16">
        <div style={{ flex: 1 }}>
          <label
            style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              display: 'block',
              marginBottom: 6
            }}
          >
            {t('timeFrom')}
          </label>
          <input
            className="input"
            placeholder="00:00:00"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              display: 'block',
              marginBottom: 6
            }}
          >
            {t('timeTo')}
          </label>
          <input
            className="input"
            placeholder="inf"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
          />
        </div>
      </div>
      {(timeFrom || timeTo) && (
        <p
          style={{
            fontSize: 10,
            color: 'var(--text-tertiary)',
            marginTop: 8,
            lineHeight: 1.4
          }}
        >
          {t('timeHelper')}
        </p>
      )}
    </div>
  )
}
