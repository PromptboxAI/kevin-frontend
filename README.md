# kevin-frontend

Production frontend for **Kevin** (kevin.co) — photos in, defensible
personal-property inventory out, exported to Xactimate/XactContents.

- `src/` — the production app (Vite + React + TypeScript).
- `design/` — the high-fidelity design prototype. **Reference, not shippable code.**
  `design/CLAUDE.md` (domain rules), `design/INTERACTIONS.md` (wiring manifest),
  `design/SCHEMAS.md` and `design/ROUTES.md` are the spec.

The backend is a separate service; `kevin-backend/FRONTEND.md` is the API contract.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend origin (the **web** service, not a worker) |
| `VITE_SUPABASE_URL` | Supabase project URL — auth only |
| `VITE_SUPABASE_ANON_KEY` | Publishable key. **Never** the service-role key |

Any `localhost` origin is CORS-allowed by the backend, so local dev needs no
backend change. A deployed origin must be added to `CORS_ALLOWED_ORIGINS`.

## Deployment

Vercel, zero-config Vite. `vercel.json` rewrites every path to `index.html` so
client-side routes resolve on a cold hit — without it, share links of the form
`/p/<token>` 404 at the CDN before React Router ever runs.

## Routes

| Path | Notes |
|---|---|
| `/` | Scaffold placeholder |
| `/p/:token` | **Public** client portal. No auth, no Supabase key required. A dead link answers `410`, not `404` |
