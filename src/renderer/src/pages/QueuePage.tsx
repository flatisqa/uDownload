import { useState, type ReactElement } from 'react'
import { useStore } from '../store'
import type { DownloadJob, DownloadStatus } from '@shared/types/download'
import { useTranslation } from '../i18n'
import {
  ConfirmConflictModal,
  type ConflictInfo
} from '../components/Downloader/ConfirmConflictModal'

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function statusBadgeClass(s: DownloadStatus): string {
  const map: Record<DownloadStatus, string> = {
    idle: 'badge-pending',
    fetching_meta: 'badge-pending',
    pending: 'badge-pending',
    starting: 'badge-download', // use same styles as download or a new pending style
    downloading: 'badge-download',
    converting: 'badge-convert',
    done: 'badge-done',
    error: 'badge-error',
    cancelled: 'badge-paused',
    paused: 'badge-paused'
  }
  return map[s] || 'badge-pending'
}

function statusLabel(s: DownloadStatus, t: ReturnType<typeof useTranslation>): string {
  const map: Record<DownloadStatus, string> = {
    idle: t('statusIdle'),
    fetching_meta: t('statusFetching'),
    pending: t('statusPending'),
    starting: t('statusStarting'),
    downloading: t('statusDownloading'),
    converting: t('statusConverting'),
    done: t('statusDone'),
    error: t('statusError'),
    cancelled: t('statusCancelled'),
    paused: t('statusPaused')
  }
  return map[s] || s
}

function progressBarClass(s: DownloadStatus): string {
  if (s === 'starting') return 'starting' // Will use CSS to animate it if needed
  if (s === 'converting') return 'converting'
  if (s === 'done') return 'done'
  if (s === 'error') return 'error'
  return ''
}

