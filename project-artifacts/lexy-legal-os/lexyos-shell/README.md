# LexyOS Shell

Clean-room matter-centered legal document cockpit prototype.

No Mike/PIP code is copied. This is a separate shell designed around Peacock's actual matter workflow:

- one Google Drive folder per matter;
- adapters for no-code DB/intake sources;
- baseline matter data preserved for document population;
- document workspace centered on the selected matter;
- Eva/research rail produces tracked-change proposals, not silent edits.

## Run

```bash
npm install # no runtime dependencies today; keeps npm scripts available
npm run reset:data
npm test
npm start
# open http://localhost:5174/
```

`npm start` runs the local Node HTTP product backend, not a static-only file server. It serves the UI and JSON API from the same origin, with durable state in `data/lexyos.json` by default. Override the state file for isolated test/dev runs:

```bash
LEXYOS_DATA_PATH=/tmp/lexyos-dev.json npm run reset:data
LEXYOS_DATA_PATH=/tmp/lexyos-dev.json npm start
```

## Local API surface

All endpoints are local-only unless you deliberately bind the server differently. No external services are contacted.

- `GET /api/health`
- `GET /api/matters`, `POST /api/matters`
- `GET /api/matters/:matterId/files`, `POST /api/matters/:matterId/files`
- `GET /api/document-requests`, `POST /api/document-requests`, `POST /api/document-requests/:requestId/artifacts`
- `GET /api/gates`, `POST /api/gates/:gateId/approve`, `POST /api/gates/:gateId/reject`
- `GET /api/tasks`, `POST /api/tasks`
- `GET /api/audit-events`
- `GET /api/filing-packets`, `POST /api/filing-packets`, `GET /api/filing-packets/:packetId/status`, `POST /api/filing-packets/:packetId/submit`
- `POST /api/corpus/search` (returns cited support or an explicit unsupported/refusal answer)
- `POST /api/service-packets`, `POST /api/service-packets/:packetId/send`, `POST /api/service-packets/:packetId/proof`

Example smoke call after `npm start`:

```bash
curl -s http://127.0.0.1:5174/api/health
curl -s http://127.0.0.1:5174/api/matters
```

## Current modules

- `src/matters.mjs` — normalizes matter rows and searches baseline data.
- `src/repository.mjs` — source adapter pattern for no-code DB and intake systems.
- `src/storage.mjs` — Drive-folder-per-matter storage adapter.
- `src/eva.mjs` — Eva context and tracked-change proposal primitives.
- `src/auth.mjs` — tenant-aware B2B SSO/session/role/permission contract for unified LexyOS login.
- `src/oidc.mjs` — OIDC claim validation/session creation contract with issuer/audience/domain/member checks.
- `src/persistence.mjs` — durable JSON/in-memory store facade, canonical PRD collections, and hash-chained audit events.
- `src/audit.mjs` — immutable audit event log primitives.
- `src/gates.mjs` — human approval/rejection gates for filing, documents, external communications, and proof review.
- `src/tasks.mjs` — queue/task primitives, intake task creation, and cockpit metrics.
- `src/runner.mjs` — durable agent run lifecycle, tool allowlist enforcement, and tool-call audit contracts.
- `src/intake.mjs` — web/email/fax/call/text intake classification, matter draft, conflict/representation gates, and missing-info workflow.
- `src/documents.mjs` — document template, data validation, generation request, rendering artifact, attorney-review gate, and Adeu tracked-change application primitives.
- `src/filing.mjs` — LexyFiling packet validation, approval, manual connector, status, receipt, and tool-registry primitives.
- `src/corpus.mjs` — Lexy Corpus source/citation retrieval, quote verification, unsupported-answer refusal, privacy boundary, and search bridge.
- `src/practicePacks.mjs` — practice-pack manifest validation plus QDRO/family, estate planning, probate, bankruptcy, and DUI starter packs.
- `src/service.mjs` — service requirement, packet, vendor task, approval gate, sent/proof lifecycle, proof filing handoff, and failed-service escalation primitives.
- `src/cockpit.mjs` — operational cockpit view model with task/gate/filing/service/deadline/audit cards and matter drilldowns.
- `src/risk.mjs` — threat model and clean-room/license-boundary memo contracts.
- `src/api.mjs` — service stub for `/matters`, `/tasks`, `/gates`, and `/audit-events`.
- `src/server.mjs` — runnable local Node HTTP product backend for the UI plus persistent JSON API workflows.
- `data/seed.json` — resettable local seed data for matters, files, tasks, corpus sources, and empty workflow collections.
- `scripts/reset-data.mjs` — copies seed data into the active JSON data file (`data/lexyos.json` by default).
- `src/schema.mjs` — Lexy canonical matter schema split into `lexy_core`, `qdro_pack`, and `peacock_ops` classifications.
- `scripts/align_nocodb_schema.py` — idempotent NoCoDB schema alignment/backfill tool for making firm tables conform to Lexy titles.
- `public/` — matter cockpit UI with SSO/session, filing, corpus, service, task/gate, Drive, document, and Eva panels. It now hydrates matters, files, and corpus answers from the local API with module-demo fallback only for development resilience.
- `docs/kanban-execution-plan.md` — full PRD feature coverage and review-gate plan mirrored into Hermes Kanban.
- `config/integrations.json` — first-pass Peacock integration assumptions.

## Compatibility strategy

Adapters accept multiple common field names:

| Canonical | Accepted aliases |
|---|---|
| Matter ID | `matter_id`, `id` |
| Client display name | `client_display_name`, `client_name`, `name` |
| Matter type | `matter_type`, `type` |
| Stage | `stage`, `status` |
| Drive folder | `drive_folder_id`, `folderId` |
| Baseline data | `baseline_data`, `data`, plus unknown scalar fields |

Peacock's live NoCoDB Cases table is intentionally bent toward the Lexy contract. Shared fields use snake_case titles. QDRO-specific reusable fields live in `qdro_pack`; Peacock-only routing/status residue remains as legacy operational fields and is read through canonical-first fallback helpers where needed.

This keeps the shell compatible with NocoDB/Airtable/Twenty/intake webhook exports without making the UI care which system currently owns the record.

## Next production wiring

1. Replace demo source with the real no-code DB adapter env values.
2. Replace fake Drive file list with `gog --account team drive search` or a thin n8n facade.
3. Decide whether LexyOS writes `drive_folder_id` back to the DB or only reads folders created by the existing automation.
4. Add document-generation endpoints and Adeu-backed tracked-change application.
