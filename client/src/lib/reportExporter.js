import { formatIDR } from './utils';

/* ===================================================================
   BAROKAH SHOES — MULTI-FORMAT REPORT EXPORT ENGINE
   Supports real client-side file generation & download for:
   - PDF (.pdf)          : Native PDF-1.4 binary generator (A4 Portrait)
   - Excel (.xlsx)       : Native Office Open XML ZIP workbook (Multi-sheet)
   - CSV (.csv)          : UTF-8 with BOM spreadsheet data
   - Word (.doc)         : Official Atelier Ledger Word document
   - JSON (.json)        : Structured raw analytics backup
   - Print A4            : Browser print / Save as PDF ledger
   =================================================================== */

// ── 1. CRC-32 & Uncompressed ZIP Builder for Real .xlsx Generation ──
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZipBuffer(files) {
  const encoder = new TextEncoder();
  const entries = files.map(f => {
    const nameBytes = encoder.encode(f.name);
    const dataBytes = typeof f.content === 'string' ? encoder.encode(f.content) : f.content;
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  let localSize = 0;
  let centralSize = 0;
  entries.forEach(e => {
    localSize += 30 + e.nameBytes.length + e.dataBytes.length;
    centralSize += 46 + e.nameBytes.length;
  });

  const totalSize = localSize + centralSize + 22;
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);
  let offset = 0;

  entries.forEach(e => {
    e.localOffset = offset;
    view.setUint32(offset, 0x04034b50, true); // Local file header signature
    view.setUint16(offset + 4, 20, true);     // Version needed to extract
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(offset + 8, 0, true);      // Compression method (0 = Store)
    view.setUint16(offset + 10, 0, true);     // Mod time
    view.setUint16(offset + 12, 0x5421, true);// Mod date
    view.setUint32(offset + 14, e.crc, true); // CRC-32
    view.setUint32(offset + 18, e.dataBytes.length, true); // Compressed size
    view.setUint32(offset + 22, e.dataBytes.length, true); // Uncompressed size
    view.setUint16(offset + 26, e.nameBytes.length, true); // File name length
    view.setUint16(offset + 28, 0, true);     // Extra field length
    buf.set(e.nameBytes, offset + 30);
    buf.set(e.dataBytes, offset + 30 + e.nameBytes.length);
    offset += 30 + e.nameBytes.length + e.dataBytes.length;
  });

  const centralStart = offset;
  entries.forEach(e => {
    view.setUint32(offset, 0x02014b50, true); // Central directory file header signature
    view.setUint16(offset + 4, 20, true);     // Version made by
    view.setUint16(offset + 6, 20, true);     // Version needed
    view.setUint16(offset + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(offset + 10, 0, true);     // Compression method
    view.setUint16(offset + 12, 0, true);     // Mod time
    view.setUint16(offset + 14, 0x5421, true);// Mod date
    view.setUint32(offset + 16, e.crc, true); // CRC-32
    view.setUint32(offset + 20, e.dataBytes.length, true);
    view.setUint32(offset + 24, e.dataBytes.length, true);
    view.setUint16(offset + 28, e.nameBytes.length, true);
    view.setUint16(offset + 30, 0, true);     // Extra field length
    view.setUint16(offset + 32, 0, true);     // File comment length
    view.setUint16(offset + 34, 0, true);     // Disk number start
    view.setUint16(offset + 36, 0, true);     // Internal file attributes
    view.setUint32(offset + 38, 0, true);     // External file attributes
    view.setUint32(offset + 42, e.localOffset, true);
    buf.set(e.nameBytes, offset + 46);
    offset += 46 + e.nameBytes.length;
  });

  const centralEnd = offset;
  view.setUint32(offset, 0x06054b50, true); // End of central directory signature
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, entries.length, true);
  view.setUint16(offset + 10, entries.length, true);
  view.setUint32(offset + 12, centralEnd - centralStart, true);
  view.setUint32(offset + 16, centralStart, true);
  view.setUint16(offset + 20, 0, true);

  return buf;
}

function escapeXml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colIndexToLetter(idx) {
  let s = '';
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function buildWorksheetXml(rows, colWidths = []) {
  const colsXml = colWidths.length > 0
    ? `<cols>${colWidths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const rowsXml = rows.map((row, rIdx) => {
    const rowNum = rIdx + 1;
    const cells = Array.isArray(row) ? row : (row.cells || []);
    const rowHeight = row.height ? ` ht="${row.height}" customHeight="1"` : '';
    const cellsXml = cells.map((cell, cIdx) => {
      const ref = `${colIndexToLetter(cIdx)}${rowNum}`;
      const val = cell && typeof cell === 'object' ? cell.v : cell;
      const styleIdx = cell && typeof cell === 'object' && cell.s != null ? cell.s : 0;
      if (val === null || val === undefined || val === '') {
        return `<c r="${ref}" s="${styleIdx}"/>`;
      }
      if (typeof val === 'number' && !Number.isNaN(val)) {
        return `<c r="${ref}" s="${styleIdx}"><v>${val}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr" s="${styleIdx}"><is><t>${escapeXml(val)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNum}"${rowHeight}>${cellsXml}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

export function generateXlsxBlob(sheets) {
  // Styles:
  // 0 = Normal
  // 1 = Title (14pt Bold)
  // 2 = Subtitle / Muted (10pt)
  // 3 = Table Header (Dark Navy fill #0F172A, White Bold text)
  // 4 = Data Cell with border
  // 5 = Bold Data / Total Cell with border & light fill (#F1F5F9)
  // 6 = Currency Cell with border (#,##0)
  // 7 = Bold Currency Total Cell (#,##0, light fill)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;Rp &quot;#,##0"/>
  </numFmts>
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF080808"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="3" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((s, i) => `<sheet name="${escapeXml(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const files = [
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: stylesXml },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      content: buildWorksheetXml(s.rows, s.colWidths || [24, 22, 18, 20, 18, 18])
    }))
  ];

  const zipBytes = createZipBuffer(files);
  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

// ── 2. Native PDF-1.4 Binary Generator (A4 Official Atelier Ledger) ──
function pdfEscape(text) {
  return String(text ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncateText(text, maxChars) {
  const s = String(text ?? '').replace(/[^\x20-\x7E]/g, ' ').trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, Math.max(0, maxChars - 3)) + '...';
}

export function generatePdfBlob(reportConfig) {
  const {
    title = 'LAPORAN ANALITIK & OPERASIONAL TOKO',
    docNumber = `BKH-RPT/${new Date().getFullYear()}/01`,
    periodLabel = 'Periode Berjalan',
    kpis = [],
    sections = []
  } = reportConfig;

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;

  const pages = [];
  let cmds = [];
  let y = pageHeight - 36;

  const startNewPage = () => {
    if (cmds.length > 0) pages.push(cmds.join('\n'));
    cmds = [];
    y = pageHeight - 40;
  };

  const ensureSpace = (neededHeight) => {
    if (y - neededHeight < 55) {
      startNewPage();
    }
  };

  const drawRect = (x, rectY, w, h, fillRgb, strokeRgb, lineWidth = 0.75) => {
    cmds.push('q');
    if (fillRgb) cmds.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg`);
    if (strokeRgb) {
      cmds.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
      cmds.push(`${lineWidth} w`);
    }
    const op = fillRgb && strokeRgb ? 'B' : fillRgb ? 'f' : 'S';
    cmds.push(`${x.toFixed(2)} ${rectY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
    cmds.push('Q');
  };

  const drawLine = (x1, y1, x2, y2, strokeRgb = [0.05, 0.05, 0.05], lineWidth = 0.75) => {
    cmds.push('q');
    cmds.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG ${lineWidth} w`);
    cmds.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    cmds.push('Q');
  };

  const drawText = (text, x, textY, { font = 'F1', size = 9, color = [0.06, 0.09, 0.16] } = {}) => {
    cmds.push('BT');
    cmds.push(`/${font} ${size} Tf`);
    cmds.push(`${color[0]} ${color[1]} ${color[2]} rg`);
    cmds.push(`${x.toFixed(2)} ${textY.toFixed(2)} Td (${pdfEscape(text)}) Tj`);
    cmds.push('ET');
  };

  // ── Header / Kop Surat Toko Barokah Shoes ──
  // Black Brand Emblem Box
  drawRect(marginX, y - 36, 36, 36, [0.03, 0.03, 0.03], null);
  drawText('B', marginX + 11, y - 25, { font: 'F2', size: 21, color: [0.82, 0.95, 0.18] });

  drawText('TOKO BAROKAH SHOES', marginX + 46, y - 11, { font: 'F2', size: 14.5, color: [0.03, 0.03, 0.03] });
  drawText('KINETIC LUXURY STREETWEAR & FOOTWEAR ATELIER', marginX + 46, y - 22, { font: 'F4', size: 7.2, color: [0.2, 0.25, 0.33] });
  drawText('Pasar Jaya Jatinegara Lt.2 Blok AKS No. 57, Jakarta Timur 13310 | WA: 081288667433', marginX + 46, y - 32, { font: 'F1', size: 7.2, color: [0.35, 0.4, 0.48] });

  // Right Document Meta
  const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  drawText('LAPORAN RESMI TOKO', pageWidth - marginX - 145, y - 11, { font: 'F2', size: 9.5, color: [0.03, 0.03, 0.03] });
  drawText(`NO: ${docNumber}`, pageWidth - marginX - 145, y - 22, { font: 'F3', size: 7.2, color: [0.25, 0.3, 0.38] });
  drawText(`TGL: ${dateStr}, ${timeStr}`, pageWidth - marginX - 145, y - 32, { font: 'F3', size: 7.2, color: [0.25, 0.3, 0.38] });

  y -= 42;
  drawLine(marginX, y, pageWidth - marginX, y, [0.03, 0.03, 0.03], 1.6);
  drawLine(marginX, y - 2.2, pageWidth - marginX, y - 2.2, [0.03, 0.03, 0.03], 0.5);
  y -= 12;

  // Title & Period Banner
  drawRect(marginX, y - 25, contentWidth, 25, [0.96, 0.97, 0.99], [0.82, 0.86, 0.91], 0.7);
  drawText(title.toUpperCase(), marginX + 10, y - 11, { font: 'F2', size: 9.5, color: [0.06, 0.09, 0.16] });
  drawText(`Periode Laporan: ${periodLabel}   |   Status Data: Terverifikasi (Real-Time Database)`, marginX + 10, y - 21, { font: 'F1', size: 7.2, color: [0.02, 0.47, 0.34] });
  y -= 34;

  // ── 4 KPI Summary Cards ──
  if (kpis.length > 0) {
    const boxGap = 8;
    const cols = Math.min(kpis.length, 4);
    const boxW = (contentWidth - boxGap * (cols - 1)) / cols;
    const boxH = 42;

    kpis.slice(0, 4).forEach((kpi, idx) => {
      const bx = marginX + idx * (boxW + boxGap);
      drawRect(bx, y - boxH, boxW, boxH, [0.99, 0.99, 1.0], [0.12, 0.16, 0.23], 0.75);
      drawRect(bx, y - 3.5, boxW, 3.5, [0.06, 0.09, 0.16], null);
      drawText(truncateText(kpi.label, 24).toUpperCase(), bx + 8, y - 14, { font: 'F4', size: 6.5, color: [0.39, 0.45, 0.55] });
      drawText(truncateText(kpi.value, 22), bx + 8, y - 27, { font: 'F2', size: 10, color: [0.03, 0.03, 0.03] });
      drawText(truncateText(kpi.sub || '', 28), bx + 8, y - 37, { font: 'F1', size: 6.5, color: [0.02, 0.55, 0.38] });
    });

    y -= boxH + 14;
  }

  // ── Dynamic Table Sections ──
  sections.forEach((sec) => {
    const headers = sec.headers || [];
    const rows = sec.rows || [];
    const colRatios = sec.colRatios || headers.map(() => 1 / Math.max(headers.length, 1));
    const totalRatio = colRatios.reduce((a, b) => a + b, 0) || 1;
    const colWidths = colRatios.map(r => (r / totalRatio) * contentWidth);

    ensureSpace(50);

    // Section Title
    drawText(sec.title.toUpperCase(), marginX, y - 9, { font: 'F2', size: 9, color: [0.06, 0.09, 0.16] });
    if (sec.subtitle) {
      drawText(sec.subtitle, pageWidth - marginX - 180, y - 9, { font: 'F1', size: 7.2, color: [0.39, 0.45, 0.55] });
    }
    y -= 13;

    // Table Header Row
    const headerH = 16;
    drawRect(marginX, y - headerH, contentWidth, headerH, [0.06, 0.09, 0.16], [0.06, 0.09, 0.16], 0.6);
    let cx = marginX;
    headers.forEach((h, i) => {
      const maxChars = Math.max(4, Math.floor(colWidths[i] / 4.6));
      drawText(truncateText(h, maxChars).toUpperCase(), cx + 6, y - 11, { font: 'F2', size: 6.8, color: [1, 1, 1] });
      cx += colWidths[i];
    });
    y -= headerH;

    // Table Data Rows
    const rowH = 14.5;
    rows.forEach((row, rIdx) => {
      ensureSpace(rowH + 8);
      const fill = rIdx % 2 === 0 ? [1, 1, 1] : [0.97, 0.98, 0.99];
      drawRect(marginX, y - rowH, contentWidth, rowH, fill, [0.85, 0.88, 0.92], 0.45);
      let rx = marginX;
      row.forEach((cellVal, cIdx) => {
        const w = colWidths[cIdx] || 60;
        if (cIdx > 0) {
          drawLine(rx, y, rx, y - rowH, [0.88, 0.91, 0.94], 0.4);
        }
        const maxChars = Math.max(4, Math.floor(w / 4.5));
        drawText(truncateText(cellVal, maxChars), rx + 6, y - 10, {
          font: cIdx === 0 || cIdx === row.length - 1 ? 'F2' : 'F1',
          size: 7.2,
          color: [0.08, 0.1, 0.15]
        });
        rx += w;
      });
      y -= rowH;
    });

    // Optional Footer Row
    if (sec.footerRow) {
      ensureSpace(rowH + 8);
      drawRect(marginX, y - rowH, contentWidth, rowH, [0.93, 0.95, 0.98], [0.06, 0.09, 0.16], 0.75);
      let fx = marginX;
      sec.footerRow.forEach((cellVal, cIdx) => {
        const w = colWidths[cIdx] || 60;
        const maxChars = Math.max(4, Math.floor(w / 4.5));
        drawText(truncateText(cellVal, maxChars), fx + 6, y - 10, {
          font: 'F2',
          size: 7.3,
          color: [0.03, 0.03, 0.03]
        });
        fx += w;
      });
      y -= rowH;
    }

    y -= 13;
  });

  // ── Signature Block: ONLY Pemilik / Owner Toko Barokah Shoes ──
  ensureSpace(85);
  y -= 6;

  const rightSigX = pageWidth - marginX - 165;
  drawText(`Jakarta, ${dateStr}`, rightSigX, y - 4, { font: 'F1', size: 8, color: [0.25, 0.3, 0.38] });
  drawText('Pemilik / Owner Toko Barokah Shoes', rightSigX, y - 15, { font: 'F2', size: 8, color: [0.06, 0.09, 0.16] });
  drawLine(rightSigX, y - 56, rightSigX + 155, y - 56, [0.06, 0.09, 0.16], 0.9);
  drawText('Nano Kantiono', rightSigX, y - 67, { font: 'F2', size: 8.5, color: [0.03, 0.03, 0.03] });
  drawText('Owner Toko Barokah Shoes', rightSigX, y - 76, { font: 'F1', size: 7.2, color: [0.39, 0.45, 0.55] });

  // Footer note
  drawLine(marginX, 36, pageWidth - marginX, 36, [0.85, 0.88, 0.92], 0.5);
  drawText('Sistem Informasi Manajemen Toko Barokah Shoes — Laporan Resmi Terverifikasi', marginX, 25, {
    font: 'F3',
    size: 6.8,
    color: [0.45, 0.5, 0.58]
  });

  pages.push(cmds.join('\n'));

  // ── Assemble PDF-1.4 Object Tree ──
  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length;
  };

  const font1Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const font2Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const font3Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const font4Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>');

  const pagesRootId = addObj(''); // placeholder for /Pages
  const pageIds = [];

  pages.forEach((streamContent) => {
    const streamId = addObj(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesRootId} 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] ` +
      `/Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R /F3 ${font3Id} 0 R /F4 ${font4Id} 0 R >> >> ` +
      `/Contents ${streamId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesRootId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesRootId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((objBody, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${objBody}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

// ── 3. Word Document (.doc) Generator ──────────────────────────────
export function generateWordBlob(reportConfig) {
  const {
    title = 'LAPORAN ANALITIK & OPERASIONAL TOKO',
    docNumber = `BKH-RPT/${new Date().getFullYear()}/01`,
    periodLabel = 'Periode Berjalan',
    kpis = [],
    sections = []
  } = reportConfig;

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const kpiCells = kpis.map(k => `
    <td style="width:25%; border:1px solid #0f172a; padding:10px; background:#f8fafc;">
      <div style="font-size:8pt; color:#64748b; font-weight:bold; text-transform:uppercase;">${escapeXml(k.label)}</div>
      <div style="font-size:13pt; color:#0f172a; font-weight:bold; margin:4px 0;">${escapeXml(k.value)}</div>
      <div style="font-size:8pt; color:#059669;">${escapeXml(k.sub || '')}</div>
    </td>
  `).join('');

  const sectionsHtml = sections.map(sec => `
    <h3 style="font-size:10.5pt; color:#0f172a; text-transform:uppercase; margin:18px 0 6px 0; border-bottom:1px solid #cbd5e1; padding-bottom:4px;">
      ${escapeXml(sec.title)}
    </h3>
    <table style="width:100%; border-collapse:collapse; font-size:9pt; margin-bottom:14px;">
      <thead>
        <tr style="background:#0f172a; color:#ffffff;">
          ${(sec.headers || []).map(h => `<th style="border:1px solid #0f172a; padding:6px 8px; text-align:left;">${escapeXml(h)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${(sec.rows || []).map((row, idx) => `
          <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            ${row.map(c => `<td style="border:1px solid #cbd5e1; padding:5px 8px;">${escapeXml(c)}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
      ${sec.footerRow ? `
        <tfoot>
          <tr style="background:#f1f5f9; font-weight:bold;">
            ${sec.footerRow.map(c => `<td style="border:1px solid #0f172a; padding:6px 8px;">${escapeXml(c)}</td>`).join('')}
          </tr>
        </tfoot>
      ` : ''}
    </table>
  `).join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; font-size: 10pt; }
  </style>
</head>
<body>
  <table style="width:100%; border-bottom:3px double #080808; padding-bottom:10px; margin-bottom:14px;">
    <tr>
      <td>
        <div style="font-size:16pt; font-weight:bold; color:#080808;">TOKO BAROKAH SHOES</div>
        <div style="font-size:8.5pt; font-weight:bold; color:#334155;">KINETIC LUXURY STREETWEAR &amp; FOOTWEAR ATELIER</div>
        <div style="font-size:8pt; color:#475569;">Pasar Jaya Jatinegara Lt.2 Blok AKS No. 57, Jakarta Timur 13310 | WA: 081288667433</div>
      </td>
      <td style="text-align:right;">
        <div style="font-size:11pt; font-weight:bold;">${escapeXml(title)}</div>
        <div style="font-size:8pt; color:#475569;">No. Dokumen: <b>${escapeXml(docNumber)}</b></div>
        <div style="font-size:8pt; color:#475569;">Periode: <b>${escapeXml(periodLabel)}</b> | Tanggal: ${escapeXml(dateStr)}</div>
      </td>
    </tr>
  </table>
  <table style="width:100%; border-collapse:separate; border-spacing:6px; margin-bottom:14px;">
    <tr>${kpiCells}</tr>
  </table>
  ${sectionsHtml}
  <table style="width:100%; margin-top:24px; font-size:9.5pt;">
    <tr>
      <td style="width:62%;"></td>
      <td style="width:38%; text-align:center;">
        <div>Jakarta, ${escapeXml(dateStr)}</div>
        <div style="font-weight:bold; margin-top:2px;">Pemilik / Owner Toko Barokah Shoes</div>
        <br/><br/><br/>
        <div style="font-weight:bold; text-decoration:underline;">Nano Kantiono</div>
        <div style="font-size:8pt; color:#64748b;">Owner Toko Barokah Shoes</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return new Blob(['\uFEFF', html], { type: 'application/msword;charset=utf-8' });
}

// ── 4. CSV (.csv) Generator with UTF-8 BOM ─────────────────────────
export function generateCsvBlob(reportConfig) {
  const {
    title = 'LAPORAN ANALITIK & OPERASIONAL TOKO',
    docNumber = '',
    periodLabel = '',
    kpis = [],
    sections = []
  } = reportConfig;

  const escapeCsvCell = (val) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [];
  lines.push([escapeCsvCell('TOKO BAROKAH SHOES - ' + title)].join(','));
  lines.push([escapeCsvCell(`No Dokumen: ${docNumber}`), escapeCsvCell(`Periode: ${periodLabel}`), escapeCsvCell(`Dicetak: ${new Date().toLocaleString('id-ID')}`)].join(','));
  lines.push('');

  if (kpis.length > 0) {
    lines.push([escapeCsvCell('INDIKATOR KPI'), escapeCsvCell('NILAI'), escapeCsvCell('KETERANGAN')].join(','));
    kpis.forEach(k => {
      lines.push([escapeCsvCell(k.label), escapeCsvCell(k.value), escapeCsvCell(k.sub || '')].join(','));
    });
    lines.push('');
  }

  sections.forEach(sec => {
    lines.push([escapeCsvCell(sec.title.toUpperCase())].join(','));
    if (sec.headers) {
      lines.push(sec.headers.map(escapeCsvCell).join(','));
    }
    (sec.rows || []).forEach(r => {
      lines.push(r.map(escapeCsvCell).join(','));
    });
    if (sec.footerRow) {
      lines.push(sec.footerRow.map(escapeCsvCell).join(','));
    }
    lines.push('');
  });

  return new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
}

// ── 5. Trigger Browser Download Helper ─────────────────────────────
export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ── 6. Single Order Receipt / Invoice PDF Download ─────────────────
export function exportOrderReceiptPdf(order) {
  const orderNo = order.order_number || 'BKH-ORD';
  const items = order.items && order.items.length > 0
    ? order.items
    : [{
        product_name: order.product_name || 'Barokah Signature Footwear',
        size: order.size || '42',
        quantity: order.qty || 1,
        unit_price: order.total_amount || 0,
        line_total: order.total_amount || 0
      }];

  const blob = generatePdfBlob({
    title: `INVOICE & STRUK PESANAN #${orderNo}`,
    docNumber: `INV/${new Date().getFullYear()}/${orderNo}`,
    periodLabel: `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
    kpis: [
      { label: 'NO. PESANAN', value: `#${orderNo}`, sub: 'Terdaftar di Sistem' },
      { label: 'PELANGGAN', value: order.recipient_name || 'Pelanggan', sub: order.phone_number || '-' },
      { label: 'METODE BAYAR', value: order.payment_method || 'Transfer / QRIS', sub: (order.payment_status || 'lunas').toUpperCase() },
      { label: 'TOTAL TAGIHAN', value: formatIDR(order.total_amount || 0), sub: `Status: ${(order.status || 'diproses').toUpperCase()}` }
    ],
    sections: [
      {
        title: 'Rincian Item Sepatu yang Dipesan',
        headers: ['No', 'Nama Produk / Siluet', 'Ukuran (EU)', 'Qty', 'Harga Satuan', 'Subtotal'],
        colRatios: [0.07, 0.38, 0.13, 0.10, 0.16, 0.16],
        rows: items.map((it, idx) => [
          String(idx + 1),
          it.product_name || 'Sepatu Barokah',
          `EU ${it.size || '42'}`,
          `${it.quantity || 1} prs`,
          formatIDR(it.unit_price || order.total_amount || 0),
          formatIDR(it.line_total || order.total_amount || 0)
        ]),
        footerRow: [
          '',
          'TOTAL PEMBAYARAN PESANAN',
          '',
          `${items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)} prs`,
          '',
          formatIDR(order.total_amount || 0)
        ]
      }
    ]
  });

  triggerBlobDownload(blob, `Struk_Pesanan_${orderNo}.pdf`);
}

