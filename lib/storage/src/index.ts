/**
 * @workspace/storage — unified object storage adapter.
 *
 * Same interface for:
 *   - Cloudflare R2   (STORAGE_DRIVER=r2)
 *   - AWS S3          (STORAGE_DRIVER=s3)
 *   - Supabase Storage (STORAGE_DRIVER=supabase)
 *   - Local disk      (STORAGE_DRIVER=local — dev only)
 *
 * Switch providers with an env change; no application code changes.
 * Every operation returns a canonical storage key. Turn keys into public
 * URLs via `@workspace/cdn`'s `toCdnUrl()` so CDN switch is also zero-code.
 */

export interface PutOptions {
  contentType?: string;
  cacheControl?: string;
  /** Object metadata (small). */
  meta?: Record<string, string>;
  /** ACL: "public" makes the object CDN-fetchable directly. */
  acl?: "public" | "private";
}

export interface SignedUrlOptions {
  expiresInSec?: number;
  /** For upload URLs. */
  contentType?: string;
}

export interface StorageDriver {
  readonly name: string;
  put(key: string, body: Uint8Array | Buffer | Blob, opts?: PutOptions): Promise<{ key: string; etag?: string }>;
  get(key: string): Promise<Uint8Array>;
  head(key: string): Promise<{ size: number; contentType?: string; etag?: string } | null>;
  delete(key: string): Promise<void>;
  signedGetUrl(key: string, opts?: SignedUrlOptions): Promise<string>;
  signedPutUrl(key: string, opts?: SignedUrlOptions): Promise<string>;
  publicUrl(key: string): string;
}

/* ------------------------------------------------------------------ */
/* Local disk driver — dev only.                                       */
/* ------------------------------------------------------------------ */
class LocalDriver implements StorageDriver {
  readonly name = "local";
  private root: string;
  private base: string;
  constructor() {
    this.root = process.env.STORAGE_LOCAL_ROOT ?? "./.storage";
    this.base = process.env.STORAGE_PUBLIC_URL ?? "http://localhost:3000/storage";
  }
  private async fs() { return await import("node:fs/promises"); }
  private async path() { return await import("node:path"); }
  private async resolve(key: string) {
    const p = (await this.path()).default;
    const abs = p.resolve(this.root, key.replace(/^\/+/, ""));
    if (!abs.startsWith(p.resolve(this.root))) throw new Error("path traversal");
    return abs;
  }
  async put(key: string, body: Uint8Array | Buffer | Blob) {
    const fs = await this.fs();
    const p = await this.path();
    const abs = await this.resolve(key);
    await fs.mkdir(p.dirname(abs), { recursive: true });
    const buf = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : Buffer.from(body as Uint8Array);
    await fs.writeFile(abs, buf);
    return { key };
  }
  async get(key: string) {
    const fs = await this.fs();
    return new Uint8Array(await fs.readFile(await this.resolve(key)));
  }
  async head(key: string) {
    try {
      const fs = await this.fs();
      const st = await fs.stat(await this.resolve(key));
      return { size: st.size };
    } catch { return null; }
  }
  async delete(key: string) {
    const fs = await this.fs();
    await fs.unlink(await this.resolve(key)).catch(() => undefined);
  }
  async signedGetUrl(key: string) { return this.publicUrl(key); }
  async signedPutUrl(key: string) { return this.publicUrl(key); }
  publicUrl(key: string) { return `${this.base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`; }
}

/* ------------------------------------------------------------------ */
/* S3 / R2 driver — S3-compatible.                                     */
/* ------------------------------------------------------------------ */
class S3Driver implements StorageDriver {
  readonly name: string;
  private client: any = null;
  private bucket: string;
  private publicBase: string;
  private region: string;
  private endpoint?: string;

  constructor(name: "s3" | "r2") {
    this.name = name;
    this.bucket = process.env.STORAGE_BUCKET ?? "";
    this.region = process.env.STORAGE_REGION ?? "auto";
    this.endpoint = process.env.STORAGE_ENDPOINT || undefined;
    this.publicBase = process.env.STORAGE_PUBLIC_URL ?? "";
    if (!this.bucket) throw new Error("STORAGE_BUCKET is required");
  }

