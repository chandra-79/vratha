# Naam Jaap & Vratha Tracker

A browser-based companion for Ganapati, Rama, Hanuman, Shiva, Gayatri Matha, and Durga Devi, with separately configurable schedules, daily targets, and temple-visit records for each practice (defaults: 48 days and 21 chants). No account or build step is required.

Run locally:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765`. Use HTTP localhost or HTTPS for offline caching and cross-tab write locks.

## Daily practice

- Pick a start date. Today’s dashboard uses the device’s local date.
- Tap the large counter, use the individual day marks, or complete an audio repetition. All three update the same daily count, capped at your configured daily target.
- Focus mode offers a goal-aware ring, Space to count when the counter is focused, Backspace to undo, and Escape to exit. Screen wake lock and optional vibration depend on browser support.
- Both recordings share the daily count. Switch recordings without losing progress; adjust playback speed, the gap between repetitions, or stop after the current repetition. Starting playback in another tab pauses the first tab where BroadcastChannel is supported.
- Undo remains available for 30 seconds, provided the entry has not changed in another tab. Use **Edit entry** for older corrections. Future days cannot be marked.
- Daily notes are saved using **Save note**. The reader includes Telugu, transliteration from the provided reference sheets, and a short meaning overview.
- The page runs top to bottom: today's practice (with a collapsible **Listen & chant** player), the day grid, **Day details & corrections**, **Your practice at a glance**, Settings, the Ganapati reference sheets, and the footer. Collapsible panels remember whether you left them open. A single floating arrow jumps to the bottom from the top half of the page and back to the top from the bottom half.
- The completion card and the **Progress card** image use the same palette as the rest of the app and follow light or dark mode. When installed to a home screen, the header and dialogs keep clear of the status bar and home indicator.

## Progress and backups

Progress, notes, and archived cycles are stored in this browser under the existing `ganapatiVratha_v2` key. Existing JSON backups are supported. Legacy audio counts are merged once with the corresponding day’s marks using the higher count, never added together.

Settings includes JSON export/import, a recurring `.ics` reminder for your calendar app, and **Archive this cycle & start another**. Archiving keeps all entries, their notes, and the cycle’s goal settings. A complete backup includes archived cycles; each archive can also be downloaded individually. Reset deletes both the current cycle and archives after confirmation.

Cross-tab updates are for the same browser profile and site origin. Moving between devices requires exporting and restoring a backup. Web Locks serialize count changes in browsers that support them; other browsers still receive storage updates but lack that concurrency guarantee.

## Files

- `index.html`: existing tracker, day details, backup flow, and dashboard markup.
- `companion.js`: shared count mutations, focus mode, audio sessions, notes, reader, reminders, archive, and dialog accessibility.
- `companion.css`: responsive dashboard and dialog styling.
- `sw.js`: offline app, reference-image, and audio cache, including media range requests. Paths work at both the site root and `/vratha/` on GitHub Pages.

Offline use requires a successful initial load and completed service-worker installation. Browser storage can be cleared or evicted; keep exported backups for long-term preservation.

## Validation performed

Chromium browser checks covered keyboard counting and Undo, concurrent counts from two tabs, audio-version switching and a real audio ending, the 21-count limit, focus restoration, legacy dialog containment, notes, JSON restoration, archive persistence, calendar downloads, and 320px/390px layouts. Offline reload, offline counting, and cached audio range responses were checked under a `/vratha/` deployment path. Mobile device haptics and calendar-app import behavior were not device-tested.

## Multiple naam-jaap practices

Choose Ganapati, Rama, Hanuman, Shiva, Gayatri Matha, or Durga Devi above the dashboard. Each practice has an independent configurable schedule, daily goal, notes, archives, and temple records. Pick its start date on first use. The default 48 days and 21 chants are tracker defaults, not prescribed durations for the additional mantras.

Ganapati retains `ganapatiVratha_v2`; other practices use `vratha_practice_<id>_v1`. Selection is remembered per tab in session storage, so two tabs may show different practices. Counts still synchronize when tabs show the same practice. Changing practice stops audio, saves an unsaved daily note, and clears Undo to prevent cross-practice corrections.

Backups and resets apply to the **selected practice**. New backups include `practiceId`; importing one selects its matching practice. Existing unlabelled backups are treated as Ganapati data. Export each practice separately to back up all your progress.

`practices.js` contains the texts and audio mappings. The five new practices offer Devanagari, Telugu, transliteration, short meanings, and bundled synthetic spoken guides; see `audio/README.md` for sources and generation details. These audio guides also work offline after the service worker finishes caching them. Ganapati keeps its original two recordings.

## Configurable goals and cookie recovery

Open **Settings → Goals** for the selected practice. Set **1–1008 chants per day**, **1–365 days**, and whether a temple visit is required to complete the day. Quick presets fill the chant input; press **Save practice goals** to apply. Existing data defaults to 21 chants over 48 days.

Changing the goal recalculates completion while preserving counts. Reducing the chant target below any recorded count, or shortening the schedule past days with recorded counts/temple visits/notes, is blocked. Archive the existing cycle first if you need a fresh start. Archives retain their original goal and duration even after the active cycle changes.

Each practice now has a compact cookie fallback with a requested one-year lifetime. Cookies preserve goal settings, dates, daily chant totals and temple flags; full exact checkmark positions, notes and archives remain in local storage and JSON exports. Cookie recovery reconstructs checked marks in order. Clearing both cookies and local storage removes the on-device data. Cookie/storage availability is shown in the save indicator.

The seven-day chart and current-cycle streak use the device's local calendar date. The recorded total includes the selected practice's active cycle and archives; it does not combine different deities. See [RESEARCH.md](RESEARCH.md) for comparisons and design decisions.

## Your own mantras and uploads

Choose **＋ Add your mantra** to create a personal category in any language. Give it a name and add text, image/PDF reading sheets, or a recording. An optional cover image appears beside the practice heading. Set the daily chant target, cycle length, start date and temple requirement when creating it; adjust goals later in Settings.

- Reading sheets: up to 6 PNG/JPG/WebP images or PDFs, 10 MB each. Images open in the reader; PDFs open in a separate tab and can be downloaded. Add a text version for screen readers. There is no automatic OCR or PDF text extraction.
- Audio: one MP3/WAV/M4A/AAC/OGG/WebM file, up to 25 MB. Use a recording of **one repetition**; each completed playback records one chant. Codec support depends on the browser.
- Cover: PNG/JPG/WebP, up to 5 MB. Total uploads per practice: 50 MB.
- **Edit practice** changes the name, text or uploads while preserving progress. New uploads replace the relevant existing files. Check the removal boxes to clear saved media.
- Deleting a personal category removes its progress, archives and uploads after confirmation. Built-in categories cannot be deleted. **Reset** clears the selected category’s progress and archives but retains its text and uploads.

Small category definitions are saved in local storage; media files are saved in IndexedDB on this device. Files are not uploaded to GitHub or a server. Cookies preserve counts/goals, but do not contain category definitions, text or media. A personal-practice JSON backup includes its definition, uploaded files, progress, notes and archives. Restore it in another browser using **Restore backup**. Restoring over an existing practice asks before replacing it. Archive downloads also carry the personal definition and media.

Keep separate backups: clearing site data can remove categories and uploads. The browser may grant persistent storage, but the app cannot guarantee it. Export each category to back up the complete library.

`custom-practices.js` implements the editor, upload validation, IndexedDB storage and portable backups. `manifest.webmanifest` and `assets/` provide the updated PWA branding and practice artwork. See [artwork details](assets/README.md), [research](RESEARCH.md) and the [validation report](VALIDATION.md).
