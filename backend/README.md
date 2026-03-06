# Backend – Personal Website

Express server that serves the built React site and provides an API for admin-managed content (experiences, projects, photos, contact messages).

## Setup

From the project root:

```bash
npm run build
cd backend && npm install
npm start
```

Server runs at **http://localhost:3000** (or `PORT` env var). The site is served from `../dist`; admin data is stored in `data/*.json`.

## API (all under `/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/experiences` | — | List experiences |
| POST | `/api/experiences` | Admin | Add one |
| PUT | `/api/experiences` | Admin | Replace all (body: `{ items }`) |
| DELETE | `/api/experiences/:id` | Admin | Remove one |
| GET | `/api/projects` | — | List projects |
| POST | `/api/projects` | Admin | Add one |
| PUT | `/api/projects` | Admin | Replace all |
| DELETE | `/api/projects/:id` | Admin | Remove one |
| GET | `/api/photos` | — | List photos |
| POST | `/api/photos` | Admin | Add one |
| PUT | `/api/photos` | Admin | Replace all |
| DELETE | `/api/photos/:id` | Admin | Remove one |
| GET | `/api/messages` | Admin | List contact messages |
| POST | `/api/messages` | — | Submit contact message |
| PUT | `/api/messages` | Admin | Replace all |
| DELETE | `/api/messages/:id` | Admin | Remove one |

**Admin auth:** send `Authorization: Bearer <ADMIN_PASSWORD>` on POST/PUT/DELETE. Password is set via env `ADMIN_PASSWORD` (default matches the one in the frontend Admin page).

## Environment

- `PORT` – Server port (default `3000`)
- `ADMIN_PASSWORD` – Password for admin API (optional; change in production)

## Development

Run the backend on port 3000 and the Vite dev server (e.g. port 5173). Vite proxies `/api` to the backend so the frontend can call the API during development.
