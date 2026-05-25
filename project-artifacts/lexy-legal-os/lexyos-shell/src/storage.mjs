export function createDriveMatterStorage({ rootFolderId, listFiles, createFolder } = {}) {
  if (!rootFolderId) throw new Error('rootFolderId is required');
  if (typeof listFiles !== 'function') throw new Error('listFiles function is required');

  return {
    async listMatterFiles(matter) {
      if (!matter?.driveFolderId) return [];
      const files = await listFiles(matter.driveFolderId);
      return (files ?? []).map(normalizeDriveFile);
    },

    folderStatus(matter) {
      return {
        rootFolderId,
        matterId: matter?.id ?? null,
        displayName: matter?.displayName ?? matter?.clientName ?? 'Unknown matter',
        driveFolderId: matter?.driveFolderId ?? null,
        needsFolder: !matter?.driveFolderId,
      };
    },

    async ensureMatterFolder(matter) {
      if (matter?.driveFolderId) return { created: false, folderId: matter.driveFolderId };
      if (typeof createFolder !== 'function') {
        return { created: false, folderId: null, blocked: 'createFolder adapter not configured' };
      }
      const folder = await createFolder({
        parentFolderId: rootFolderId,
        name: `${matter.displayName} — ${matter.id}`,
        matter,
      });
      return { created: true, folderId: folder.id, folder };
    },
  };
}

export function normalizeDriveFile(file) {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType ?? 'application/octet-stream',
    modifiedTime: file.modifiedTime ?? null,
    webViewLink: file.webViewLink ?? driveWebLink(file.id),
    source: 'google_drive',
  };
}

function driveWebLink(id) {
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/view` : null;
}
