import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  AdapterContext,
  IMediaAdapter,
  UploadInput,
  UploadOutput,
} from "@workspace/media-core";

export class S3StorageAdapter implements IMediaAdapter<UploadInput, UploadOutput> {
  readonly meta = {
    id: "aws-s3",
    provider: "aws" as const,
    kind: "storage" as const,
    qualityTier: "flagship" as const,
    capabilities: ["presigned-put", "presigned-get"],
  };

  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(
    opts: {
      region?: string;
      bucket?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    } = {},
  ) {
    this.bucket = opts.bucket ?? process.env["AWS_S3_BUCKET"] ?? "";
    const region = opts.region ?? process.env["AWS_REGION"] ?? "us-east-1";
    const accessKeyId = opts.accessKeyId ?? process.env["AWS_ACCESS_KEY_ID"];
    const secretAccessKey = opts.secretAccessKey ?? process.env["AWS_SECRET_ACCESS_KEY"];
    this.client = new S3Client({
      region,
      credentials:
        accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async execute(input: UploadInput, _ctx: AdapterContext): Promise<UploadOutput> {
    if (!this.bucket) throw new Error("AWS_S3_BUCKET missing");
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.client, cmd, { expiresIn: 900 });
    return {
      uploadUrl,
      method: "PUT",
      key: input.key,
      publicUrl: `https://${this.bucket}.s3.amazonaws.com/${encodeURIComponent(input.key)}`,
      expiresIn: 900,
    };
  }

  async signGet(key: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: 900 });
  }

  async estimateCost() {
    return { currency: "USD" as const, estimated: 0 };
  }

  async healthCheck() {
    return { ok: Boolean(this.bucket), latencyMs: 0 };
  }
}
