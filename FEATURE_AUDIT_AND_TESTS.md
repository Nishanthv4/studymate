# StudyMate v6 — bug audit, changes, and test checklist

## Issues hardened

1. **Duplicate day cards from local model output:** repeated headings such as `Day 1` are merged into a single day object, rather than making duplicate cards.
2. **Malformed saved browser data:** saved plans are normalized on load; invalid dates, nonsensical hours, missing text fields, invalid exam dates, and invalid timetable clock values are constrained or discarded.
3. **Current day/calendar rollover:** app date updates every minute. The browser sends local date, weekday, and time to generation/refinement prompts so Day 1 starts today and the model is instructed not to suggest earlier Day 1 times. If the calendar was on the previous current day/month, it follows the new date at midnight while preserving a user's intentional selected date.
4. **Timetable conflicts:** generation context includes only entries with a subject and valid non-overlapping period times. The rescheduler also checks recognized class and timed-study ranges before placing tasks.
5. **Missed-task safety:** unfinished tasks are placed into future gaps after the current time on the current day, not during complete recorded class periods or recognized existing blocks. It respects daily focused time and future calendar dates that match the task. A task split into chunks is removed from its original location only if every chunk was scheduled. Unsuccessful tasks stay in the original plan.
6. **Deadline awareness:** upcoming exam/assignment calendar items are passed into plan generation/refinement; rescheduling uses structured upcoming calendar dates and explicit future dates parsed from lines in the free-text deadline field (for example `22 Oct`, `22/10/2026`, or `2026-10-22`) when matching a task to a subject/topic.
7. **Backup/restore safety:** JSON backup includes plans, completion state, active plan, timetable, calendar entries, and current form draft. Restore checks file size/shape/version, normalizes imported values, and asks before replacing current browser data.
8. **Local API ergonomics:** request errors are made more understandable; local development CORS accepts localhost/127.0.0.1 origins on Vite ports if the default port is occupied.

## Automated/static verification passed

- `node --check server.js`
- TypeScript JSX transpilation/syntax check: zero diagnostics
- PostCSS parser checks for `src/App.css` and `src/index.css`
- Helper test: repeated Day 1 headings merge; time range parsing/formatting; date difference; duration parsing; invalid stored timetable clock time normalization; impossible exam dates rejected; malformed plan metadata normalized; explicit manual deadlines in ISO and DD Mon formats recognized; the frontend includes browser-local date/weekday/time in plan requests.

## Manual smoke test on the user's machine

1. Start Ollama and confirm `ollama list` includes `llama3.2:1b`.
2. Start backend using `node server.js`; open `http://127.0.0.1:3001/api/health` and check it reports the model as installed.
3. Start Vite with `npm run dev`; generate a new study plan and verify headings, tasks, and progress cards show normally.
4. Fill 7-period class times and subjects; refresh the browser to confirm they remain saved.
5. Add an exam/assignment date 2–3 days in the future; verify it appears in calendar and countdowns and is included when generating a new plan.
6. Create or open a past-day plan with at least one unchecked task. Try “Reschedule missed tasks”; inspect times and ensure it does not conflict with class periods, existing timed blocks, or the relevant deadline. If no slot fits, confirm the task remains in place and the app reports that.
7. Download a backup JSON file, change a harmless entry, restore the backup, confirm the prompt, and verify the old entries return.
8. Refresh the page and confirm task progress, exams, saved plans, and timetable persist.

## Known limitations

- Browser localStorage is local to that browser/profile. It is not cross-browser or cloud-synced; use JSON backup/restore for transfer.
- The AI can still output imperfect or vague plans. The deterministic rescheduler can only avoid complete class times entered in the timetable, time ranges it can parse from existing blocks, and future deadline dates it can identify and match from the calendar/free-text deadline field. It cannot infer missing class times or reliably parse ambiguous free-text dates.
- The actual Windows browser/Ollama runtime was not available for end-to-end execution in this build session, so complete the manual smoke test above after replacing the files.
