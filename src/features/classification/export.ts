import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { ClassificationRecord } from './types';

// ──────────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────────

function escapeCSV(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
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
      escapeCSV(new Date(record.createdAt).toISOString()),
      escapeCSV(record.label),
      String(record.confidence),
      record.isPositive ? 'Yes' : 'No',
      escapeCSV(record.source),
      escapeCSV(record.modelVersion),
      escapeCSV(record.recommendation),
    ].join(','),
  );

  return [header, ...rows].join('\n');
}

export async function exportHistoryAsCSV(records: ClassificationRecord[]) {
  const csv = buildCSV(records);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `wh-history-${timestamp}.csv`;

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

function buildPDFHTML(records: ClassificationRecord[]) {
  const totalScans = records.length;
  const positiveCount = records.filter((r) => r.isPositive).length;
  const avgConfidence =
    totalScans > 0
      ? Math.round(
          records.reduce((sum, r) => sum + r.confidence, 0) / totalScans,
        )
      : 0;

  const tableRows = records
    .map(
      (r) => `
      <tr>
        <td>${dateFormatter.format(new Date(r.createdAt))}</td>
        <td>
          <span class="badge ${r.isPositive ? 'badge-positive' : r.label === 'No Water Hyacinth' ? 'badge-negative' : 'badge-review'}">
            ${r.label}
          </span>
        </td>
        <td class="center">${r.confidence}%</td>
        <td>${r.source}</td>
        <td class="rec">${r.recommendation}</td>
      </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #152626;
      padding: 40px;
      background: #fff;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0F9F77;
    }

    .logo {
      width: 48px;
      height: 48px;
      background: #0F9F77;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 18px;
    }

    .header-text h1 {
      font-size: 22px;
      font-weight: 800;
      color: #152626;
    }

    .header-text p {
      font-size: 13px;
      color: #54706D;
      margin-top: 2px;
    }

    .summary {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat {
      background: #F6FBFA;
      border: 1px solid #D8E5E2;
      border-radius: 12px;
      padding: 14px 20px;
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: #152626;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #54706D;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th {
      background: #0F9F77;
      color: #fff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child  { border-radius: 0 8px 0 0; }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #D8E5E2;
      vertical-align: top;
    }

    tr:last-child td { border-bottom: none; }

    tr:nth-child(even) td {
      background: #F6FBFA;
    }

    .center { text-align: center; }

    .rec {
      max-width: 220px;
      color: #54706D;
      font-size: 11px;
      line-height: 1.4;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-positive { background: #FFE9E7; color: #E24A4A; }
    .badge-negative { background: #ECF8F4; color: #177A61; }
    .badge-review   { background: #FFF2DF; color: #A25B00; }

    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #D8E5E2;
      font-size: 11px;
      color: #87A09C;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WH</div>
    <div class="header-text">
      <h1>Water Hyacinth — Classification Report</h1>
      <p>Generated on ${dateFormatter.format(new Date())}</p>
    </div>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${totalScans}</div>
      <div class="stat-label">Total Scans</div>
    </div>
    <div class="stat">
      <div class="stat-value">${positiveCount}</div>
      <div class="stat-label">Likely Detections</div>
    </div>
    <div class="stat">
      <div class="stat-value">${avgConfidence}%</div>
      <div class="stat-label">Avg. Confidence</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Classification</th>
        <th class="center">Confidence</th>
        <th>Source</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    Water Hyacinth Field Classification App &bull; Confidential report
  </div>
</body>
</html>`;
}

export async function exportHistoryAsPDF(records: ClassificationRecord[]) {
  const html = buildPDFHTML(records);

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
