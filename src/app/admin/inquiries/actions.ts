"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Inquiry } from "@prisma/client";
import { rawPrisma } from "@/server/db/client";
import { requireAdmin } from "@/server/auth/admin-session";
import { sendInquiryNotification } from "@/server/services/inquiry-notification";

export type InquiryMutationState = {
  ok: boolean;
  message: string;
};

const emptyState: InquiryMutationState = { ok: false, message: "" };
const inquiryIdSchema = z.string().trim().min(1).max(64);
const statusSchema = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "RESOLVED", "SPAM"]);

function refreshInquiryPaths(id?: string) {
  try {
    revalidatePath("/admin/inquiries");
    revalidatePath("/admin");
    if (id) revalidatePath(`/admin/inquiries/${id}`);
  } catch {
    console.error("[inquiry] admin_revalidation_failed", { inquiryId: id ?? null });
  }
}

export async function updateInquiry(
  _previousState: InquiryMutationState,
  formData: FormData,
): Promise<InquiryMutationState> {
  await requireAdmin();
  const parsed = z.object({
    id: inquiryIdSchema,
    status: statusSchema,
    internalNotes: z.string().trim().max(5000, "Notes must be 5,000 characters or fewer."),
  }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    internalNotes: formData.get("internalNotes"),
  });
  if (!parsed.success) {
    return { ...emptyState, message: parsed.error.issues[0]?.message ?? "Invalid inquiry details." };
  }

  let inquiryId: string;
  try {
    const inquiry = await rawPrisma.inquiry.findUnique({
      where: { id: parsed.data.id },
      select: { id: true },
    });
    if (!inquiry) return { ...emptyState, message: "This inquiry could not be found." };
    inquiryId = inquiry.id;
    await rawPrisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: parsed.data.status,
        internalNotes: parsed.data.internalNotes || null,
      },
    });
  } catch {
    console.error("[inquiry] admin_update_failed");
    return { ...emptyState, message: "The inquiry could not be updated. Please try again." };
  }
  refreshInquiryPaths(inquiryId);
  return { ok: true, message: "Inquiry updated." };
}

export async function retryInquiryNotification(
  _previousState: InquiryMutationState,
  formData: FormData,
): Promise<InquiryMutationState> {
  await requireAdmin();
  const parsedId = inquiryIdSchema.safeParse(formData.get("id"));
  if (!parsedId.success) return { ...emptyState, message: "Invalid inquiry reference." };

  let inquiry: Inquiry | null;
  try {
    inquiry = await rawPrisma.inquiry.findUnique({
      where: { id: parsedId.data },
    });
  } catch {
    console.error("[inquiry] admin_retry_lookup_failed");
    return { ...emptyState, message: "The inquiry could not be loaded. Please try again." };
  }
  if (!inquiry) return { ...emptyState, message: "This inquiry could not be found." };
  if (inquiry.notificationStatus === "SENT") {
    return { ok: true, message: "The administrator email was already sent." };
  }

  try {
    await sendInquiryNotification(inquiry);
  } catch {
    try {
      await rawPrisma.inquiry.update({
        where: { id: inquiry.id },
        data: { notificationStatus: "FAILED" },
      });
    } catch {
      console.error("[inquiry] retry_status_update_failed", { inquiryId: inquiry.id });
    }
    console.error("[inquiry] admin_email_retry_failed", { inquiryId: inquiry.id });
    refreshInquiryPaths(inquiry.id);
    return { ...emptyState, message: "The email could not be delivered. The saved inquiry is unchanged; you can retry later." };
  }

  try {
    await rawPrisma.inquiry.update({
      where: { id: inquiry.id },
      data: { notificationStatus: "SENT", notificationSentAt: new Date() },
    });
  } catch {
    console.error("[inquiry] retry_success_status_update_failed", { inquiryId: inquiry.id });
    return { ...emptyState, message: "The email may have been sent, but its delivery status could not be recorded. Check the email before retrying." };
  }
  refreshInquiryPaths(inquiry.id);
  return { ok: true, message: "Administrator notification sent." };
}
