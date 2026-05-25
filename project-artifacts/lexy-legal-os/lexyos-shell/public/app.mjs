import { createStaticMatterSource, createMatterRepository } from '../src/repository.mjs';
import { searchMatters } from '../src/matters.mjs';
import { createDriveMatterStorage } from '../src/storage.mjs';
import { buildEvaPromptContext, createEditProposal } from '../src/eva.mjs';
import { createSession, createUser } from '../src/auth.mjs';
import { createMissingRequirementTasks, QDRO_FAMILY_PACK } from '../src/practicePacks.mjs';
import { createFilingPacket, requestFilingApproval, validateFilingPacket } from '../src/filing.mjs';
import { answerWithCitations, createCorpusSource } from '../src/corpus.mjs';
import { defineServiceRequirement, prepareServicePacket } from '../src/service.mjs';
import { createDocumentGenerationRequest, createDocumentTemplate } from '../src/documents.mjs';

const sampleRows = [
  {
    matter_id: 'Q-2026-001',
    client_name: 'Jane Doe',
    matter_type: 'QDRO',
    stage: 'drafting',
    drive_folder_id: 'drive-jane',
    baseline_data: {
      plan_name: 'Fidelity 401(k)',
      participant: 'John Doe',
      alternate_payee: 'Jane Doe',
      valuation_date: '2024-01-01',
      jurisdiction: 'CT',
    },
  },
  {
    matter_id: 'Q-2026-002',
    client_name: 'Andrew Gerhold',
    matter_type: 'QDRO',
    stage: 'client_paid',
    drive_folder_id: '1TxIBS7Yfh0q9fFy7M4VbbLDdF7DHkGCX',
    baseline_data: { plan_name: 'Unknown - needs plan docs', missing: 'Plan name, decree' },
  },
  {
    matter_id: 'INTAKE-003',
    client_name: 'New Intake Client',
    matter_type: 'QDRO',
    stage: 'intake',
    baseline_data: { county: 'Fairfield', paid: false },
  },
];

const fakeFiles = {
  'drive-jane': [
    { id: 'doc-jane-1', name: 'Draft QDRO.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2026-05-24T13:00:00Z' },
    { id: 'pdf-jane-1', name: 'Plan Statement.pdf', mimeType: 'application/pdf', modifiedTime: '2026-05-22T10:00:00Z' },
  ],
  '1TxIBS7Yfh0q9fFy7M4VbbLDdF7DHkGCX': [
    { id: 'gerhold-intake', name: 'Client Intake.pdf', mimeType: 'application/pdf', modifiedTime: '2026-05-15T05:04:00Z' },
  ],
};

const repo = createMatterRepository({ sources: [createStaticMatterSource('demo', sampleRows)] });
const storage = createDriveMatterStorage({
  rootFolderId: '1H-QI7MRbbXgoPjSvdNoXg4mjB5PZ0JSM',
  listFiles: async (folderId) => fakeFiles[folderId] ?? [],
});

const demoUser = createUser({
  id: 'willie',
  email: 'willie@peacock.test',
  memberships: [{ tenantId: 'peacock', roles: ['attorney'] }],
});
const demoSession = createSession({ user: demoUser, tenantId: 'peacock', provider: 'google-workspace' });
const corpusSources = [
  createCorpusSource({
    id: 'ct-qdro-memo',
    title: 'CT QDRO Firm Memo',
    jurisdiction: 'CT',
    practiceArea: 'family_qdro',
    sourceType: 'firm_memo',
    text: 'QDRO drafts require plan identity, judgment review, and attorney approval before filing.',
  }),
];

let matters = [];
let visibleMatters = [];
let selectedMatter = null;
let selectedDocument = null;

const matterSearch = document.querySelector('#matter-search');
const matterList = document.querySelector('#matter-list');
const fileList = document.querySelector('#file-list');
const baselinePanel = document.querySelector('#baseline-panel');
const documentFrame = document.querySelector('#document-frame');
const evaContext = document.querySelector('#eva-context');
const evaInstruction = document.querySelector('#eva-instruction');
const evaProposal = document.querySelector('#eva-proposal');
const folderStatus = document.querySelector('#folder-status');
const sessionPanel = document.querySelector('#session-panel');
const opsPanel = document.querySelector('#ops-panel');
const researchPanel = document.querySelector('#research-panel');

async function boot() {
  matters = await loadMattersFromApi();
  visibleMatters = matters;
  await selectMatter(matters[0]);
  renderMatters();
}

function renderMatters() {
  matterList.innerHTML = '';
  for (const matter of visibleMatters) {
    const button = document.createElement('button');
    button.className = `matter-card ${matter.id === selectedMatter?.id ? 'selected' : ''}`;
    button.innerHTML = `<strong>${escapeHtml(matter.displayName)}</strong><span>${escapeHtml(matter.id)} · ${escapeHtml(matter.stage)}</span>`;
    button.addEventListener('click', () => selectMatter(matter));
    matterList.appendChild(button);
  }
}

async function selectMatter(matter) {
  selectedMatter = matter;
  selectedDocument = null;
  renderMatters();
  renderBaseline();
  await renderFiles();
  renderEva();
  await renderLexyOps();
}

function renderBaseline() {
  baselinePanel.innerHTML = Object.entries(selectedMatter.baseline)
    .map(([key, value]) => `<div class="baseline-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(String(value))}</strong></div>`)
    .join('');
  const status = storage.folderStatus(selectedMatter);
  folderStatus.textContent = status.needsFolder
    ? `No Drive folder yet. Create under root ${status.rootFolderId}.`
    : `Drive folder: ${status.driveFolderId}`;
}

