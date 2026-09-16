import os
import shutil
import weasyprint

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, 'screenshots')

icon_path = os.path.join(BASE_DIR, 'build', 'icon.png')
sc_card = os.path.join(SCREENSHOTS_DIR, 'sc_card.png')
sc_presets = os.path.join(SCREENSHOTS_DIR, 'sc_presets.png')
sc_format = os.path.join(SCREENSHOTS_DIR, 'sc_format.png')
sc_folder = os.path.join(SCREENSHOTS_DIR, 'sc_folder.png')
sc_timing = os.path.join(SCREENSHOTS_DIR, 'sc_timing.png')
sc_chapters = os.path.join(SCREENSHOTS_DIR, 'sc_chapters.png')
sc_queue = os.path.join(SCREENSHOTS_DIR, 'sc_queue_card.png')
sc_settings = os.path.join(SCREENSHOTS_DIR, 'sc_settings_accordions.png')
sc_cookies = os.path.join(SCREENSHOTS_DIR, 'sc_settings_cookies.png')

html_content = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>uDowload — Полное иллюстрированное руководство пользователя</title>
<style>
  @page {{
    size: A4;
    margin: 13mm 14mm 13mm 14mm;
    @bottom-right {{
      content: counter(page);
      font-size: 8pt;
      font-family: 'Lato', 'DejaVu Sans', sans-serif;
      font-weight: 700;
      color: #64748b;
    }}
    @bottom-left {{
      content: "uDowload v1.0.4 • Полное руководство пользователя";
      font-size: 8pt;
      font-family: 'Lato', 'DejaVu Sans', sans-serif;
      color: #64748b;
    }}
  }}

  @page:first {{
    margin: 0;
    @bottom-right {{ content: none; }}
    @bottom-left {{ content: none; }}
  }}

  body {{
    font-family: 'Lato', 'DejaVu Sans', 'FreeSans', sans-serif;
    font-size: 9pt;
    line-height: 1.45;
    color: #1e293b;
    margin: 0;
    padding: 0;
    orphans: 2;
    widows: 2;
  }}

  /* ── COVER PAGE ── */
  .cover-page {{
    background: linear-gradient(135deg, #070a11 0%, #0f172a 45%, #064e3b 100%);
    color: #ffffff;
    width: 210mm;
    height: 297mm;
    box-sizing: border-box;
    padding: 55mm 20mm 20mm 20mm;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
  }}

  .cover-logo {{
    width: 100px;
    height: 100px;
    margin: 0 auto 16px auto;
    filter: drop-shadow(0 10px 25px rgba(16, 185, 129, 0.45));
  }}

  .cover-title {{
    font-size: 38pt;
    font-weight: 800;
    letter-spacing: -1px;
    margin: 0 0 10px 0;
    color: #ffffff;
  }}

  .cover-subtitle {{
    font-size: 13pt;
    color: #cbd5e1;
    max-width: 520px;
    margin: 0 auto 20px auto;
    font-weight: 400;
    line-height: 1.4;
  }}

  .cover-badges {{
    margin: 18px 0;
  }}

  .badge {{
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 8.5pt;
    font-weight: 600;
    margin: 0 4px;
  }}

  .badge-emerald {{
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }}

  .badge-blue {{
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
  }}

  .badge-purple {{
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
    border: 1px solid rgba(168, 85, 247, 0.4);
  }}

  .cover-features {{
    margin: 28px auto;
    max-width: 520px;
    text-align: left;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px 22px;
    font-size: 9pt;
    color: #94a3b8;
    line-height: 1.6;
  }}

  .cover-features strong {{
    color: #f1f5f9;
  }}

  .cover-footer {{
    font-size: 8.5pt;
    color: #64748b;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 15px;
  }}

  /* ── SECTION HEADINGS ── */
  h1 {{
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #10b981;
    padding-bottom: 4px;
    margin: 14px 0 8px 0;
    letter-spacing: -0.3px;
    break-after: avoid;
  }}

  h2 {{
    font-size: 11.5pt;
    font-weight: 700;
    color: #1e293b;
    margin: 12px 0 6px 0;
    break-after: avoid;
  }}

  h3 {{
    font-size: 9.8pt;
    font-weight: 700;
    color: #0f766e;
    margin: 9px 0 4px 0;
    break-after: avoid;
  }}

  p {{
    margin: 0 0 6px 0;
    color: #334155;
  }}

  ul, ol {{
    margin: 0 0 7px 0;
    padding-left: 17px;
  }}

  li {{
    margin-bottom: 2.5px;
    color: #334155;
  }}

  strong {{
    color: #0f172a;
  }}

  code {{
    font-family: 'Consolas', 'Courier New', monospace;
    background: #f1f5f9;
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 8.5pt;
    color: #0f766e;
    border: 1px solid #e2e8f0;
  }}

  /* ── SCREENSHOT CONTAINERS ── */
  .screenshot-box {{
    margin: 6px 0 8px 0;
    text-align: center;
    break-inside: avoid;
  }}

  .screenshot-box img {{
    max-width: 100%;
    max-height: 165px;
    border-radius: 6px;
    border: 1px solid #334155;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
    display: block;
    margin: 0 auto;
  }}

  .screenshot-caption {{
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 3px;
    font-style: italic;
  }}

  /* ── CARDS & CALLOUTS ── */
  .step-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #10b981;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 6px;
    break-inside: avoid;
  }}

  .step-card-blue {{
    border-left-color: #0ea5e9;
  }}

  .step-card-purple {{
    border-left-color: #8b5cf6;
  }}

  .step-card-amber {{
    border-left-color: #f59e0b;
  }}

  .step-title {{
    font-size: 9pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }}

  .scenario-block {{
    break-inside: avoid;
    margin-bottom: 8px;
  }}

  .info-box {{
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-left: 3px solid #3b82f6;
    border-radius: 6px;
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 8.5pt;
    color: #1e40af;
    break-inside: avoid;
  }}

  .tip-box {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 3px solid #22c55e;
    border-radius: 6px;
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 8.5pt;
    color: #166534;
    break-inside: avoid;
  }}

  .warn-box {{
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-left: 3px solid #f59e0b;
    border-radius: 6px;
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 8.5pt;
    color: #92400e;
    break-inside: avoid;
  }}

  /* ── TABLES ── */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 8px 0;
    font-size: 8.3pt;
    break-inside: avoid;
  }}

  th {{
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 5px 8px;
    border-top: 1px solid #e2e8f0;
    border-bottom: 2px solid #cbd5e1;
  }}

  td {{
    padding: 4px 8px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: top;
  }}

  tr:nth-child(even) td {{
    background: #f8fafc;
  }}

  /* ── TWO-COLUMN GRID ── */
  .grid-2 {{
    display: flex;
    justify-content: space-between;
    gap: 9px;
    margin: 6px 0 8px 0;
    break-inside: avoid;
  }}

  .grid-col {{
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 7px 9px;
  }}

  .grid-col-title {{
    font-weight: 700;
    color: #0f172a;
    font-size: 8.6pt;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 4px;
  }}

  /* ── FAQ ── */
  .faq-item {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #0ea5e9;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 6px;
    break-inside: avoid;
  }}

  .faq-q {{
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
    font-size: 8.7pt;
  }}

  .faq-a {{
    color: #475569;
    font-size: 8.4pt;
    margin: 0;
  }}
