/**
 * @workspace/cdn — CDN URL rewriter with image transforms.
 *
 * The API stores canonical storage keys (`s3://bucket/key` or plain `/uploads/x`).
 * On read, resolve them through this helper so that flipping `CDN_BASE_URL`
 * in env moves 100% of media/static delivery to a CDN without touching any
 * business code.
 *
 * Supported transforms (Cloudflare-Images / imgix compatible parameter names —
 * the helper only appends them as query params; the CDN edge handles them):
 *   - w, h   : width, height
 *   - fit    : cover | contain | scale-down
 *   - quality: 1–100
 *   - format : auto | avif | webp | jpg
 */

export interface ImageTransform {
  w?: number;
  h?: number;
  fit?: "cover" | "contain" | "scale-down";
  quality?: number;
  format?: "auto" | "avif" | "webp" | "jpg";
}

function cdnBase(): string | null {
  const v = process.env["CDN_BASE_URL"];
  return v && v.length ? v.replace(/\/+$/, "") : null;
}

function storageBase(): string | null {
  const v = process.env["STORAGE_PUBLIC_URL"];
  return v && v.length ? v.replace(/\/+$/, "") : null;
}

/** Return a fully-qualified public URL for a storage key or origin URL. */
export function toCdnUrl(input: string | null | undefined, transform?: ImageTransform): string | null {
  if (!input) return null;

  let url = input;

  // Rewrite raw storage schemes → public origin
  const base = cdnBase() ?? storageBase();
  if (base) {
    if (url.startsWith("s3://")) {
      // s3://bucket/key → base/key
      const withoutScheme = url.slice("s3://".length);
      const slash = withoutScheme.indexOf("/");
      url = slash === -1 ? `${base}/${withoutScheme}` : `${base}/${withoutScheme.slice(slash + 1)}`;
    } else if (url.startsWith("/")) {
      url = `${base}${url}`;
    }
  }

  if (!transform || Object.keys(transform).length === 0) return url;

  const params = new URLSearchParams();
  if (transform.w) params.set("w", String(transform.w));
  if (transform.h) params.set("h", String(transform.h));
  if (transform.fit) params.set("fit", transform.fit);
  if (transform.quality) params.set("quality", String(transform.quality));
  if (transform.format) params.set("format", transform.format);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${params.toString()}`;
}

/** Build a `srcset` string for responsive images. */
export function toSrcSet(url: string | null | undefined, widths: number[], transform: Omit<ImageTransform, "w"> = {}): string {
  if (!url) return "";
  return widths
    .map((w) => `${toCdnUrl(url, { ...transform, w })} ${w}w`)
    .join(", ");
}

/** Standard responsive widths for hero / card / thumbnail images. */
export const RESPONSIVE_WIDTHS = {
  hero:      [640, 960, 1280, 1600, 2000],
  card:      [320, 480, 640, 960],
  thumbnail: [96, 160, 240],
} as const;
