# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Wedding reception web app: guests upload photos, leave guestbook entries, and admins moderate. FastAPI backend serves a React SPA; realtime updates flow via WebSocket.

## Commands

Backend (uv + FastAPI, Python ≥3.11):
- `uv sync` — install deps
- `uv run fastapi dev app/main.py` — dev server (reload) on :8000
- `uv run fastapi run app/main.py --host 0.0.0.0 --port 8080` — prod-style run

Frontend (Vite + React 19, in `frontend/`):
- `npm install`
- `npm run dev` — Vite dev server; proxies `/api` → `http://localhost:8080`
- `npm run build` — outputs to `frontend/dist/`, which the FastAPI app mounts at `/` when present
- `npm run lint` — ESLint

Full stack via Docker: `docker-compose up --build` (backend on :8080, optional nginx on :80 serving `frontend/build`).

No test suite is configured.

## Architecture

**Single-process deployment model.** In production, FastAPI serves the built React SPA as static files (`app/main.py` mounts `frontend/dist` at `/` if it exists). In dev, run Vite and FastAPI separately — Vite proxies `/api` to the backend.

**Backend layout** (`app/`):
- `main.py` — FastAPI app, lifespan-based DB init, CORS (open), three routers, `/ws` WebSocket endpoint, SPA static mount.
- `database.py` — `aiosqlite` against `data/wedding.db`. Two tables: `photos`, `guestbook`, both with a `hidden` soft-delete flag. `get_db()` returns a new connection per caller with `Row` factory.
- `routers/` — `gallery.py` (uploads, likes, thumbnails), `guestbook.py` (entries), `admin.py` (login/logout/moderation actions; password in `app/config.py` via `ADMIN_PASSWORD`).
- `utils/image_processor.py` — Pillow-based image/thumbnail processing for uploads; files land in `uploads/` and `thumbnails/`.
- `websocket/manager.py` — in-memory connection manager; routers broadcast via this after mutations so all clients refresh live. Any new mutating endpoint should broadcast through `manager` to preserve realtime behavior.

**Frontend layout** (`frontend/src/`):
- `App.jsx` — top-level view switching (gallery / guestbook / upload / admin).
- `components/` — `PhotoGallery`, `PhotoUpload`, `Guestbook`, `AdminPanel`, `Navigation`, `BackgroundSelector`.
- `hooks/useWebSocket.js` — subscribes to `/ws` and triggers refetches on broadcast messages.
- `config.js` — **all API URLs go through this module.** In dev it reads `VITE_API_URL` / `VITE_WS_URL` (defaults to `localhost:8080`); in prod it uses relative URLs so the SPA works behind the same origin as the API. Add new endpoints here rather than hardcoding.

**Persistent state** lives in `data/` (SQLite), `uploads/` (originals), `thumbnails/` (generated). The Docker compose file bind-mounts all three so they survive rebuilds.

## Secrets

`app/config.py` calls `load_dotenv()` at import time, so secrets go in a gitignored `.env` at the repo root:

```
STABILITY_API_KEY=sk-...
ADMIN_PASSWORD=...          # optional override
```

`chmod 600 .env`. The same file works on the Pi, or inject via `docker-compose.yml` `env_file: .env`.

The caricature endpoint branches on `STABILITY_API_KEY`: when set, it calls Stability v2beta SD 3.5 Flash img2img (`app/utils/stability.py`); when unset, it falls back to the local OpenCV cartoon filter (`app/utils/caricature.py`) so UI iteration doesn't burn credits.

## Notes

- `ADMIN_PASSWORD` defaults to `"wedding2026"` in `app/config.py`; override via `.env` for production.
- CORS is wide open (`allow_origins=["*"]`); intentional for the single-event deployment, but worth noting before reuse.
- Several `*~` backup files exist alongside sources (editor artifacts); ignore them.
