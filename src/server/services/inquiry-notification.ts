import "server-only";

import type { Inquiry } from "@prisma/client";
import { brandedEmail, escapeHtml, sendEmail } from "@/server/services/messaging";

function resolveContactRecipient(): string {
  const explicitRecipient = process.env.CONTACT_TO_EMAIL?.trim();
  if (explicitRecipient) return explicitRecipient;

  const envFrom = process.env.EMAIL_FROM?.trim();
  if (envFrom) {
    const match = envFrom.match(/<([^>]+)>/);
    if (match?.[1]?.trim()) return match[1].trim();
    const bareEmail = envFrom.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    if (bareEmail) return bareEmail;
  }

  return "leonochieng436@gmail.com";
}

export async function sendInquiryNotification(inquiry: Inquiry): Promise<void> {
  const reference = `INQ-${inquiry.id.toUpperCase()}`;
  const businessName = inquiry.businessName.replace(/[\r\n]+/g, " ").trim();
  const detail = (label: string, value: string) =>
    `<p><strong>${label}:</strong> ${escapeHtml(value || "Not specified")}</p>`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    "https://dukapos-theta.vercel.app";

  await sendEmail({
    recipient: resolveContactRecipient(),
    subject: `New DukaOS enquiry from ${businessName}`,
    message: [
      `Reference: ${reference}`,
      `Name: ${inquiry.name}`,
      `Business: ${inquiry.businessName}`,
      `Email: ${inquiry.email}`,
      `Phone: ${inquiry.phone}`,
      `Business type: ${inquiry.businessType || "Not specified"}`,
      `Locations: ${inquiry.numberOfLocations || "Not specified"}`,
      `Current system: ${inquiry.currentSystem || "Not specified"}`,
      `Product/service: ${inquiry.productOrService || "Not specified"}`,
      `Product ID: ${inquiry.productId || "Not specified"}`,
      `Product URL: ${inquiry.productUrl || "Not specified"}`,
      "",
      inquiry.message,
    ].join("\n"),
    html: brandedEmail({
      preheader: `New enquiry from ${inquiry.name}`,
      eyebrow: "New enquiry",
      title: "A new business enquiry has arrived",
      body: [
        detail("Reference", reference),
        detail("Name", inquiry.name),
        detail("Business", inquiry.businessName),
        detail("Email", inquiry.email),
        detail("Phone", inquiry.phone),
        detail("Business type", inquiry.businessType ?? ""),
        detail("Locations", inquiry.numberOfLocations ?? ""),
        detail("Current system", inquiry.currentSystem ?? ""),
        detail("Product/service", inquiry.productOrService ?? ""),
        detail("Product ID", inquiry.productId ?? ""),
        detail("Product URL", inquiry.productUrl ?? ""),
        `<p><strong>Message:</strong><br>${escapeHtml(inquiry.message).replace(/\n/g, "<br>")}</p>`,
      ].join(""),
      cta: {
        label: "Open inquiry inbox",
        url: `${appUrl.replace(/\/$/, "")}/admin/inquiries/${encodeURIComponent(inquiry.id)}`,
      },
    }),
    replyTo: inquiry.email,
  });
}
