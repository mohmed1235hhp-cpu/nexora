import { Router, Response } from "express";
import { db, badgesTable } from "@workspace/db";
import { asyncHandler } from "@workspace/core/errors";
import { type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/badges
router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const badges = await db.select().from(badgesTable);
  res.json(badges.map(b => ({
    id: b.id, name: b.name, description: b.description, iconUrl: b.iconUrl, earnedAt: null,
  })));
}));

export default router;
