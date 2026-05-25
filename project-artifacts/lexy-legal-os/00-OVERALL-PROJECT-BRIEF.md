# Lexy Legal OS — Overall Project Brief

**Created:** 2026-05-24  
**Owner:** Willie Peacock / Peacock Law Firm  
**Working names:** LexyOS, Lexy Legal OS, LexyFiling, Lexy Corpus, Lexy Agents, Lexy Packs  
**Status:** Active concept → PRD buildout started

## Executive answer

Build **LexyOS** as the durable matter-state operating system. Use **Mike OSS and its forks as reference systems and maybe as an open core**, but do not blindly make Mike's original schema or AGPL code the center of gravity.

The correct architecture is a modular legal operating system:

1. **LexyOS Core** — matter-state engine, parties, facts, documents, tasks, gates, audit logs, permissions, attorney review.
2. **Lexy Agents / Admin OS** — intake, routine admin, gap sweeps, rough draft prep, follow-ups, queue execution.
3. **Lexy Cockpit** — firm overview of what agents are doing, what's blocked, what's due, what requires human approval.
4. **Lexy Packs** — practice-area plugins for QDRO/family, estate planning, probate, bankruptcy, DUI, etc.
5. **LexyFiling** — MCP/API-first filing/action layer with a thin human UI.
6. **Lexy Corpus** — legal/source corpus, retrieval, citation verification, firm-approved guidance, sample language.
7. **Process Service Automation** — automate packet prep, vendor coordination, proof intake, failed-service follow-up; not physical service.

## The strategic AGPL fork question

Mike is AGPL-3.0. That does **not** prohibit commercial use and does **not** require payment. The issue is source-code reciprocity: if Peacock modifies and network-serves AGPL-covered Mike code, users may be entitled to the corresponding source code of the AGPL-covered modified program.

### Open-core posture worth considering

We can make an upgraded Mike-derived **open core** and keep proprietary value in separate plugin/service layers if we enforce clean boundaries:

- **Open core:** Mike-derived legal workspace/cockpit, generic document workspace, generic workflow executor, generic connector SDK.
- **Proprietary/private:** Lexy Packs, jurisdiction-specific workflows, firm templates, legal strategy rules, Corpus datasets, filing connectors where allowed, client data, operations playbooks, hosted orchestration, quality/evaluation data.

This only works if plugin boundaries are real: separate repos/packages/services, API/MCP contracts, no tight code-linking that turns plugins into derivative AGPL work. License counsel should bless the final architecture before product launch.

## Reference code systems to study

| Reference | URL | Why it matters | Reuse posture |
|---|---|---|---|
| Mike OSS | https://github.com/willchen96/mike | Product shape: matter workspaces, doc review, AI chat, workflows, tabular review | UX/reference; possible AGPL open-core base |
| PIP | https://github.com/cpatpa/PIP | Most serious hardening fork: auth, RLS, audit, retention, migrations, tests, threat model | Study for production rails/security |
| Mike Local | https://github.com/rafal-fryc/mikelocal | Electron/SQLite/local workspace privacy-first mode | Study for local demo/offline/sandbox architecture |
| Azure Mike | https://github.com/Altien/mikeOssAzure | Provider abstraction for storage/auth/config; Azure/Entra/Key Vault | Steal abstraction pattern, not Azure strategy |
| Mike Redline | https://github.com/jamietso/mike-redline | Redline/comment-aware DOCX/PDF extraction | Pair with Adeu for legal document fidelity |
| EU-Mike | https://github.com/lucianschw-dev/eumike | Official-source connector + MCP-ish law tools + citation verification | Pattern for Lexy Corpus connectors |
| MikeNL | https://github.com/Jeroen1991z/mikeNL | Jurisdiction-specific law-source integration | Pattern for state/practice packs |
| Lavern | https://github.com/AnttiHero/lavern | Legal agent governance, debate board, verifier, approval gates | Pattern mine only |
| Retriever | https://github.com/sdemyanov/retriever | Local-first document intelligence / eDiscovery-style archive review | Pattern mine for Corpus/document archive |
| Adeu | local MCP/tools | Word-native DOCX redlining, Track Changes, comments, sanitization | Direct component for legal docs |
| Hermes Kanban/Paperclips concept | internal | Agent queue execution and overview | Operational pattern |
| GBrain | internal | Memory/corpus/source graph | Possible Corpus substrate/reference |

