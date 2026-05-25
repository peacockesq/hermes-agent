# PRD — Lexy Corpus

## Goal

Build Lexy Corpus as the source-backed legal research, retrieval, citation verification, and firm-knowledge layer used by LexyOS and practice packs.

## Product thesis

Legal research and authority should not live inside the matter UI. Corpus is a separate source system that supplies verified law/source answers, citations, sample language, firm-approved playbooks, and jurisdiction/practice-pack knowledge.

## Reference systems

- GBrain: source graph, memory, retrieval, page/chunk model.
- EU-Mike: official source connector + citation verification.
- MikeNL: jurisdiction-specific law source integrations.
- Retriever: local-first archive/document intelligence.
- Lavern: grounding verifier / precedent board concepts.
- Adeu: document-level redline/source fidelity.

## Functional requirements

### F1. Source registry

Each source has:
- source ID;
- jurisdiction/practice area;
- source type: statute, rule, form, case, plan document, firm memo, sample language;
- provenance URL/path;
- last checked;
- license/usage notes;
- trust level;
- citation format.

### F2. Retrieval API

Corpus exposes:
- semantic search;
- keyword search;
- citation lookup;
- source retrieval by ID;
- quote verification;
- answer-with-citations endpoint;
- pack-specific retrieval scopes.

### F3. Citation verification

For any legal/source-backed answer:
- return source IDs;
- quoted text spans;
- citation string;
- confidence;
- warning if source is stale/unverified;
- no answer if no source support.

### F4. Practice-pack knowledge

Corpus supports packs with:
- statutes/rules;
- court forms;
- local rules;
- agency/court procedures;
- plan-admin procedures;
- firm-approved sample language;
- reusable strategy notes.

### F5. Matter boundary

Corpus may receive anonymized or scoped matter queries, but should not become the matter database. LexyOS owns matter facts and client data.

## Data model

- `sources`.
- `source_versions`.
- `chunks`.
- `citations`.
- `quote_spans`.
- `jurisdictions`.
- `practice_area_scopes`.
- `firm_guidance`.
- `retrieval_logs`.
- `verification_results`.

## Security/privacy

- Separate public/legal-source corpus from private firm/client corpus.
- Strict permissioning for client/matter-derived content.
- Track provenance and license.
- Do not train/publicly expose firm/private materials.

## Implementation milestones

1. Define source registry schema.
2. Build ingestion for static markdown/PDF/text sources.
3. Build search endpoint.
4. Build quote verification endpoint.
5. Add QDRO/plan-procedure sample sources.
6. Add practice-pack scoped retrieval.
7. Add GBrain bridge or evaluate reusing GBrain directly.
8. Add evaluation suite: known questions with expected cited answers.
9. Add source freshness monitor.

## Acceptance criteria

- LexyOS can ask Corpus a QDRO/source question and receive cited output.
- Corpus refuses unsupported answers.
- Quote verification links answer text to source text.
- Practice pack can declare required Corpus scopes.
- Retrieval/audit logs show what sources were used.
