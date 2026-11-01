"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { InvoiceActivityType, InvoicePaymentMethod, InvoiceStatus } from "@prisma/client";
import { requireAuthContext, AuthError } from "@/server/auth/context";
import { recordAudit } from "@/server/services/audit";
import { brandedEmail, sendEmail } from "@/server/services/messaging";
import { calculateInvoice, type InvoiceLineInput } from "@/lib/invoices/calculations";
import type { ActionResult } from "./auth";

function readItems(raw: FormDataEntryValue | null): InvoiceLineInput[] {
  if (typeof raw !== "string") return [];
  try {
    const items = JSON.parse(raw) as InvoiceLineInput[];
    return items.filter((item) => item.description?.trim() && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0);
  } catch {
    return [];
  }
}

function nextInvoiceNumber(sequence: number) {
  return `INV-${new Date().getFullYear()}-${String(sequence).padStart(6, "0")}`;
}

function statusForPayment(total: Decimal, paid: Decimal, dueDate: Date, current: InvoiceStatus) {
  if (current === InvoiceStatus.VOID || current === InvoiceStatus.CANCELLED) return current;
  if (paid.greaterThanOrEqualTo(total)) return InvoiceStatus.PAID;
  if (paid.greaterThan(0)) return InvoiceStatus.PARTIALLY_PAID;
  if (dueDate < new Date() && current !== InvoiceStatus.DRAFT) return InvoiceStatus.OVERDUE;
  return current;
}

function assertInvoiceManagement(ctx: Awaited<ReturnType<typeof requireAuthContext>>) {
  if (!ctx.permissions.has("INVOICES_MANAGE") && !ctx.permissions.has("CUSTOMERS_MANAGE")) {
    throw new AuthError("Missing permission: INVOICES_MANAGE", 403);
  }
}

