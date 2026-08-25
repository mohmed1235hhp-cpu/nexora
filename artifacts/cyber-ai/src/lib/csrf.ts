/**
 * The API requires the double-submit `x-csrf-token` header on every unsafe
 * (POST/PUT/PATCH/DELETE) request once a session cookie exists — see
 * artifacts/api-server/src/middlewares/csrf.ts. Anonymous requests have no
 * session cookie yet, so the server skips the check for them; that made it
 * easy to miss in testing while logged out, but every logged-in mutation
 * that used a bare `fetch()` instead of `@workspace/api-client-react`'s
 * `customFetch` was silently failing with 403 csrf_failed.
 *
 * Spread this into a fetch() `headers` object on any POST/PUT/PATCH/DELETE
 * call: `headers: { "Content-Type": "application/json", ...csrfHeaders() }`.
 */
export function csrfHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="));
  const token = match ? decodeURIComponent(match.slice("csrf_token=".length)) : null;
  return token ? { "x-csrf-token": token } : {};
}