</style>
</head>
<body>

<!-- ══════════════ COVER PAGE ══════════════ -->
<div class="cover-page">
  <div></div>
  <div class="cover-center">
    <img src="{icon_path}" class="cover-logo" alt="uDowload Logo">
    <div class="cover-title">uDowload</div>
    <div class="cover-subtitle">
      Официальное иллюстрированное руководство пользователя настольного приложения
    </div>

    <div class="cover-badges">
      <span class="badge badge-emerald">v1.0.4 Release</span>
      <span class="badge badge-blue">Windows • macOS • Linux</span>
      <span class="badge badge-purple">yt-dlp & FFmpeg 9.0+</span>
      <span class="badge badge-emerald">4K / 8K • MP3 320k • Opus</span>
    </div>

    <div class="cover-features">
      <strong>Ключевые возможности программы:</strong><br>
      • Высокоскоростное скачивание видео и аудио с более чем 1000 сайтов<br>
      • Нарезка роликов по главам YouTube (Chapters) и точным таймкодам (ОТ / ДО)<br>
      • Авторазбивка музыкальных альбомов на треки с тегами ID3 и папками<br>
      • Умные пресеты в 1 клик с возможностью выбора пресета по умолчанию<br>
      • Обход блокировок и авторизация через Cookie браузера (18+, закрытые видео)<br>
      • Поддержка тем «Глубокий космос» и «Светлая» на ультрасовременном Glassmorphism
    </div>
  </div>

  <div class="cover-footer">
    Разработчик: <strong>flatisqa</strong> • Репозиторий: <strong>github.com/flatisqa/uDownload</strong> • 2026 г.
  </div>
</div>

<!-- ══════════════ 1. О ПРОГРАММЕ ══════════════ -->
<h1>1. О программе uDowload</h1>
<p>
  <strong>uDowload</strong> — это настольное приложение нового поколения для быстрой загрузки видео, аудиозаписей, плейлистов и альбомов с более чем 1000 интернет-ресурсов (YouTube, VK Видео, Rutube, TikTok, Vimeo, Twitch, SoundCloud и др.).
</p>

<div class="info-box">
  💡 <strong>Архитектура:</strong> Приложение объединяет максимальную производительность консольных утилит <code>yt-dlp</code> и <code>FFmpeg 9.0+</code> с ультрасовременным интерфейсом Glassmorphism.
</div>

<div class="grid-2">
  <div class="grid-col">
    <div class="grid-col-title">🎬 Видео и Аудио</div>
    <ul>
      <li>Разрешение от 144p до 4K/8K (60fps, HDR)</li>
      <li>Контейнеры MP4, MKV, WebM</li>
      <li>Аудио: Original Opus, MP3 320k, FLAC Lossless</li>
    </ul>
  </div>
  <div class="grid-col">
    <div class="grid-col-title">⚡ Умные сценарии</div>
    <ul>
      <li>Выборочная нарезка по главам (Chapters)</li>
      <li>Точная обрезка по таймкодам (чч:мм:сс)</li>
      <li>Авторазбивка альбомов на треки с обложкой</li>
    </ul>
  </div>
</div>

