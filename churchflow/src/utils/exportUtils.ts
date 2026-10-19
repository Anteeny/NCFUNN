/**
 * Universal Export Utilities for NCF ChurchFlow
 * Provides standardized CSV export (with UTF-8 BOM for Microsoft Excel)
 * and formatted printable table views.
 */

/**
 * Exports data to a CSV file with automatic Excel UTF-8 BOM encoding.
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  if (!rows || rows.length === 0) {
    alert('No data records available to export.');
    return;
  }

  const escapedHeaders = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
  const escapedRows = rows.map(row =>
    row
      .map(cell => {
        if (cell === null || cell === undefined) return '""';
        return `"${String(cell).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [escapedHeaders, ...escapedRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-friendly window with church header branding and prints or saves to PDF.
 */
export function printTable(
  title: string,
  metaDetails: { label: string; value: string | number }[],
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups in your browser to print or export to PDF.');
    return;
  }

  const metaHtml = metaDetails
    .map(m => `<span><strong>${m.label}:</strong> ${m.value}</span>`)
    .join(' &nbsp;|&nbsp; ');

  const theadHtml = headers
    .map((h, i) => `<th style="${i === 0 ? 'text-align: center; width: 45px;' : ''}">${h}</th>`)
    .join('');

  const tbodyHtml = rows
    .map(
      r => `
      <tr>
        ${r
          .map(
            (c, i) =>
              `<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; ${
                i === 0 ? 'text-align: center; font-weight: bold;' : ''
              }">${c ?? '—'}</td>`
          )
          .join('')}
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} · NCF ChurchFlow</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            padding: 24px;
            margin: 0;
            background: #fff;
          }
          .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
          }
          h1 {
            margin: 0 0 6px 0;
            font-size: 20px;
            color: #0f172a;
          }
          .meta {
            font-size: 12px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
          }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 8px 12px;
            border-bottom: 2px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 10.5px;
            letter-spacing: 0.5px;
            color: #475569;
          }
          @media print {
            body { padding: 8px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NCF ChurchFlow · ${title}</h1>
          <div class="meta">
            ${metaHtml} &nbsp;|&nbsp; <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>${theadHtml}</tr>
          </thead>
          <tbody>
            ${tbodyHtml || '<tr><td colspan="' + headers.length + '" style="padding: 20px; text-align: center;">No records to display.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
