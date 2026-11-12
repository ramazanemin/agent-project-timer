# Agent Project Timer design
Approved scope, 2026-11-12: Automatically measure Codex, Claude Code, Cline and OpenCode activity; pause between turns, resume with subsequent prompts. User explicitly completes a project in the dashboard.

Architecture choice: dependency-free Node.js >=22.13, local SQLite database, local HTTP dashboard. Alternatives: browser-only cannot observe agents; remote service adds account and hosting requirements. A local library/CLI plus native lifecycle adapters fits the requested use.

Store only project path/name, agent, session identifier and activity intervals; no prompts, credentials or conversation content. Separate elapsed calendar duration from active time; union concurrent sessions to avoid double-counting. Agent task completion pauses a session, never completes the project. Completed projects reject activity until explicitly reopened. Hooks work with the dashboard closed. Missing stop events after a crash require manual pause; no guessed inactivity timeout.

Provide explicit opt-in project installation (preserve existing settings). Codex/Claude command hooks; OpenCode V1 plugin; Cline file hooks (platform/version constraints documented). No global agent configuration changes. GitHub-ready repository, MIT license, CI, tests and Turkish quickstart. Live agent testing depends on locally installed clients; fixture verification must be distinguished from live verification.
