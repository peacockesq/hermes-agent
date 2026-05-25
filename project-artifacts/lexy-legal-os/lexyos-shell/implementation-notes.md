# LexyOS Shell Implementation Notes

## Scope locked
- Clean-room LexyOS shell. No Mike/PIP source copied.
- Google Drive is the first storage backend.
- One folder per matter is a core invariant.
- No-code DB and intake system compatibility is via adapters, not hard coupling.

## Matter contract
Required stable field:
- `matter_id` or `id`

Preferred fields:
- `client_display_name` first; fallback to `client_name` / `name`
- `matter_type` / `type`
- `stage` / `status`
- `drive_folder_id` / `folderId`
- `baseline_data` / `data`

Unknown scalar fields are preserved into `baseline` so NocoDB/Airtable/Lawmatics/intake shape drift does not destroy useful document-population data.

## NoCoDB canonical alignment
- Peacock's Cases table now exposes Lexy snake_case titles for shared fields where possible.
- Reusable firm-agnostic legal fields live in `lexy_core`.
- Reusable QDRO/family-law fields live in `qdro_pack`.
- Peacock-only operational residue stays in place and is not dropped.
- Downstream Peacock scripts must read canonical-first, legacy-second, e.g. `field(row, 'case_number', 'Case Number')`.
- When Slack status changes are propagated to NoCoDB, write both canonical `stage`/`stage_updated_at` and legacy `Current Status`/`Status Updated Date` until old automations are retired.

## Storage contract
- UI reads matter files only from the selected matter's `driveFolderId`.
- If a matter has no folder, the storage adapter returns `needsFolder: true` and can call `ensureMatterFolder` only if a creation adapter is configured.
- Current config points at Peacock's canonical `2026 Permanent Matter Files` Drive root from the existing folder automation record.

## Legal safety
- Eva document edits are proposals using tracked-change mode by default.
- Silent mutation of legal documents is blocked at the model layer (`requiresApproval: true`).

## B2B SSO / unified login
- `src/auth.mjs` models the shared LexyOS login boundary: tenant, SSO provider, user membership, role, permission, and matter access.
- Attorney sessions can prepare/submit approved filings; agent sessions can prepare work but cannot submit filings or bypass gates.
- Matter access is tenant-scoped by default and can be narrowed to explicit matter IDs for B2B/client-facing roles.
- API stubs filter `/matters`, `/tasks`, `/gates`, and `/audit-events` by session-accessible matter IDs.
- Gate approval now requires an authorized session with `gate:decide`; task completion validates gate status, type/action, and same-matter scope.
- Filing submission requires `filing:submit`, a valid approved filing gate for the same matter, and a passing validation result.
- Private Corpus retrieval requires an explicit matching matter ID; caller-set `allowPrivate` alone is not enough.

## PRD feature contracts now represented in code
- Foundation: durable JSON/in-memory store facade, canonical PRD collections, hash-chained audit events, gates, task queue, API stubs, canonical matter schema.
- B2B SSO: OIDC claim validation/session creation contract with issuer, audience, expiry, verified email, domain, and membership checks.
- Agent Admin OS/Cockpit: durable agent run lifecycle, tool allowlists, tool-call audit contracts, intake task creation, gate-aware completion, cockpit metrics, UI status panels, and operational view model.
- Intake/Admin: web/email/fax/call/text classification, matter draft creation, conflict/representation gates, payment/work authorization task, and missing-info workflow.
- Practice Packs: QDRO/family manifest plus estate planning, probate, bankruptcy, and DUI starter packs with fact schema, templates, deadline rules, corpus scopes, and stage criteria.
- LexyFiling: packet creation, validation, approval gate, manual submit connector, receipt/status ingestion, and tool registry for prepare/validate/request approval/submit/status/receipt.
- Lexy Corpus: source model, scoped retrieval, quote verification, unsupported-answer refusal, public/private boundary, and LexyOS search bridge. Full all-cases/statutes ingestion/annotation is intentionally deferred and not a launch blocker.
- Process Serving: service requirement model, packet assembly, service approval gate, vendor task, sent/proof lifecycle, proof review gate, proof-to-filing handoff, stale/failed escalation.
- Document generation: template data validation, generation request payload, document rendering artifact, attorney-review gate, Adeu tracked-change application primitive.
- Threat/license: clean-room license-boundary memo and security threat model contracts.

## Kanban execution state
- Board `lexyos` contains implementation cards for every PRD feature plus dependency-gated integration, spec, security, Otto, and GitHub PR cards.
- The GitHub publication card is intentionally gated behind Otto final review; do not publish while the feature contracts or review cards are incomplete.

## Runtime product backend decisions and receipts
- `npm start` now runs `node src/server.mjs`, a local Node HTTP server that serves the cockpit UI and same-origin JSON APIs. It binds to `127.0.0.1:5174` by default and does not call external services.
- Persistence is JSON-file backed through the existing store facade. Default mutable state is `data/lexyos.json`; `npm run reset:data` rebuilds it from `data/seed.json`; tests override `LEXYOS_DATA_PATH`/constructor data paths with temp files.
- API workflows now cover matters, matter files, document generation requests/artifacts, gates approve/reject, tasks, hash-chained audit events, filing packet/status/submission, corpus search with explicit unsupported refusal, and service packet/send/proof lifecycle.
- The browser cockpit now hydrates matters, matter files, and corpus answers from the local API and falls back to module demo data only if the local backend is unreachable.
- Receipt: `npm test` passes 52/52 after adding `tests/product-backend.test.mjs`, preserving the existing module suite while proving endpoint behavior and persistence.

## Open integration decisions
- Confirm exact no-code DB: NocoDB vs Airtable vs Twenty/Apiary table.
- Confirm whether folder IDs should be written back to the DB by LexyOS or remain owned by the existing automation.
- Confirm whether the first live adapter should call `gog --account team drive ...` directly or an n8n webhook facade.
