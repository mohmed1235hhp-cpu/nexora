/**
 * Zod validation schemas for auth routes.
 * Single source of truth — reused by `validate()` middleware and shareable
 * with the frontend for client-side pre-validation.
 */
import { z } from "zod";

export const UsernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, underscores");

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters");

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password must be at most 200 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(100, "Display name must be at most 100 characters");

export const RegisterSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  displayName: DisplayNameSchema,
  referralCode: z.string().trim().max(32).optional(),
});

export const LoginSchema = z.object({
  // Accept either username or email for user convenience.
  email: z.string().trim().min(3).max(255),
  password: z.string().min(1).max(200),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: PasswordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
