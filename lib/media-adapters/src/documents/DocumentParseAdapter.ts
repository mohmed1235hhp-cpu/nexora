import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import type {
  AdapterContext,
  DocumentParseInput,
  DocumentParseOutput,
  IMediaAdapter,
} from "@workspace/media-core";

export class DocumentParseAdapter
  implements IMediaAdapter<DocumentParseInput, DocumentParseOutput>
{
  readonly meta = {
    id: "local-document-parser",
    provider: "local" as const,
    kind: "document" as const,
    qualityTier: "cheap" as const,
    capabilities: ["pdf", "docx", "xlsx", "csv", "txt"],
  };

  async execute(input: DocumentParseInput, ctx: AdapterContext): Promise<DocumentParseOutput> {
    const res = await fetch(input.fileUrl, { signal: ctx.signal });
    if (!res.ok) throw new Error(`document fetch failed [${res.status}]`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = input.mimeType.toLowerCase();

    if (mime === "application/pdf") {
      const parsed = await pdfParse(buf);
      return { provider: "local", text: parsed.text, pages: parsed.numpages, metadata: parsed.info as Record<string, unknown> };
    }
    if (mime.includes("word") || mime.endsWith("docx")) {
      const { value, messages } = await mammoth.extractRawText({ buffer: buf });
      return { provider: "local", text: value, metadata: { warnings: messages.map((m) => m.message) } };
    }
    if (mime.includes("sheet") || mime.endsWith("xlsx") || mime.endsWith("csv")) {
      const wb = XLSX.read(buf, { type: "buffer" });
      const text = wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n]!)).join("\n\n");
      return { provider: "local", text, metadata: { sheets: wb.SheetNames } };
    }
    if (mime.startsWith("text/")) {
      return { provider: "local", text: buf.toString("utf8") };
    }
    throw new Error(`unsupported mime: ${input.mimeType}`);
  }

  async estimateCost() {
    return { currency: "USD" as const, estimated: 0 };
  }

  async healthCheck() {
    return { ok: true, latencyMs: 0 };
  }
}
