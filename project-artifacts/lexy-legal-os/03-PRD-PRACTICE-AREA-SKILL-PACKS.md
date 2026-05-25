# PRD — Lexy Practice-Area Skill Packs

## Goal

Define a plugin/skill-pack system that lets LexyOS support multiple practice areas without rewriting the core operating system.

## Product thesis

LexyOS is the engine. Practice packs are the vertical legal operating procedures. Each pack supplies forms, stages, required facts, workflow definitions, gates, filing/service requirements, and Corpus connectors.

## Initial packs

1. QDRO / Family Law.
2. Estate Planning.
3. Probate.
4. Bankruptcy.
5. DUI.

## Reference systems

- Mike workflows/prompts: reusable workflow mechanics.
- EU-Mike/MikeNL: jurisdiction/source connector pattern.
- Lavern: legal-agent prompt library and verifier pattern.
- Docassemble: form/interview logic reference.
- Adeu: document redline/review operations.
- Peacock QDRO stage map: known high-confidence workflow stages.

## Pack manifest

Each pack should contain:

```yaml
id: qdro
name: QDRO Pack
version: 0.1.0
license: proprietary-internal
jurisdictions: [CA, NY, NJ, KS, MO, IA, ND, CT]
stages:
  - intake
  - review
  - missing_info
  - plan_research
  - draft_ready
  - drafting
  - attorney_review
  - submitted_to_plan
  - revision
  - ready_to_file
  - filed
  - entered
  - closed
facts:
  - marriage_date
  - separation_date
  - divorce_filing_date
  - judgment_date
  - plan_name
  - participant_name
  - alternate_payee_name
documents:
  - judgment
  - msa
  - plan_statement
  - plan_procedures
workflows:
  - intake_gap_sweep
  - draft_qdro_packet
  - plan_preapproval_request
  - filing_packet_review
gates:
  - conflict_check
  - attorney_review
  - client_send_approval
  - plan_send_approval
  - court_filing_approval
```

## Functional requirements

### F1. Stage definitions

Each pack defines:
- allowed stages;
- entry criteria;
- exit criteria;
- required documents/facts;
- default tasks;
- stale thresholds;
- allowed automations.

### F2. Fact schema

Each pack defines typed facts:
- name;
- type;
- source requirement;
- confidence;
- validation rules;
- whether attorney approval is required.

### F3. Document inventory

Each pack defines:
- required documents;
- optional documents;
- accepted formats;
- extraction rules;
- redline/comment handling;
- source-of-truth priority.

### F4. Workflow definitions

Each workflow includes:
- trigger;
- prerequisites;
- tools allowed;
- output schema;
- human gate requirements;
- audit requirements;
- failure/escalation path.

### F5. Form/template inventory

Each pack defines:
- available forms;
- jurisdiction applicability;
- field mapping;
- generation rules;
- review requirements;
- filing/service packet requirements.

### F6. Corpus connectors

Each pack declares Corpus needs:
- statutes/rules;
- court forms;
- local rules;
- plan/admin procedures;
- sample language;
- firm-approved playbooks.

## Pack-specific notes

### QDRO / Family Law

Highest immediate fit because Peacock has domain depth. Must include plan-admin/preapproval routing, valuation-date rules, MSA/judgment extraction, filing stages, and plan follow-up.

### Estate Planning

Needs client family/asset map, package selection, signing workflow, trust funding checklist, beneficiary/fiduciary roles, and document execution rules.

### Probate

Needs decedent/estate/beneficiary/creditor model, court deadlines, inventory/accounting tasks, notice/service requirements.

### Bankruptcy

Needs petition data, means-test workflow, creditor matrix, document checklist, filing packet, post-filing deadlines, reaffirmation/341 tracking.

### DUI

Needs criminal court workflow, DMV/license deadlines, discovery request, plea/strategy checkpoints, jurisdiction-specific forms/options.

## Proprietary boundary

Practice packs are likely where much of the value lives. Keep them outside any AGPL Mike-derived core unless intentionally open-sourced.

Potential pack packaging:
- private npm package;
- private repo;
- loaded over API/MCP;
- YAML/JSON manifests plus template/doc bundles;
- encrypted/tenant-licensed pack registry.

## Implementation milestones

1. Draft pack manifest schema.
2. Build pack loader.
3. Build QDRO pack v0.1 using known Peacock stages.
4. Add sample forms/templates only; no client data.
5. Build workflow runner against pack definitions.
6. Build validation tests for stages/facts/forms/gates.
7. Add Estate Planning stub pack.
8. Add Bankruptcy stub pack.
9. Add Corpus connector declarations.
10. Add filing/service handoff declarations.

## Acceptance criteria

- LexyOS can load a pack and expose its stages/workflows/forms.
- Sample QDRO matter can be advanced through stages by pack rules.
- Missing facts/documents create tasks automatically.
- Human gates are enforced from pack definitions.
- Pack can be removed/updated without core schema migration except declared extensions.
