import { useStore } from '../store'
import type { DownloadJob, DownloadStatus } from '@shared/types/download'
import { useTranslation } from '../i18n'

function statusBadgeClass(s: DownloadStatus) {
  const map: Record<DownloadStatus, string> = {
    idle: 'badge-pending',
    fetching_meta: 'badge-pending',
    pending: 'badge-pending',
    downloading: 'badge-download',
    converting: 'badge-convert',
    done: 'badge-done',
    error: 'badge-error',
    cancelled: 'badge-paused',
    paused: 'badge-paused'
  }
  return map[s] || 'badge-pending'
}

function statusLabel(s: DownloadStatus, t: any) {
  const map: Record<DownloadStatus, string> = {
    idle: t('statusIdle'),
    fetching_meta: t('statusFetching'),
    pending: t('statusPending'),
    downloading: t('statusDownloading'),
    converting: t('statusConverting'),
    done: t('statusDone'),
    error: t('statusError'),
    cancelled: t('statusCancelled'),
    paused: t('statusPaused')
  }
  return map[s] || s
}

function progressBarClass(s: DownloadStatus) {
  if (s === 'converting') return 'converting'
  if (s === 'done') return 'done'
  if (s === 'error') return 'error'
  return ''
}

function JobCard({ job }: { job: DownloadJob }) {
  const settings = useStore((s) => s.settings)
  const updateJob = useStore((s) => s.updateJob)
  const removeJob = useStore((s) => s.removeJob)
  const t = useTranslation(settings.language)

  const handleCancel = async () => {
    await window.api.cancelDownload(job.id)
    updateJob(job.id, { status: 'cancelled' })
  }

  const handleOpenFolder = () => {
    if (job.outputPath) {
      window.api.showInFolder(job.outputPath)
    }
  }

  const isActive = ['idle', 'fetching_meta', 'pending', 'downloading', 'converting'].includes(job.status)
  const isDone = job.status === 'done'
  const isError = job.status === 'error'
  const showProgress = isActive && job.status !== 'pending'

  return (
    <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top row: thumbnail + title + badge + action buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Thumbnail */}
        {job.metadata?.thumbnail && (
          <img
            src={job.metadata.thumbnail}
            alt=""
            style={{ width: 76, height: 49, objectFit: 'cover', borderRadius: 6, flexShrink: 0, marginTop: 2 }}
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
          <span className={`badge ${statusBadgeClass(job.status)}`} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
            {statusLabel(job.status, t)}
          </span>
        </div>

        {/* Action buttons — always on the right */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {job.progress > 0 ? `${job.progress.toFixed(1)}%` : '...'}
            </span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {job.size && (
                <span style={{ color: 'var(--text-secondary)' }}>{job.size}</span>
              )}
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
    </div>
  )
}

export default function QueuePage() {
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
