# Health Tracking & Advisory App (MVP)

Qwik + TypeScript implementation of the MVP in `HEALTH_APP_BUILD_PROMPT.md`.

## Implemented MVP Scope

- Session auth API with signup/login/logout/me, secure cookie handling, CSRF validation, inactivity timeout logic, and provider-ready OAuth (Google/Apple/Microsoft/Samsung + optional GitHub/LinkedIn) with PKCE state flow.
- TOTP-based 2FA setup/confirm/disable/verify endpoints and login challenge flow.
- Health metrics logging (single + batch), history endpoint, latest metrics endpoint.
- Rule-based suggestions endpoint and dashboard cards.
- D3 metric interconnection graph with upstream/downstream highlight, zoom/pan, edge/node tooltips.
- Intervention library + simulation endpoint, before/after table, contraindication warnings, predicted graph overlay.
- Snapshot save/list/delete, snapshot vs current comparison, timeline chart.
- Apple Health sync endpoints (consent + sync event logging + status), sync indicator UI.
- Settings endpoint/UI for weight and distance unit preferences.
- Postgres-backed persistence via Drizzle (single-state adapter for existing APIs).

## Run

```bash
pnpm install
export DATABASE_URL=postgres://health:health@localhost:5432/health_app
export OAUTH_SIMULATION_MODE=true
pnpm dev
```

App runs at `http://localhost:5173` by default.

## Type Check

```bash
./node_modules/.bin/tsc --noEmit
```

## Docker (local dev)

```bash
docker compose up --build
```

This starts Postgres + the app on `http://localhost:3000`.

## API Surface

Implemented routes are under `src/routes/api/*` and match the MVP route list in the prompt (auth, metrics, snapshots, interventions, suggestions, applehealth, settings).
