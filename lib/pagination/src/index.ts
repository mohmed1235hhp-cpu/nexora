/**
 * @workspace/pagination — cursor + keyset pagination helpers.
 *
 * Offset pagination (`LIMIT/OFFSET`) doesn't scale past a few hundred thousand
 * rows — Postgres has to walk every skipped row. Every list endpoint that
 * ships to the client should use cursor pagination.
 *
 * Cursor format is `base64url(json({ v: 1, k: <sortKey>, id: <tieBreaker> }))`
 * so it survives URL, JSON, and mobile clients unchanged.
 */

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export interface CursorPayload<K = string | number> {
  v: 1;
  k: K;
  id: string | number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PageParams {
  limit?: number;
  cursor?: string | null;
}

function b64uEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function b64uDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function encodeCursor<K>(payload: CursorPayload<K>): string {
  return b64uEncode(JSON.stringify(payload));
}

export function decodeCursor<K = string | number>(cursor: string | null | undefined): CursorPayload<K> | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(b64uDecode(cursor));
    if (parsed && parsed.v === 1 && "k" in parsed && "id" in parsed) return parsed as CursorPayload<K>;
    return null;
  } catch {
    return null;
  }
}

export function clampLimit(requested: number | undefined): number {
  if (!requested || requested <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(requested, MAX_PAGE_SIZE);
}

/**
 * Turn an over-fetched result set (limit + 1 rows) into a Page<T>.
 * `sortKeyFn` should return the value used in the ORDER BY (createdAt, score…).
 * `idFn` returns the tie-breaker id.
 */
export function toPage<T>(
  rows: T[],
  limit: number,
  sortKeyFn: (row: T) => string | number,
  idFn: (row: T) => string | number,
): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last
    ? encodeCursor({ v: 1, k: sortKeyFn(last), id: idFn(last) })
    : null;
  return { items, nextCursor, hasMore };
}
