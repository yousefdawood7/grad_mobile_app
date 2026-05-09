import { Platform } from 'react-native';

import { ClassificationRecord } from './types';
import { displayConfidence } from '../../utils/confidence';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/** Safely format a date string — returns the raw input on failure. */
function safeDateFormat(
  input: string,
  formatter: Intl.DateTimeFormat,
): string {
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return input || '—';
    return formatter.format(d);
  } catch {
    return input || '—';
  }
}

/** Download a text blob on web by creating a temporary <a> element. */
function downloadBlobOnWeb(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

// ──────────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────────

function escapeCSV(value: unknown) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}



function buildCSV(records: ClassificationRecord[]) {
  const header = [
    'Date',
    'Label',
    'Confidence (%)',
    'Positive',
    'Source',
    'Model Version',
    'Recommendation',
  ].join(',');

  const rows = records.map((record) =>
    [
      escapeCSV(safeDateFormat(record.createdAt, dateFormatter)),
      escapeCSV(record.label ?? 'Unknown'),
      String(displayConfidence(record.confidence)),
      record.isPositive ? 'Yes' : 'No',
      escapeCSV(record.source ?? 'unknown'),
      escapeCSV(record.modelVersion ?? 'N/A'),
      escapeCSV(record.recommendation ?? ''),
    ].join(','),
  );

  return [header, ...rows].join('\n');
}

export async function exportHistoryAsCSV(records: ClassificationRecord[]) {
  const csv = buildCSV(records);
  const fileName = `wh-history-${timestamp()}.csv`;

  if (Platform.OS === 'web') {
    downloadBlobOnWeb(csv, fileName, 'text/csv;charset=utf-8;');
    return;
  }

  // Native path — dynamic import so web builds never touch the native module
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

  const file = new File(Paths.cache, fileName);
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  }
}

