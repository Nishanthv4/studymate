# StudyMate v6 — Task recovery, exam calendar, and backup/restore

This is an overlay upgrade for an existing React + Vite + Express StudyMate project. It preserves the local-first workflow, does not add a login page, and uses Ollama with `llama3.2:1b` by default.

## New features

- **Smart missed-task rescheduler:** finds unchecked study tasks from past plan days and tries to fit them into future free slots. It respects valid, saved class periods, timed study blocks already in the plan, the configured daily focused-study limit, matching upcoming exams/assignments from the calendar, and explicit future dates detected in the free-text deadline field (for example `22 Oct` or `2026-10-22`). It adds a small buffer after existing blocks, tries up to 60 days ahead, and leaves tasks in the original plan if the full task (or all split parts) cannot be safely scheduled.
- **Exam countdown and calendar:** add exams and assignment deadlines, see countdowns, navigate calendar months, select dates, and pass upcoming structured deadlines to future plan generation/refinement.
- **Current-day awareness:** a local date banner and current-day highlighting update during the session; the browser sends its local date, weekday, and time with plan requests so Day 1 begins today and past times are avoided; the calendar follows midnight rollover if it had been showing the previous current day/month.
- **Full backup and restore:** one JSON file includes saved plans, task completion, active plan, weekly timetable, exam entries, and current form draft. Restore validates the format/size and asks before replacing existing data.
- **Bug hardening:** local stored plans/times/dates are normalized; repeated Day N headings from small models are merged; local API errors are clearer; the local API accepts localhost Vite ports when Vite changes ports.

## Installation

Read `INSTALL.txt`. Short version: back up your files, replace `src/App.jsx`, `src/App.css`, and `server.js` in your existing project, optionally replace `index.html`, restart `node server.js`, keep the Vite terminal running, and refresh the frontend.

Do not replace `package.json`, `src/main.jsx`, or `node_modules`; no new dependencies are needed. `src/index.css` is included only for reference and does not need to be replaced.

## Verification performed

- `node --check server.js` passed.
- JSX transpilation/syntax check reported zero diagnostics.
- CSS parse checks passed for `App.css` and `index.css`.
- Helper tests passed for duplicate day headings, clock parsing/formatting, date math, duration parsing, and invalid saved date/time/metadata normalization.

The package has not been run in the user's Windows browser + Ollama runtime here. After installing, manually verify AI generation, one missed-task reschedule, adding an exam/countdown, and a backup-export/restore cycle.
