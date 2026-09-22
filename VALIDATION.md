# Portal validation

Tested 19 September 2026 using isolated Playwright Chromium browser contexts. Local root and `/vratha/` deployments were exercised. Tests used synthetic personal categories and did not modify anyone’s existing browser profile.

## Passed browser checks

- All six built-in categories retain independent progress and goals. All seven bundled audio recordings reached a real playback end and updated the selected daily counter.
- Manual counting, audio counting, count caps, Undo, day correction, notes, optional temple completion, focus mode keyboard handling, focus restoration, Help and reset dialogs.
- Simultaneous counting in two tabs, theme propagation, per-tab category selection, and audio ownership between tabs.
- Goals of 1–1008 chants and 1–365 days; 108/40 and maximum-size cycles; refusal of changes that discard recorded progress; compact large-goal rendering; archive settings retained across subsequent goal changes.
- Cookie restoration after local progress removal, maximum-size cookie below 3800 characters, and restoration of newer cookie counts after simulated local-storage write failure.
- Custom creation with multilingual text, PDF and image references, recording and cover; configured schedule; real uploaded-audio completion; reload persistence; text-only manual practice with unavailable audio controls disabled.
- Personal edits preserve counts and files; changing a category in another tab updates its selector and title. Stale edits are refused, and a draft daily note survives a remote category rename. Removing uploads retains progress. Empty-content edits and malformed/oversized uploads are rejected.
- Simulated storage failure while replacing an upload restores the prior media. Deletion cancellation preserves data; confirmed deletion clears the category, progress, cookie and media, and moves other tabs to a built-in category.
- A downloaded personal backup restored in a completely fresh browser context, including goals, counts, text, PDF, images and recording. Existing-practice restore cancellation preserves progress. Personal archived-cycle downloads also restored with their uploads and original goals. PDF-only creation works without typed text or audio. Legacy backups are accepted; malformed marks and invalid calendar dates are rejected.
- Calendar reminder and progress PNG downloads, archived-cycle preservation, selected-practice reset isolation, future-day write protection, and a single pair of working arrow navigation buttons.
- Offline reload under `/vratha/`, offline custom counting and real audio completion, offline reading sheets, artwork, manifest and icons. All seven bundled recordings returned correct cached HTTP 206 byte ranges.
- Layouts at 320, 390, 768, 1024 and 1440px had no horizontal page overflow. Desktop/mobile screenshots were inspected for the dashboard and custom editor.

## Sharing and deep-link checks, 22 September 2026

Tested in headless Chrome over the DevTools protocol against a local server.

- `?practice=shiva` on a cold load selects the Shiva practice, sets the document
  title, and renders `ॐ नमः शिवाय।` with `lang="sa"`.
- Switching practice in the app updates the query string; returning to Ganapati
  clears it. The Back button is not filled with view changes.
- Offline reload of `?practice=krishna` restores the Krishna practice with the
  full interface, served from the cache.
- The cache holds exactly two index entries (`./` and `./index.html`) after
  visiting several practices, confirming navigations are not cached per query.
- Open Graph image, JSON-LD block, `robots.txt` and `sitemap.xml` all serve.
- No console errors or uncaught exceptions in any of the above.

Not covered: how a specific messaging app renders the preview card, which
depends on each service's own crawler and cache.

## Accessibility checks

Axe-core 4.10.3 checks for WCAG 2 A/AA, 2.1 AA and 2.2 AA reported no violations in the tested views: Ganapati and Gayatri dashboards in light/dark themes, their readers, focus mode, day correction, Help, reset and the custom editor. Keyboard tests covered modal containment, counting, Undo, Escape and focus return. A dark-theme footer contrast issue found during testing was corrected.

Automated scans do not prove complete accessibility conformance. Real screen-reader sessions, physical-device haptics, iOS/Safari/Firefox codec variations, OS installation prompts and calendar-app import behavior were not device-tested. Uploaded audio should contain one repetition; the app counts completed files and does not infer repetitions inside a recording. Browser storage can be cleared or evicted; backups are the recovery mechanism.

JavaScript syntax checks and `git diff --check` also passed. GitHub Pages publication is verified after pushing the final commit.
