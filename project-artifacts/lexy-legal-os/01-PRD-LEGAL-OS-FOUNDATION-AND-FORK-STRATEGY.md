# PRD — LexyOS Foundation and Mike Fork Strategy

## Goal

Decide and implement the foundation for LexyOS: either an AGPL-compatible Mike-derived open core with proprietary plugin/service boundaries, or a clean-room LexyOS core that uses Mike/forks only as reference architecture.

## Problem

Mike has attention, momentum, a usable UI shape, and a large fork ecosystem. It is also a young AGPL codebase with obvious production gaps. Building fully from scratch loses upstream momentum. Forking directly risks inheriting weak architecture and licensing obligations.

## Product thesis

Use Mike's ecosystem for leverage, but ensure LexyOS owns the durable domain model: matters, parties, facts, documents, tasks, gates, filings, service, communications, audit, and practice-pack plugins.

## Users

- Peacock internal users: attorney, paralegal, intake/admin, filing coordinator.
- Future B2B law firm admins.
- Future practice-area pack builders.
- Future API/MCP consumers.

## Non-goals

- No live client data until security/audit/human gates are proven.
- No unsupervised legal advice.
- No proprietary plugin code mixed directly into AGPL core unless intentionally open-sourced.
- No court/agency filing without explicit human approval.

## Reference systems

### Mike OSS
- Study for workspace UI, document viewer, AI chat, reusable workflows, tabular extraction.
- Risk: AGPL, immature production rails.

### PIP
- Study for auth, RLS, audit, retention, migrations, tests, threat model, internal firm posture.
- Treat as strongest production-hardening reference.

### mikelocal
- Study for desktop/local-first, SQLite, local workspace, secrets, lock screen.
- Useful for safe sample-data prototype.

### Azure Mike
- Study provider abstractions for auth/storage/config.
- Extract interface idea, not necessarily Azure stack.

### Redline fork + Adeu
- Study Mike UI integration for redlines.
- Use Adeu for Word-native changes/comments/sanitization.

## Functional requirements

### F1. Core domain schema

Define canonical entities:
- Tenant / firm.
- User / role / permission.
- Lead.
- Matter.
- Party / adverse party / related party.
- Representation status.
- Conflict-check record.
- Document.
- Fact.
- Task.
- Deadline.
- Workflow run.
- Human gate / approval.
- Communication.
- Filing packet/event.
- Service packet/event.
- Corpus citation/source.
- Audit event.
- Agent action/tool call.
- Training/evaluation grade.

### F2. Event/audit log

Every meaningful action must produce an immutable audit event:
- actor: human, agent, system, external webhook;
- source: UI, API, MCP, email, filing callback;
- timestamp;
- matter ID;
- old/new values for state changes;
- approval linkage;
- source documents/facts;
- model/tool call metadata when relevant.

### F3. Plugin boundary

Practice packs must be loadable without becoming tangled in the core:
- manifest file;
- schema extensions;
- workflow definitions;
- forms/templates;
- gates;
- deadline rules;
- filing requirements;
- Corpus connectors;
- tests.

### F4. Fork compatibility layer

If using Mike as open core, isolate Lexy concepts:
- add adapter around Mike project/workspace model;
- avoid hard-coding practice-specific logic into Mike core;
- expose Lexy plugin API over HTTP/MCP/package boundary;
- keep proprietary packs outside AGPL repo unless counsel approves.

## Architecture options

### Option A — Direct Mike fork open core

Pros:
- fastest UI start;
- upstream improvements can be merged;
- public attention helps recruiting/community;
- open-source goodwill.

Cons:
- AGPL disclosure obligations;
- inherited architectural debt;
- plugin boundary must be disciplined;
- upstream merges may fight deep domain changes.

Best if: we intentionally want an open-source Legal OS core and monetize hosting, packs, support, filing, Corpus, implementation.

### Option B — Clean-room LexyOS core + Mike as reference

Pros:
- clean license/control;
- domain model designed correctly;
- no AGPL contamination risk;
- cleaner product architecture.

Cons:
- slower initial UI;
- less upstream leverage;
- must replicate useful Mike features.

Best if: proprietary moat matters more than ecosystem leverage.

### Option C — Hybrid shell

Fork Mike for a generic open workspace/cockpit, but make LexyOS core a separate service. Mike UI calls LexyOS APIs/MCP tools. Practice packs live outside Mike.

Pros:
- uses Mike momentum and UI;
- keeps core domain/plugin architecture separate;
- open core can be public while packs remain private.

Cons:
- requires careful boundary/legal review;
- two systems to operate;
- UX/data duplication risk.

Recommended starting posture: **Option C for prototype, with a hard license review gate before production.**

## Acceptance criteria

- Decision memo comparing A/B/C with counsel-facing license questions.
- Running fake-data Mike/fork demo.
- Canonical LexyOS schema draft.
- Plugin manifest spec.
- Explicit list of what would be AGPL/open vs private/proprietary.
- Security threat model before live data.

## Implementation milestones

1. Clone upstream and selected forks into a reference workspace.
2. Produce architecture diff notes: upstream vs PIP vs mikelocal vs Azure vs redline.
3. Build local fake-data demo.
4. Draft canonical schema in SQL/Prisma/Drizzle format.
5. Draft plugin manifest JSON/YAML schema.
6. Prototype LexyOS service stub with `/matters`, `/tasks`, `/gates`, `/audit-events`.
7. Prototype Mike UI adapter calling LexyOS service.
8. Write license boundary memo.

## Risks

- Accidentally mixing proprietary pack code into AGPL app.
- Trusting Mike's original security posture too much.
- Building a pretty cockpit without the legal-state machine.
- Overfitting to QDRO and making other packs awkward.

## Proof gates

- Unit tests for schema/gates/audit.
- Threat model reviewed.
- No live PII in prototype.
- All outbound communications disabled or stubbed.
- License boundary documented.
- Runtime demo shows matter created, admin task completed, attorney gate created, audit log preserved.
