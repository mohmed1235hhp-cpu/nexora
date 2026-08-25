import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import profileRouter from "./profile";
import followRouter from "./follow";
import notificationsRouter from "./notifications";
import portfolioRouter from "./portfolio";
import savedRouter from "./saved";
import categoriesRouter from "./categories";
import searchRouter from "./search";
import reputationRouter from "./reputation";
import badgesRouter from "./badges";
import presenceRouter from "./presence";
import privacyRouter from "./privacy";
import securityRouter from "./security";
import adminRouter from "./admin";
import mediaRouter from "./media";
import mediaPipelineRouter from "./media-pipeline";
import analyticsRouter from "./analytics";
import monitoringRouter from "./monitoring";
import aiGovernanceRouter from "./ai-governance";
import aiRouter from "./ai";
import aiProvidersV2Router from "./ai-providers-v2";
import jobsRouter from "./jobs";
import orchestrateRouter from "./orchestrate";
import providersRouter from "./providers";
import creditsRouter from "./credits";
import referralsRouter from "./referrals";
import developerRouter from "./developer";
import dataExportRouter from "./data-export";

const router: IRouter = Router();

// Health & Monitoring (Phase 20)
router.use(monitoringRouter);
// NOTE: previously imported but never mounted, so /readyz (DB readiness probe
// referenced by deployment configs) was unreachable — fixed by mounting it.
router.use(healthRouter);

// Phase 1 — Auth & Profiles
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/profile", profileRouter);

// Phase 2 — Presence
router.use("/presence", presenceRouter);
router.use("/privacy", privacyRouter);

// Phase 3 — Portfolio
router.use("/portfolio", portfolioRouter);
router.use("/saved", savedRouter);
router.use("/categories", categoriesRouter);

// Phase 12 — Notifications (SSE stream, list, mark-read, unread-count).
// NOTE: this router existed fully built (see file header) but was never
// mounted anywhere in this file, so all of /api/notifications/* — including
// the SSE stream the frontend's useSSE hook depends on — was unreachable.
router.use("/notifications", notificationsRouter);

// Phase 10 — Reputation / Badges
router.use("/reputation", reputationRouter);
router.use("/badges", badgesRouter);

// Phase 11 — Smart Search
router.use("/search", searchRouter);

// Follow / Friend requests — schema (follows, friend_requests tables,
// followersCount/followingCount/friendsCount counters, follow/friend_request/
// friend_accept notification types) already existed and GET /api/users/:username
// already computed isFollowing/isFriend, but no route ever wrote to these
// tables. Mounted at root since its own paths are already /follow/... and
// /friend-request/..., same convention as securityRouter below.
router.use(followRouter);

// Phase 14 — Security / Reports / Block / Mute
// NOTE: previously mounted 4x at /block, /mute, /report, /comments — since
// this router's own routes already start with /block, /mute, /report,
// /comments, that produced unreachable paths like /api/block/block/:userId
// while the frontend calls /api/block/:userId directly. Fixed: mount once
// at root so the router's own paths resolve as intended.
router.use(securityRouter);

// Phase 16 — Media System
router.use("/media", mediaRouter);
router.use("/media-pipeline", mediaPipelineRouter);

// Phase 18 — Analytics
router.use("/analytics", analyticsRouter);

// Phase 19 — Admin Dashboard
router.use("/admin", adminRouter);

// Phase 23 — AI Governance
router.use("/ai", aiGovernanceRouter);

// AI Tools — chat/image/website/app/video via the shared Provider Manager
// (@workspace/ai-core: Claude/OpenAI/Groq/Replit Agent/Gemini/Bolt.new/
// OpenAI Images/Flux/Stable Diffusion/Veo/Runway/Kling AI/...), each
// capability routed through an automatic primary->secondary->fallback
// chain instead of one hardcoded vendor. aiProvidersV2Router adds the
// Phase 2 capabilities (music, TTS, STT, web search, code execution).
// NOTE: this router (and providersRouter) existed in the codebase but was
// never mounted here, so none of its routes were ever reachable. Its own
// paths are already prefixed with /ai/..., so it's mounted at root like
// securityRouter above, not under an extra "/ai" prefix.
router.use(aiRouter);
router.use(aiProvidersV2Router);
router.use(jobsRouter);
router.use(orchestrateRouter);
router.use(providersRouter);

// Credits — daily AI-usage balance, history, and deduction. Existed in full
// but was never mounted, so /api/credits* was unreachable; its own paths
// are already prefixed with /credits/..., so it's mounted at root too.
router.use(creditsRouter);
router.use(referralsRouter);
router.use(developerRouter);
router.use(dataExportRouter);

export default router;

// Payments — subscriptions, checkout, invoices, history.
// Webhooks are mounted separately in app.ts (raw body required) but still
// live under /api/webhooks/:provider; see routes/webhooks.ts.
import paymentsRouter from "./payments";
import adminPaymentsRouter from "./admin-payments";
router.use(paymentsRouter);
router.use(adminPaymentsRouter);
