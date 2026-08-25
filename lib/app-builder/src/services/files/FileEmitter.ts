import type { GeneratedFile } from "../../core/types";
export class FileEmitter {
  private files: GeneratedFile[] = [];
  emit(file: GeneratedFile): void { this.files.push(file); }
  all(): GeneratedFile[] { return [...this.files]; }
  count(): number { return this.files.length; }
  clear(): void { this.files = []; }
}
export const fileEmitter = new FileEmitter();
