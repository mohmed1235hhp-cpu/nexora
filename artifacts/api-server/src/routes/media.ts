/**
 * Phase 16 — Media System
 * Handles upload validation, secure storage, metadata, and CDN-ready URLs.
 */
import { Router, Response } from "express";
import { asyncHandler, ValidationError } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { uploadLimiter } from "../middlewares/rateLimit";
import crypto from "crypto";
import path from "path";

const router = Router();
// Was defined in middlewares/rateLimit.ts but never applied here, leaving
// upload-URL issuance and validation completely unthrottled.
router.use(uploadLimiter);

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, "application/pdf", "application/zip"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function getMediaType(contentType: string): "image" | "video" | "file" | null {
  if (ALLOWED_IMAGE_TYPES.includes(contentType)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(contentType)) return "video";
  if (ALLOWED_FILE_TYPES.includes(contentType)) return "file";
  return null;
}

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-z0-9_-]/gi, "_")
    .slice(0, 50);
  return `${base}${ext}`;
}

// POST /api/media/upload-url
router.post("/upload-url", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { filename, contentType, folder = "uploads" } = req.body;

  if (!filename || !contentType) {
    throw new ValidationError("Filename and content type are required");
  }

  const mediaType = getMediaType(contentType);
  if (!mediaType) {
    throw new ValidationError("Unsupported file type", { context: { allowed: ALLOWED_FILE_TYPES } });
  }

  // Validate folder
  const allowedFolders = ["avatars", "covers", "portfolio", "stories", "chat", "uploads"];
  const safeFolder = allowedFolders.includes(folder) ? folder : "uploads";

  const safeFilename = sanitizeFilename(filename);
  const uniqueId = crypto.randomBytes(12).toString("hex");
  const key = `${safeFolder}/${req.userId}/${uniqueId}-${safeFilename}`;
  const fileUrl = `/uploads/${key}`;

  // Return presigned-style response (CDN-ready in production)
  return res.json({
    uploadUrl: `/api/media/upload/${encodeURIComponent(key)}`,
    fileUrl,
    key,
    mediaType,
    maxSizeBytes: mediaType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
    expiresIn: 3600,
    optimizationTips: mediaType === "image"
      ? ["Convert to WebP for 25-35% smaller size", "Use responsive srcset for mobile", "Strip EXIF metadata before uploading"]
      : ["H.264 codec recommended for compatibility", "Target 720p for web, 1080p max"],
  });
}));

// POST /api/media/validate - validate file before upload
router.post("/validate", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contentType, sizeBytes, filename } = req.body;

  if (!contentType || !sizeBytes || !filename) {
    throw new ValidationError("contentType, sizeBytes, and filename required");
  }

  const mediaType = getMediaType(contentType);
  if (!mediaType) {
    return res.status(400).json({ valid: false, error: "Unsupported file type" });
  }

  const maxSize = mediaType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (sizeBytes > maxSize) {
    return res.status(400).json({
      valid: false,
      error: `File too large. Max ${maxSize / 1024 / 1024}MB for ${mediaType}s`,
    });
  }

  // Check filename for path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return res.status(400).json({ valid: false, error: "Invalid filename" });
  }

  return res.json({
    valid: true,
    mediaType,
    maxSizeBytes: maxSize,
    recommendations: mediaType === "image"
      ? { formats: ["webp", "avif"], maxDimension: 2048 }
      : { codec: "h264", maxBitrate: "4mbps", maxResolution: "1080p" },
  });
}));

// GET /api/media/config - get media system configuration
router.get("/config", requireAuth, asyncHandler(async (_req: AuthRequest, res: Response) => {
  return res.json({
    allowedImageTypes: ALLOWED_IMAGE_TYPES,
    allowedVideoTypes: ALLOWED_VIDEO_TYPES,
    maxImageSizeBytes: MAX_IMAGE_SIZE,
    maxVideoSizeBytes: MAX_VIDEO_SIZE,
    supportedFormats: {
      images: ["jpeg", "png", "gif", "webp", "avif"],
      videos: ["mp4", "webm", "ogg", "mov"],
    },
    optimizationEnabled: true,
    cdnEnabled: process.env.CDN_BASE_URL ? true : false,
    cdnUrl: process.env.CDN_BASE_URL || null,
  });
}));

export default router;
