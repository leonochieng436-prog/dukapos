"use server";

import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { z } from "zod";
import { assertBranchAccess, assertPermission, requireAuthContext, AuthError } from "@/server/auth/context";
import { initiateStkPush } from "@/server/services/mpesa/daraja";
import type { ActionResult } from "./auth";

const requestSchema = z.object({
  branchId: z.string().min(1),
  paymentAccountId: z.string().min(1),
  amount: z.string().refine((value) => new Decimal(value).isFinite() && new Decimal(value).gt(0)),
  phoneNumber: z.string().trim().regex(/^(?:254|0)7\d{8}$/),
  saleId: z.string().optional().or(z.literal("")),
});

function normalizePhone(phoneNumber: string) {
  return phoneNumber.startsWith("0") ? `254${phoneNumber.slice(1)}` : phoneNumber;
}

export async function initiateMpesaPayment(raw: unknown): Promise<ActionResult<{ paymentIntentId: string; status: "PENDING" }>> {
  try {
    const ctx = await requireAuthContext();
    assertPermission(ctx, "SALES_CREATE");
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Enter a valid amount, phone number, branch, and M-Pesa account." };
    const input = parsed.data;
    assertBranchAccess(ctx, input.branchId);
    const account = await ctx.db.paymentAccount.findFirst({ where: { id: input.paymentAccountId, provider: "MPESA", isActive: true, status: "ACTIVE", OR: [{ branchId: input.branchId }, { branchId: null }] } });
    if (!account) return { ok: false, error: "Active M-Pesa account not found for this branch." };
    if (input.saleId) {
      const sale = await ctx.db.sale.findFirst({ where: { id: input.saleId, branchId: input.branchId, status: "COMPLETED" }, select: { id: true, total: true } });
      if (!sale || !new Decimal(sale.total.toString()).eq(input.amount)) return { ok: false, error: "Sale not found or amount does not match." };
    }
    const accountReference = `DUKAOS-${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
    const intent = await ctx.db.mpesaPaymentIntent.create({ data: { organizationId: ctx.organizationId, branchId: input.branchId, paymentAccountId: account.id, saleId: input.saleId || null, amount: new Decimal(input.amount).toFixed(2), phoneNumber: normalizePhone(input.phoneNumber), accountReference } });
    try {
      const response = await initiateStkPush(account, { phoneNumber: intent.phoneNumber, amount: intent.amount.toString(), accountReference, description: "DukaOS sale payment", callbackUrl: `${process.env.MPESA_CALLBACK_URL || process.env.NEXT_PUBLIC_APP_URL || "https://dukapos-theta.vercel.app"}/api/webhooks/mpesa` });
      await ctx.db.mpesaPaymentIntent.update({ where: { id: intent.id }, data: { status: "PROCESSING", checkoutRequestId: response.CheckoutRequestID, merchantRequestId: response.MerchantRequestID ?? null, metadata: response } });
      return { ok: true, data: { paymentIntentId: intent.id, status: "PENDING" } };
    } catch (error) {
      await ctx.db.mpesaPaymentIntent.update({ where: { id: intent.id }, data: { status: "FAILED", resultDescription: error instanceof Error ? error.message : "STK Push failed", completedAt: new Date() } });
      return { ok: false, error: error instanceof Error ? error.message : "Could not send M-Pesa payment request." };
    }
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: error instanceof Error ? error.message : "Could not initiate M-Pesa payment." };
  }
}
