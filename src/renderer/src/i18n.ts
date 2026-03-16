export type SupportedLanguage = 'en' | 'ru'

export const translations = {
  en: {
    // Navigation
    navDownloader: 'Downloader',
    navQueue: 'Queue',
    navSettings: 'Settings',

    // Downloader Page
    urlPlaceholder: 'Paste YouTube / VK / TikTok link...',
    fetchBtn: 'Fetch',
    configClear: 'Clear',
    waitingPlaceholder: 'Paste link to grab track or video',
    analyzingLink: 'Analyzing link...',
    analyzingDesc: 'Fetching video metadata',
    settingsBtn: 'Select browser in Settings',

    // Config Panel
    configFormat: 'FORMAT',
    configAudio: 'AUDIO',
    configVideo: 'VIDEO',
    configSubtitles: 'SUBTITLES',
    configSubtitlesNone: 'None',
    configSubtitlesDownload: 'Download',
    configSubtitlesEmbed: 'Embed',
    configChapters: 'CHAPTERS',
    configChaptersOption: 'Split by chapter',
    chapterOptionSingle: 'Single file (Full video)',
    chapterOptionSplit: 'Selected episodes',
    configAdvanced: 'ADVANCED',
    configPreset: 'FAST PRESET (SMART)',

    // Playlist & Chapters
    playlistTracks: 'Playlist Tracks',
    selectAll: 'Select All',
    selectNone: 'None',
    chaptersTitle: 'Chapters',
    timingCrop: 'Timing Crop (Optional)',
    timeFrom: 'FROM (HH:MM:SS)',
    timeTo: 'TO (HH:MM:SS)',
    timeHelper: 'Leave empty to download full video. Ignored if chapters are selected.',
    selected: 'selected',
    editMetadataBtn: 'Edit Metadata',
    metaArtist: 'Artist',
    metaYear: 'Year',
    metaDescription: 'Description / Comment',

    // Download BTN
    downloadBtn: '⬇ Download',

    // Queue Page
    queueTitle: 'Download Queue',
    queueEmpty: 'Queue is empty. Find something to download!',
    openFolder: 'Folder',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    removeBtn: 'Remove',
    clearFinished: 'Clear finished',
    activeJobs: 'active',
    finishedJobs: 'finished',
    noDownloads: 'No downloads',

    // Statuses
    statusIdle: 'Idle',
    statusFetching: 'Fetching...',
    statusPending: 'Pending',
    statusStarting: 'Preparing...',
    statusDownloading: 'Downloading',
    statusConverting: 'Processing...',
    statusDone: 'Done',
    statusError: 'Error',
    statusCancelled: 'Cancelled',
    statusPaused: 'Paused',

    // Settings Page
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    themeDeepSpace: 'Deep Space',
    themeLight: 'Light',
    themeMidnightPurple: 'Midnight Purple',
    themeCrimsonWave: 'Crimson Wave',
    themeArcticSteel: 'Arctic Steel',
    themeSunsetAmber: 'Sunset Amber',
    themeGraphitePro: 'Graphite Pro',
    themeSakuraRain: 'Sakura Rain',
    themeForestTerminal: 'Forest Terminal',
    themeSystem: 'System Default',

    downloadSec: 'Download',
    saveFolderVideo: 'VIDEO SAVE FOLDER',
    saveFolderAudio: 'AUDIO SAVE FOLDER',
    browse: 'Browse',
    concurrent: 'CONCURRENT DOWNLOADS',

    subtitlesSec: 'Subtitles',
    downloadSubs: 'Download subtitles',
    embedSubs: 'Embed into video',
    subsLang: 'LANGUAGE',

    metadataSec: 'Metadata & Tags',
    embedThumb: 'Embed thumbnail (album art)',
    embedMeta: 'Embed metadata (title, artist)',
    useCookies: 'USE COOKIES FROM BROWSER (BYPASS AGE/GEO BLOCKS)',
    useCookiesNone: 'None (Anonymous)',
    useCookiesWarn:
      'Requires the browser to be closed during download for yt-dlp to access the cookie file.',

    clipboardSec: 'Clipboard Watcher',
    autoDetect: 'Auto-detect media links',
    autoDetectDesc: 'When enabled, copying a YouTube URL will prompt an instant download',

    presetsSec: 'Smart Presets',
    addPreset: '+ Add Preset',
    cancelBtn: 'Cancel',
    savePreset: 'Save Preset',
    noPresets: 'No presets yet.',
    deleteBtn: 'Delete',

    advancedSec: 'Advanced',
    customArgs: 'CUSTOM yt-dlp ARGUMENTS',
    portableMode: 'Portable mode',
    portableModeDesc: 'Save config.json next to the executable',

    componentsSec: 'Components',
    checkForUpdates: '↻ Check for updates',
    updating: 'Updating...',

    // Clipboard Toast
    detectedLink: 'Detected media link',
    downloadNow: 'Download Now',
    dismiss: 'Dismiss'
  },
  ru: {
    // Navigation
    navDownloader: 'Загрузки',
    navQueue: 'Очередь',
    navSettings: 'Настройки',

    // Downloader Page
    urlPlaceholder: 'Вставьте ссылку YouTube / VK / TikTok...',
    fetchBtn: 'Найти',
    configClear: 'Очистить',
    waitingPlaceholder: 'Вставьте ссылку для загрузки аудио или видео',
    analyzingLink: 'Анализ ссылки...',
    analyzingDesc: 'Получаем метаданные видео',
    settingsBtn: 'Выбрать браузер в Настройках',

    // Config Panel
    configFormat: 'ФОРМАТ',
    configAudio: 'АУДИО',
    configVideo: 'ВИДЕО',
    configSubtitles: 'СУБТИТРЫ',
    configSubtitlesNone: 'Нет',
    configSubtitlesDownload: 'Скачать',
    configSubtitlesEmbed: 'Встроить',
    configChapters: 'ЧАПТЕРЫ (ЭПИЗОДЫ)',
    configChaptersOption: 'Разрезать по эпизодам',
    chapterOptionSingle: 'Одним файлом (Полное видео)',
    chapterOptionSplit: 'Выбранные эпизоды',
    configAdvanced: 'ПРОДВИНУТЫЕ',
    configPreset: 'БЫСТРЫЕ ПРЕСЕТЫ',

    // Playlist & Chapters
    playlistTracks: 'Треки плейлиста',
    selectAll: 'Выбрать всё',
    selectNone: 'Ничего',
    chaptersTitle: 'Чаптеры (Эпизоды)',
    timingCrop: 'Обрезка по времени (Опционально)',
    timeFrom: 'ОТ (ЧЧ:ММ:СС)',
    timeTo: 'ДО (ЧЧ:ММ:СС)',
    timeHelper: 'Оставьте пустым для скачивания всего видео. Игнорируется, если выбраны чаптеры.',
    selected: 'выбрано',
    editMetadataBtn: 'Изменить метаданные',
    metaArtist: 'Исполнитель',
    metaYear: 'Год',
    metaDescription: 'Описание / Комментарий',

    // Download BTN
    downloadBtn: '⬇ Скачать',

    // Queue Page
    queueTitle: 'Очередь загрузок',
    queueEmpty: 'Очередь пуста. Найдите что-нибудь для загрузки!',
    openFolder: 'Папка',
    pause: 'Пауза',
    resume: 'Пуск',
    cancel: 'Отмена',
    removeBtn: 'Удалить',
    clearFinished: 'Очистить завершенные',
    activeJobs: 'активных',
    finishedJobs: 'завершенных',
    noDownloads: 'Нет загрузок',

    // Statuses
    statusIdle: 'Ожидание',
    statusFetching: 'Получение...',
    statusPending: 'В очереди',
    statusStarting: 'Подготовка...',
    statusDownloading: 'Скачивание',
    statusConverting: 'Обработки...',
    statusDone: 'Готово',
    statusError: 'Ошибка',
    statusCancelled: 'Отменено',
    statusPaused: 'Пауза',

    // Settings Page
    settingsTitle: 'Настройки',
    appearance: 'Внешний вид',
    language: 'Язык',
    theme: 'Тема оформления',
    themeDeepSpace: 'Глубокий космос',
    themeLight: 'Светлая',
    themeMidnightPurple: 'Полуночный пурпур',
    themeCrimsonWave: 'Багровая волна',
    themeArcticSteel: 'Арктическая сталь',
    themeSunsetAmber: 'Закатный янтарный',
    themeGraphitePro: 'Профессиональный графит',
    themeSakuraRain: 'Дождь сакуры',
    themeForestTerminal: 'Лесной терминал',
    themeSystem: 'Системная',

    downloadSec: 'Загрузка',
    saveFolderVideo: 'ПАПКА СОХРАНЕНИЯ ВИДЕО',
    saveFolderAudio: 'ПАПКА СОХРАНЕНИЯ АУДИО',
    browse: 'Обзор',
    concurrent: 'ОДНОВРЕМЕННЫХ ЗАГРУЗОК',

    subtitlesSec: 'Субтитры',
    downloadSubs: 'Скачивать субтитры',
    embedSubs: 'Встраивать в видео',
    subsLang: 'ЯЗЫК СУБТИТРОВ',

    metadataSec: 'Метаданные и Теги',
    embedThumb: 'Встроить обложку (thumbnail)',
    embedMeta: 'Встроить метаданные (название, артист)',
    useCookies: 'ИСПОЛЬЗОВАТЬ COOKIES БРАУЗЕРА (ОБХОД БЛОКИРОВОК)',
    useCookiesNone: 'Нет (Анонимно)',
    useCookiesWarn:
      'Браузер должен быть закрыт во время загрузки, чтобы yt-dlp мог получить доступ к файлу cookie.',

    clipboardSec: 'Перехват буфера обмена',
    autoDetect: 'Автоопределение медиа ссылок',
    autoDetectDesc: 'Копирование URL автоматически предложит скачать файл',

    presetsSec: 'Умные Пресеты',
    addPreset: '+ Создать Пресет',
    cancelBtn: 'Отмена',
    savePreset: 'Сохранить Пресет',
    noPresets: 'Нет пресетов.',
    deleteBtn: 'Удалить',

    advancedSec: 'Расширенные',
    customArgs: 'КАСТОМНЫЕ АРГУМЕНТЫ yt-dlp',
    portableMode: 'Портативный режим',
    portableModeDesc: 'Сохранять config.json рядом с .exe файлом',

    componentsSec: 'Компоненты',
    checkForUpdates: '↻ Проверить обновления',
    updating: 'Обновление...',

    // Clipboard Toast
    detectedLink: 'Обнаружена ссылка',
    downloadNow: 'Скачать сейчас',
    dismiss: 'Скрыть'
  }
}

export function useTranslation(lang: SupportedLanguage) {
  return function t(key: keyof (typeof translations)['en']) {
    return translations[lang][key] || translations['en'][key]
  }
}
