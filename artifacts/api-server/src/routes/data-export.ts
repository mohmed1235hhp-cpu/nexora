import { Router, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { and, eq, desc } from "drizzle-orm";
import { db, dataExportsTable, usersTable, portfolioTable, aiConversationsTable, sessionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { asyncHandler, NotFoundError } from "@workspace/core/errors";

const router = Router();
const exportDir = path.resolve(process.env.DATA_EXPORT_DIR || "./data-exports");

router.post("/data-export", requireAuth, asyncHandler(async(req:AuthRequest,res:Response)=>{
 const [job]=await db.insert(dataExportsTable).values({
   userId:req.userId!,status:"queued",expiresAt:new Date(Date.now()+24*60*60*1000)
 }).returning();
 void buildExport(job.id, req.userId!);
 res.status(202).json({id:job.id,status:"queued"});
}));
router.get("/data-export/:id",requireAuth,asyncHandler(async(req:AuthRequest,res:Response)=>{
 const id=Number(req.params.id);
 const [job]=await db.select().from(dataExportsTable).where(and(eq(dataExportsTable.id,id),eq(dataExportsTable.userId,req.userId!))).limit(1);
 if(!job) throw new NotFoundError("Export not found");
 if(job.status==="ready" && job.filePath && job.expiresAt && job.expiresAt > new Date()) {
   return res.download(job.filePath,"nexora-data-export.json");
 }
 res.json({id:job.id,status:job.status,error:job.error});
}));
async function buildExport(id:number,userId:number){
 try {
  await fs.mkdir(exportDir,{recursive:true});
  await db.update(dataExportsTable).set({status:"processing"}).where(eq(dataExportsTable.id,id));
  const [user]=await db.select().from(usersTable).where(eq(usersTable.id,userId));
  const portfolio=await db.select().from(portfolioTable).where(eq(portfolioTable.userId,userId));
  const conversations=await db.select().from(aiConversationsTable).where(eq(aiConversationsTable.userId,userId));
  const file=path.join(exportDir,`${userId}-${id}.json`);
  await fs.writeFile(file,JSON.stringify({exportedAt:new Date().toISOString(),user,portfolio,conversations},null,2));
  await db.update(dataExportsTable).set({status:"ready",filePath:file,completedAt:new Date()}).where(eq(dataExportsTable.id,id));
 } catch(e) {
  await db.update(dataExportsTable).set({status:"failed",error:e instanceof Error?e.message:"Export failed"}).where(eq(dataExportsTable.id,id)).catch(()=>{});
 }
}
export default router;