<!-- ══════════════ 2. УСТАНОВКА ══════════════ -->
<h1>2. Установка и варианты запуска</h1>
<p>Свежие официальные сборки доступны на GitHub в разделе <code>Releases</code>:</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Платформа</th>
      <th style="width: 40%;">Файл дистрибутива</th>
      <th style="width: 35%;">Особенности запуска</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Windows 10 / 11</strong></td>
      <td>
        <code>uDowload-1.0.4-setup.exe</code><br>
        <code>uDowload-1.0.4-portable.exe</code>
      </td>
      <td><strong>Setup:</strong> стандартный установщик с ярлыками.<br><strong>Portable:</strong> единый <code>.exe</code>, запуск без установки.</td>
    </tr>
    <tr>
      <td><strong>macOS</strong> (Apple Silicon / Intel)</td>
      <td>
        <code>uDowload-1.0.4.dmg</code><br>
        <code>uDowload-1.0.4-universal-mac.zip</code>
      </td>
      <td><strong>Universal Binary:</strong> нативная поддержка Apple Silicon (M1/M2/M3/M4) и Intel. Смонтируйте DMG и перетащите в Applications.</td>
    </tr>
    <tr>
      <td><strong>Linux</strong> (Ubuntu / Debian / Arch)</td>
      <td>
        <code>uDowload-1.0.4.AppImage</code><br>
        <code>uDowload_1.0.4_amd64.deb</code>
      </td>
      <td><strong>AppImage:</strong> <code>chmod +x</code> и запуск.<br><strong>DEB:</strong> установка через <code>sudo dpkg -i</code>.</td>
    </tr>
  </tbody>
</table>

<!-- ══════════════ 3. ГЛАВНЫЙ ЭКРАН (ЗАГРУЗКИ) ══════════════ -->
<h1>3. Главный экран («Загрузки») — Полный пошаговый гид</h1>
<p>
  Вкладка <strong>«Загрузки»</strong> — основной рабочий центр uDowload. Ниже подробно разобран каждый элемент интерфейса и представлены пошаговые инструкции для всех сценариев.
</p>

<!-- 3.1 Одиночный файл -->
<h2>3.1. Сценарий: Скачивание одиночного файла (видео или аудио)</h2>
<p>Базовый сценарий для скачивания любого ролика, лекции, клипа или песни по прямой ссылке:</p>

<div class="screenshot-box">
  <img src="{sc_card}" alt="Карточка медиа и поле ввода">
  <div class="screenshot-caption">Рис. 1 — Поле ввода ссылки, кнопки поиска/скачивания и карточка медиа с редактором метаданных</div>
</div>

<div class="step-card">
  <div class="step-title">Шаг 1. Вставка ссылки и автоперехват буфера обмена (Clipboard Watcher)</div>
  Скопируйте ссылку на ролик в браузере (Ctrl+C). Если в настройках включен «Перехват буфера обмена», uDowload <strong>автоматически подставит ссылку</strong> и начнет получение информации о ролике. Также вы можете вручную вставить URL в поле ввода (Ctrl+V) и нажать кнопку <strong>«Найти»</strong>. Кнопка <strong>«Очистить»</strong> мгновенно сбрасывает поле.
</div>

<div class="step-card step-card-blue">
  <div class="step-title">Шаг 2. Карточка медиа и редактирование метаданных (ID3 / Название)</div>
  После распознавания появится карточка с обложкой ролика, названием, автором и точной длительностью. Нажав кнопку <strong>✏️ «Изменить метаданные»</strong> в правом углу карточки, вы можете прямо перед скачиванием подкорректировать итоговое название файла, указать имя исполнителя и музыкальные теги.
</div>

<div class="screenshot-box">
  <img src="{sc_format}" alt="Выбор формата и качества">
  <div class="screenshot-caption">Рис. 2 — Меню выбора типа формата («Только аудио»), битрейта (Best без пережатия) и подсказка по качеству</div>
</div>

<div class="step-card step-card-purple">
  <div class="step-title">Шаг 3. Выбор типа формата (Видео / Только аудио / Только видео)</div>
  В выпадающем списке <strong>«Формат»</strong> выберите желаемый режим:
  <ul>
    <li><strong>Видео + Аудио:</strong> скачивает полноценный видеоролик со сведением звука в один контейнер (MP4, MKV или WebM).</li>
    <li><strong>Только видео:</strong> скачивает чистую видеодорожку без звука (идеально для видеомонтажа, б-роллов и футажей).</li>
    <li><strong>Только аудио:</strong> извлекает звуковую дорожку из видео (для прослушивания музыки, подкастов или аудиокниг).</li>
  </ul>
</div>

<div class="step-card step-card-amber">
  <div class="step-title">Шаг 4. Настройка качества видео или битрейта аудио</div>
  <ul>
    <li><strong>Для видео:</strong> выберите разрешение от экономных <code>360p / 720p</code> до ультра-чётких <code>1080p (Full HD)</code>, <code>1440p (2K)</code>, <code>2160p (4K)</code> и <code>4320p (8K)</code> с сохранением 60 кадров/сек и HDR.</li>
    <li><strong>Для аудио:</strong> выберите битрейт MP3 (<code>128k</code>, <code>192k</code>, <code>256k</code>, <code>320k</code>), Lossless (<code>FLAC</code>, <code>WAV</code>) или режим <strong>⭐ Best (без изменений)</strong>. В режиме Best аудиопоток Opus/M4A с серверов YouTube сохраняется в оригинале без перекодирования — скачивание происходит мгновенно и с высочайшим качеством звука.</li>
  </ul>