async function renderFiles() {
  const files = await loadFilesFromApi(selectedMatter);
  fileList.innerHTML = '';
  if (!files.length) {
    fileList.innerHTML = '<div class="empty">No files found for this matter folder yet.</div>';
    documentFrame.innerHTML = '<div class="empty big">Select a document after files sync.</div>';
    return;
  }
  for (const file of files) {
    const button = document.createElement('button');
    button.className = 'file-card';
    button.innerHTML = `<strong>${escapeHtml(file.name)}</strong><span>${escapeHtml(file.mimeType)}</span>`;
    button.addEventListener('click', () => selectDocument(file));
    fileList.appendChild(button);
  }
  selectDocument(files[0]);
}

function selectDocument(file) {
  selectedDocument = file;
  documentFrame.innerHTML = `
    <div class="doc-preview">
      <div class="doc-title">${escapeHtml(file.name)}</div>
      <p>Drive-backed document preview placeholder. Real adapter opens or embeds: <a href="${file.webViewLink}" target="_blank" rel="noreferrer">Drive file</a>.</p>
      <blockquote id="selected-text">The Alternate Payee shall receive fifty percent of the marital portion.</blockquote>
    </div>`;
  renderEva();
}

function renderEva() {
  const selectedText = document.querySelector('#selected-text')?.textContent ?? '';
  evaContext.textContent = buildEvaPromptContext({ matter: selectedMatter, document: selectedDocument, selectedText });
}

async function renderLexyOps() {
  if (!selectedMatter) return;
  const packTasks = createMissingRequirementTasks(QDRO_FAMILY_PACK, {
    ...selectedMatter,
    documents: selectedDocument ? [selectedDocument] : [],
  });
  const template = createDocumentTemplate({
    id: 'qdro-draft',
    name: 'QDRO Draft',
    practiceArea: 'family_qdro',
    requiredFacts: ['plan_name', 'case_number'],
  });
  const docRequest = createDocumentGenerationRequest({ template, matter: selectedMatter });
  const packet = createFilingPacket({
    id: `filing-${selectedMatter.id}`,
    matterId: selectedMatter.id,
    jurisdiction: selectedMatter.baseline.jurisdiction ?? 'unknown',
    filingType: 'QDRO filing',
    documents: selectedDocument ? [{ ...selectedDocument, type: selectedDocument.name.toLowerCase().includes('qdro') ? 'qdro' : 'supporting' }] : [],
  });
  const filingValidation = validateFilingPacket(packet, QDRO_FAMILY_PACK.filingRequirements);
  const filingGate = requestFilingApproval(packet);
  const corpusAnswer = await loadCorpusAnswerFromApi({
    question: 'What does a QDRO draft require before filing?',
    scope: { practiceArea: 'family_qdro', jurisdiction: selectedMatter.baseline.jurisdiction ?? 'CT' },
  });
  const serviceRequirement = defineServiceRequirement({ id: 'plan-admin-mail', method: 'mail', requiredDocuments: ['notice'] });
  const servicePacket = prepareServicePacket({
    id: `svc-${selectedMatter.id}`,
    matter: selectedMatter,
    requirement: serviceRequirement,
    documents: selectedDocument ? [{ ...selectedDocument, type: 'notice' }] : [],
    recipient: selectedMatter.baseline.plan_admin_tpa ?? 'Plan Administrator',
  });

  sessionPanel.textContent = JSON.stringify({ backend: 'http://localhost:5174/api', tenantId: demoSession.tenantId, provider: demoSession.provider, roles: demoSession.roles }, null, 2);
  opsPanel.textContent = JSON.stringify({ source: 'api-backed matter/file/corpus with local workflow contracts', missingPackTasks: packTasks.map((task) => task.title), documentGeneration: docRequest.status, filingValidation, filingGate: filingGate.status }, null, 2);
  researchPanel.textContent = JSON.stringify({ corpus: corpusAnswer, servicePacket: { status: servicePacket.status, missingDocuments: servicePacket.missingDocuments } }, null, 2);
}

async function loadMattersFromApi() {
  try {
    const apiMatters = await apiJson('/api/matters');
    return apiMatters.length ? apiMatters : await repo.listMatters();
  } catch {
    return repo.listMatters();
  }
}

async function loadFilesFromApi(matter) {
  try {
    return await apiJson(`/api/matters/${encodeURIComponent(matter.id)}/files`);
  } catch {
    return storage.listMatterFiles(matter);
  }
}

async function loadCorpusAnswerFromApi({ question, scope }) {
  try {
    return await apiJson('/api/corpus/search', { method: 'POST', body: { query: question, scope } });
  } catch {
    return answerWithCitations({ question, sources: corpusSources, scope });
  }
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw new Error(`LexyOS API failed: ${response.status}`);
  return response.json();
}

matterSearch.addEventListener('input', (event) => {
  visibleMatters = searchMatters(matters, event.target.value);
  renderMatters();
});

document.querySelector('#eva-propose').addEventListener('click', () => {
  const selectedText = document.querySelector('#selected-text')?.textContent ?? '';
  const proposal = createEditProposal({ instruction: evaInstruction.value, selectedText });
  evaProposal.textContent = JSON.stringify(proposal, null, 2);
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

boot();
