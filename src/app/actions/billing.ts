"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext, assertPermission, assertOwner, AuthError } from "@/server/auth/context";
import { recordAudit } from "@/server/services/audit";
import { changePlanSchema } from "@/lib/validation/billing";
import type { ActionResult } from "./auth";
import { getTrialEndDate, planLimits, type Plan } from "@/lib/billing";
import { getStripe, } from "@/lib/stripe";

export async function createCheckoutSession(raw: unknown): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await requireAuthContext(); assertPermission(ctx, "BILLING_MANAGE"); assertOwner(ctx);
    const parsed = changePlanSchema.safeParse(raw);
    if (!parsed.success || parsed.data.plan === "trial") return { ok: false, error: "Choose a paid plan." };
    const plan = parsed.data.plan as Plan;
    const priceEnv = planLimits(plan).stripePriceEnv;
    const priceId = priceEnv ? process.env[priceEnv] : null;
    if (!priceId) return { ok: false, error: "This plan is not configured for online payment." };
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: ctx.organizationId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { organizationId: ctx.organizationId, plan },
      subscription_data: { metadata: { organizationId: ctx.organizationId, plan } },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dukapos-theta.vercel.app"}/dashboard/billing?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dukapos-theta.vercel.app"}/dashboard/billing?checkout=cancelled`,
    });
    if (!session.url) return { ok: false, error: "Stripe did not return a checkout URL." };
    return { ok: true, data: { url: session.url } };
  } catch (e) { if (e instanceof AuthError) return { ok: false, error: e.message }; return { ok: false, error: e instanceof Error ? e.message : "Could not start checkout." }; }
}

export async function changePlan(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAuthContext(); assertPermission(ctx, "BILLING_MANAGE"); assertOwner(ctx);
    const parsed = changePlanSchema.safeParse(raw); if (!parsed.success) return { ok: false, error: "Choose a valid plan." };
    const input = parsed.data; const plan = planLimits(input.plan as Plan); const periodEnd = new Date(Date.now() + 30 * 86400000); const trialEndsAt = input.plan === "trial" ? getTrialEndDate() : null;
    const subscription = await ctx.db.subscription.upsert({ where: { organizationId: ctx.organizationId }, update: { plan: input.plan, status: input.plan === "trial" ? "trialing" : "active", branchLimit: plan.branchLimit, registerLimit: plan.registerLimit, userLimit: plan.userLimit, currentPeriodEnd: periodEnd, trialEndsAt }, create: { organizationId: ctx.organizationId, plan: input.plan, status: input.plan === "trial" ? "trialing" : "active", branchLimit: plan.branchLimit, registerLimit: plan.registerLimit, userLimit: plan.userLimit, currentPeriodEnd: periodEnd, trialEndsAt } });
    await recordAudit({ organizationId: ctx.organizationId, userId: ctx.userId, action: "SUBSCRIPTION_PLAN_CHANGED", entityType: "Subscription", entityId: subscription.id, metadata: { plan: input.plan } });
    revalidatePath("/dashboard/billing"); return { ok: true, data: undefined };
  } catch (e) { if (e instanceof AuthError) return { ok: false, error: e.message }; throw e; }
}
