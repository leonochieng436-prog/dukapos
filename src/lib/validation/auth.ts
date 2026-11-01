import { z } from "zod";

export const registerOrganizationSchema = z.object({
  businessName: z.string().min(2, "Business name is required").max(120),
  ownerName: z.string().min(2, "Your name is required").max(120),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(15, "Password must be at least 15 characters").max(1024, "Password must be 1,024 characters or fewer"),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  businessType: z.string().min(1).max(60).default("general_store"),
  country: z.string().length(2).default("KE"),
  plan: z.enum(["starter", "growth", "enterprise"]).default("starter"),
  purchaseMode: z.enum(["trial", "direct"]).default("trial"),
});
export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationSchema
>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid reset token"),
  password: z.string().min(15, "Password must be at least 15 characters").max(1024, "Password must be 1,024 characters or fewer"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const createBranchSchema = z.object({
  name: z.string().min(2).max(120),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, "Code may only contain letters, numbers, - and _"),
  address: z.string().max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const inviteUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  roleId: z.string().min(1, "Select a role"),
  branchIds: z.array(z.string()).default([]),
  registerIds: z.array(z.string()).default([]),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