</div>

<div class="screenshot-box">
  <img src="{sc_folder}" alt="Выбор папки сохранения">
  <div class="screenshot-caption">Рис. 3 — Строка выбора папки сохранения с кнопками «Обзор» и «Открыть папку»</div>
</div>

<div class="step-card">
  <div class="step-title">Шаг 5. Выбор каталога сохранения и старт скачивания</div>
  Строка <strong>«Папка сохранения»</strong> отображает текущий путь загрузки. Кликните кнопку <strong>«Обзор»</strong>, чтобы выбрать другую папку, или <strong>«Открыть папку»</strong>, чтобы посмотреть её содержимое в проводнике. Для старта нажмите большую зелёную кнопку <strong>«Скачать»</strong> — задача моментально отправится в Очередь.
</div>

<!-- 3.2 Быстрые пресеты -->
<h2>3.2. Сценарий: Быстрые пресеты в один клик</h2>
<p>
  Под полем ввода расположена панель <strong>«Быстрые пресеты»</strong>. Клик по кнопке пресета мгновенно выставляет настроенную связку формата и качества:
</p>

<div class="screenshot-box">
  <img src="{sc_presets}" alt="Панель быстрых пресетов">
  <div class="screenshot-caption">Рис. 4 — Панель быстрых смарт-пресетов с индикатором пресета по умолчанию (⭐)</div>
</div>

<div class="grid-2">
  <div class="grid-col">
    <div class="grid-col-title">🚗 В машину</div>
    Автоматически включает «Только аудио», битрейт MP3 320 kbps и вшивание квадратной обложки для автомагнитол.
  </div>
  <div class="grid-col">
    <div class="grid-col-title">📱 На телефон</div>
    Включает режим «Видео + Аудио», разрешение 720p MP4 для экономии памяти смартфона и быстрого просмотра.
  </div>
</div>

<div class="grid-2">
  <div class="grid-col">
    <div class="grid-col-title">📺 Архив 4K</div>
    Выставляет видео 2160p (4K) 60fps в контейнере MKV с наилучшим звуковым потоком для домашних кинотеатров.
  </div>
  <div class="grid-col">
    <div class="grid-col-title">🔥 Audio original ⭐</div>
    Скачивает аудиопоток YouTube (Opus 160 kbps) в оригинале без секунды перекодирования.
  </div>
</div>

<div class="tip-box">
  ⭐ <strong>Пресет по умолчанию:</strong> В меню «Настройки → Умные пресеты» вы можете назначить любой пресет главным со значком звёздочки ⭐. При каждом открытии программы он будет выбираться автоматически.
</div>

<!-- 3.3 Главы / Эпизоды -->
<h2>3.3. Сценарий: Скачивание видео с главами (YouTube Chapters / Эпизоды)</h2>
<p>
  Если автор видео разметил таймкоды (главы / треки) в описании, uDowload мгновенно распознаёт структуру и открывает интерактивную панель <strong>«Чаптеры (Эпизоды)»</strong>:
</p>

<div class="screenshot-box">
  <img src="{sc_chapters}" alt="Панель глав и эпизодов">
  <div class="screenshot-caption">Рис. 5 — Интерактивный список глав ролика с таймкодами, переключателем режимов и чекбоксами</div>
</div>

<div class="step-card step-card-blue">
  <div class="step-title">Режим 1. «Одним файлом (Полное видео)»</div>
  Скачивает видео целиком в единый файл, но <strong>вшивает оглавление глав</strong> внутрь видеоконтейнера MP4/MKV. При открытии такого файла в любом плеере (VLC, MPC-HC, QuickTime) вы сможете переключаться между главами кнопками «Следующий/Предыдущий раздел».
</div>

<div class="step-card step-card-purple">
  <div class="step-title">Режим 2. «Выбранные эпизоды» (Нарезка на отдельные файлы)</div>
  При выборе этого режима активируется список чекбоксов напротив каждой главы:
  <ul>
    <li>Используйте кнопки <strong>«Выбрать всё»</strong> или <strong>«Ничего»</strong> для быстрого сброса.</li>
    <li>Отметьте галочками только нужные вам фрагменты (например, части 2, 4 и 5).</li>
    <li><strong>Результат:</strong> uDowload скачает видео и при помощи FFmpeg нарежет его на отдельные самостоятельные файлы с именами глав (например: <code>02. He Said No.mp4</code>, <code>04. On Christ Alone.mp4</code>).</li>
  </ul>
</div>

<!-- 3.4 Нарезка по времени -->
  <h2>3.4. Сценарий: Точная нарезка длинного видео по времени (Timing Cut)</h2>
  <p>
    Когда вам нужен только конкретный фрагмент из длинного видео (например, 5 минут из 3-часового интервью или стрима), скачивать гигабайты видео целиком не нужно.
  </p>

  <div class="screenshot-box">
    <img src="{sc_timing}" alt="Блок обрезки по времени">
    <div class="screenshot-caption">Рис. 6 — Блок задания интервала обрезки «ОТ» и «ДО» в формате чч:мм:сс</div>
  </div>

  <div class="step-card step-card-amber">
    <div class="step-title">Пошаговая настройка интервала обрезки:</div>
    <ol>
      <li>Найдите на первой странице блок <strong>«ОБРЕЗКА ПО ВРЕМЕНИ (ОПЦИОНАЛЬНО)»</strong>.</li>
      <li>В поле <strong>«ОТ (чч:мм:сс)»</strong> укажите начало фрагмента (например, <code>00:14:20</code>).</li>
      <li>В поле <strong>«ДО (чч:мм:сс)»</strong> укажите окончание фрагмента (например, <code>00:19:45</code>). Если нужно скачать от указанной точки и до самого конца ролика, оставьте в поле «ДО» значение по умолчанию <code>inf</code>.</li>
      <li><strong>Экономия трафика и времени:</strong> программа скачивает с сервера только запрошенный диапазон, экономя ваше время и дисковое пространство.</li>
    </ol>
  </div>
