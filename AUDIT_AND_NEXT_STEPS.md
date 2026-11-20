# StudyMate audit notes (v5)

## Issues addressed in this upgrade

1. **Failed plan generation could hide the previous plan.** The frontend now leaves current plan state intact until a replacement is returned successfully.
2. **Unexpected browser storage shape could break saved-plan rendering.** Saved-plan and completion state are normalized before use; the timetable is normalized to exactly seven periods and seven days.
3. **API non-JSON responses could become a confusing `response.json()` error.** The frontend now reports a helpful local API response error.
4. **Vite's auto-selected development port could fail CORS.** The backend now permits local `localhost` / `127.0.0.1` development origins on any port, while rejecting non-local origins.
5. **A model request could wait indefinitely.** Ollama calls have a 180-second timeout; the health check has a short timeout and the error message explains what to try.
6. **Large user input could overload the prompt.** Backend validation now limits subjects, goals, deadlines and timetable context.
7. **Timetable times could be reversed or overlap.** The UI highlights invalid or overlapping periods, and only complete, non-overlapping class periods are passed to the AI.
8. **The timetable was not part of AI planning.** Generation and refinement requests now include the saved class timetable context.
9. **CSV values could be treated as spreadsheet formulas.** Formula-like subject values are escaped before export.
10. **Clearing history could erase plans accidentally.** The app asks for confirmation before clearing all plans; resetting completion progress now has a visible, confirmed action.
11. **Downloaded files could revoke the object URL too early.** The link URL is now revoked after a short delay.

## Verification performed here

- `server.js` passed `node --check` syntax validation.
- `src/App.jsx` passed TypeScript's JSX transpilation/syntax check with zero diagnostics.
- `src/App.css` and `src/index.css` passed the available CSS parser with zero top-level parse errors.

## What still needs a local smoke test

This environment cannot connect to the Ollama instance installed on your Windows laptop, and the original Vite `package.json` / `node_modules` are not included in this overlay ZIP. After copying the files, please test locally:

- Edit one period time and a subject, refresh, and confirm the timetable remains.
- Set two periods to overlapping times and confirm warnings appear.
- Export the timetable as CSV and open it.
- Generate a plan and check that it avoids complete class time ranges.
- Stop Ollama, generate a plan, and confirm a readable error appears while the previous plan remains available.
- Test the app at the exact Vite URL printed in the terminal in case the port is not 5173.

No finite source audit can guarantee every possible bug is eliminated; the items above are the issues found and checks performed for this version.

## Additional feature ideas, ordered by value

1. **Missed-task rescheduler:** move unfinished tasks into open study slots while respecting class times and deadlines.
2. **Exam countdown and syllabus coverage:** track unit completion and show days remaining until each exam.
3. **Focus timer with breaks:** Pomodoro or custom timer that marks a task complete when a session finishes.
4. **Subject analytics:** weekly minutes, completion rate and weak-topic tracking without making diagnostic claims.
5. **Timetable-aware availability:** automatically compute free evening/weekend blocks from the class timetable.
6. **Export/restore backup:** download and import a local JSON backup containing timetable, saved plans and progress.
7. **PWA/offline shell:** make the interface installable and allow it to open without network access; AI still requires the local Ollama service to be running.