// ──────────────────────────────────────────────
// PDF Export
// ──────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const isoFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function buildPDFHTML(records: ClassificationRecord[]) {
  const totalScans = records.length;
  const positiveCount = records.filter((r) => r.isPositive).length;
  const negativeCount = records.filter(
    (r) => r.label === 'No Water Hyacinth',
  ).length;
  const reviewCount = totalScans - positiveCount - negativeCount;
  const avgConfidence =
    totalScans > 0
      ? Math.round(
          records.reduce((sum, r) => sum + displayConfidence(r.confidence), 0) /
            totalScans,
        )
      : 0;

  const tableRows = records
    .map((r, i) => {
      const conf = displayConfidence(r.confidence);
      return `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="col-num">${i + 1}</td>
        <td class="col-date">${safeDateFormat(r.createdAt, dateFormatter)}</td>
        <td>
          <span class="badge ${r.isPositive ? 'badge-positive' : r.label === 'No Water Hyacinth' ? 'badge-negative' : 'badge-review'}">
            ${r.label ?? 'Unknown'}
          </span>
        </td>
        <td class="col-conf">
          <div class="conf-wrap">
            <div class="conf-bar">
              <div class="conf-fill ${conf >= 80 ? 'fill-high' : conf >= 50 ? 'fill-mid' : 'fill-low'}" style="width:${conf}%"></div>
            </div>
            <span class="conf-num">${conf}%</span>
          </div>
        </td>
        <td class="col-source">${r.source ?? 'unknown'}</td>
        <td class="col-rec">${r.recommendation ?? ''}</td>
      </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page {
      size: A4 landscape;
      margin: 18mm 16mm;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a2e2a;
      background: #fff;
      padding: 36px 40px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Header ────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 22px;
      border-bottom: 3px solid #0d9668;
      margin-bottom: 26px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #0d9668, #06d6a0);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 900;
      font-size: 19px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(13, 150, 104, 0.3);
    }

    .header-text h1 {
      font-size: 22px;
      font-weight: 800;
      color: #152626;
      line-height: 1.2;
    }

    .header-text p {
      font-size: 12px;
      color: #6b8a84;
      margin-top: 3px;
      font-weight: 500;
    }

    .header-right {
      text-align: right;
      font-size: 11px;
      color: #6b8a84;
      line-height: 1.6;
    }

    .header-right strong {
      color: #1a2e2a;
    }

    /* ── Stats Grid ────────────────────────── */
    .stats {
      display: flex;
      gap: 14px;
      margin-bottom: 26px;
    }

    .stat-card {
      flex: 1;
      border-radius: 14px;
      padding: 16px 20px;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      opacity: 0.08;
      border-radius: 14px;
    }

    .stat-total  { background: #eef9f5; border: 1.5px solid #c8ece0; }
    .stat-detect { background: #fef3f2; border: 1.5px solid #fcd5d1; }
    .stat-clear  { background: #eef9f5; border: 1.5px solid #c8ece0; }
    .stat-avg    { background: #f0f4ff; border: 1.5px solid #d0d9f5; }

    .stat-value {
      font-size: 30px;
      font-weight: 900;
      line-height: 1;
    }

    .stat-total  .stat-value { color: #0d9668; }
    .stat-detect .stat-value { color: #e24a4a; }
    .stat-clear  .stat-value { color: #177a61; }
    .stat-avg    .stat-value { color: #4361ee; }

    .stat-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #6b8a84;
      margin-top: 6px;
    }

    /* ── Table ─────────────────────────────── */
    .table-section h2 {
      font-size: 15px;
      font-weight: 800;
      color: #152626;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .table-section h2::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 18px;
      background: linear-gradient(180deg, #0d9668, #06d6a0);
      border-radius: 2px;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 12px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    thead th {
      background: #0d9668;
      color: #fff;
      font-weight: 700;
      text-align: left;
      padding: 11px 14px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      white-space: nowrap;
    }

    thead th:first-child { border-radius: 12px 0 0 0; }
    thead th:last-child  { border-radius: 0 12px 0 0; }

    td {
      padding: 10px 14px;
      border-bottom: 1px solid #e8efed;
      vertical-align: middle;
    }

    .row-even td { background: #fff; }
    .row-odd  td { background: #f8fbfa; }

    tr:last-child td { border-bottom: none; }
    tr:last-child td:first-child { border-radius: 0 0 0 12px; }
    tr:last-child td:last-child  { border-radius: 0 0 12px 0; }

    .col-num {
      color: #a0b4b0;
      font-weight: 700;
      font-size: 11px;
      text-align: center;
      width: 30px;
    }

    .col-date {
      white-space: nowrap;
      font-weight: 600;
      color: #2d4a44;
    }

    .col-source {
      text-transform: capitalize;
      font-weight: 600;
      color: #5a7a74;
    }

    .col-rec {
      max-width: 240px;
      color: #5a7a74;
      font-size: 11px;
      line-height: 1.45;
    }

    /* ── Confidence Bar ────────────────────── */
    .col-conf { width: 120px; }

    .conf-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .conf-bar {
      flex: 1;
      height: 7px;
      background: #e8efed;
      border-radius: 4px;
      overflow: hidden;
    }

    .conf-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }

    .fill-high { background: linear-gradient(90deg, #0d9668, #06d6a0); }
    .fill-mid  { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-low  { background: linear-gradient(90deg, #e24a4a, #f87171); }

    .conf-num {
      font-weight: 800;
      font-size: 12px;
      color: #1a2e2a;
      min-width: 36px;
      text-align: right;
    }

    /* ── Badges ────────────────────────────── */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-positive { background: #fef3f2; color: #dc2626; border: 1px solid #fcd5d1; }
    .badge-negative { background: #eef9f5; color: #177a61; border: 1px solid #c8ece0; }
    .badge-review   { background: #fff8ed; color: #b45309; border: 1px solid #fde3a7; }

    /* ── Footer ────────────────────────────── */
    .footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1.5px solid #e0ebe8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94aba6;
    }

    .footer-left { font-weight: 600; }
    .footer-right { font-style: italic; }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="logo">WH</div>
      <div class="header-text">
        <h1>Water Hyacinth — Classification Report</h1>
        <p>Automated Detection & Monitoring Summary</p>
      </div>
    </div>
    <div class="header-right">
      <strong>Report generated</strong><br />
      ${dateFormatter.format(new Date())}
    </div>
  </div>

  <div class="stats">
    <div class="stat-card stat-total">
      <div class="stat-value">${totalScans}</div>
      <div class="stat-label">Total Scans</div>
    </div>
    <div class="stat-card stat-detect">
      <div class="stat-value">${positiveCount}</div>
      <div class="stat-label">Likely Detections</div>
    </div>
    <div class="stat-card stat-clear">
      <div class="stat-value">${negativeCount}</div>
      <div class="stat-label">Clear</div>
    </div>
    <div class="stat-card stat-avg">
      <div class="stat-value">${avgConfidence}%</div>
      <div class="stat-label">Avg Confidence</div>
    </div>
  </div>

  <div class="table-section">
    <h2>Classification Details</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Classification</th>
          <th>Confidence</th>
          <th>Source</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span class="footer-left">Water Hyacinth Field Classification App</span>
    <span class="footer-right">Confidential — ${new Date().getFullYear()}</span>
  </div>

</body>
</html>`;
}

export async function exportHistoryAsPDF(records: ClassificationRecord[]) {
  const html = buildPDFHTML(records);

  if (Platform.OS === 'web') {
    // On web, open a new window with the HTML and trigger the browser print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();

      // Give the browser a moment to render styles before printing
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      // Fallback: if onload doesn't fire (already loaded)
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 400);
    } else {
      // Popup blocked — fallback: download as HTML
      downloadBlobOnWeb(html, `wh-report-${timestamp()}.html`, 'text/html');
    }
    return;
  }

  // Native path
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  }
}
