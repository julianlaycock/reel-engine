// Generate a clean 1-page "Service Agreement" PDF (Helvetica, no deps) for the
// Documenso screen-recording demo. Byte offsets are computed so the xref is valid.
// Usage: node scripts/make-sample-pdf.mjs "C:\\Users\\julia\\Downloads\\service-agreement.pdf"
import fs from 'node:fs';

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const body = [
  'This Service Agreement (the "Agreement") is made effective as of the',
  'date of the final electronic signature below, by and between the parties',
  'identified as the Client and the Provider (together, the "Parties").',
  '',
  '1. Services. The Provider will deliver the services described in Schedule A',
  '   in a professional, workmanlike, and timely manner.',
  '',
  '2. Term. This Agreement begins on the Effective Date and continues until',
  '   the services are completed or terminated in writing by either Party.',
  '',
  '3. Fees. The Client will pay the fees set out in Schedule A within thirty',
  '   (30) days of each invoice date.',
  '',
  '4. Confidentiality. Each Party will keep the other Party non-public',
  '   information confidential and use it only to perform this Agreement.',
  '',
  '5. Governing Law. This Agreement is governed by the laws of the',
  '   jurisdiction in which the Provider is established.',
  '',
  'By signing below, the Parties agree to the terms of this Agreement.',
];

const contentLines = [
  'BT',
  '/F2 22 Tf',
  '72 772 Td',
  '(SERVICE AGREEMENT) Tj',
  '/F1 11 Tf',
  '0 -34 Td',
  '15 TL',
  ...body.map((l) => `(${esc(l)}) Tj\nT*`),
  '0 -28 Td',
  '/F2 12 Tf',
  '(Signature:) Tj',
  '0 -44 Td',
  '/F1 11 Tf',
  '(______________________________) Tj',
  '0 -34 Td',
  '/F2 12 Tf',
  '(Date:) Tj',
  '0 -38 Td',
  '/F1 11 Tf',
  '(______________________________) Tj',
  'ET',
];
const content = contentLines.join('\n');

const objs = [];
objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
objs[3] =
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>';
objs[4] = `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`;
objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
objs[6] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

let pdf = '%PDF-1.4\n';
const offsets = [];
for (let i = 1; i < objs.length; i += 1) {
  offsets[i] = Buffer.byteLength(pdf, 'latin1');
  pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`;
}
const xrefStart = Buffer.byteLength(pdf, 'latin1');
const size = objs.length; // objects 1..6 + slot 0 => size 7
pdf += `xref\n0 ${size}\n0000000000 65535 f \n`;
for (let i = 1; i < size; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

const out = process.argv[2] || 'service-agreement.pdf';
fs.writeFileSync(out, Buffer.from(pdf, 'latin1'));
console.log(`wrote ${out} (${Buffer.byteLength(pdf, 'latin1')} bytes)`);
