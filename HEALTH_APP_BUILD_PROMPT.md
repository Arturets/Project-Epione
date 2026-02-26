# Health Tracking & Advisory App – MVP Build Prompt

## Vision

Build a **full-stack web application** that helps users holistically optimize their bodies, habits, and psychology by visualizing how their health metrics interconnect and showing how interventions affect multiple systems simultaneously.

**Core insight:** Generic advice ("calories in vs. calories out") becomes coherent when contextualized to the individual. This app makes that context visible—showing *why* a recommendation matters *for them*, accounting for allergies, convenience, hunger signals, sleep, stress, etc.

**User journey (MVP):**
1. Sign up / log in (OAuth2 or password)
2. Log health metrics manually or sync from Apple Health
3. Explore an interactive graph showing how their metrics interconnect
4. Select an intervention (e.g., "Starting Strength 5x5 for 8 weeks")
5. See predicted changes across their interconnected metrics (before/after + flagged contradictions)
6. Save snapshots of their state over time and track progress

---

## Technical Stack

**Frontend:** Qwik + Tailwind + TypeScript  
**Backend:** Node + TypeScript + Hono + Zod  
**Data:** Postgres + ElectricSQL + SQLite client + Drizzle ORM  
**Auth:** Session-based (Lucia or Auth.js) + OAuth2 + password auth  
**AI (later):** RAG + pgvector + explainable prompts  
**Infra:** Fly/Railway + Cloudflare + S3 (with local alternatives)  
**Observability:** Sentry + OpenTelemetry + PostHog (optional in local mode)  

---

## MVP Feature Spec

### 1. Authentication

- **Session-based auth** with httpOnly, Secure, SameSite cookies
- **Password auth:** Email + password signup/login
  - Password hashing: bcrypt (min cost factor 12)
  - Email validation on signup
- **OAuth2:** Apple + Google
  - Use PKCE flow (not implicit)
  - Store OAuth tokens securely (encrypted in DB if persisted)
- **Session management:**
  - Auto-logout after 30 days of inactivity
  - Logout endpoint clears session
- **User table schema:**
  ```
  users:
    id (UUID)
    email (unique, indexed)
    password_hash (nullable, for password auth)
    oauth_providers (JSONB: {apple: {sub, email}, google: {sub, email}})
    created_at
    updated_at
  ```

---

### 2. Health Metrics & State Model

**MVP metrics** (7 core + interconnections):
1. **Weight** (lbs or kg, user preference)
2. **Body Fat %** (estimated or measured)
3. **VO2 Max** (ml/kg/min or relative)
4. **Resting Heart Rate** (bpm)
5. **Heart Rate Variability (HRV)** (ms)
6. **Sleep Duration** (hours)
7. **Stress Level** (1-10 self-report)

**Metric properties:**
- Current value
- Last updated (timestamp)
- Unit (user-configurable preference)
- Trend (optional: historical values for graphing)

**Database schema:**
```
metrics:
  id (UUID)
  user_id (FK users)
  metric_name (enum: weight, body_fat, vo2_max, rhr, hrv, sleep, stress)
  value (numeric)
  unit (string: lbs, kg, %, ml/kg/min, bpm, ms, hours, 1-10)
  recorded_at (timestamp)
  synced_from (enum: manual, apple_health, null for manual)
  created_at
  updated_at

user_preferences:
  id (UUID)
  user_id (FK users)
  weight_unit (kg | lbs)
  distance_unit (km | mi)
  created_at
  updated_at

snapshots:
  id (UUID)
  user_id (FK users)
  snapshot_data (JSONB: {metrics: {weight: 82, body_fat: 18, ...}, timestamp: ISO8601})
  created_at
```

**Manual logging:**
- Single-metric entry form (user selects metric, enters value, optional note)
- Or batch-entry form (all metrics at once, optional)
- Auto-populate with last recorded value (if exists)

**Apple Health sync:**
- Read access to: weight, body fat %, heart rate, HRV, sleep duration, steps
- Write access: none (read-only for MVP)
- Sync trigger: on login, or manual "sync now" button
- Store last sync timestamp to avoid duplicate imports
- Handle timezone-aware data from Apple Health
- **Privacy:** Display clear consent before first sync; log all sync events with timestamps

---

### 3. Metric Interconnection Graph

**Graph structure:**
- **Nodes:** The 7 metrics above
- **Edges:** Causal/correlative relationships (hardcoded for MVP)

