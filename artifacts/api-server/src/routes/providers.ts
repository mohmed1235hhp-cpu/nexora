import { Router } from "express";
import { PROVIDERS, AI_TOOLS } from "../lib/providers";

const router = Router();

// GET /api/providers
router.get("/providers", (_req, res) => {
  return res.json({ providers: PROVIDERS });
});

// GET /api/providers/tools
router.get("/providers/tools", (_req, res) => {
  return res.json({ tools: AI_TOOLS });
});

export default router;
