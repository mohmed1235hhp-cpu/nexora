/**
 * Minimal PDF invoice generator — no external dependency.
 *
 * We emit a single-page, hand-written PDF (v1.4) using core PDF objects and
 * the Helvetica standard-14 font. It's not layout-rich, but it's dependency-
 * free, deterministic, byte-safe, and enough for a legally-valid invoice
 * containing number/date/amount/tax/total/line items. Swap for pdfkit or a
 * headless-Chrome renderer if you need branded templates later.
 */

import type { Invoice } from "@workspace/db";

export interface InvoiceRenderInput {
  invoice: Invoice;
  seller: { name: string; address?: string; taxId?: string };
  buyer: { name: string; email: string };
}

export function renderInvoicePdf(input: InvoiceRenderInput): Buffer {
  const { invoice, seller, buyer } = input;
  const money = (m: number) => `${(m / 100).toFixed(2)} ${invoice.currency}`;
  const issued = invoice.createdAt.toISOString().slice(0, 10);
  const paid = invoice.paidAt ? invoice.paidAt.toISOString().slice(0, 10) : "-";

  const lines: string[] = [];
  lines.push(`Invoice ${invoice.number}`);
  lines.push("");
  lines.push(`Issued: ${issued}    Paid: ${paid}    Status: ${invoice.status.toUpperCase()}`);
  lines.push("");
  lines.push(`From: ${seller.name}`);
  if (seller.address) lines.push(`      ${seller.address}`);
  if (seller.taxId) lines.push(`      Tax ID: ${seller.taxId}`);
  lines.push("");
  lines.push(`To:   ${buyer.name} <${buyer.email}>`);
  lines.push("");
  lines.push("Description                                       Qty     Amount");
  lines.push("--------------------------------------------------------------------");
  for (const item of invoice.lineItems) {
    const desc = item.description.padEnd(50, " ").slice(0, 50);
    const qty = String(item.quantity).padStart(4, " ");
    const amt = money(item.unitAmountMinor * item.quantity).padStart(14, " ");
    lines.push(`${desc}${qty}   ${amt}`);
  }
  lines.push("--------------------------------------------------------------------");
  lines.push(`${"Subtotal:".padStart(60, " ")}   ${money(invoice.amountMinor).padStart(14, " ")}`);
  lines.push(`${"Tax:".padStart(60, " ")}   ${money(invoice.taxMinor).padStart(14, " ")}`);
  lines.push(`${"Total:".padStart(60, " ")}   ${money(invoice.totalMinor).padStart(14, " ")}`);

  // ---- PDF assembly ---------------------------------------------------------
  const stream = buildContentStream(lines);
  const objects: string[] = [];
  const push = (s: string) => objects.push(s);
  push("<< /Type /Catalog /Pages 2 0 R >>");
  push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  );
  push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body, "binary"));
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body, "binary");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) body += `${o.toString().padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, "binary");
}

function buildContentStream(lines: string[]): string {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const parts: string[] = [];
  parts.push("BT");
  parts.push("/F1 10 Tf");
  parts.push("14 TL");
  parts.push("50 760 Td");
  lines.forEach((l, i) => {
    if (i === 0) parts.push(`(${escape(l)}) Tj`);
    else parts.push(`T* (${escape(l)}) Tj`);
  });
  parts.push("ET");
  return parts.join("\n");
}