**Example relationships:**
- Weight ← (inversely) Cardio + Diet
- Body Fat % ← (inversely) Weight Training + Caloric Deficit
- VO2 Max ← Cardio (directly) + Weight Training (indirectly)
- RHR ← (inversely) Cardio fitness
- HRV ← Sleep quality + Stress level
- Sleep ← Stress level (inversely) + Screen time (inversely)
- Stress ← Sleep (inversely) + Cardio (inversely)

**Visualization:**
- Interactive graph using D3 (or Cytoscape/Sigma.js if simpler preferred)
- Static node positions (no force-directed layout for MVP)
- Nodes sized by "importance" or weighted by user interest (configurable later)
- Edges colored by relationship type (correlation vs. causation, strength of effect)
- **Interactivity:**
  - Click a node → highlight upstream (what affects it) OR downstream (what it affects) [toggle button]
  - Hover node → show current value + last updated
  - Hover edge → show relationship description

**Graph controls:**
- Zoom / pan enabled
- "Reset view" button
- (Future: filter by category, search metrics)

---

### 4. Interventions & Effects Configuration

**MVP interventions** (4 curated):
1. **Weight Training** (e.g., Starting Strength 5x5)
   - Duration: 8 weeks
   - Frequency: 3x/week
   - Effects: +5 lbs muscle, +15% strength, -1% body fat (assuming 500 cal/day surplus)
   
2. **Cardio** (e.g., 3x/week moderate intensity)
   - Duration: 8 weeks
   - Frequency: 3x/week
   - Effects: -3 to -5 lbs weight, VO2 max +10%, RHR -5 bpm, HRV +10%
   
3. **Diet intervention** (e.g., clean eating, caloric deficit of 500 kcal/day)
   - Duration: 8 weeks (ongoing)
   - Effects: -1 to -1.5 lbs/week weight, body fat -2-3%, sleep ±0 (neutral)
   
4. **Screen time reduction** (e.g., no screens 1 hour before bed)
   - Duration: 4 weeks
   - Effects: sleep +0.5-1 hour, HRV +15%, stress -2 points

**Intervention config format (JSON):**
```json
{
  "id": "intervention_weight_training",
  "name": "Weight Training (Starting Strength 5x5)",
  "category": "strength",
  "duration_weeks": 8,
  "frequency": "3x/week",
  "description": "Barbell compound movements: squat, bench, deadlift.",
  "effects": [
    {
      "metric": "weight",
      "change_value": 5,
      "unit": "lbs",
      "confidence": "moderate",
      "assumptions": "500 kcal/day surplus"
    },
    {
      "metric": "body_fat",
      "change_value": -1,
      "unit": "%",
      "confidence": "low",
      "assumptions": "assumes strength training only, no caloric surplus"
    },
    {
      "metric": "vo2_max",
      "change_value": 3,
      "unit": "%",
      "confidence": "low",
      "assumptions": "minimal aerobic stimulus"
    }
  ],
  "contraindications": [
    {
      "scenario": "heavy_cardio + weight_training + caloric_deficit",
      "warning": "Combining high-volume cardio with strength training in a deficit may impair hypertrophy. Prioritize recovery and protein intake."
    }
  ]
}
```

