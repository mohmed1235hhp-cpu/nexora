import { Queue, QueueEvents, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

export function createRedis(url: string = process.env["REDIS_URL"] ?? "redis://localhost:6379") {
  return new IORedis(url, { maxRetriesPerRequest: null });
}

const connection = createRedis() as unknown as ConnectionOptions;

export const queues = {
  image: new Queue("media-image", { connection }),
  voice: new Queue("media-voice", { connection }),
  ocr: new Queue("media-ocr", { connection }),
  documents: new Queue("media-documents", { connection }),
} as const;

export const events = {
  image: new QueueEvents("media-image", { connection }),
  voice: new QueueEvents("media-voice", { connection }),
  ocr: new QueueEvents("media-ocr", { connection }),
  documents: new QueueEvents("media-documents", { connection }),
} as const;

export type QueueName = keyof typeof queues;