<!-- 3.5 Плейлисты и каналы -->
  <h2>3.5. Сценарий: Скачивание плейлистов и каналов</h2>
  <p>
    При вставке ссылки на плейлист (YouTube Playlist, подборка VK Видео и т.д.) uDowload переключается в пакетный режим:
  </p>
  <ul>
    <li><strong>Определение количества:</strong> программа показывает общее количество роликов в подборке.</li>
    <li><strong>Выбор диапазона:</strong> вы можете скачать весь плейлист целиком либо указать диапазон роликов (например, <code>1-10</code> для первых десяти роликов).</li>
    <li><strong>Пакетная очередь:</strong> ролики добавляются в Очередь задач, где скачиваются параллельно в соответствии с вашими настройками одновременных потоков.</li>
  </ul>
<!-- 3.6 Нарезка альбомов на треки -->
  <h2>3.6. Сценарий: Нарезка музыкальных альбомов на треки</h2>
  <p>
    Специализированный инструмент для длинных музыкальных миксов и альбомов, выложенных одним файлом:
  </p>
  <div class="step-card">
    <div class="step-title">Автораспознавание треклиста и теги ID3:</div>
    <ul>
      <li><strong>Автоопределение:</strong> алгоритм сканирует описание и комментарии ролика и находит список треков с таймкодами (например, <code>03:15 Song Title</code>).</li>
      <li><strong>Редактор треклиста:</strong> в появившейся таблице вы можете вручную переименовать песни, подправить тайминги или удалить ненужные композиции.</li>
      <li><strong>Папка альбома и обложка:</strong> программа создаст отдельную аккуратную папку с именем альбома, сохранит файл обложки <code>folder.jpg</code> и пропишет в каждый трек теги исполнителя и номер дорожки.</li>
    </ul>
  </div>
<!-- ══════════════ 4. ОЧЕРЕДЬ ЗАГРУЗОК ══════════════ -->
  <h1>4. Вкладка «Очередь» (Queue) и мониторинг</h1>
  <p>
    Вкладка <strong>«Очередь»</strong> позволяет отслеживать ход загрузок в реальном времени, контролировать скорость и управлять файлами.
  </p>

  <div class="screenshot-box">
    <img src="{sc_queue}" alt="Карточка задачи в очереди">
    <div class="screenshot-caption">Рис. 7 — Карточка активной задачи: процент, текущая скорость, ETA и прогресс нарезки треков</div>
  </div>

  <div class="grid-2">
    <div class="grid-col">
      <div class="grid-col-title">📊 Индикаторы процесса</div>
      <ul>
        <li><strong>Скорость:</strong> в реальном времени (например, <code>5.48 MiB/s</code>)</li>
        <li><strong>ETA:</strong> оставшееся время до окончания загрузки</li>
        <li><strong>Объем:</strong> скачано МБ из общего веса файла</li>
        <li><strong>Статус треков:</strong> галочки при нарезке альбома</li>
      </ul>
    </div>
    <div class="grid-col">
      <div class="grid-col-title">🎮 Управление задачей</div>
      <ul>
        <li><strong>Пауза / Возобновить:</strong> временная остановка потока</li>
        <li><strong>Отмена:</strong> удаление задачи из очереди</li>
        <li><strong>Иконка папки:</strong> открытие скачанного файла в проводнике</li>
        <li><strong>Свернуть:</strong> компактный вид карточки</li>
      </ul>
    </div>
  </div>
