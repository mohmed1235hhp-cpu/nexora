import { ValidationError } from "../errors/MediaError.js";
export const enforceMime = (mime: string, allow: readonly string[]): void => {
  if (!allow.includes(mime)) throw new ValidationError(`mime ${mime} not allowed`);
};
