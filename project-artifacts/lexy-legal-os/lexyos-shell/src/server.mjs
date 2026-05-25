import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createSession, createUser } from './auth.mjs';
import { createMatterRepository } from './repository.mjs';
import { createJsonFileStore, appendAuditEvent } from './persistence.mjs';
import { createDocumentGenerationRequest, createDocumentTemplate, renderDocumentArtifact, requestDocumentApproval } from './documents.mjs';
import { approveGate, rejectGate } from './gates.mjs';
import { createTask } from './tasks.mjs';
import { createFilingPacket, getFilingStatus, ingestFilingReceipt, requestFilingApproval, submitApprovedFiling, validateFilingPacket } from './filing.mjs';
import { answerWithCitations, createCorpusSearchBridge } from './corpus.mjs';
import { defineServiceRequirement, ingestProofOfService, markServiceSent, prepareServicePacket, requestServiceApproval } from './service.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const defaultDataPath = resolve(projectRoot, 'data', 'lexyos.json');
const defaultSeedPath = resolve(projectRoot, 'data', 'seed.json');

export async function loadDefaultSeed(seedPath = defaultSeedPath) {
  try {
    return JSON.parse(await readFile(seedPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export function createLexyProductServer({ dataPath = process.env.LEXYOS_DATA_PATH ?? defaultDataPath, seed = {}, publicDir = resolve(projectRoot, 'public') } = {}) {
  const app = createLexyProductApp({ dataPath, seed, publicDir });
  const server = http.createServer((request, response) => app.handleHttp(request, response));
  return { server, app };
}

export function createLexyProductApp({ dataPath = defaultDataPath, seed = {}, publicDir = resolve(projectRoot, 'public') } = {}) {
  const store = createJsonFileStore({ path: dataPath, seed });
  const repository = createMatterRepository({ store });
  const systemSession = createSession({
    user: createUser({ id: 'local-owner', email: 'local-owner@lexyos.test', memberships: [{ tenantId: 'peacock', roles: ['owner'], globalMatterAccess: true }] }),
    tenantId: 'peacock',
    provider: 'local-dev',
  });

  async function handleApi(method, pathname, body = {}) {
    const segments = pathname.split('/').filter(Boolean).slice(1); // drop api

    if (method === 'GET' && segments.length === 1 && segments[0] === 'health') {
      return ok({ status: 'ok', dataPath, product: 'LexyOS local backend' });
    }

    if (method === 'GET' && segments.length === 1 && segments[0] === 'matters') {
      return ok(await repository.listMatters());
    }
    if (method === 'POST' && segments.length === 1 && segments[0] === 'matters') {
      const matter = await repository.saveMatter({ ...body, id: body.id ?? body.matter_id ?? `matter_${randomUUID()}` });
      await audit('matter.upserted', matter.id, { source: 'api' });
      return created(matter);
    }
    if (method === 'GET' && segments.length === 3 && segments[0] === 'matters' && segments[2] === 'files') {
      const matterId = decodeURIComponent(segments[1]);
      return ok((await store.all('documents')).filter((document) => document.matterId === matterId && document.kind !== 'artifact'));
    }
    if (method === 'POST' && segments.length === 3 && segments[0] === 'matters' && segments[2] === 'files') {
      const matterId = decodeURIComponent(segments[1]);
      await requireMatter(matterId);
      const file = await store.upsert('documents', { id: body.id ?? `file_${randomUUID()}`, matterId, kind: 'file', ...body });
      await audit('file.upserted', matterId, { fileId: file.id });
      return created(file);
    }

    if (method === 'GET' && segments.length === 1 && segments[0] === 'document-requests') {
      return ok((await store.all('documents')).filter((document) => document.kind === 'document_request'));
    }
    if (method === 'POST' && segments.length === 1 && segments[0] === 'document-requests') {
      const matter = await requireMatter(body.matterId);
      const template = createDocumentTemplate(body.template ?? defaultDocumentTemplate());
      const request = { ...createDocumentGenerationRequest({ template, matter, requestedBy: body.requestedBy ?? 'local-agent' }), kind: 'document_request', template };
      await store.upsert('documents', request);
      const gate = requestDocumentApproval(request);
      await store.upsert('gates', gate);
      await audit('document.requested', matter.id, { requestId: request.id, gateId: gate.id });
      return created({ request, gate });
    }
    if (method === 'POST' && segments.length === 3 && segments[0] === 'document-requests' && segments[2] === 'artifacts') {
      const requestId = decodeURIComponent(segments[1]);
      const request = await requireRow('documents', requestId, 'document_request_not_found');
      const matter = await requireMatter(request.matterId);
      const artifact = { ...renderDocumentArtifact({ request, template: request.template, matter }), kind: 'artifact', sourceRequestId: request.id };
      await store.upsert('documents', artifact);
      await audit('document.artifact.rendered', matter.id, { requestId, artifactId: artifact.id });
      return created(artifact);
    }

    if (method === 'GET' && segments.length === 1 && segments[0] === 'gates') return ok(await store.all('gates'));
    if (method === 'POST' && segments.length === 3 && segments[0] === 'gates' && ['approve', 'reject'].includes(segments[2])) {
      const gateId = decodeURIComponent(segments[1]);
      const gate = await requireRow('gates', gateId, 'gate_not_found');
      const matter = gate.matterId ? await requireMatter(gate.matterId) : null;
      const decided = segments[2] === 'approve'
        ? approveGate(gate, { session: systemSession, matter, reason: body.reason ?? '' })
        : rejectGate(gate, { session: systemSession, matter, reason: body.reason ?? 'rejected' });
      await store.upsert('gates', decided);
      const affectedTasks = await applyGateDecisionToTasks(decided, body.reason ?? '');
      await audit(`gate.${decided.status}`, gate.matterId, { gateId, reason: body.reason ?? '', affectedTaskIds: affectedTasks.map((task) => task.id) });
      return ok(decided);
    }

    if (method === 'GET' && segments.length === 1 && segments[0] === 'tasks') return ok(await store.all('tasks'));
    if (method === 'POST' && segments.length === 1 && segments[0] === 'tasks') {
      if (body.matterId) await requireMatter(body.matterId);
      const task = createTask({ id: body.id ?? `task_${randomUUID()}`, matterId: body.matterId, title: body.title, kind: body.kind, assignedTo: body.assignedTo, requiresGate: body.requiresGate, prerequisites: body.prerequisites ?? [], payload: body.payload ?? {} });
      const gateDecision = body.requiresGate ? await findExistingGateDecision({ matterId: body.matterId, requiresGate: body.requiresGate }) : null;
      const persistedTask = {
        ...task,
        ...body,
        id: task.id,
        ...(gateDecision ? {
          status: gateDecision.status === 'approved' ? 'approved' : 'blocked',
          gateDecision: {
            gateId: gateDecision.id,
            gateStatus: gateDecision.status,
            decidedAt: gateDecision.decidedAt,
            reason: gateDecision.reason ?? '',
          },
        } : {}),
      };
      await store.upsert('tasks', persistedTask);
      await audit('task.created', body.matterId ?? null, { taskId: task.id, requiresGate: body.requiresGate ?? null, gateDecisionApplied: Boolean(gateDecision) });
      return created(persistedTask);
    }

    if (method === 'GET' && segments.length === 1 && segments[0] === 'audit-events') return ok(await store.all('auditEvents'));

    if (method === 'GET' && segments.length === 1 && segments[0] === 'filing-packets') return ok(await store.all('filingPackets'));
    if (method === 'POST' && segments.length === 1 && segments[0] === 'filing-packets') {
      await requireMatter(body.matterId);
      const packet = createFilingPacket({ id: body.id ?? `filing_${randomUUID()}`, matterId: body.matterId, jurisdiction: body.jurisdiction, filingType: body.filingType, documents: body.documents ?? [], filingFee: body.filingFee, serviceRequirements: body.serviceRequirements ?? [], createdBy: body.createdBy ?? 'local-agent' });
      const validation = validateFilingPacket(packet, body.requirements ?? {});
      const gate = requestFilingApproval(packet);
      await store.upsert('filingPackets', packet);
      await store.upsert('gates', gate);
      await audit('filing.packet.prepared', packet.matterId, { packetId: packet.id, gateId: gate.id, valid: validation.ok });
      return created({ packet, validation, gate, status: getFilingStatus(packet) });
    }
    if (method === 'GET' && segments.length === 3 && segments[0] === 'filing-packets' && segments[2] === 'status') {
      return ok(getFilingStatus(await requireRow('filingPackets', decodeURIComponent(segments[1]), 'filing_packet_not_found')));
    }
    if (method === 'POST' && segments.length === 3 && segments[0] === 'filing-packets' && segments[2] === 'submit') {
      const packet = await requireRow('filingPackets', decodeURIComponent(segments[1]), 'filing_packet_not_found');
      const matter = await requireMatter(packet.matterId);
      const gate = (await store.all('gates')).find((item) => item.action === `submit_filing:${packet.id}` && item.status === 'approved');
      const submitted = submitApprovedFiling(packet, { gate, session: systemSession, matter, validation: validateFilingPacket(packet, body.requirements ?? {}) });
      const receipted = ingestFilingReceipt(submitted, submitted.submitted);
      await store.upsert('filingPackets', receipted);
      await audit('filing.packet.submitted', packet.matterId, { packetId: packet.id, receiptId: submitted.submitted.receiptId });
      return ok({ packet: receipted, status: getFilingStatus(receipted) });
    }

    if (method === 'POST' && segments.length === 2 && segments[0] === 'corpus' && segments[1] === 'search') {
      const sources = await store.all('corpusSources');
      const bridge = createCorpusSearchBridge({ sources });
      const result = bridge.search({ query: body.query, scope: body.scope ?? {}, limit: body.limit ?? 10 });
      const answer = answerWithCitations({ question: body.query, sources, scope: body.scope ?? {} });
      await audit(answer.supported ? 'corpus.search.supported' : 'corpus.search.refused', body.scope?.matterId ?? null, { query: body.query, citations: result.citations.length });
      return ok({ ...result, supported: answer.supported, answer: answer.answer });
    }

    if (method === 'POST' && segments.length === 1 && segments[0] === 'service-packets') {
      const matter = await requireMatter(body.matterId);
      const requirement = defineServiceRequirement(body.requirement ?? {});
      const packet = prepareServicePacket({ id: body.id ?? `service_${randomUUID()}`, matter, requirement, documents: body.documents ?? [], recipient: body.recipient, vendor: body.vendor ?? null });
      const gate = requestServiceApproval(packet);
      await store.upsert('servicePackets', packet);
      await store.upsert('gates', gate);
      await audit('service.packet.prepared', matter.id, { packetId: packet.id, gateId: gate.id });
      return created({ packet, gate });
    }
    if (method === 'POST' && segments.length === 3 && segments[0] === 'service-packets' && segments[2] === 'send') {
      const packet = await requireRow('servicePackets', decodeURIComponent(segments[1]), 'service_packet_not_found');
      const matter = await requireMatter(packet.matterId);
      const gate = (await store.all('gates')).find((item) => item.action === `send_service:${packet.id}` && item.status === 'approved');
      const sent = markServiceSent(packet, { gate, session: systemSession, matter, vendor: body.vendor, trackingId: body.trackingId });
      await store.upsert('servicePackets', sent);
      await store.append('serviceEvents', { matterId: packet.matterId, packetId: packet.id, action: 'sent', trackingId: body.trackingId });
      await audit('service.packet.sent', packet.matterId, { packetId: packet.id, trackingId: body.trackingId });
      return ok(sent);
    }
    if (method === 'POST' && segments.length === 3 && segments[0] === 'service-packets' && segments[2] === 'proof') {
      const packet = await requireRow('servicePackets', decodeURIComponent(segments[1]), 'service_packet_not_found');
      const result = ingestProofOfService({ packet, proofDocument: body.proofDocument, extracted: body.extracted ?? {} });
      await store.upsert('servicePackets', result.packet);
      await store.upsert('gates', result.gate);
      await store.append('serviceEvents', { matterId: packet.matterId, packetId: packet.id, action: 'proof_received', proofDocument: body.proofDocument });
      await audit('service.proof.received', packet.matterId, { packetId: packet.id, gateId: result.gate.id });
      return created(result);
    }

    return notFound();
  }

  async function requireMatter(matterId) {
    const matter = (await repository.listMatters()).find((item) => item.id === matterId);
    if (!matter) throw httpError(404, 'matter_not_found');
    return matter;
  }

  async function requireRow(collection, id, code) {
    const row = await store.get(collection, id);
    if (!row) throw httpError(404, code);
    return row;
  }

  async function findExistingGateDecision({ matterId, requiresGate }) {
    return (await store.all('gates')).find((gate) => gate.matterId === matterId && [gate.type, gate.action].includes(requiresGate) && ['approved', 'rejected'].includes(gate.status)) ?? null;
  }

  async function applyGateDecisionToTasks(gate, reason = '') {
    const tasks = await store.all('tasks');
    const nextStatus = gate.status === 'approved' ? 'approved' : gate.status === 'rejected' ? 'blocked' : null;
    if (!nextStatus) return [];
    const affected = tasks.filter((task) => task.matterId === gate.matterId && [gate.type, gate.action].includes(task.requiresGate));
    for (const task of affected) {
      await store.upsert('tasks', {
        ...task,
        status: nextStatus,
        gateDecision: {
          gateId: gate.id,
          gateStatus: gate.status,
          decidedAt: gate.decidedAt,
          reason,
        },
      });
    }
    return affected;
  }

  async function audit(action, matterId = null, metadata = {}) {
    return appendAuditEvent(store, { actor: 'local-backend', actorType: 'system', source: 'api', action, matterId, metadata });
  }

  async function handleHttp(request, response) {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (url.pathname.startsWith('/api/')) {
        const body = await parseJsonBody(request);
        return sendJson(response, await handleApi(request.method, url.pathname, body));
      }
      return serveStatic(publicDir, url.pathname, response);
    } catch (error) {
      return sendJson(response, { status: error.status ?? 500, body: { error: error.code ?? 'internal_error', message: error.message } });
    }
  }

  return { handleApi, handleHttp, store, repository, systemSession };
}

function defaultDocumentTemplate() {
  return { id: 'qdro-draft', name: 'QDRO Draft', practiceArea: 'family_qdro', requiredFacts: ['plan_name', 'case_number'] };
}

async function parseJsonBody(request) {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return {};
  let raw = '';
  for await (const chunk of request) raw += chunk;
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

async function serveStatic(publicDir, pathname, response) {
  const withoutLegacyPrefix = pathname.startsWith('/public/') ? pathname.slice('/public'.length) : pathname;
  const requested = withoutLegacyPrefix === '/' ? '/index.html' : withoutLegacyPrefix;
  const fullPath = normalize(resolve(publicDir, `.${requested}`));
  if (!fullPath.startsWith(resolve(publicDir))) return sendText(response, 403, 'forbidden');
  try {
    const data = await readFile(fullPath);
    response.writeHead(200, { 'content-type': mimeType(fullPath) });
    response.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') return sendText(response, 404, 'not found');
    throw error;
  }
}

function mimeType(pathname) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  }[extname(pathname)] ?? 'application/octet-stream';
}

function sendJson(response, result) {
  response.writeHead(result.status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(result.body, null, 2)}\n`);
}

function sendText(response, status, body) {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(body);
}

function ok(body) { return { status: 200, body }; }
function created(body) { return { status: 201, body }; }
function notFound() { return { status: 404, body: { error: 'not_found' } }; }
function httpError(status, code) {
  const error = new Error(code);
  error.status = status;
  error.code = code;
  return error;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const seed = await loadDefaultSeed();
  const port = Number(process.env.PORT ?? 5174);
  const host = process.env.HOST ?? '127.0.0.1';
  const { server } = createLexyProductServer({ seed });
  server.listen(port, host, () => {
    console.log(`LexyOS local backend listening at http://${host}:${port}`);
    console.log(`Data file: ${process.env.LEXYOS_DATA_PATH ?? defaultDataPath}`);
  });
}