  private async s3(): Promise<any> {
    if (this.client) return this.client;
    // @ts-ignore optional dep
    const { S3Client } = await import("@aws-sdk/client-s3");
    this.client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: !!this.endpoint,
      credentials: process.env.STORAGE_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
            secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
          }
        : undefined,
    });
    return this.client;
  }

  async put(key: string, body: Uint8Array | Buffer | Blob, opts: PutOptions = {}) {
    // @ts-ignore optional dep
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const buf = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : Buffer.from(body as Uint8Array);
    const res = await (await this.s3()).send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buf,
      ContentType: opts.contentType,
      CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
      Metadata: opts.meta,
      ACL: opts.acl === "public" ? "public-read" : undefined,
    }));
    return { key, etag: res.ETag };
  }

  async get(key: string) {
    // @ts-ignore optional dep
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const out = await (await this.s3()).send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const c of out.Body as AsyncIterable<Uint8Array>) chunks.push(c);
    return Buffer.concat(chunks);
  }

  async head(key: string) {
    // @ts-ignore optional dep
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const r = await (await this.s3()).send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: r.ContentLength ?? 0, contentType: r.ContentType, etag: r.ETag };
    } catch { return null; }
  }

  async delete(key: string) {
    // @ts-ignore optional dep
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.s3()).send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async signedGetUrl(key: string, opts: SignedUrlOptions = {}) {
    // @ts-ignore optional dep
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    // @ts-ignore optional dep
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(await this.s3(), new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: opts.expiresInSec ?? 900,
    });
  }

  async signedPutUrl(key: string, opts: SignedUrlOptions = {}) {
    // @ts-ignore optional dep
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    // @ts-ignore optional dep
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(await this.s3(), new PutObjectCommand({
      Bucket: this.bucket, Key: key, ContentType: opts.contentType,
    }), { expiresIn: opts.expiresInSec ?? 900 });
  }

  publicUrl(key: string) {
    if (this.publicBase) return `${this.publicBase.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
    if (this.endpoint) return `${this.endpoint.replace(/\/+$/, "")}/${this.bucket}/${key}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

/* ------------------------------------------------------------------ */
/* Supabase Storage driver.                                            */
/* ------------------------------------------------------------------ */
class SupabaseDriver implements StorageDriver {
  readonly name = "supabase";
  private client: any = null;
  private bucket: string;
  private publicBase: string;
  constructor() {
    this.bucket = process.env.STORAGE_BUCKET ?? "media";
    this.publicBase = process.env.STORAGE_PUBLIC_URL ?? "";
  }
  private async sb() {
    if (this.client) return this.client;
    // @ts-ignore optional dep
    const { createClient } = await import("@supabase/supabase-js");
    this.client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    return this.client;
  }
  async put(key: string, body: Uint8Array | Buffer | Blob, opts: PutOptions = {}) {
    const c = await this.sb();
    const buf = body instanceof Blob ? body : new Blob([Buffer.from(body as Uint8Array)], { type: opts.contentType });
    const { error, data } = await c.storage.from(this.bucket).upload(key, buf, {
      contentType: opts.contentType, cacheControl: opts.cacheControl, upsert: true,
    });
    if (error) throw error;
    return { key: data.path };
  }
  async get(key: string) {
    const { data, error } = await (await this.sb()).storage.from(this.bucket).download(key);
    if (error) throw error;
    return new Uint8Array(await data.arrayBuffer());
  }
  async head(key: string) {
    const { data } = await (await this.sb()).storage.from(this.bucket).list("", { search: key });
    const file = data?.find((f: any) => f.name === key);
    return file ? { size: file.metadata?.size ?? 0, contentType: file.metadata?.mimetype } : null;
  }
  async delete(key: string) {
    await (await this.sb()).storage.from(this.bucket).remove([key]);
  }
  async signedGetUrl(key: string, opts: SignedUrlOptions = {}) {
    const { data, error } = await (await this.sb()).storage.from(this.bucket)
      .createSignedUrl(key, opts.expiresInSec ?? 900);
    if (error) throw error;
    return data.signedUrl;
  }
  async signedPutUrl(key: string, opts: SignedUrlOptions = {}) {
    const { data, error } = await (await this.sb()).storage.from(this.bucket)
      .createSignedUploadUrl(key);
    if (error) throw error;
    return data.signedUrl;
  }
  publicUrl(key: string) {
    if (this.publicBase) return `${this.publicBase.replace(/\/+$/, "")}/${key}`;
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${this.bucket}/${key}`;
  }
}

/* ------------------------------------------------------------------ */
/* Selector.                                                           */
/* ------------------------------------------------------------------ */

let _driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (_driver) return _driver;
  const which = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  _driver =
    which === "s3" ? new S3Driver("s3") :
    which === "r2" ? new S3Driver("r2") :
    which === "supabase" ? new SupabaseDriver() :
    new LocalDriver();
  return _driver;
}

export function setStorage(driver: StorageDriver): void { _driver = driver; }
