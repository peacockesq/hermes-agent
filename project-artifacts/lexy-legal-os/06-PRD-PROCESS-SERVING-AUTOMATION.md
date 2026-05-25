# PRD — Process Serving Automation

## Goal

Automate everything around process serving that does not require physical in-person service.

## Scope

Automate:
- service requirement determination;
- service packet assembly;
- vendor/process-server routing;
- instruction letters;
- deadline tracking;
- status follow-up;
- proof-of-service intake;
- failed-service escalation;
- alternate-service packet preparation;
- matter timeline updates.

Do not automate:
- physical handoff/service itself;
- legal decisions about sufficiency of service without human review;
- court filings without approval.

## Reference systems

- LexyFiling packet model.
- LexyOS task/deadline/audit model.
- Practice pack filing/service requirements.
- Avofax/email/Drive/Gmail integrations for communication and documents.

## Functional requirements

### F1. Service requirement rules

From practice pack:
- who must be served;
- acceptable methods;
- deadline;
- required documents;
- proof requirements;
- jurisdiction/court-specific rules.

### F2. Service packet generation

Generate:
- cover/instruction letter;
- documents to serve;
- recipient details;
- court/matter metadata;
- deadline notes;
- proof form/checklist.

### F3. Vendor routing

Track:
- vendor/process server;
- jurisdiction/service area;
- contact method;
- fee/payment info;
- assignment timestamp;
- status.

### F4. Status tracking

Statuses:
- not required;
- packet needed;
- ready for approval;
- assigned to vendor;
- attempted;
- served;
- failed;
- alternate service needed;
- proof received;
- proof filed;
- closed.

### F5. Proof intake

When proof arrives:
- classify document;
- attach to matter;
- extract service date/time/person/method;
- create attorney/paralegal review gate;
- hand proof to LexyFiling if filing required.

## Implementation milestones

1. Define service event schema.
2. Add service requirements to practice-pack manifest.
3. Build sample QDRO/family service packet generator.
4. Build vendor assignment task.
5. Build status update/manual intake UI.
6. Build proof-of-service extraction with human gate.
7. Integrate with LexyFiling for proof filing.
8. Add stale/failed-service sweeper.

## Acceptance criteria

- Practice pack can define service requirements.
- System can assemble service packet from sample matter.
- Human approval required before sending packet to vendor.
- Proof intake creates review gate and filing task.
- Failed/stale service creates escalation task.
