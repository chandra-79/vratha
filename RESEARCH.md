# Tracker comparison and implemented improvements

Reviewed 19 September 2026. This compares the products' own public feature descriptions, not a reliability or popularity ranking.

| Reference | Observed feature | Decision for this site |
| --- | --- | --- |
| [Digital Japa Counter](https://www.jaapcounter.in/) | Selectable mala sizes and daily goals, seven-day history, streaks, focus mode, Undo | Added goal presets, recent daily counts and a current-cycle streak. Retained focus, Undo and optional sensory feedback. |
| [DailyBliss mantra counter](https://dailybliss.app/tools/mantra-counter/) | Browser counting with keyboard support; its companion app advertises separate mantra histories and daily/lifetime goals | Added recorded totals across the selected practice's current and archived cycles. Kept each deity's data separate. The web tool itself says it does not preserve history beyond today; we do. |
| [NaamJaap goal calculator](https://blog.naamjaap.in/naam-jap-calculator-how-long-to-complete-your-goal/) | Planning a larger goal from daily repetition targets | Added the projected cycle total (chants per day × number of days). |

## Implemented

- Each practice supports 1–1008 chants per day and 1–365 days, with quick chant presets of 21, 54, 108 and 1008.
- A temple visit is independently configurable as a completion requirement. Existing practices retain their previous requirement unless changed.
- The daily counter, audio stopping point, focus ring, calendar, completion rules, reminder, correction dialog, export and archive use the selected practice's settings.
- Changing settings preserves recorded counts. Reductions that would discard counts, temple records or notes are refused; the user can archive the existing cycle instead.
- Cookie fallback restores each practice's settings, dates, daily counts and temple flags. Notes and archived cycles use local storage and JSON backups.
- A seven-day chart, current-cycle streak and all-cycle recorded total add history without competitive rankings.
- Large targets use a compact add button in day details rather than thousands of focusable circles. The calendar selects the day to inspect.

## Deliberately deferred

Cloud sync requires an account/service and explicit product decisions about privacy. Calendar reminders remain downloadable events rather than an untested promise of background web notifications. Voice recognition counting needs pronunciation/noise testing; completion of a known audio file remains the reliable automatic counting trigger here. We did not add a social leaderboard or pace competition to a devotional practice.

## Storage details

One compact first-party cookie per practice has a one-year requested lifetime, SameSite=Lax, and Secure on HTTPS. It contains no notes or recordings. The bounded configuration supports a cookie payload below 3800 ASCII characters even with 365 daily entries at the maximum count. Browsers may expire or evict stored data sooner; exported backups remain the durable user-controlled copy.

Cookie recovery preserves count and temple status; individual checkmark positions are reconstructed in order. Local storage retains exact marks, notes and archives. A visible save indicator distinguishes a full browser-and-cookie save, browser-only save, cookie-only count save, and save failure.

## Personal library and accessibility additions

- File and blob storage uses [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), while small category definitions remain in local storage. This keeps large recordings out of synchronous string storage and cookie headers.
- The app requests [persistent storage](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) after a successful category save; the browser decides whether to grant it. Portable backups remain available regardless of that decision.
- Controls use visible labels, keyboard focus, native modal dialogs, explicit file limits and error messages. Primary controls aim for 44px touch targets, exceeding the [WCAG 2.2 minimum target criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum/). Automated accessibility checks supplement keyboard and viewport checks; they do not establish full accessibility conformance.
- Uploaded reading sheets have open/download links, and the editor asks for a text version for screen readers. PDFs are opened using the browser’s own PDF viewer; automatic transcription and OCR are not advertised.
- Category edits keep progress intact. Concurrent editors detect a changed version before overwriting, and media backups restore into a browser with no pre-existing category.
