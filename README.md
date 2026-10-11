# DSA Placement Tracker — Full-stack version

A single-user local web app for the 16-week C++ DSA plan. Includes the original tracker features plus an Express backend that persists progress in `data/progress.json`.

## Features

- 16-week roadmap with 96 study-day cards
- Topic descriptions and direct practice links (LeetCode links where appropriate)
- Checklist and progress percentage
- Daily notes for each task
- Study-hour logging and daily target
- Completion streak
- Search and filters (all, pending, completed, next task)
- Dark/light theme
- Export/import JSON backup
- Browser `localStorage` fallback if the API is unavailable
- Express REST API for saving/loading progress

## Requirements

- Node.js 18+ recommended
- npm

## Run locally

1. Extract this ZIP.
2. Open a terminal in the extracted folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the backend:

   ```bash
   npm start
   ```

5. Open **http://localhost:3000** in Chrome.

Do not open `public/index.html` directly if you want server sync. Open the localhost URL instead.

## API endpoints

- `GET /api/health` — health check
- `GET /api/state` — load saved tracker state
- `PUT /api/state` — save tracker state
- `GET /api/export` — download a JSON backup of the server-side state

Progress is saved to `data/progress.json`. Keep this file backed up.

## Important limitations

- This starter version is intended for local/single-user use. It does not include accounts, authentication, or per-user isolation.
- Anyone who can access the server can read or change the saved progress. Do not expose it publicly without adding authentication and HTTPS.
- JSON-file storage is suitable for a small local tracker. For a multi-user deployment, use a database such as PostgreSQL or MongoDB and add authentication.
- The browser's Export/Import buttons manage the browser state; `/api/export` exports the server-side state.

## Folder structure

```text
dsa-placement-tracker/
├── public/
│   └── index.html
├── data/
│   └── progress.json
├── server.js
├── package.json
└── README.md
```


## Debug backend sync

1. Start with `npm start` from the project root.
2. Open `http://localhost:3000/api/health`. It should return JSON with `"ok": true`.
3. Open `http://localhost:3000/api/state`. It should return `{"state":{...}}`.
4. Open the app at `http://localhost:3000` (not by double-clicking `public/index.html`).
5. Check the footer. It should say `Backend connected · progress synced`.
6. Complete a day, then refresh `/api/state`. The `completed` object should include that task.
7. If the footer says local-only, open Chrome DevTools → Console and Network. Look for a failed `/api/state` request and check the terminal for errors.

### Manual API save test (PowerShell)

```powershell
Invoke-RestMethod -Method Put `
  -Uri http://localhost:3000/api/state `
  -ContentType "application/json" `
  -Body '{"completed":{"w0d0":{"date":"2026-10-09"}},"notes":{},"hours":{},"habits":{},"theme":"light","selectedWeek":0}'
Invoke-RestMethod http://localhost:3000/api/state
```

After a successful PUT, `data/progress.json` should contain the saved `completed.w0d0` entry.
