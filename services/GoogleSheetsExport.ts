export async function exportToSheets(accessToken: string, pages: any[], columns: Array<{ key: string; label: string }>) {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: `Seesby Crawl — ${new Date().toISOString().split('T')[0]}` },
      sheets: [{ properties: { title: 'Crawl Data' } }]
    })
  });
  if (!createRes.ok) throw new Error(`Failed to create spreadsheet (${createRes.status})`);
  const sheet = await createRes.json() as { spreadsheetId: string };

  const headers = columns.map((c) => c.label);
  const rows = pages.map((page) => columns.map((c) => page[c.key] ?? ''));
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/A1:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [headers, ...rows] })
    }
  );
  if (!appendRes.ok) throw new Error(`Failed to write spreadsheet rows (${appendRes.status})`);
  return `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`;
}
