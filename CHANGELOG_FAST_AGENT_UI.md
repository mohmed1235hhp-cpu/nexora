# Fast Supervisor + UI Upgrade

- Supervisor routing now uses a deterministic, local intent scorer before any model call, so ordinary routing does not wait for Gemini just to classify a request.
- Chat continues through Gemini as the main conversational model.
- Website/app generation keeps the existing OpenRouter/Qwen code pipeline.
- Video generation shows truthful live work states while the real provider request is in flight.
- Website/app generation emits real server-side progress states for build, QA, and preview preparation.
- Removed fixed XP/level/power/review metrics from the home screen.
- Refreshed the home UI with a cleaner glass/neon hero, live execution panel, and stronger visual hierarchy.

## Real Browser Project Runtime — 2026-08-22
- Builder now requests a multi-file web project manifest instead of forcing a single HTML file.
- Added strict project-file sanitization and path traversal protection.
- Preview renders linked CSS/JS into the isolated browser iframe, so generated JavaScript executes in the user's browser.
- Builder edits now send the previous multi-file project back to the coding model instead of only `index.html`.
- Removed fabricated quality/performance/security scores from the builder result.
- The server never executes generated project code; server-side arbitrary command execution is intentionally not enabled.
