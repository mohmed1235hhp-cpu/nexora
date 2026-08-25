import { Router, Response } from "express";
import { db, categoriesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { asyncHandler } from "@workspace/core/errors";
import { type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/categories
router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await db.select().from(categoriesTable).orderBy(desc(categoriesTable.count));
  res.json(categories.map(c => ({
    id: c.id, name: c.name, slug: c.slug,
    description: c.description, iconUrl: c.iconUrl, count: c.count,
  })));
}));

export default router;
