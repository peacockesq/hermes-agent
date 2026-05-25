# PRD — LexyFiling MCP/API-First Filing Layer

## Goal

Build LexyFiling as an API/MCP-first filing and filing-status service with a thin human UI for review, override, and manual edge cases.

## Product thesis

Filing should be an action layer, not a monolithic UI. LexyOS, agents, and future external systems should call LexyFiling through API/MCP tools. Humans only need a clean review console for approval and exceptions.

## Scope

LexyFiling handles:
- filing packet validation;
- filing assembly;
- court/agency/vendor connector abstraction;
- filing submission after human approval;
- receipt/status ingestion;
- docket/event normalization;
- service packet handoff;
- audit trail.

## Reference systems

- MCP tool architecture: API-first tool calls for agents.
- Court e-filing APIs/vendors where available.
- Mike workflow execution as UI inspiration only.
- LexyOS gates/audit model.

## Functional requirements

### F1. Filing packet model

Packet fields:
- packet ID;
- matter ID;
- jurisdiction;
- court/venue;
- case number if existing;
- filing type;
- documents;
- metadata fields;
- fee/payment info;
- service requirements;
- validation status;
- approval status;
- submission status;
- receipts/events.

### F2. Validation engine

Validate:
- required documents present;
- required metadata present;
- document format/PDF compliance;
- signatures/notary/exhibits where applicable;
- filing fee/payment prerequisites;
- service requirements;
- practice-pack rules;
- court/jurisdiction rules.

### F3. MCP/API tools

Initial tools:
- `create_filing_packet`;
- `validate_filing_packet`;
- `list_filing_requirements`;
- `attach_document_to_packet`;
- `request_filing_approval`;
- `submit_approved_filing`;
- `get_filing_status`;
- `ingest_filing_receipt`;
- `prepare_service_packet`.

### F4. Human UI

Thin UI views:
- packet review;
- validation errors;
- approval controls;
- receipts/status;
- filing history;
- manual override notes.

### F5. Connector abstraction

Each filing connector defines:
- supported jurisdictions/courts;
- auth method;
- packet schema;
- document constraints;
- fee/payment behavior;
- status callbacks/polling;
- error taxonomy.

### F6. Audit and safety

No submission without:
- matter exists;
- representation status allows filing;
- payment/work gate satisfied if required;
- attorney/human filing approval;
- packet validation passed or override recorded;
- immutable audit event.

## Non-goals

- Do not build every court connector first.
- Do not hide manual filing flow; manual fallback is acceptable.
- Do not let agents submit filings autonomously.

## Implementation milestones

1. Define filing packet schema.
2. Build validation stub with fake jurisdiction.
3. Expose MCP/API tools.
4. Build thin review UI.
5. Integrate with LexyOS matter/gate/audit model.
6. Build manual filing connector: generates packet and checklist but does not submit.
7. Build first real connector only after choosing jurisdiction/vendor.
8. Build receipt/status ingestion.
9. Build service packet handoff.

## Acceptance criteria

- Agent can create a draft filing packet but cannot submit.
- Human can review packet, see validation errors, approve or reject.
- Approved packet can be marked submitted through manual connector.
- Receipt/status event updates LexyOS matter timeline.
- All actions are audit-logged.
