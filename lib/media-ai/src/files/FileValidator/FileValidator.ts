// Files / FileValidator — service (provider-agnostic; wire through the router)
import type { FileValidatorRequest, FileValidatorResponse } from "./FileValidatorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface FileValidatorHandler {
  handle(req: FileValidatorRequest): Promise<FileValidatorResponse>;
}
export class FileValidatorService implements FileValidatorHandler {
  constructor(private readonly handler?: FileValidatorHandler) {}
  async handle(req: FileValidatorRequest): Promise<FileValidatorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "FileValidator handler is not wired");
    return this.handler.handle(req);
  }
}