export async function createInvoice(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireAuthContext();
    assertInvoiceManagement(ctx);
    const customerId = String(formData.get("customerId") || "");
    const dueDate = String(formData.get("dueDate") || "");
    const lines = readItems(formData.get("items"));
    if (!customerId || !dueDate || lines.length === 0) return { ok: false, error: "Choose a customer, due date, and at least one item." };

    const customer = await ctx.db.customer.findFirst({ where: { id: customerId, isWalkIn: false } });
    if (!customer) return { ok: false, error: "Customer not found." };
    const calculated = calculateInvoice(lines);
    if (new Decimal(calculated.total).lte(0)) return { ok: false, error: "Invoice total must be greater than zero." };
    const issueDate = new Date(String(formData.get("issueDate") || new Date().toISOString().slice(0, 10)));
    const due = new Date(`${dueDate}T23:59:59`);
    if (Number.isNaN(due.getTime()) || due < issueDate) return { ok: false, error: "Due date must be on or after the issue date." };
    const shouldSend = formData.get("intent") === "send";

    const invoice = await ctx.db.$transaction(async (tx) => {
      const count = await tx.invoice.count({ where: { organizationId: ctx.organizationId } });
      const created = await tx.invoice.create({
        data: {
          organizationId: ctx.organizationId,
          customerId,
          invoiceNumber: nextInvoiceNumber(count + 1),
          status: shouldSend ? InvoiceStatus.SENT : InvoiceStatus.DRAFT,
          issueDate,
          dueDate: due,
          currency: String(formData.get("currency") || "KES"),
          subtotal: calculated.subtotal,
          discountTotal: calculated.discountTotal,
          taxTotal: calculated.taxTotal,
          total: calculated.total,
          amountDue: calculated.total,
          notes: String(formData.get("notes") || "") || null,
          paymentInstructions: String(formData.get("paymentInstructions") || "") || null,
          publicToken: randomBytes(24).toString("hex"),
          items: { create: calculated.items.map((item) => ({ description: item.description, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, taxRate: item.taxRate, taxAmount: item.taxAmount, total: item.total })) },
          activities: { create: { organizationId: ctx.organizationId, userId: ctx.userId, type: shouldSend ? InvoiceActivityType.SENT : InvoiceActivityType.CREATED } },
        },
      });
      return created;
    });
    if (shouldSend && customer.email) {
      const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dukapos-theta.vercel.app"}/invoice/view/${invoice.publicToken}`;
      try {
        await sendEmail({
          recipient: customer.email,
          subject: `Invoice ${invoice.invoiceNumber} from DukaOS`,
          message: `Hello ${customer.name},\n\nYour invoice ${invoice.invoiceNumber} is ready.\nAmount: ${invoice.currency} ${invoice.total.toString()}\n\nView invoice: ${invoiceUrl}`,
          html: brandedEmail({
            preheader: `Invoice ${invoice.invoiceNumber} from ${invoice.organizationId ? "DukaOS" : "DukaOS"}.`,
            eyebrow: "Invoice",
            title: `Invoice ${invoice.invoiceNumber}`,
            body: `<p style="margin:0 0 12px">Hello ${customer.name.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character)},</p><p style="margin:0">Your invoice is ready. The amount due is <strong style="color:#102b4e">${invoice.currency} ${invoice.total.toString()}</strong>.</p>`,
            cta: { label: "View invoice", url: invoiceUrl },
          }),
        });
      } catch (error) {
        console.error(`[invoice:${invoice.id}] email delivery failed`, error);
      }
    }
    await recordAudit({ organizationId: ctx.organizationId, userId: ctx.userId, action: "INVOICE_CREATED", entityType: "Invoice", entityId: invoice.id, metadata: { invoiceNumber: invoice.invoiceNumber, total: calculated.total } });
    revalidatePath("/dashboard/invoices");
    return { ok: true, data: { id: invoice.id } };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: "SENT" | "VOID"): Promise<ActionResult> {
  try {
    const ctx = await requireAuthContext();
    assertInvoiceManagement(ctx);
    const invoice = await ctx.db.invoice.findFirst({ where: { id: invoiceId } });
    if (!invoice) return { ok: false, error: "Invoice not found." };
    if (invoice.status === InvoiceStatus.PAID && status === "VOID") return { ok: false, error: "Paid invoices cannot be voided." };
    await ctx.db.$transaction([
      ctx.db.invoice.update({ where: { id: invoiceId }, data: { status: status === "VOID" ? InvoiceStatus.VOID : InvoiceStatus.SENT, voidedAt: status === "VOID" ? new Date() : null } }),
      ctx.db.invoiceActivity.create({ data: { organizationId: ctx.organizationId, invoiceId, userId: ctx.userId, type: status === "VOID" ? InvoiceActivityType.VOIDED : InvoiceActivityType.SENT } }),
    ]);
    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function recordInvoicePayment(formData: FormData): Promise<ActionResult> {
  try {
    const ctx = await requireAuthContext();
    assertInvoiceManagement(ctx);
    const invoiceId = String(formData.get("invoiceId") || "");
    const amount = new Decimal(String(formData.get("amount") || 0));
    const method = String(formData.get("method") || "OTHER") as InvoicePaymentMethod;
    if (!invoiceId || !amount.isFinite() || amount.lte(0)) return { ok: false, error: "Enter a valid payment amount." };
    const invoice = await ctx.db.invoice.findFirst({ where: { id: invoiceId } });
    if (!invoice || invoice.status === InvoiceStatus.VOID) return { ok: false, error: "Invoice is unavailable for payment." };
    const outstanding = new Decimal(invoice.total.toString()).minus(invoice.amountPaid.toString());
    if (amount.gt(outstanding)) return { ok: false, error: "Payment exceeds the outstanding balance." };
    const paid = new Decimal(invoice.amountPaid.toString()).plus(amount);
    const nextStatus = statusForPayment(new Decimal(invoice.total.toString()), paid, invoice.dueDate, invoice.status);
    await ctx.db.$transaction([
      ctx.db.invoicePayment.create({ data: { organizationId: ctx.organizationId, invoiceId, amount: amount.toFixed(2), method, reference: String(formData.get("reference") || "") || null, paidAt: new Date(String(formData.get("paidAt") || new Date().toISOString())) } }),
      ctx.db.invoice.update({ where: { id: invoiceId }, data: { amountPaid: paid.toFixed(2), amountDue: new Decimal(invoice.total.toString()).minus(paid).toFixed(2), status: nextStatus } }),
      ctx.db.invoiceActivity.create({ data: { organizationId: ctx.organizationId, invoiceId, userId: ctx.userId, type: nextStatus === InvoiceStatus.PAID ? InvoiceActivityType.PAID : InvoiceActivityType.PARTIALLY_PAID, metadata: { amount: amount.toFixed(2), method } } }),
    ]);
    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    throw error;
  }
}