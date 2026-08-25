/**
 * Canonical subscription plan catalog.
 *
 * This is the source of truth used to seed `subscription_plans` on boot and
 * to compute effective feature limits for a user regardless of provider.
 * Prices are in the currency's minor unit (999 = $9.99). `null` amount = free.
 *
 * Providers map plans -> their own price IDs via env (STRIPE_PRICE_PLUS, ...);
 * a plan is considered "purchasable via provider X" only if that env is set.
 */

export type BillingPlan = "free" | "plus" | "pro" | "business";

export interface PlanFeatureLimits {
  /** Monthly credit grant, added to userCreditsTable.balance on cycle start. */
  creditsPerCycle: number;
  /** Daily video generations (also enforced in videoLimits.ts). */
  dailyVideos: number;
  /** Max concurrent AI jobs. */
  maxConcurrentJobs: number;
  /** Priority queue tier (0 = free, 3 = business). */
  priorityTier: number;
  /** Whether the plan unlocks team/workspace features. */
  teamSeats: number;
}

export interface PlanConfig {
  plan: BillingPlan;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  amountMinor: number | null; // null = free
  currency: "USD" | "EGP";
  interval: "month" | "year";
  features: string[];
  featuresAr: string[];
  limits: PlanFeatureLimits;
  sortOrder: number;
}

export const PLAN_CATALOG: PlanConfig[] = [
  {
    plan: "free",
    name: "Free",
    nameAr: "مجاني",
    description: "Get started with core AI tools.",
    descriptionAr: "ابدأ مع أدوات الذكاء الاصطناعي الأساسية.",
    amountMinor: null,
    currency: "USD",
    interval: "month",
    features: ["100 credits / day", "Standard queue"],
    featuresAr: ["100 نقطة يوميًا", "طابور عادي"],
    limits: {
      creditsPerCycle: 0, // free plan does not grant monthly bulk credits
      dailyVideos: 1,
      maxConcurrentJobs: 1,
      priorityTier: 0,
      teamSeats: 1,
    },
    sortOrder: 0,
  },
  {
    plan: "plus",
    name: "Plus",
    nameAr: "بلس",
    description: "For creators shipping regularly.",
    descriptionAr: "للمبدعين الذين ينتجون بانتظام.",
    amountMinor: 999, // $9.99
    currency: "USD",
    interval: "month",
    features: ["3,000 credits / month", "5 videos / day", "Priority queue"],
    featuresAr: ["3000 نقطة شهريًا", "5 فيديوهات يوميًا", "طابور مميز"],
    limits: {
      creditsPerCycle: 3000,
      dailyVideos: 5,
      maxConcurrentJobs: 3,
      priorityTier: 1,
      teamSeats: 1,
    },
    sortOrder: 1,
  },
  {
    plan: "pro",
    name: "Pro",
    nameAr: "برو",
    description: "For power users and small studios.",
    descriptionAr: "للمستخدمين المحترفين والاستوديوهات الصغيرة.",
    amountMinor: 2999, // $29.99
    currency: "USD",
    interval: "month",
    features: ["12,000 credits / month", "20 videos / day", "Fast lane queue", "API access"],
    featuresAr: ["12,000 نقطة شهريًا", "20 فيديو يوميًا", "طابور فائق السرعة", "وصول API"],
    limits: {
      creditsPerCycle: 12000,
      dailyVideos: 20,
      maxConcurrentJobs: 6,
      priorityTier: 2,
      teamSeats: 1,
    },
    sortOrder: 2,
  },
  {
    plan: "business",
    name: "Business",
    nameAr: "أعمال",
    description: "Teams and organizations at scale.",
    descriptionAr: "للفرق والمؤسسات على نطاق واسع.",
    amountMinor: 9999, // $99.99
    currency: "USD",
    interval: "month",
    features: [
      "50,000 credits / month",
      "Unlimited videos",
      "Dedicated queue",
      "5 team seats",
      "Priority support",
    ],
    featuresAr: [
      "50,000 نقطة شهريًا",
      "فيديوهات غير محدودة",
      "طابور مخصص",
      "5 مقاعد للفريق",
      "دعم فوري",
    ],
    limits: {
      creditsPerCycle: 50000,
      dailyVideos: 999,
      maxConcurrentJobs: 20,
      priorityTier: 3,
      teamSeats: 5,
    },
    sortOrder: 3,
  },
];

export function findPlan(plan: BillingPlan): PlanConfig {
  const p = PLAN_CATALOG.find((x) => x.plan === plan);
  if (!p) throw new Error(`Unknown plan: ${plan}`);
  return p;
}

/** Human-readable currency formatter (avoids Intl in server hot paths). */
export function formatAmount(minor: number | null, currency: string): string {
  if (minor == null) return "Free";
  const major = (minor / 100).toFixed(2);
  return `${major} ${currency}`;
}