**Effects resolution:**
- Read from config file (JSON, loaded at runtime or DB seeded)
- Assume "average adherence" for MVP (don't ask user for adherence details)
- Display as: "Change: +5 lbs (range: +3 to +7 lbs based on genetics)"

---

### 5. Intervention Suggestions (Rule-Based)

**Suggestion logic (rule-based, configurable):**

Rules stored in a config file or DB. Examples:

```json
[
  {
    "condition": {
      "metric": "weight",
      "operator": "above",
      "value": 85,
      "unit": "kg"
    },
    "goal": "weight_loss",
    "suggested_interventions": ["diet_500_deficit", "cardio_3x_weekly"],
    "message": "Your weight is above the CDC healthy range for your height. Consider a moderate caloric deficit + cardio."
  },
  {
    "condition": {
      "metric": "sleep",
      "operator": "below",
      "value": 6,
      "unit": "hours"
    },
    "goal": "recovery",
    "suggested_interventions": ["screen_time_reduction", "stress_management"],
    "message": "Sleep below 6 hours impairs recovery. Try reducing screen time 1 hour before bed."
  },
  {
    "condition": {
      "metric": "stress",
      "operator": "above",
      "value": 7,
      "unit": "1-10"
    },
    "goal": "stress_reduction",
    "suggested_interventions": ["cardio_mild", "screen_time_reduction"],
    "message": "High stress. Moderate cardio and sleep improvement are evidence-based interventions."
  }
]
```

**Suggestion display:**
- On dashboard: show top 2-3 suggestions based on user's current state
- Clickable suggestions lead to intervention details (see next section)

---

### 6. Intervention Explorer & Before/After Visualization

**Intervention explorer flow:**
1. User clicks on an intervention (from suggestions or a library)
2. Display intervention details:
   - Name, duration, frequency, description
   - Assumptions (e.g., "500 kcal surplus assumed")
3. Show **before/after visualization:**
   - **Option A:** Side-by-side graphs (current state vs. predicted state after intervention)
   - **Option B:** Same graph, nodes colored differently (green for improvement, red for risk, gray for unchanged)
4. List expected metric changes in a table:
   | Metric | Current | Predicted | Change | Confidence |
   |--------|---------|-----------|--------|------------|
   | Weight | 82 kg | 79 kg | -3 kg | Moderate |
   | Body Fat % | 22% | 20% | -2% | Low |
5. **Contraindication warnings:**
   - If user has selected multiple interventions (stacking), flag conflicts
   - E.g., "Heavy cardio + weight training in a deficit may reduce muscle gains"
   - Display as a yellow/orange banner, don't block selection

**Graph visualization for intervention effects:**
- Same interactive graph as main view
- Nodes update to show predicted values (or highlight which metrics change)
- Use color coding: green (improvement), red (degradation), gray (no change)
- Option to toggle between current/predicted with a slider or button

---

### 7. Snapshots & Time Tracking

**Snapshot functionality:**
- User can manually save a snapshot of their current metrics with a timestamp
- Or snapshots are auto-saved weekly (configurable)
- Each snapshot includes: all metric values, optional user note, timestamp

**Snapshot UI:**
- List view: "Snapshot from Dec 15, 2024 – Weight: 82 kg, Body Fat: 22%"
- Click snapshot to compare with current state:
  - **Side-by-side graphs** (snapshot vs. current)
  - **Timeline view:** Graph showing metric values over time (line chart for each metric)
  - Show delta: "Weight changed +2 kg since Dec 15"

**Database:**
```
snapshots:
  id (UUID)
  user_id (FK users)
  metric_values (JSONB: {weight: 82, body_fat: 22, vo2_max: 45, ...})
  user_note (text, optional)
  created_at
  updated_at
```

---

### 8. Data Sync (ElectricSQL + Local-First)

**Architecture:**
- **Cloud mode:** Postgres (Fly/Railway) + ElectricSQL syncs to local SQLite
- **Local mode:** Node + local Postgres or SQLite only
- **ElectricSQL handles:** Automatic sync, conflict resolution (CRDT), offline support

**Sync status indicator (UI):**
- Show in bottom-right corner or header:
  - ✓ Synced (green)
  - ⏳ Syncing (spinner)
  - ⚠️ Offline (gray, still usable)
  - ❌ Error (red)
- Manual "Sync now" button
- Users can still log metrics while offline; they sync when connection returns

**Data persistence:**
- In cloud mode: data lives in Postgres + synced locally
- In local mode: SQLite only (optional: user can export to file)

---

### 9. Deployment & Portability

**Cloud deployment (default):**
```
Frontend: Qwik app deployed to Cloudflare Pages (or Vercel/Netlify)
Backend: Node server on Fly.io or Railway
Database: Managed Postgres (Fly.io Postgres or Railway)
S3: For backups (optional, Cloudflare R2 alternative)
```

**Local deployment (fully self-hosted):**
```
docker-compose.yml:
  - Node backend (port 3000)
  - Postgres or SQLite
  - Frontend served from Node
  
No external dependencies; runs on localhost:3000
```

**Configuration:**
- Environment variables for cloud vs. local mode
- Observability (Sentry, OpenTelemetry) disabled in local mode unless explicitly enabled
- Apple Health sync available in both modes (requires Apple device)

---

## File Structure (Recommended)

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   └── OAuthButton.tsx
│   │   │   ├── MetricGraph/
│   │   │   │   ├── Graph.tsx (D3-based visualization)
│   │   │   │   ├── GraphControls.tsx
│   │   │   │   └── NodeTooltip.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── MetricInput.tsx
│   │   │   │   ├── SuggestionCard.tsx
│   │   │   │   └── SnapshotHistory.tsx
│   │   │   ├── InterventionExplorer/
│   │   │   │   ├── InterventionLibrary.tsx
│   │   │   │   ├── InterventionDetail.tsx
│   │   │   │   └── BeforeAfterComparison.tsx
│   │   │   └── Common/
│   │   │       ├── Layout.tsx
│   │   │       ├── Navbar.tsx
│   │   │       └── SyncStatus.tsx
│   │   ├── routes/
│   │   │   ├── index.tsx (home / dashboard)
│   │   │   ├── auth/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── callback.tsx (OAuth callback)
│   │   │   ├── dashboard.tsx
│   │   │   ├── interventions.tsx
│   │   │   ├── snapshots.tsx
│   │   │   └── settings.tsx
│   │   ├── styles/
│   │   │   └── globals.css (Tailwind + custom)
│   │   └── entry.tsx
│   ├── qwik.config.ts
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── auth.ts (login, signup, OAuth)
│   │   │   ├── metrics.ts (GET/POST/PUT metrics)
│   │   │   ├── snapshots.ts (GET/POST snapshots)
│   │   │   ├── interventions.ts (GET interventions, POST selected)
│   │   │   ├── suggestions.ts (GET suggestions based on user state)
│   │   │   ├── applehealth.ts (sync endpoint)
│   │   │   └── sync.ts (ElectricSQL sync middleware)
│   │   ├── middleware/
│   │   │   ├── auth.ts (session validation)
│   │   │   ├── validation.ts (Zod schema validation)
│   │   │   └── errorHandler.ts
│   │   ├── db/
│   │   │   ├── schema.ts (Drizzle schema)
│   │   │   ├── migrations/ (Drizzle migrations)
│   │   │   └── client.ts (Drizzle client)
│   │   ├── lib/
│   │   │   ├── interventions.ts (load & parse intervention configs)
│   │   │   ├── suggestions.ts (rule engine)
│   │   │   ├── applehealth.ts (Apple Health API integration)
│   │   │   └── crypto.ts (bcrypt, encryption helpers)
│   │   ├── types/
│   │   │   ├── index.ts (TypeScript types/interfaces)
│   │   │   └── interventions.ts (Intervention type definitions)
│   │   ├── config/
│   │   │   ├── interventions.json (intervention definitions)
│   │   │   ├── rules.json (suggestion rules)
│   │   │   └── env.ts (environment config)
│   │   └── index.ts (Hono app entry point)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docker-compose.yml (local dev/deployment)
├── Dockerfile (backend)
├── README.md
└── .github/workflows/ (CI/CD if desired)
```

---

## API Endpoints (MVP)

### Auth
- `POST /api/auth/signup` – Create account (email, password)
- `POST /api/auth/login` – Login (email, password)
- `POST /api/auth/logout` – Logout
- `GET /api/auth/oauth/apple/authorize` – Initiate Apple OAuth
- `GET /api/auth/oauth/apple/callback` – Handle Apple OAuth callback
- `GET /api/auth/me` – Get current user (from session)

### Metrics
- `GET /api/metrics` – Get all user metrics (latest values)
- `GET /api/metrics/:metricName/history` – Get historical values for graphing
- `POST /api/metrics` – Log a metric (body: {metric_name, value, unit})
- `PUT /api/metrics/:metricId` – Update a metric

### Snapshots
- `GET /api/snapshots` – List all snapshots
- `POST /api/snapshots` – Save current state as snapshot (optional: user_note)
- `GET /api/snapshots/:snapshotId` – Get snapshot details
- `DELETE /api/snapshots/:snapshotId` – Delete snapshot

### Interventions
- `GET /api/interventions` – List all interventions
- `GET /api/interventions/:interventionId` – Get intervention details + predicted effects
- `POST /api/interventions/:interventionId/simulate` – Get before/after prediction (optional: include other selected interventions for stacking)

### Suggestions
- `GET /api/suggestions` – Get rule-based suggestions based on current user state

### Apple Health
- `POST /api/applehealth/sync` – Trigger sync from Apple Health
- `GET /api/applehealth/status` – Get last sync timestamp + status

### User Settings
- `GET /api/settings` – Get user preferences (weight unit, etc.)
- `PUT /api/settings` – Update preferences

---

## Security Checklist

- [ ] **Passwords:** Bcrypt hashing with cost factor ≥12
- [ ] **Sessions:** httpOnly, Secure, SameSite=Lax/Strict cookies
- [ ] **CSRF:** Implement CSRF token validation for state-changing requests
- [ ] **OAuth2:** Use PKCE flow; validate state parameter
- [ ] **Input validation:** Zod schemas on all API endpoints
- [ ] **SQL injection:** Use Drizzle ORM (parameterized queries)
- [ ] **Apple Health consent:** Clear consent UI before first sync; log access
- [ ] **Rate limiting:** Implement on auth endpoints (prevent brute force)
- [ ] **Encryption at rest:** Enable for Postgres (pg_crypto) + SQLite
- [ ] **Environment secrets:** Never commit .env; use environment variables
- [ ] **HTTPS/TLS:** Enforce in production (Fly/Railway handle this)
- [ ] **Error handling:** Don't expose internal errors to client; log securely
- [ ] **Audit logging:** Log all Apple Health syncs, metric changes, user actions

---

## Local vs. Cloud Mode (Configuration)

**Environment variables:**

```bash
# Deployment mode
DEPLOYMENT_MODE=cloud  # or "local"

# Database
DATABASE_URL=postgres://user:pass@host/db  # cloud
# or
DATABASE_URL=file:./data.db  # local (SQLite)

# Auth
OAUTH_APPLE_ID=com.example.app
OAUTH_APPLE_SECRET=...
OAUTH_GOOGLE_ID=...
OAUTH_GOOGLE_SECRET=...

# Session
SESSION_SECRET=<random-secret>

# Observability (optional, disabled in local mode)
SENTRY_DSN=...
OTEL_ENABLED=false  # or true for cloud

# S3/Backup (cloud mode)
S3_BUCKET=...
S3_REGION=...
```

---

## Testing & Validation (MVP)

**Minimum test coverage:**
- Auth flows (signup, login, OAuth, logout)
- Metric logging + Apple Health sync
- Intervention suggestion rules
- Before/after prediction calculations
- Snapshot save/load

**Tools:**
- Unit tests: Vitest or Jest
- E2E tests: Playwright or Cypress
- Load testing: Artillery (optional)

---

## Acceptance Criteria

The MVP is complete when:

1. ✅ User can sign up / log in (password or OAuth)
2. ✅ User can manually log health metrics
3. ✅ User can sync Apple Health data
4. ✅ Interactive metric interconnection graph renders
5. ✅ User can select an intervention and see predicted changes
6. ✅ Before/after visualization displays (side-by-side or overlay)
7. ✅ Contraindication warnings appear when stacking interventions
8. ✅ Rule-based suggestions appear on dashboard
9. ✅ User can save snapshots and view historical changes
10. ✅ Sync status indicator shows (synced/syncing/offline/error)
11. ✅ App runs locally (docker-compose) and on cloud (Fly/Railway)
12. ✅ All auth + API endpoints are secure (CSRF, rate limiting, input validation)
13. ✅ Session-based auth works across page refreshes
14. ✅ ElectricSQL sync handles offline scenarios gracefully

---

## Future Enhancements (Post-MVP)

- AI-powered intervention suggestions (RAG + pgvector)
- Custom interventions (users add their own)
- Coach/trainer collaboration (share snapshots)
- Mobile app (React Native or native iOS/Android)
- Advanced analytics (trend detection, correlation analysis)
- Wearable integrations (Whoop, Oura, Garmin)
- Export (PDF reports, CSV data)
- Micronutrient tracking (magnesium, vitamin D, zinc, etc.)
- Medication interactions (future: rule config for meds)
- Multi-language support

---

## Success Metrics (Post-MVP)

- User retention (30-day, 90-day)
- Intervention adherence (do users follow through?)
- Snapshot frequency (how often do users track?)
- Feature adoption (which interventions are most selected?)
- Accuracy of predictions (post-hoc: did actual results match predictions?)

---

## Notes

- **Tech debt mitigation:** Document "escape hatches" (e.g., how to migrate off ElectricSQL if needed)
- **Observability in local mode:** Provide file-based logging + in-app event log (don't force external services)
- **Apple Health privacy:** Be explicit about data access; never sell or share user health data
- **Intervention config:** Design to be easily editable; future goal is rule-based auto-generation from research papers
- **Scope creep:** This prompt is for MVP only. Resist adding features not listed above; defer to post-MVP.

---

**End of Prompt**
