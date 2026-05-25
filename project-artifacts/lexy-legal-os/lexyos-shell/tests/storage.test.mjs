import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriveMatterStorage } from '../src/storage.mjs';

test('Drive storage adapter lists files for selected matter folder only', async () => {
  const calls = [];
  const storage = createDriveMatterStorage({
    rootFolderId: 'root',
    listFiles: async (folderId) => {
      calls.push(folderId);
      return [{ id: 'doc1', name: 'Draft QDRO.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }];
    },
  });

  const files = await storage.listMatterFiles({ id: 'Q1', driveFolderId: 'folder-q1' });

  assert.deepEqual(calls, ['folder-q1']);
  assert.equal(files[0].name, 'Draft QDRO.docx');
});

test('Drive storage adapter returns setup action when matter has no folder yet', async () => {
  const storage = createDriveMatterStorage({ rootFolderId: 'root', listFiles: async () => [] });
  const result = await storage.listMatterFiles({ id: 'Q1', displayName: 'Jane Doe — QDRO' });

  assert.deepEqual(result, []);
  assert.equal(storage.folderStatus({ id: 'Q1', displayName: 'Jane Doe — QDRO' }).needsFolder, true);
});