<!-- ══════════════ 5. РАЗДЕЛЫ НАСТРОЕК ══════════════ -->
  <h1>5. Вкладка «Настройки» (Settings)</h1>
  <p>
    Все параметры uDowload сгруппированы в виде 8 сворачиваемых секций (аккордеонов). Открытое состояние блоков сохраняется автоматически.
  </p>

  <div class="screenshot-box">
    <img src="{sc_settings}" alt="Разделы настроек">
    <div class="screenshot-caption">Рис. 8 — Аккордеоны настроек: внешний вид, папки по умолчанию, субтитры, теги и компоненты</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Раздел настроек</th>
        <th style="width: 75%;">Назначение и параметры</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Внешний вид</strong></td>
        <td>Выбор языка (Русский / English) и темы оформления («Глубокий космос» тёмная, либо светлая).</td>
      </tr>
      <tr>
        <td><strong>2. Загрузка</strong></td>
        <td>Каталоги по умолчанию для видео и аудио, ограничение одновременных закачек (от 1 до 10).</td>
      </tr>
      <tr>
        <td><strong>3. Субтитры и текст</strong></td>
        <td>Скачивание субтитров, выбор основного языка (RU, EN), автоперевод, вшивание в контейнер.</td>
      </tr>
      <tr>
        <td><strong>4. Метаданные и теги</strong></td>
        <td>Вшивание обложек, автозаполнение ID3-тегов и <strong>авторизация через Cookies браузера</strong>.</td>
      </tr>
      <tr>
        <td><strong>5. Перехват буфера</strong></td>
        <td>Включение/отключение автоматического детектирования ссылок из буфера обмена ОС.</td>
      </tr>
      <tr>
        <td><strong>6. Умные пресеты</strong></td>
        <td>Создание, редактирование, удаление пресетов и выбор пресета по умолчанию со звёздочкой ⭐.</td>
      </tr>
      <tr>
        <td><strong>7. Расширенные</strong></td>
        <td>Пользовательские консольные аргументы yt-dlp (прокси, кастомные заголовки, лимит скорости).</td>
      </tr>
      <tr>
        <td><strong>8. Компоненты</strong></td>
        <td>Выбор FFmpeg (системный либо автономный 9.0+ от BtbN), проверка и автообновление бинарников.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-box">
    <img src="{sc_cookies}" alt="Настройка Cookies браузера">
    <div class="screenshot-caption">Рис. 9 — Выбор браузера для чтения Cookies (Chrome, Edge, Firefox, Brave, Safari)</div>
  </div>

  <div class="warn-box">
    ⚠️ <strong>Важно при использовании Cookies:</strong> При чтении cookies напрямую из браузера (например, Google Chrome), перед стартом скачивания приватного или закрытого видео <strong>закройте браузер</strong>, чтобы операционная система освободила файл базы данных cookies для yt-dlp.
  </div>
<!-- ══════════════ 6. СОВЕТЫ И FAQ ══════════════ -->
<h1>6. Полезные советы и Часто задаваемые вопросы (FAQ)</h1>

<div class="faq-item">
  <div class="faq-q">❓ Как скачать закрытое видео или видео с возрастным ограничением (18+)?</div>
  <div class="faq-a">
    Перейдите в <strong>Настройки → Метаданные и теги</strong>, в пункте «Из браузера» выберите ваш браузер, в котором выполнен вход в аккаунт (например, Chrome). Закройте браузер и нажмите «Скачать» — сессия авторизации передастся в загрузчик.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Как скачать аудио в максимальном качестве без потерь и пережатия?</div>
  <div class="faq-a">
    Выберите пресет <strong>«Audio original ⭐»</strong> либо в меню формата установите «Только аудио» и качество <strong>«Best (без изменений)»</strong>. Приложение сохранит оригинальный поток Opus/M4A прямо с серверов без перекодирования.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Где искать скачанные файлы?</div>
  <div class="faq-a">
    Нажмите кнопку <strong>«Открыть папку»</strong> в строке папки сохранения на главном экране или кликните иконку папки на карточке завершенной задачи во вкладке «Очередь».
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Как обновить yt-dlp и FFmpeg до самых свежих версий?</div>
  <div class="faq-a">
    Откройте <strong>Настройки → Компоненты</strong> и нажмите кнопку <strong>«Проверить обновления»</strong>. Приложение автоматически загрузит свежие стабильные сборки в фоновом режиме.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Можно ли вырезать только песню из длинного концерта?</div>
  <div class="faq-a">
    Да! Если автор указал треклист, воспользуйтесь блоком «Чаптеры» или «Разбивка на треки». Если треклиста нет, укажите тайминги начала и конца в блоке «Обрезка по времени (ОТ / ДО)».
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Поддерживается ли докачка файлов при обрыве интернет-соединения?</div>
  <div class="faq-a">
    Да, встроенный движок yt-dlp автоматически возобновляет загрузку с того места, где она прервалась, без необходимости повторно скачивать уже полученные части файла.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Можно ли сохранить файлы сразу на внешний накопитель или флешку?</div>
  <div class="faq-a">
    Конечно. Нажмите кнопку «Обзор» в строке папки сохранения и укажите любую папку на внешнем USB-диске, SD-карте или сетевом диске (NAS).
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Как скачать субтитры к видео на нужном языке?</div>
  <div class="faq-a">
    Откройте <strong>Настройки → Субтитры и текст</strong>, активируйте переключатель «Скачивать субтитры» и выберите желаемые языки (например, RU, EN). uDowload может вшивать дорожку субтитров прямо в контейнер MP4/MKV или сохранять отдельным файлом <code>.srt</code> рядом с видео.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Почему видео 4K и 8K скачиваются со звуком без потери качества?</div>
  <div class="faq-a">
    Видеохостинги (YouTube, VK) отдают потоки высокого разрешения раздельно: чистое видео и отдельный звук. uDowload автоматически задействует встроенный <strong>FFmpeg 9.0+</strong> для бесшовного мультиплексирования (сведения) аудио и видео в единый файл без перекодирования и задержек.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Можно ли ограничить скорость загрузки, чтобы не перегружать сеть?</div>
  <div class="faq-a">
    Да. В разделе <strong>Настройки → Расширенные</strong> в строке кастомных параметров введите ключ <code>--limit-rate 5M</code> (ограничение 5 МБ/с) или любое другое комфортное значение.
  </div>
</div>

<h2 style="margin-top: 18px;">⌨️ Горячие клавиши</h2>

