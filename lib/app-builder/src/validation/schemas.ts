import { z } from "zod";
export const AppTypeSchema = z.enum([
  "mobile","android","ios","pwa","desktop","dashboard","crm","pos","restaurant",
  "booking","chat","ai","ecommerce","education","healthcare","productivity","business",
]);
export const AppRequestSchema = z.object({
  description: z.string().min(3),
  type: AppTypeSchema,
  locale: z.string().optional(),
});
export type AppRequestInput = z.infer<typeof AppRequestSchema>;