function JobCard({ job }: { job: DownloadJob }): ReactElement {
  const settings = useStore((s) => s.settings)
  const updateJob = useStore((s) => s.updateJob)
  const removeJob = useStore((s) => s.removeJob)
  const t = useTranslation(settings.language)
  const [isExpanded, setIsExpanded] = useState(false)

  const [conflict, setConflict] = useState<ConflictInfo | null>(null)

  const handleCancel = async (): Promise<void> => {
    await window.api.cancelDownload(job.id)
    updateJob(job.id, { status: 'cancelled' })
  }

  const handleRetry = async (force: boolean | unknown = false): Promise<void> => {
    if (force !== true) {
      try {
        const isPlaylistOrAlbum = Boolean(
          (job.playlistProgress && job.playlistProgress.items.length > 0) ||
          job.metadata?.isPlaylist ||
          (job.options.selectedChapters && job.options.selectedChapters.length > 1)
        )
        const checkPath = job.options.outputPath || ''
        const checkTitle = job.options.customTitle || job.metadata?.title || ''
        const conflictCheck = await window.api.checkConflict(
          checkPath,
          checkTitle,
          isPlaylistOrAlbum,
          job.options.format
        )
        if (conflictCheck && conflictCheck.exists) {
          setConflict(conflictCheck)
          return
        }
      } catch (err) {
        console.error('Retry conflict check failed:', err)
      }
    }

    // Reset job status and restart download
    const resetPlaylistProgress = job.playlistProgress
      ? {
          ...job.playlistProgress,
          current: 0,
          items: job.playlistProgress.items.map((it) => ({
            ...it,
            status: 'pending' as const,
            progress: 0
          }))
        }
      : undefined

    updateJob(job.id, {
      status: 'pending',
      error: undefined,
      progress: 0,
      playlistProgress: resetPlaylistProgress
    })
    const res = await window.api.startDownload(job.url, job.options, resetPlaylistProgress)
    if (!res.success) {
      updateJob(job.id, { status: 'error', error: res.error || 'Failed to restart download' })
    } else if (res.data && res.data !== job.id) {
      updateJob(job.id, { id: res.data })
    }
  }

  const handleOpenFolder = (): void => {
    if (job.finalFilePath) {
      window.api.showInFolder(job.finalFilePath)
    } else if (job.outputPath) {
      window.api.showInFolder(job.outputPath)
    }
  }

  const isActive = ['idle', 'fetching_meta', 'pending', 'downloading', 'converting'].includes(
    job.status
  )
  const isDone = job.status === 'done'
  const isError = job.status === 'error'
  const showProgress = isActive && job.status !== 'pending'
  const isPlaylistJob = Boolean(job.playlistProgress && job.playlistProgress.items.length > 0)
  const downloadedFileName = job.finalFilePath?.split(/[\\/]/).pop() ?? ''
  const downloadedExt = downloadedFileName.includes('.')
    ? downloadedFileName.split('.').pop()?.toUpperCase()
    : undefined
  const expectedExt =
    job.options.format === 'audio'
      ? job.options.audioQuality === 'flac'
        ? 'FLAC'
        : job.options.audioQuality === 'aac'
          ? 'AAC'
          : job.options.audioQuality === 'opus' || job.options.audioQuality === 'best'
            ? 'OPUS'
            : 'MP3'
      : job.options.format === 'video'
        ? 'MP4'
        : 'MKV'
  const currentFormat = downloadedExt || expectedExt
  const showInlineMeta = ['starting', 'downloading', 'converting', 'done'].includes(job.status)

  return (
    <div
      className="glass-panel"
      style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Top row: thumbnail + title + badge + action buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Thumbnail */}
        {job.metadata?.thumbnail && (
          <img
            src={job.metadata.thumbnail}
            alt=""
            style={{
              width: 76,
              height: 49,
              objectFit: 'cover',
              borderRadius: 6,
              flexShrink: 0,
              marginTop: 2
            }}
          />
        )}

        {/* Title + badge */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>
            {job.metadata?.title || job.url}
          </p>
          {job.metadata?.author && (
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{job.metadata.author}</p>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 2,
              flexWrap: 'wrap'
            }}
          >
            <span className={`badge ${statusBadgeClass(job.status)}`}>
              {statusLabel(job.status, t)}
            </span>
            {isPlaylistJob && (
              <span className="badge badge-download" style={{ fontSize: 11 }}>
                {job.status === 'done'
                  ? job.metadata?.isPlaylist
                    ? `Плейлист (${job.playlistProgress!.total})`
                    : `Треки (${job.playlistProgress!.total})`
                  : `Трек ${job.playlistProgress!.current || 1}/${job.playlistProgress!.total}`}
              </span>
            )}
            {showInlineMeta && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                {currentFormat && (
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{currentFormat}</span>
                )}
                {currentFormat && job.size && <span style={{ opacity: 0.4 }}>·</span>}
                {job.size && <span style={{ color: 'var(--text-secondary)' }}>{job.size}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons — always on the right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 6,
            flexShrink: 0,
            alignItems: 'flex-start'
          }}
        >
          {isPlaylistJob && (
            <button
              className="btn btn-ghost"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>{isExpanded ? '▲' : '▼'}</span>
              <span>{isExpanded ? 'Свернуть' : `Треки (${job.playlistProgress!.total})`}</span>
            </button>
          )}
          {isActive && (
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: 11 }}
              onClick={handleCancel}
            >
              {t('cancelBtn')}
            </button>
          )}
          {isDone && (
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: 11 }}
              onClick={handleOpenFolder}
            >
              {t('openFolder')}
            </button>
          )}
          {isError && (
            <button
              className="btn btn-primary"
              style={{ padding: '4px 12px', fontSize: 11 }}
              onClick={() => handleRetry(false)}
            >
              {t('retryBtn')}
            </button>
          )}
          {(isDone || isError || job.status === 'cancelled') && (
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: 11 }}
              onClick={() => removeJob(job.id)}
            >
              {t('removeBtn')}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {isError && (
        <p style={{ fontSize: 11, color: 'var(--status-error)', padding: '4px 0' }}>{job.error}</p>
      )}

      {/* Progress bar + stats row — at the bottom */}
      {showProgress && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* stats row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-muted)'
            }}
          >
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {job.progress > 0 ? `${job.progress.toFixed(1)}%` : '...'}
            </span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {job.size && <span style={{ color: 'var(--text-secondary)' }}>{job.size}</span>}
              {job.speed && (
                <>
                  {job.size && <span style={{ opacity: 0.4 }}>·</span>}
                  <span style={{ color: 'var(--accent)', opacity: 0.8 }}>{job.speed}</span>
                </>
              )}
              {job.eta && job.eta !== 'Unknown ETA' && (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>ETA {job.eta}</span>
                </>
              )}
            </span>
          </div>
          {/* bar */}
          <div className="progress-wrap">
            <div
              className={`progress-bar ${progressBarClass(job.status)}`}
              style={{ width: `${job.progress}%`, transition: 'width 0.4s ease' }}
            />
          </div>
        </div>
      )}

      {/* Playlist items collapsible list */}
      {isPlaylistJob && isExpanded && (
        <div
          style={{
            marginTop: 4,
            padding: '8px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 'max(280px, calc(100vh - 260px))',
            overflowY: 'auto'
          }}
        >
          {job.playlistProgress!.items.map((item, idx) => {
            const isItemActive = idx === job.playlistProgress!.current - 1 && isActive
            const itemStatus = item.status || 'pending'
            return (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: isItemActive
                    ? 'rgba(110, 231, 183, 0.08)'
                    : 'rgba(255, 255, 255, 0.01)',
                  border: isItemActive
                    ? '1px solid rgba(110, 231, 183, 0.25)'
                    : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <span
                  style={{
                    minWidth: 22,
                    fontSize: 11,
                    color: isItemActive ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isItemActive ? 700 : 400
                  }}
                >
                  {idx + 1}.
                </span>

                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    style={{
                      width: 34,
                      height: 22,
                      objectFit: 'cover',
                      borderRadius: 4,
                      flexShrink: 0
                    }}
                  />
                )}

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <p
                    className="truncate"
                    style={{
                      fontSize: 12,
                      fontWeight: isItemActive ? 600 : 400,
                      color: isItemActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      margin: 0
                    }}
                  >
                    {item.title}
                  </p>
                  {(itemStatus === 'downloading' || itemStatus === 'converting') && (
                    <div className="progress-wrap" style={{ height: 3 }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor:
                            itemStatus === 'converting' ? 'var(--warning)' : undefined,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  )}
                </div>

                {item.duration ? (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatDuration(item.duration)}
                  </span>
                ) : null}

                <span
                  className={`badge ${statusBadgeClass(itemStatus)}`}
                  style={{ fontSize: 10, padding: '2px 8px', flexShrink: 0 }}
                >
                  {itemStatus === 'done'
                    ? '✓'
                    : itemStatus === 'downloading'
                      ? `${item.progress > 0 ? `${item.progress.toFixed(0)}%` : '...'}`
                      : statusLabel(itemStatus, t)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Conflict confirmation dialog on retry */}
      {conflict && (
        <ConfirmConflictModal
          conflict={conflict}
          onConfirm={() => {
            setConflict(null)
            handleRetry(true)
          }}
          onCancel={() => setConflict(null)}
        />
      )}
    </div>
  )
}

export default function QueuePage(): ReactElement {
  const jobs = useStore((s) => s.jobs)
  const settings = useStore((s) => s.settings)
  const clearCompleted = useStore((s) => s.clearCompleted)
  const t = useTranslation(settings.language)

  const activeJobs = jobs.filter(
    (j) => j.status !== 'done' && j.status !== 'cancelled' && j.status !== 'error'
  )
  const doneJobs = jobs.filter(
    (j) => j.status === 'done' || j.status === 'cancelled' || j.status === 'error'
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="heading-xl">{t('queueTitle')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 12 }}>
            {jobs.length === 0
              ? t('noDownloads')
              : `${activeJobs.length} ${t('activeJobs')} · ${doneJobs.length} ${t('finishedJobs')}`}
          </p>
        </div>
        {doneJobs.length > 0 && (
          <button
            className="btn btn-ghost"
            onClick={clearCompleted}
            style={{ alignSelf: 'flex-start' }}
          >
            {t('clearFinished')}
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-icon">≡</div>
          <p className="heading-sm">{t('queueEmpty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
