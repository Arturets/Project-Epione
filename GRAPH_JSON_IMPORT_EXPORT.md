# Project Epione Graph JSON Import/Export Guide

This guide describes the graph JSON functions for developers and AI agents.

## What this supports

- Batch create custom graph metrics from JSON
- Batch create custom graph edges from JSON
- Export the graph as JSON (base, custom, merged, and reusable import template)
- Round-trip export -> import without manual JSON edits

## Authentication requirements

All developer graph endpoints require:

- authenticated admin session
- `X-Admin-Key` header with the admin API key

In the UI, this is handled in Developer Console.

## Developer Console workflow

Open `Developer Console -> Graph Metrics`.

You now have three ways to manage graph data:

1. `Add Graph Metric` (single metric form)
2. `Add Graph Edge` (single edge form)
3. `Graph JSON Import / Export` (batch JSON)

`Graph JSON Import / Export` has:

- `Import mode`
  - `append`: keeps current custom metrics/edges, then adds new ones
  - `replace_custom`: deletes all current custom metrics/edges, then imports
- `JSON payload` textarea
- `Import JSON` button
- `Export JSON` button
- `Load Template` button

When you export JSON, the full export file is downloaded and a reusable `importTemplate` is loaded into the textarea automatically.

## API endpoints

### `POST /api/developer/graph/import`

Batch imports custom metrics and edges.

Accepted JSON shapes:

1. Minimal import payload:

```json
{
  "mode": "append",
  "metrics": [],
  "edges": []
}
```

2. Full export payload from `/api/developer/graph/export` (import handler reads `importTemplate` or `custom`).

Notes:

- `mode` is optional. Defaults to `append`.
- At least one metric or edge must be present.
- Import is atomic per request. If any entry is invalid, no partial write is saved.

Success response:

```json
{
  "ok": true,
  "data": {
    "mode": "append",
    "createdMetrics": 2,
    "createdEdges": 3
  }
}
```

### `GET /api/developer/graph/export`

Exports graph JSON package.

Success response shape:

```json
{
  "ok": true,
  "data": {
    "exportedAt": "2026-02-25T22:00:00.000Z",
    "base": { "nodes": [], "edges": [] },
    "custom": { "metrics": [], "edges": [] },
    "merged": { "nodes": [], "edges": [] },
    "importTemplate": {
      "mode": "append",
      "metrics": [],
      "edges": []
    }
  }
}
```

`importTemplate` is the safest object to re-import directly.

## JSON schema details

### Metric object (`metrics[]`)

```json
{
  "id": "fasting_glucose",
  "label": "Fasting Glucose",
  "domain": "metabolic",
  "tier": "supporting",
  "x": 460,
  "y": 140,
  "description": "Morning glucose concentration marker."
}
```

Rules:

- `id`: lowercase letters, numbers, underscore only (`^[a-z0-9_]+$`)
- `domain`: `cardiovascular | respiratory | nervous | metabolic | musculoskeletal | recovery`
- `tier`: `core | supporting`
- `x`, `y`: numeric canvas coordinates
- `description`: required

### Edge object (`edges[]`)

```json
{
  "id": "glucose_to_hrv",
  "source": "fasting_glucose",
  "target": "hrv",
  "direction": "inverse",
  "effectStrength": "moderate",
  "type": "correlative",
  "description": "Poor glucose control is often associated with lower HRV."
}
```

Rules:

- `id`: optional (auto-generated if omitted)
- `source` and `target`: must exist in final graph node set
- `direction`: `direct | inverse`
- `effectStrength`: `low | moderate | high`
- `type`: `causal | correlative`
- `description`: required

## Example batch import payload

```json
{
  "mode": "append",
  "metrics": [
    {
      "id": "fasting_glucose",
      "label": "Fasting Glucose",
      "domain": "metabolic",
      "tier": "supporting",
      "x": 460,
      "y": 140,
      "description": "Morning glucose concentration marker."
    },
    {
      "id": "resting_lactate",
      "label": "Resting Lactate",
      "domain": "metabolic",
      "tier": "supporting",
      "x": 560,
      "y": 200,
      "description": "Baseline lactate as a metabolic stress proxy."
    }
  ],
  "edges": [
    {
      "source": "fasting_glucose",
      "target": "hrv",
      "direction": "inverse",
      "effectStrength": "moderate",
      "type": "correlative",
      "description": "Higher fasting glucose often co-occurs with lower HRV."
    },
    {
      "source": "resting_lactate",
      "target": "vo2_max",
      "direction": "inverse",
      "effectStrength": "low",
      "type": "correlative",
      "description": "Higher resting lactate can indicate reduced aerobic efficiency."
    }
  ]
}
```

## cURL examples

Use from an authenticated browser/session context or provide valid session cookie manually.

Export:

```bash
curl -sS \
  -H "X-Admin-Key: <ADMIN_API_KEY>" \
  -H "Cookie: <SESSION_COOKIE>" \
  http://localhost:5173/api/developer/graph/export
```

Import:

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <ADMIN_API_KEY>" \
  -H "Cookie: <SESSION_COOKIE>" \
  -d @graph-import.json \
  http://localhost:5173/api/developer/graph/import
```

## Common failure causes

- Duplicate metric ID (`graph_metric_exists`)
- Duplicate edge ID (`graph_edge_exists`)
- Edge references missing source/target node (`graph_edge_invalid_nodes`)
- Invalid metric ID format (`graph_metric_invalid_id`)
- Empty import payload (`graph_import_empty`)

