import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuditLog } from '../src/audit.mjs';
import { createSession, createUser } from '../src/auth.mjs';
import { createLexyService } from '../src/api.mjs';
import { createCorpusSource, queryCorpus } from '../src/corpus.mjs';
import { approveGate, createHumanGate } from '../src/gates.mjs';
import { createMatterRepository, createStaticMatterSource } from '../src/repository.mjs';
import { completeTask, createTask } from '../src/tasks.mjs';

function sessionFor(tenantId, roles = ['attorney'], matterScope = 'tenant') {
  const user = createUser({ id: `${tenantId}-${roles[0]}`, email: `${roles[0]}@${tenantId}.test`, memberships: [{ tenantId, roles, matterScope }] });
  return createSession({ user, tenantId });
}

test('API filters matters, tasks, gates, and audit events by tenant/matter access', async () => {
  const repo = createMatterRepository({ sources: [createStaticMatterSource('test', [
    { matter_id: 'A1', tenantId: 'firm-a', client_display_name: 'A Client' },
    { matter_id: 'B1', tenantId: 'firm-b', client_display_name: 'B Client' },
  ])] });
  const auditLog = createAuditLog();
  auditLog.append({ actor: 'system', source: 'test', action: 'matter.updated', matterId: 'A1' });
  auditLog.append({ actor: 'system', source: 'test', action: 'matter.updated', matterId: 'B1' });
  const service = createLexyService({
    matterRepository: repo,
    tasks: [createTask({ id: 'ta', matterId: 'A1', title: 'A task' }), createTask({ id: 'tb', matterId: 'B1', title: 'B task' })],
    gates: [createHumanGate({ id: 'ga', matterId: 'A1', type: 'filing_approval', action: 'submit_filing:p1', requestedBy: 'agent' }), createHumanGate({ id: 'gb', matterId: 'B1', type: 'filing_approval', action: 'submit_filing:p2', requestedBy: 'agent' })],
    auditLog,
  });
  const session = sessionFor('firm-a');

  assert.deepEqual((await service.handle({ path: '/matters', session })).body.map((m) => m.id), ['A1']);
  assert.deepEqual((await service.handle({ path: '/tasks', session })).body.map((t) => t.id), ['ta']);
  assert.deepEqual((await service.handle({ path: '/gates', session })).body.map((g) => g.id), ['ga']);
  assert.deepEqual((await service.handle({ path: '/audit-events', session })).body.map((e) => e.matterId), ['A1']);
});

test('task creation denies cross-tenant matter writes', async () => {
  const repo = createMatterRepository({ sources: [createStaticMatterSource('test', [{ matter_id: 'A1', tenantId: 'firm-a', client_display_name: 'A Client' }])] });
  const service = createLexyService({ matterRepository: repo, tasks: [], auditLog: createAuditLog() });
  const agentSession = sessionFor('firm-b', ['agent']);
  const response = await service.handle({ method: 'POST', path: '/tasks', session: agentSession, body: createTask({ id: 'bad', matterId: 'A1', title: 'Bad cross tenant write' }) });
  assert.equal(response.status, 403);
});

test('gate and task completion require authorized same-matter approval', () => {
  const attorneySession = sessionFor('firm-a', ['attorney']);
  const agentSession = sessionFor('firm-a', ['agent']);
  const gate = createHumanGate({ id: 'g1', matterId: 'M1', type: 'external_communication', action: 'external_communication', requestedBy: 'agent' });
  assert.throws(() => approveGate(gate, { session: agentSession }), /authorized session/);
  const approved = approveGate(gate, { session: attorneySession, matter: { id: 'M1', tenantId: 'firm-a' } });
  const task = createTask({ id: 't1', matterId: 'M1', title: 'Send approved message', requiresGate: 'external_communication' });
  assert.equal(completeTask(task, { actor: 'agent', approvedGate: approved }).status, 'done');
  const otherMatterTask = createTask({ id: 't2', matterId: 'M2', title: 'Bad reuse', requiresGate: 'external_communication' });
  assert.throws(() => completeTask(otherMatterTask, { actor: 'agent', approvedGate: approved }), /matter mismatch/);
});

test('private corpus sources require an explicit matching matter scope', () => {
  const unscopedPrivate = createCorpusSource({ id: 'private-null', text: 'Secret internal text', visibility: 'private' });
  const scopedPrivate = createCorpusSource({ id: 'private-m1', text: 'Secret plan detail', visibility: 'private', matterId: 'M1' });
  assert.equal(queryCorpus({ sources: [unscopedPrivate], query: 'secret', allowPrivate: true }).length, 0);
  assert.equal(queryCorpus({ sources: [scopedPrivate], query: 'secret', allowPrivate: true, matterId: 'M2' }).length, 0);
  assert.equal(queryCorpus({ sources: [scopedPrivate], query: 'secret', allowPrivate: true, matterId: 'M1' }).length, 1);
});
