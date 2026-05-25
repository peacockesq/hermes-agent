# PRD — Lexy Agents Admin OS and Firm Cockpit

## Goal

Build the administrative execution layer where agents handle intake, routine workflows, draft preparation, follow-ups, gap sweeps, and blocked-task escalation while the firm sees everything in one cockpit.

## Problem

Law firm admin work is repetitive but risk-bearing. Agents can do much of it, but invisible agents create malpractice, client-service, and operational risk. The firm needs queue discipline and an overview of automation state.

## Core concept

Agents are bounded queue workers. They do not free-roam. They pick up tasks, run approved workflows, log tool calls, produce draft outputs, and escalate when a human gate or missing prerequisite appears.

## Reference systems

- **Hermes Kanban/Paperclips:** queue-driven agent execution and status visibility.
- **Bridge screenshots/concept:** cockpit showing agent activity, due/overdue, blocked work, matter drilldown.
- **Mike:** workspace/document/chat UI patterns.
- **PIP:** audit/admin/security posture.
- **Lavern:** human gates, debate/verification concepts.

## Users

- Intake/admin staff.
- Attorneys reviewing escalations.
- Firm owner/operator monitoring risk and throughput.
- Agents as API/MCP consumers.

## Functional requirements

### F1. Work queue

Task fields:
- task ID;
- matter ID;
- practice pack;
- workflow type;
- status: pending, running, blocked, needs human, completed, failed, cancelled;
- priority;
- due date;
- assigned actor/agent;
- prerequisites;
- human gate if required;
- created/source event;
- audit events.

### F2. Agent worker contract

Each agent run must:
- claim exactly one task;
- load matter context within permission scope;
- verify prerequisites;
- run approved tools only;
- produce structured output;
- decide: complete, block, or escalate;
- write audit log;
- never send external communications without approved gate.

### F3. Intake automations

Capabilities:
- parse web forms/emails/faxes/calls/texts into lead/matter candidates;
- classify practice area;
- detect conflicts inputs;
- request missing documents/facts using approved templates;
- create consult/retainer/payment tasks;
- convert lead to matter only after representation gate.

### F4. Routine admin automations

- missing-info chases;
- document checklist sweeps;
- stale matter detection;
- draft packet assembly;
- rough form prep;
- follow-up scheduling;
- status update drafts;
- task creation for human review.

### F5. Cockpit overview

Dashboard cards:
- due today;
- overdue;
- blocked;
- human gates awaiting review;
- failed automations;
- waiting on client/court/plan/vendor;
- agent activity stream;
- throughput by practice pack;
- aging matters.

### F6. Matter drilldown

Matter page must show:
- current stage;
- key facts;
- documents;
- required missing items;
- task queue;
- available workflows;
- human gates;
- communication history;
- audit log;
- agent runs/tool calls;
- filing/service status.

### F7. Human gates

Gate types:
- approve draft;
- approve outbound message;
- approve filing;
- approve legal advice/strategy note;
- conflict/representation decision;
- payment/work authorization;
- close/withdraw matter.

## Non-functional requirements

- Every agent action is auditable.
- All external writes are disabled by default in development.
- Tool permissions are practice/task scoped.
- Failed tasks produce actionable errors, not raw stack dumps to users.
- Agents must be idempotent where possible.
- Queue should survive worker restarts.

## Data model additions

- `agent_runs`.
- `agent_tool_calls`.
- `task_prerequisites`.
- `human_gates`.
- `gate_decisions`.
- `workflow_runs`.
- `workflow_outputs`.
- `automation_failures`.

## Implementation milestones

1. Define task/agent/gate tables.
2. Build queue runner with fake agent.
3. Build intake task creation from sample inbound event.
4. Build gap sweeper for QDRO sample matter.
5. Build cockpit dashboard with sample metrics.
6. Build matter drilldown timeline/audit stream.
7. Add human gate approval flow.
8. Add external-communication stub with approval required.
9. Add agent evaluation grading.

## Proof gates

- Demo: fake lead enters, agent classifies, creates missing-info task, drafts message, human gate blocks send.
- Demo: gap sweeper finds stale/missing item and creates task.
- Demo: firm cockpit shows live agent run statuses.
- Tests prove agents cannot complete gated actions without approval.
