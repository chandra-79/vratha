# Tracker comparison and implemented improvements

Reviewed 19 September 2026. This compares the products' own public feature descriptions, not a reliability or popularity ranking.

| Reference | Observed feature | Decision for this site |
| --- | --- | --- |
| [Digital Japa Counter](https://www.jaapcounter.in/) | Selectable mala sizes and daily goals, seven-day history, streaks, focus mode, Undo | Added goal presets, recent daily counts and a current-cycle streak. Retained focus, Undo and optional sensory feedback. |
| [DailyBliss mantra counter](https://dailybliss.app/tools/mantra-counter/) | Browser counting with keyboard support; its companion app advertises separate mantra histories and daily/lifetime goals | Added recorded totals across the selected practice's current and archived cycles. Kept each deity's data separate. The web tool itself says it does not preserve history beyond today; we do. |
| [NaamJaap goal calculator](https://blog.naamjaap.in/naam-jap-calculator-how-long-to-complete-your-goal/) | Planning a larger goal from daily repetition targets | Added the projected cycle total (chants per day × number of days). |

## Competitor review, 21 September 2026

Reviewed the current crop of japa counters (apps and browser tools) for the mantras they ship and for look-and-feel patterns. Sources: [NaamJaap comparison of five counters](https://naamjaap.in/blog/top-5-naam-japa-counter-apps), [NaamJaap online counter](https://naamjaap.in/online-counter), [JapaCounterOnline](https://japacounteronline.in/), [JapaCount](https://www.japacount.com/), [600IQ naam japa counter](https://600iq.com/tools/naam-japa-counter/), [Japa Counter by Sweetedge](https://play.google.com/store/apps/details?id=com.sweetedge.japacounter), [an open-source japa mala counter](https://github.com/Srusti-26/japa-mala-counter), and the [Divine Life Society japa mantra list](https://www.dlshq.org/teachings/japa-yoga/) used as the text reference.

| Pattern seen across competitors | Decision for this site |
| --- | --- |
| Mantra presets converge on Om Namah Shivaya, Hare Krishna Maha Mantra, Ram Naam, Gayatri, Om Gam Ganapataye, Maha Mrityunjaya, Radhe, Om Namo Narayanaya; Lakshmi and Saraswati appear in longer lists | Added Krishna (Maha Mantra), Maha Mrityunjaya, Narayana, Lakshmi, Saraswati and Subrahmanya as built-in practices with Devanagari, Telugu, transliteration, meaning, art and spoken guides. Radhe Radhe is a naam rather than a listed mantra text; users can add it as a personal practice. |
| Counting is framed as beads within a 108-bead mala plus a mala number ("Bead 37 / 108 · Mala 2"), with presets of 11, 27, 54, 108 | Counter and focus ring show mala round and bead position once the target is 108 or more. Added the 27 preset. Kept our per-day target model rather than auto-resetting at 108, because a vratha has a fixed daily count. |
| Distinct haptic on completing a mala, softer tap per bead; guru bead drawn larger on the ring | Longer vibration pulse on each completed mala; guru-bead marker at the top of the focus ring. |
| Focus mode shows a large deity image with minimal chrome | Focus mode now shows the practice artwork above the ring. Artwork remains symbolic line drawings, not sacred iconography. |
| Streaks with current and best values; lifetime tallies toward 1 lakh / 1 crore | Added best streak for the cycle and a lifetime milestone bar (108 → 1,008 → 10,008 → 1 lakh → 10 lakh → 1 crore) driven by the existing all-cycle total. No leaderboard. |
| Warm saffron/marigold accents on cream or deep indigo backgrounds; low visual noise for meditation | Already the direction here; the completion card and share image were brought onto the same palette in the previous pass. |

Not adopted: voice/microphone counting (accuracy untested and battery-hungry), background music loops, mini-games, and global leaderboards.

## Sharing and discoverability pass, 22 September 2026

The tracker is shared person to person — a link sent to family in WhatsApp or
Telegram — but it carried no link-preview metadata at all, so those links
appeared as bare URLs with no title, description or image.

| Gap found | Decision for this site |
| --- | --- |
| No Open Graph or Twitter Card tags; a shared link showed nothing | Added the full set plus a 1200×630 preview card drawn in the app's own saffron and marigold palette, showing a mala ring, the guru bead and the mantra in Devanagari and Telugu. |
| No structured data | Added JSON-LD (`WebApplication` + `Person`) describing the practice list and features. Nothing is claimed that the app does not do. |
| No `robots.txt` or `sitemap.xml` | Added both. One canonical URL; practices are views of that page, not separate documents. |
| A practice could not be linked to or bookmarked | Added `?practice=<id>`. The URL wins over the tab's remembered selection, and switching keeps the address bar in step with `replaceState`. |
| Manifest had no shortcuts and no maskable icons | Added maskable icons, categories, `lang`/`dir`, and four home-screen shortcuts (Ganapati, Shiva, Krishna, Gayatri). |
| `cache.addAll` in the service worker install | Replaced with individual `cache.add` calls. `addAll` is all-or-nothing, so one failing entry in the forty-asset media list would abort the install and leave no offline support whatsoever. |
| The new query parameter would have cached one copy of the app per practice | Navigations are now stored under a single `./index.html` key. Verified: two index entries in the cache regardless of how many practices are visited. |

Deliberately not done: personal practices are not addressable by URL, because
they exist only in the user's own browser and a shared link to one would be
dead for everyone else.

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
