import React, { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n'
import { useStore } from '../../store'
import type { TrackDetectProgress } from '@shared/types/download'

interface TrackSplitPanelProps {
  onDownloadTracks: () => void
}

export const TrackSplitPanel: React.FC<TrackSplitPanelProps> = ({ onDownloadTracks }) => {
  const settings = useStore((s) => s.settings)
  const meta = useStore((s) => s.meta)
  const detectedTracks = useStore((s) => s.detectedTracks)
  const setDetectedTracks = useStore((s) => s.setDetectedTracks)
  const toggleDetectedTrack = useStore((s) => s.toggleDetectedTrack)
  const toggleAllDetectedTracks = useStore((s) => s.toggleAllDetectedTracks)
  const updateDetectedTrackTitle = useStore((s) => s.updateDetectedTrackTitle)

  const t = useTranslation(settings.language)

  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<TrackDetectProgress | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showTextModal, setShowTextModal] = useState(false)
  const [tracklistText, setTracklistText] = useState('')

  // Sensitivity settings
  const [noiseLevel, setNoiseLevel] = useState(-32)
  const [minSilenceDuration, setMinSilenceDuration] = useState(1.5)

  useEffect(() => {
    const unsub = window.api.onDetectProgress((prog) => {
      setScanProgress(prog)
    })
    return () => unsub()
  }, [])

  // Only show this panel when video has NO native YouTube chapters and is NOT a playlist
  if (meta?.isPlaylist || (meta?.chapters && meta.chapters.length > 0)) {
    return null
  }

  const formatDuration = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleStartSilenceScan = async (): Promise<void> => {
    if (!meta) return
    setIsScanning(true)
    setScanProgress({ percent: 0, currentTime: 0, totalDuration: meta.duration || 0 })
    setScanError(null)

    try {
      const res = await window.api.detectTracks(
        meta.url,
        meta.duration || 0,
        {
          cookiesFromBrowser: settings.cookiesFromBrowser,
          cookiesManual: settings.cookiesManual,
          cookiesFilePath: settings.cookiesFilePath
        },
        {
          noiseLevel,
          minSilenceDuration,
          minTrackDuration: 30
        }
      )

      if (res.success && res.data) {
        if (res.data.length === 0) {
          setScanError(t('noSilenceDetected'))
        } else {
          setDetectedTracks(res.data)
        }
      } else {
        setScanError(res.error || 'Ошибка сканирования')
      }
    } catch (err) {
      setScanError(String(err))
    } finally {
      setIsScanning(false)
      setScanProgress(null)
    }
  }

  const handleCancelScan = async (): Promise<void> => {
    try {
      await window.api.cancelDetectTracks()
    } catch {
      // Ignore cancel error
    }
    setIsScanning(false)
    setScanProgress(null)
  }

  const handleApplyTracklistText = async (): Promise<void> => {
    if (!tracklistText.trim() || !meta) return
    try {
      const res = await window.api.parseTracklist(tracklistText, meta.duration || 0)
      if (res.success && res.data && res.data.length > 0) {
        setDetectedTracks(res.data)
        setShowTextModal(false)
        setTracklistText('')
        setScanError(null)
      } else {
        setScanError(t('noSilenceDetected'))
      }
    } catch (err) {
      setScanError(String(err))
    }
  }

  const selectedCount = detectedTracks.filter((t) => t.selected).length
  const allSelected = detectedTracks.length > 0 && selectedCount === detectedTracks.length

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <p className="heading-sm">{t('trackSplitTitle')}</p>
        <button
          className="btn btn-ghost"
          onClick={() => setShowSettings(!showSettings)}
          style={{ padding: '4px 8px', fontSize: 12, opacity: 0.8 }}
          title={t('noiseThreshold')}
        >
          ⚙️
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 14 }}>
        {t('trackSplitDesc')}
      </p>

      {/* Sensitivity settings accordion */}
      {showSettings && (
        <div
          style={{
            padding: 12,
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {t('noiseThreshold')}
            </label>
            <select
              className="input"
              style={{ width: 100, padding: '4px 8px', fontSize: 12 }}
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(Number(e.target.value))}
            >
              <option value={-25}>-25 dB (громко)</option>
              <option value={-30}>-30 dB</option>
              <option value={-32}>-32 dB (стандарт)</option>
              <option value={-35}>-35 dB</option>
              <option value={-40}>-40 dB (тихо)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {t('minSilenceDuration')}
            </label>
            <select
              className="input"
              style={{ width: 90, padding: '4px 8px', fontSize: 12 }}
              value={minSilenceDuration}
              onChange={(e) => setMinSilenceDuration(Number(e.target.value))}
            >
              <option value={1.0}>1.0 сек</option>
              <option value={1.5}>1.5 сек</option>
              <option value={2.0}>2.0 сек</option>
              <option value={3.0}>3.0 сек</option>
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        className="flex gap-12"
        style={{ marginBottom: isScanning || detectedTracks.length > 0 ? 14 : 0 }}
      >
        <button
          className="btn btn-primary"
          onClick={handleStartSilenceScan}
          disabled={isScanning}
          style={{ flex: 1, gap: 8, fontSize: 13, padding: '10px 16px' }}
        >
          <span style={{ fontSize: 16 }}>🔍</span>
          {t('detectSilenceBtn')}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setShowTextModal(!showTextModal)}
          disabled={isScanning}
          style={{ gap: 6, fontSize: 13, padding: '10px 14px' }}
        >
          <span>📋</span>
          {t('pasteTracklistBtn')}
        </button>
      </div>

      {/* Live Scanning Progress Card */}
      {isScanning && (
        <div
          style={{
            padding: 14,
            background: 'rgba(0, 229, 255, 0.05)',
            borderRadius: 8,
            border: '1px solid rgba(0, 229, 255, 0.25)',
            marginBottom: 16
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div className="flex items-center gap-8">
              <div className="spinner-ring" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                {t('scanningProgressTitle')}
              </span>
            </div>
            <div className="flex items-center gap-12">
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)'
                }}
              >
                {scanProgress?.percent ?? 0}%
              </span>
              <button
                className="btn btn-ghost"
                onClick={handleCancelScan}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  color: 'var(--text-muted)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                ✕ {t('cancelScan')}
              </button>
            </div>
          </div>

          {/* Progress Bar Line */}
          <div
            style={{
              height: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(2, scanProgress?.percent ?? 0)}%`,
                background: 'linear-gradient(90deg, var(--accent), #10b981)',
                borderRadius: 3,
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>

          {/* Timing details */}
          <div
            className="flex items-center justify-between"
            style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}
          >
            <span>
              ⏱ {formatDuration(scanProgress?.currentTime ?? 0)} /{' '}
              {formatDuration(scanProgress?.totalDuration || meta?.duration || 0)}
            </span>
            {scanProgress?.speed && (
              <span
                style={{
                  background: 'rgba(0, 229, 255, 0.1)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  color: 'var(--accent)',
                  fontFamily: 'monospace'
                }}
              >
                ⚡ {scanProgress.speed}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {scanError && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: 12
          }}
        >
          {scanError}
        </div>
      )}

      {/* Text Tracklist Modal/Area */}
      {showTextModal && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-color)'
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            {t('pasteTracklistBtn')}:
          </p>
          <textarea
            className="input"
            rows={5}
            placeholder={t('pasteTracklistPlaceholder')}
            value={tracklistText}
            onChange={(e) => setTracklistText(e.target.value)}
            style={{ width: '100%', fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }}
          />
          <div className="flex justify-end gap-8" style={{ marginTop: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowTextModal(false)
                setTracklistText('')
              }}
              style={{ fontSize: 12 }}
            >
              {t('dismiss')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleApplyTracklistText}
              disabled={!tracklistText.trim()}
              style={{ fontSize: 12 }}
            >
              {t('applyTracklist')}
            </button>
          </div>
        </div>
      )}

      {/* Detected Tracks List */}
      {detectedTracks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {/* Controls row */}
          <div
            className="flex items-center justify-between"
            style={{
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 10
            }}
          >
            <div className="flex items-center gap-12">
              <label
                className="flex items-center gap-6 cursor-pointer"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAllDetectedTracks(e.target.checked)}
                />
                <span>{t('selectAll')}</span>
              </label>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  padding: '2px 8px',
                  borderRadius: 12
                }}
              >
                {selectedCount} / {detectedTracks.length} {t('selected')}
              </span>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => setDetectedTracks([])}
              style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-muted)' }}
            >
              ✕ {t('clearTracks')}
            </button>
          </div>

          {/* Tracks scrollable items */}
          <div
            className="flex flex-col gap-6"
            style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}
          >
            {detectedTracks.map((track, idx) => {
              const numStr = String(idx + 1).padStart(2, '0')
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-10"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: track.selected
                      ? 'rgba(0, 229, 255, 0.04)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: track.selected
                      ? '1px solid rgba(0, 229, 255, 0.2)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={track.selected}
                    onChange={() => toggleDetectedTrack(track.id)}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                      minWidth: 20
                    }}
                  >
                    {numStr}.
                  </span>
                  <input
                    className="input"
                    value={track.title}
                    onChange={(e) => updateDetectedTrackTitle(track.id, e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: '4px 8px',
                      height: 28,
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatDuration(track.startTime)} – {formatDuration(track.endTime)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--accent)',
                      background: 'rgba(0, 229, 255, 0.1)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatDuration(track.duration)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Download button for detected tracks */}
          <div style={{ marginTop: 14 }}>
            <button
              className="btn btn-primary"
              onClick={onDownloadTracks}
              disabled={selectedCount === 0}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 13,
                fontWeight: 700,
                background: 'var(--accent)',
                color: '#08090d',
                gap: 8,
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: 16 }}>⬇</span>
              {t('downloadSelectedTracks')} ({selectedCount})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