<table style="width:100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 10px;">
  <thead>
    <tr style="background: #0f172a; color: #fff;">
      <th style="padding: 5px 8px; text-align: left; border-radius: 4px 0 0 0;">Сочетание</th>
      <th style="padding: 5px 8px; text-align: left;">Действие</th>
      <th style="padding: 5px 8px; text-align: left; border-radius: 0 4px 0 0;">Где работает</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Ctrl + V</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Вставить ссылку из буфера обмена</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Вкладка «Загрузки»</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Enter</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Запустить анализ / поиск видео</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Поле ввода URL</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Esc</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Очистить поле ввода / закрыть панель</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Поле ввода URL</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Ctrl + Tab</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Переключение между вкладками (Загрузки → Очередь → Настройки)</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Всё приложение</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Ctrl + D</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Начать загрузку (аналог кнопки «Скачать»)</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Вкладка «Загрузки»</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Ctrl + ,</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Открыть Настройки</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Всё приложение</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><code>Ctrl + Q</code></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Перейти к очереди загрузок</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Всё приложение</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px;"><code>Ctrl + O</code></td>
      <td style="padding: 4px 8px;">Открыть папку сохранения в Finder/Explorer</td>
      <td style="padding: 4px 8px;">Всё приложение</td>
    </tr>
  </tbody>
</table>

<h2 style="margin-top: 18px;">🌐 Поддерживаемые сервисы (более 1000+)</h2>

<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">▶ YouTube</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">📺 Vimeo</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎵 SoundCloud</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">📘 Facebook</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">📸 Instagram</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎭 TikTok</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🐦 Twitter / X</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎬 Rutube</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">💬 VK Видео</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎙 Twitch</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">📡 Dailymotion</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎞 Odysee</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🔵 Reddit</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">📰 Bandcamp</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎶 Mixcloud</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🎥 Bilibili</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">🌏 NicoNico</span>
  <span style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:3px 9px; font-size:8pt;">и многие другие…</span>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Можно ли скачивать из закрытых групп ВКонтакте или приватных каналов?</div>
  <div class="faq-a">
    Да, если вы авторизованы. Перейдите в <strong>Настройки → Метаданные и теги → Из браузера</strong>, выберите браузер, в котором выполнен вход в аккаунт VK или Telegram, закройте браузер и запустите загрузку.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Как скачать несколько видео с разных сайтов сразу?</div>
  <div class="faq-a">
    Добавьте первую ссылку, нажмите «В очередь», затем вставьте следующую ссылку и снова «В очередь». Все задания будут выполнены поочерёдно или параллельно в зависимости от настроек параллелизма.
  </div>
</div>

<div class="faq-item">
  <div class="faq-q">❓ Что делать, если загрузка зависла или показывает ошибку?</div>
  <div class="faq-a">
    Нажмите <strong>✕</strong> на карточке задания, чтобы отменить, и попробуйте снова. Убедитесь, что yt-dlp обновлён (<strong>Настройки → Компоненты → Обновить</strong>). Если ошибка повторяется — откройте Issue на GitHub с текстом ошибки.
  </div>
</div>

<h2 style="margin-top: 16px;">🖥️ Системные требования</h2>

<table style="width:100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 14px;">
  <thead>
    <tr style="background: #0f172a; color: #fff;">
      <th style="padding: 5px 8px; text-align: left;">Параметр</th>
      <th style="padding: 5px 8px; text-align: left;">Минимум</th>
      <th style="padding: 5px 8px; text-align: left;">Рекомендуется</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>ОС</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">macOS 11+, Windows 10, Linux (Ubuntu 20+)</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">macOS 13+, Windows 11</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>RAM</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">4 ГБ</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">8 ГБ и более</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Диск</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">200 МБ (для самого приложения)</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">SSD, место под файлы</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Сеть</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Любое подключение к интернету</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">10 Мбит/с+ для 4K</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px;"><strong>Архитектура</strong></td>
      <td style="padding: 4px 8px;">x86-64, Apple Silicon (ARM64)</td>
      <td style="padding: 4px 8px;">Apple M1/M2/M3, AMD64</td>
    </tr>
  </tbody>
</table>
<h2 style="margin-top: 18px;">📖 Словарь терминов</h2>

<table style="width:100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 14px;">
  <thead>
    <tr style="background: #0f172a; color: #fff;">
      <th style="padding: 5px 8px; text-align: left; width: 22%;">Термин</th>
      <th style="padding: 5px 8px; text-align: left;">Что означает</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Кодек</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Алгоритм сжатия видео или аудио. Примеры: H.264, H.265 (HEVC), AV1 — видео; AAC, Opus, MP3 — аудио.</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Контейнер</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Формат файла, который «упаковывает» видео, аудио и субтитры вместе. Примеры: MP4, MKV, WebM.</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Muxing</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Объединение (мультиплексирование) отдельных потоков видео и аудио в один файл без перекодирования.</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Чаптер / Глава</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Временная метка, которую автор видео расставил в треклисте — позволяет разбить длинное видео на отдельные части.</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Плейлист</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Коллекция нескольких видео, объединённых в список на YouTube или другом сервисе. Скачивается одним URL.</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Пресет</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Готовый набор настроек формата/качества для быстрого выбора. Можно сохранить собственный пресет для повторного использования.</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>yt-dlp</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Мощный open-source движок для загрузки видео с более чем 1000 сайтов. Встроен в uDowload и регулярно обновляется.</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px;"><strong>FFmpeg</strong></td>
      <td style="padding: 4px 8px;">Профессиональный инструмент конвертации и обработки медиа-файлов. uDowload использует его для muxing, обрезки по времени и конвертации.</td>
    </tr>
  </tbody>
