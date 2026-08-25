# Media Pipeline (v6)

## Upload flow
1. Client requests **signed URL** from `POST /api/media/upload-url` (server-side, returns S3/R2 PUT URL, TTL 5m).
2. Client PUTs the file directly to the object store — never through the API.
3. Client calls `POST /api/media` with the object key + client-declared mime + sha256.
4. Server:
   - Verifies object exists via HEAD.
   - Enqueues background job: MIME sniff (magic bytes), ClamAV scan, image transcode (WebP + AVIF), video probe (ffprobe).
   - Sets `status: pending → ready | rejected`.
5. Delivery via CDN (Cloudflare) with signed URLs for private items.

## Limits
- Images: ≤ 10 MB, max 8000×8000, transcoded to WebP + AVIF (q=80).
- Video:  ≤ 200 MB, max 10 min, HLS pack.
- Audio:  ≤ 50 MB.

## Security
- Never trust client mime. Sniff via `file-type` from the first 4 KB.
- Reject SVG unless sanitized (DOMPurify server-side).
- Strip EXIF (privacy) via `sharp().rotate().withMetadata({ exif: {} })`.