## Product boundary

The product is not "an AI lawyer." It is a **law firm operating system** that lets agents do everything safely outside core lawyer judgment.

Agents may:
- intake facts;
- classify and route;
- request missing documents;
- run checklists;
- draft rough forms;
- assemble packets;
- chase routine follow-ups;
- prepare admin communications;
- flag blockers.

Humans must gate:
- legal advice;
- strategic decisions;
- final filings;
- settlement/legal position communications;
- client/court/opposing-counsel communications that materially affect rights;
- privilege-sensitive decisions;
- conflict/representation decisions.

## What we are missing if we only copy Mike

- conflict checking;
- representation lifecycle;
- UPL/ethics/supervision logs;
- real permissions and role model;
- privilege/confidentiality model;
- deadline/court-holiday engine;
- billing/payment/trust gates;
- records retention/export/litigation hold;
- client portal and communication authority;
- filing/service event model;
- training/evaluation loop;
- clean plugin/license boundary;
- production incident/audit posture.

## Recommended build strategy

### Phase 0 — Reference audit and fork decision

- Clone upstream Mike and useful forks.
- Diff architecture and security changes.
- Run demo locally with fake data.
- Decide between:
  - **Open-core Mike fork** with proprietary plugins; or
  - **Clean-room LexyOS** using Mike as UX/reference.

### Phase 1 — LexyOS core schema and event model

- Define canonical matter-state model.
- Build event-sourced audit log.
- Define roles, gates, tasks, documents, facts, communications, filings, service events.
- Create plugin contract for practice packs.

### Phase 2 — Agent Admin OS + Cockpit

- Queue-driven agent work.
- Intake admin workflows.
- Gap sweeper.
- Follow-up chaser.
- Human review queue.
- Cockpit overview.

### Phase 3 — First practice pack: QDRO / family law

- Use Peacock's known QDRO stages.
- Forms/checklists/document requirements.
- Plan admin/preapproval workflows.
- Filing/service handoff.

### Phase 4 — LexyFiling MVP

- MCP/API first.
- Manual UI only for review/override.
- Packet validation, receipts, filing status events.

### Phase 5 — Lexy Corpus MVP

- Source connectors, retrieval, citation verification.
- Firm-approved playbooks and sample language.
- Practice-pack query API.

### Phase 6 — Additional packs

- Estate planning.
- Probate.
- Bankruptcy.
- DUI.

## Open decisions

1. Are we comfortable with an AGPL open-core Mike fork if plugin boundaries preserve proprietary packs?
2. Which repo owns the canonical schema: Mike fork, clean LexyOS repo, or separate shared package?
3. Should the first prototype be local-first desktop, hosted web, or both?
4. Which practice pack proves value fastest: QDRO/family, estate planning, bankruptcy, or DUI?
5. How much of Lexy Corpus is powered by GBrain vs a new service?
6. Which human gate model is mandatory before touching live client data?

## PRD index

- `01-PRD-LEGAL-OS-FOUNDATION-AND-FORK-STRATEGY.md`
- `02-PRD-AGENT-ADMIN-OS-AND-COCKPIT.md`
- `03-PRD-PRACTICE-AREA-SKILL-PACKS.md`
- `04-PRD-LEXYFILING-MCP-API-FIRST.md`
- `05-PRD-LEXY-CORPUS.md`
- `06-PRD-PROCESS-SERVING-AUTOMATION.md`