</table>

<div style="background: linear-gradient(135deg, #0f172a 0%, #064e3b 100%); color: #fff; border-radius: 10px; padding: 18px 22px; text-align: center; margin-top: 14px; break-inside: avoid; break-before: avoid;">
  <div style="font-size: 14pt; font-weight: 800; margin-bottom: 6px;">uDowload v1.0.4</div>
  <div style="font-size: 8.5pt; color: #94a3b8; margin-bottom: 14px;">Самый удобный загрузчик видео и аудио для macOS, Windows и Linux</div>
  <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
    <span style="background: rgba(255,255,255,0.08); border-radius: 5px; padding: 4px 10px; font-size: 7.5pt; color: #6ee7b7;">📦 Релизы: github.com/flatisqa/uDownload/releases</span>
    <span style="background: rgba(255,255,255,0.08); border-radius: 5px; padding: 4px 10px; font-size: 7.5pt; color: #6ee7b7;">🐛 Issues: github.com/flatisqa/uDownload/issues/new</span>
    <span style="background: rgba(255,255,255,0.08); border-radius: 5px; padding: 4px 10px; font-size: 7.5pt; color: #93c5fd;">🎞 Поддерживаемые сайты: yt-dlp/yt-dlp/supportedsites.md</span>
    <span style="background: rgba(255,255,255,0.08); border-radius: 5px; padding: 4px 10px; font-size: 7.5pt; color: #93c5fd;">🛠 FFmpeg: ffmpeg.org/documentation.html</span>
  </div>
  <div style="font-size: 8pt; color: #6ee7b7; font-weight: 700; letter-spacing: 0.5px;">🌐 github.com/flatisqa/uDownload</div>
  <div style="font-size: 7.5pt; color: #64748b; margin-top: 6px;">По вопросам и предложениям открывайте Issue на GitHub. Мы рады любой обратной связи!</div>
</div>

<h2 style="margin-top: 20px;">🎞 Справочник форматов и кодеков</h2>

<table style="width:100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;">
  <thead>
    <tr style="background: #0f172a; color: #fff;">
      <th style="padding: 5px 8px; text-align: left; width: 14%;">Формат / Кодек</th>
      <th style="padding: 5px 8px; text-align: left; width: 14%;">Тип</th>
      <th style="padding: 5px 8px; text-align: left;">Когда использовать</th>
      <th style="padding: 5px 8px; text-align: left; width: 16%;">Совместимость</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>MP4</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Контейнер</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Универсальный выбор для обмена и просмотра. Работает везде.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐⭐</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>MKV</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Контейнер</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Лучший для хранения: поддерживает много дорожек, субтитры, главы.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>WebM</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Контейнер</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Нативный формат YouTube/VK. Маленький размер, открытый стандарт.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>H.264</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Видео кодек</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Стандарт для SD/HD. Быстрое аппаратное декодирование на всех устройствах.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐⭐</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>H.265 (HEVC)</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Видео кодек</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">4K/8K видео: вдвое меньший размер файла при том же качестве.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>AV1</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Видео кодек</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Следующее поколение: лучшее сжатие, используется YouTube 4K+. Требует мощного CPU.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>AAC</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Аудио кодек</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Стандарт для MP4. Высокое качество при небольшом битрейте (128–256 кбит/с).</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐⭐</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>Opus</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Аудио кодек</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Нативный кодек YouTube/WebM. Выбирайте «Best» чтобы сохранить оригинал.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;"><strong>MP3</strong></td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Аудио кодек</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Максимальная совместимость (старые плееры, авто). Рекомендуется 320 кбит/с.</td>
      <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">⭐⭐⭐⭐⭐</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px;"><strong>FLAC</strong></td>
      <td style="padding: 4px 8px;">Аудио кодек</td>
      <td style="padding: 4px 8px;">Без потерь. Для меломанов и архивного хранения. Большой размер файла.</td>
      <td style="padding: 4px 8px;">⭐⭐⭐⭐</td>
    </tr>
  </tbody>
</table>

<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; font-size: 8pt; color: #14532d; margin-top: 8px;">
  💡 <strong>Совет:</strong> Используйте пресет <strong>«Video original ⭐»</strong> чтобы сохранить исходный кодек без перекодирования — это самый быстрый способ сохранить максимальное качество с минимальным размером файла.
</div>

</body>
</html>
"""

output_docs_pdf = os.path.join(DOCS_DIR, 'uDowload_User_Guide.pdf')
output_root_pdf = os.path.join(BASE_DIR, 'uDowload_User_Guide.pdf')

print("Compiling illustrated PDF with WeasyPrint...")
html_doc = weasyprint.HTML(string=html_content, base_url=BASE_DIR)
html_doc.write_pdf(output_docs_pdf)
print(f"Saved to: {output_docs_pdf}")

# Copy to root directory for convenient access
shutil.copyfile(output_docs_pdf, output_root_pdf)
print(f"Copied to: {output_root_pdf}")

file_size_mb = os.path.getsize(output_root_pdf) / (1024 * 1024)
print(f"PDF Generation Complete! File size: {file_size_mb:.2f} MB")
