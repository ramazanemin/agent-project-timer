# Verification record — 2026-11-12

- Node 24.22.1 on Windows; Node 22 CI specified but not run locally.
- 17 automated tests: interval resume/overlap/completion, persistence, normalized payloads, real generated Cline scripts and CLI subprocesses, OpenCode V1 callback, HTTP state changes and cross-origin denial, installer preservation/idempotency, Windows path casing, discoverable plugin extension.
- In-app browser: initial empty dashboard renders; sample project counter displays and increments; pause button transitions to Bekliyor with stable active time. Sample data stored separately in work/preview.sqlite and is not shipped. Completion API verified automatically; browser dialog interaction could not be verified, so the unnecessary confirmation was removed (completion is reversible).
- npm package content checked with npm 11.6.2 downloaded from registry.npmjs.org into ignored work/tools because host PATH contains Node but no npm.
- Final independent review found OpenCode .mjs discovery and Windows case identity bugs; regression tests reproduced both before fixes. Full suite passed after fixes.
- No live end-to-end session with external Codex/Claude/Cline/OpenCode clients performed. No global agent settings modified. No remote GitHub repository or npm registry publication performed.
