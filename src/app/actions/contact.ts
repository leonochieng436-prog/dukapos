"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getWhatsAppBusinessNumber, buildInquiryWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { contactInquirySchema } from "@/lib/inquiry-validation";
import { rawPrisma } from "@/server/db/client";
import { sendInquiryNotification } from "@/server/services/inquiry-notification";

export type ContactActionState = {
  ok: boolean;
  error: string;
  message: string;
  reference: string;
  whatsappUrl: string | null;
  fieldErrors: Record<string, string[]>;
};

const emptyState: ContactActionState = {
  ok: false,
  error: "",
  message: "",
  reference: "",
  whatsappUrl: null,
  fieldErrors: {},
};

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function createWhatsAppLink(inquiry: {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  productOrService: string | null;
  productId: string | null;
  productUrl: string | null;
  message: string;
}) {
  const number = getWhatsAppBusinessNumber();
  if (!number) return null;

  const reference = `INQ-${inquiry.id.toUpperCase()}`;
  const message = buildInquiryWhatsAppMessage({
    name: inquiry.name,
    businessName: inquiry.businessName,
    phone: inquiry.phone,
    email: inquiry.email,
    productOrService: inquiry.productOrService ?? "",
    productId: inquiry.productId ?? undefined,
    productUrl: inquiry.productUrl ?? undefined,
    message: inquiry.message,
    reference,
  });
  return buildWhatsAppUrl(number, message);
}

function successState(inquiry: Parameters<typeof createWhatsAppLink>[0]): ContactActionState {
  return {
    ok: true,
    error: "",
    message: "Your inquiry has been saved. Continue to WhatsApp to send the pre-filled message; you will still need to press Send in WhatsApp.",
    reference: `INQ-${inquiry.id.toUpperCase()}`,
    whatsappUrl: createWhatsAppLink(inquiry),
    fieldErrors: {},
  };
}

function getErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "unknown";
}

export async function submitContactEnquiry(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactInquirySchema.safeParse({
    submissionKey: formText(formData, "submissionKey"),
    website: formText(formData, "website"),
    fullName: formText(formData, "fullName"),
    businessName: formText(formData, "businessName"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
    businessType: formText(formData, "businessType"),
    numberOfLocations: formText(formData, "numberOfLocations"),
    currentSystem: formText(formData, "currentSystem"),
    interest: formText(formData, "interest"),
    productId: formText(formData, "productId"),
    productUrl: formText(formData, "productUrl"),
    message: formText(formData, "message"),
  });

  if (!parsed.success) {
    return {
      ...emptyState,
      error: "Please fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const existing = await rawPrisma.inquiry.findUnique({
      where: { submissionKey: parsed.data.submissionKey },
    });
    if (existing) return successState(existing);

    const requestHeaders = await headers();
    const clientIp =
      requestHeaders.get("x-real-ip")?.trim() ||
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "";
    const ipHash = clientIp
      ? createHash("sha256").update(clientIp).digest("hex")
      : null;

    if (ipHash) {
      const recentSubmissions = await rawPrisma.inquiry.count({
        where: {
          ipHash,
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
      });
      if (recentSubmissions >= 5) {
        return {
          ...emptyState,
          error: "Too many inquiries have been sent from this connection. Please try again later.",
        };
      }
    }

    const input = parsed.data;
    const inquiry = await rawPrisma.inquiry.create({
      data: {
        submissionKey: input.submissionKey,
        name: input.fullName,
        businessName: input.businessName,
        phone: input.phone,
        phoneDigits: input.phone.replace(/\D/g, ""),
        email: input.email.toLowerCase(),
        businessType: input.businessType || null,
        numberOfLocations: input.numberOfLocations || null,
        currentSystem: input.currentSystem || null,
        subject: input.interest || "Business enquiry",
        productOrService: input.interest || null,
        message: input.message,
        productId: input.productId || null,
        productUrl: input.productUrl || null,
        ipHash,
      },
    });
    try {
      revalidatePath("/admin/inquiries");
      revalidatePath("/admin");
    } catch {
      console.error("[inquiry] admin_revalidation_failed", { inquiryId: inquiry.id });
    }

    try {
      await sendInquiryNotification(inquiry);
      await rawPrisma.inquiry.update({
        where: { id: inquiry.id },
        data: { notificationStatus: "SENT", notificationSentAt: new Date() },
      });
    } catch {
      try {
        await rawPrisma.inquiry.update({
          where: { id: inquiry.id },
          data: { notificationStatus: "FAILED" },
        });
      } catch {
        console.error("[inquiry] notification_status_update_failed", { inquiryId: inquiry.id });
      }
      console.error("[inquiry] admin_email_delivery_failed", { inquiryId: inquiry.id });
    }

    return successState(inquiry);
  } catch (error) {
    if (getErrorCode(error) === "P2002") {
      try {
        const existing = await rawPrisma.inquiry.findUnique({
          where: { submissionKey: formText(formData, "submissionKey") },
        });
        if (existing) return successState(existing);
      } catch {
        console.error("[inquiry] duplicate_submission_lookup_failed");
      }
    }
    console.error("[inquiry] persistence_failed", { code: getErrorCode(error) });
    return {
      ...emptyState,
      error: "We couldn't save your inquiry right now. Please try again in a few minutes or contact us directly.",
    };
  }
}
