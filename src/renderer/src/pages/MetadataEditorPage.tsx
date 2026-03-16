import { useStore } from '../store'
import { useTranslation } from '../i18n'

interface MetadataEditorPageProps {
  onBack: () => void
}

export default function MetadataEditorPage({ onBack }: MetadataEditorPageProps) {
  const meta = useStore((s) => s.meta)
  const customTitle = useStore((s) => s.customTitle)
  const setCustomTitle = useStore((s) => s.setCustomTitle)
  const customThumbnail = useStore((s) => s.customThumbnail)
  const setCustomThumbnail = useStore((s) => s.setCustomThumbnail)

  const settings = useStore((s) => s.settings)
  const t = useTranslation(settings.language)

  const customArtist = useStore((s) => s.customArtist)
  const setCustomArtist = useStore((s) => s.setCustomArtist)
  const customYear = useStore((s) => s.customYear)
  const setCustomYear = useStore((s) => s.setCustomYear)
  const customDescription = useStore((s) => s.customDescription)
  const setCustomDescription = useStore((s) => s.setCustomDescription)

  const handleChooseThumbnail = async () => {
    // @ts-ignore
    const res = await window.api.openImageDialog()
    if (res.success && res.data) {
      setCustomThumbnail(res.data)
    }
  }

  if (!meta) return null

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div className="flex items-center gap-16">
          <div>
            <h1 className="heading-xl">{t('editMetadataBtn')}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {settings.language === 'ru'
                ? 'Измените информацию о видео перед загрузкой'
                : 'Change video information before downloading'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-40" style={{ marginTop: 32 }}>
        {/* Thumbnail Edit */}
        <div style={{ width: 320 }}>
          <p className="heading-sm" style={{ marginBottom: 12 }}>
            {settings.language === 'ru' ? 'Обложка файла' : 'File Cover'}
          </p>
          <div
            className="glass-panel"
            style={{
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              border: customThumbnail
                ? '1px solid var(--accent)'
                : '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                overflow: 'hidden',
                borderRadius: 8,
                background: '#000'
              }}
            >
              <img
                src={customThumbnail ? `file://${customThumbnail}` : meta.thumbnail}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="Preview"
              />
              {customThumbnail && (
                <button
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14
                  }}
                  onClick={() => setCustomThumbnail('')}
                >
                  ✕
                </button>
              )}
            </div>
            <button className="btn btn-primary w-full" onClick={handleChooseThumbnail}>
              🖼️ {settings.language === 'ru' ? 'Выбрать свою обложку' : 'Choose custom cover'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              {settings.language === 'ru'
                ? 'Рекомендуется JPG или PNG. Обложка будет вшита прямо в медиафайл.'
                : 'JPG or PNG recommended. Thumbnail will be embedded into the file.'}
            </p>
          </div>
        </div>

        {/* Info Edit */}
        <div className="flex-1">
          <p className="heading-sm" style={{ marginBottom: 12 }}>
            {settings.language === 'ru' ? 'Информация' : 'Information'}
          </p>
          <div
            className="glass-panel"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <div>
              <label
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  display: 'block',
                  marginBottom: 8
                }}
              >
                {settings.language === 'ru' ? 'Название (Title)' : 'Title'}
              </label>
              <input
                className="input w-full"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 20 }}>
              <div>
                <label
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    display: 'block',
                    marginBottom: 8
                  }}
                >
                  {t('metaArtist')}
                </label>
                <input
                  className="input w-full"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="..."
                />
              </div>
              <div>
                <label
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    display: 'block',
                    marginBottom: 8
                  }}
                >
                  {t('metaYear')}
                </label>
                <input
                  className="input w-full"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="YYYY"
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  display: 'block',
                  marginBottom: 8
                }}
              >
                {t('metaDescription')}
              </label>
              <textarea
                className="input w-full"
                style={{ minHeight: 80, resize: 'vertical', padding: 12 }}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="..."
              />
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: 24,
                marginTop: 8
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-12">
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                    onClick={onBack}
                  >
                    💾 {settings.language === 'ru' ? 'Применить и вернуться' : 'Apply and return'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setCustomTitle(meta.title)
                      setCustomThumbnail('')
                      setCustomArtist(meta.author || '')
                      setCustomYear('')
                      setCustomDescription('')
                    }}
                  >
                    ↺ {settings.language === 'ru' ? 'Сбросить' : 'Reset'}
                  </button>
                </div>
                <button className="btn btn-ghost" style={{ padding: '10px 24px' }} onClick={onBack}>
                  {t('cancelBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
