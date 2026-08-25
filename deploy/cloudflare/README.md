# Cloudflare deployment notes

The app is already CDN-ready — no code change needed to sit behind Cloudflare.

## Zone-level settings

- **Caching**: Standard.
- **Cache rules**:
  - `/uploads/*` and `/_media/*` — Cache Everything, Edge TTL 30d.
  - `/api/*` — Bypass Cache (except `/api/public/*` for public read-only).
  - `/assets/*`, `/_next/*`, `*.{js,css,woff2,svg,png,jpg,webp,avif}` — Cache Everything, Edge TTL 30d.
- **Speed → Auto Minify**: HTML/CSS/JS on.
- **Speed → Brotli**: on.
- **Speed → Early Hints**: on.

## Security

- **WAF Managed Rules**: enable "Cloudflare Managed Ruleset" and "OWASP Core Ruleset".
- **Bot Fight Mode** → Super Bot Fight Mode. Allow verified bots.
- **Rate Limiting Rules** (Cloudflare):
  - `POST /api/auth/*` — 20 req / 1m per IP.
  - `POST /api/ai/*`  — 30 req / 1m per IP.
  - `GET  /api/*`     — 300 req / 1m per IP.
- **Transform Rules → Add HTTP Response Headers**:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **Trusted IPs**: origin only accepts Cloudflare IP ranges (see https://www.cloudflare.com/ips/).

## Origin config

The origin server (nginx or the API directly) must:

- Read `CF-Connecting-IP` for real client IP (already handled — nginx `real_ip_header`).
- Return `Cache-Control` correctly on `/uploads/*` (the app sets `public, max-age=31536000, immutable`).

## Environment

```env
# Public URL that the CDN serves — used by @workspace/cdn to rewrite storage keys.
CDN_BASE_URL=https://cdn.cyberai.example
STORAGE_PUBLIC_URL=https://cdn.cyberai.example
```

## R2 as object storage (recommended)

```env
STORAGE_DRIVER=r2
STORAGE_BUCKET=cyberai-prod
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
STORAGE_PUBLIC_URL=https://cdn.cyberai.example  # public R2 bucket / custom domain
```
