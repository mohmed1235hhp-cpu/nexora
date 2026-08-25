export type Id = string;
export type Timestamp = number;
export interface Entity { id: Id; createdAt: Timestamp; updatedAt: Timestamp; }
export type AppType =
  | "mobile" | "android" | "ios" | "pwa" | "desktop" | "dashboard"
  | "crm" | "pos" | "restaurant" | "booking" | "chat" | "ai"
  | "ecommerce" | "education" | "healthcare" | "productivity" | "business";
export interface AppRequest { id: Id; description: string; type: AppType; locale?: string; }
export interface AppPlan { id: Id; requestId: Id; steps: string[]; }
export interface GeneratedFile { path: string; content: string; kind: string; }
export interface BuildReport {
  id: Id; buildId: Id; filesGenerated: number; features: number; screens: number;
  components: number; services: number; tests: number; errorsFixed: number;
  readinessScore: number; summary: string;
}
