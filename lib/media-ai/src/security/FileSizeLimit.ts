import { ValidationError } from "../errors/MediaError.js";
export const enforceFileSize = (size: number, maxBytes: number): void => {
  if (size > maxBytes) throw new ValidationError(`file exceeds ${maxBytes} bytes`);
};
