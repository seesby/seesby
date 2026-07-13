async function findOrCreateBackupFolder(accessToken: string) {
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='Seesby Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!searchRes.ok) throw new Error(`Drive search failed (${searchRes.status})`);
  const searchData = await searchRes.json() as { files?: Array<{ id: string }> };
  if (searchData.files?.[0]?.id) return searchData.files[0].id;

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Seesby Backups', mimeType: 'application/vnd.google-apps.folder' })
  });
  if (!createRes.ok) throw new Error(`Drive folder create failed (${createRes.status})`);
  const created = await createRes.json() as { id: string };
  return created.id;
}

export async function backupToGoogleDrive(accessToken: string, fileName: string, data: Blob) {
  const folderId = await findOrCreateBackupFolder(accessToken);
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', data);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });
  if (!uploadRes.ok) throw new Error(`Drive upload failed (${uploadRes.status})`);
  return uploadRes.json();
}
