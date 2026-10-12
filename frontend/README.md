# AskMyDocs frontend

React + Vite UI for the RAG document Q&A backend in [`../backend`](../backend).
The design came from Stitch and AI Studio; it is now connected to the FastAPI API.

## Run locally

You need both servers running.

**1. Backend** (from `backend/`, with `GEMINI_API_KEY` set in `backend/.env`):

```bash
uvicorn main:app --reload --port 8000
```

**2. Frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

Open http://localhost:3000. The dev server forwards every `/api/*` request to the
backend at `BACKEND_URL` (default `http://127.0.0.1:8000`), so the browser never makes a
cross-origin request.

## How the UI uses the API

| UI | Endpoint |
| --- | --- |
| Startup, offline banner, Settings (read-only) | `GET /health`, `GET /config` |
| Documents panel (pick what to ask about) | `GET /documents` |
| Upload panel (progress, duplicate, errors) | `POST /upload` |
| Delete document | `DELETE /documents/{doc_id}` |
| Asking questions (all documents, or one) | `POST /ask` |
| Search (Ctrl/⌘ K): find passages inside documents | `GET /search` |
| Document reader ("Read", "Read in document", "Open") | `GET /documents/{doc_id}/segments` |

All calls go through [`src/api.ts`](src/api.ts).

## Deploying

`npm run build` writes static files to `dist/`. Either serve them behind a reverse proxy
that forwards `/api/*` to the backend, or build with `VITE_API_URL=https://your-api`
and add the site's origin to `CORS_ORIGINS` in `backend/.env`.
