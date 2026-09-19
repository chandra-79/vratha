# Naam Jaap & Vratha Tracker

A browser-based companion for Ganapati, Rama, Hanuman, Shiva, Gayatri Matha, and Durga Devi, with a separate 48-day schedule, daily target of 21 chants, and temple-visit record for each practice. No account or build step is required.

Run locally:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765`. Use HTTP localhost or HTTPS for offline caching and cross-tab write locks.

## Daily practice

- Pick a start date. Today’s dashboard uses the device’s local date.
- Tap the large counter, use the individual day marks, or complete an audio repetition. All three update the same daily count, capped at 21.
- Focus mode offers a 21-segment ring, Space to count when the counter is focused, Backspace to undo, and Escape to exit. Screen wake lock and optional vibration depend on browser support.
- Both recordings share the daily count. Switch recordings without losing progress; adjust playback speed, the gap between repetitions, or stop after the current repetition. Starting playback in another tab pauses the first tab where BroadcastChannel is supported.
- Undo remains available for 30 seconds, provided the entry has not changed in another tab. Use **Edit entry** for older corrections. Future days cannot be marked.
- Daily notes are saved using **Save note**. The reader includes Telugu, transliteration from the provided reference sheets, and a short meaning overview.

## Progress and backups

Progress, notes, and archived cycles are stored in this browser under the existing `ganapatiVratha_v2` key. Existing JSON backups are supported. Legacy audio counts are merged once with the corresponding day’s marks using the higher count, never added together.

Settings includes JSON export/import, a recurring `.ics` reminder for your calendar app, and **Archive this cycle & start another**. Archiving keeps all 48 entries and their notes. A complete backup includes archived cycles; each archive can also be downloaded individually. Reset deletes both the current cycle and archives after confirmation.

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

Choose Ganapati, Rama, Hanuman, Shiva, Gayatri Matha, or Durga Devi above the dashboard. Each practice has an independent 48-day schedule, 21-count daily goal, notes, archives, and temple records. Pick its start date on first use. These are tracker defaults, not prescribed durations for the additional mantras.

Ganapati retains `ganapatiVratha_v2`; other practices use `vratha_practice_<id>_v1`. Selection is remembered per tab in session storage, so two tabs may show different practices. Counts still synchronize when tabs show the same practice. Changing practice stops audio, saves an unsaved daily note, and clears Undo to prevent cross-practice corrections.

Backups and resets apply to the **selected practice**. New backups include `practiceId`; importing one selects its matching practice. Existing unlabelled backups are treated as Ganapati data. Export each practice separately to back up all your progress.

`practices.js` contains the texts and audio mappings. The five new practices offer Devanagari, Telugu, transliteration, short meanings, and bundled synthetic spoken guides; see `audio/README.md` for sources and generation details. These audio guides also work offline after the service worker finishes caching them. Ganapati keeps its original two recordings.
