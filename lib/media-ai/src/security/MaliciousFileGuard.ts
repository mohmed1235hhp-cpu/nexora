// Placeholder for scan-integration; real scanner plugs behind IFileScanner.
export const suspiciousExtensions = new Set([".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi"]);
export const looksSuspicious = (filename: string): boolean => {
  const lower = filename.toLowerCase();
  for (const ext of suspiciousExtensions) if (lower.endsWith(ext)) return true;
  return false;
};
