import { Router, Response } from "express";
import crypto from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, apiKeysTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { asyncHandler, NotFoundError } from "@workspace/core/errors";
import { validate } from "../middlewares/validate";
import { z } from "zod";

const router = Router();
function makeKey() { return "nex_" + crypto.randomBytes(24).toString("base64url"); }
function hashKey(k:string) { return crypto.createHash("sha256").update(k).digest("hex"); }

router.get("/developer/api-keys", requireAuth, asyncHandler(async (req: AuthRequest,res:Response)=>{
  const keys = await db.select({
    id: apiKeysTable.id, name: apiKeysTable.name, prefix: apiKeysTable.prefix,
    lastUsedAt: apiKeysTable.lastUsedAt, createdAt: apiKeysTable.createdAt, revokedAt: apiKeysTable.revokedAt
  }).from(apiKeysTable).where(eq(apiKeysTable.userId,req.userId!)).orderBy(desc(apiKeysTable.createdAt));
  res.json({ keys });
}));
router.post("/developer/api-keys", requireAuth, validate({body:z.object({name:z.string().trim().min(1).max(80)})}),
 asyncHandler(async(req:AuthRequest,res:Response)=>{
  const key=makeKey();
  const [row]=await db.insert(apiKeysTable).values({
    userId:req.userId!,name:req.body.name,prefix:key.slice(0,12),keyHash:hashKey(key)
  }).returning({id:apiKeysTable.id,name:apiKeysTable.name,prefix:apiKeysTable.prefix,createdAt:apiKeysTable.createdAt});
  res.status(201).json({key,...row});
 }));
router.delete("/developer/api-keys/:id",requireAuth,asyncHandler(async(req:AuthRequest,res:Response)=>{
 const id=Number(req.params.id); if(!Number.isInteger(id)||id<1) return res.status(400).json({error:"Invalid key id"});
 const [row]=await db.select({id:apiKeysTable.id}).from(apiKeysTable).where(and(eq(apiKeysTable.id,id),eq(apiKeysTable.userId,req.userId!),isNull(apiKeysTable.revokedAt))).limit(1);
 if(!row) throw new NotFoundError("API key not found");
 await db.update(apiKeysTable).set({revokedAt:new Date()}).where(eq(apiKeysTable.id,id));
 res.status(204).end();
}));
router.get("/developer/docs", requireAuth, asyncHandler(async(_req,res)=>{
 res.json({name:"NEXORA API",version:"1.0",authentication:"Authorization: Bearer <your_api_key>",
  tools:["chat","image","vision","video","voice","stt","website","app","code","document","presentation","content","email","search","ocr","music","tts","translation","summarize"],
  limits:{free:"100 credits/day",plus:"3000 credits/month",pro:"12000 credits/month",business:"50000 credits/month"}});
}));
export default router;
