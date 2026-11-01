export const DEFAULT_WHATSAPP_BUSINESS_NUMBER = "254757308631";

export function normalizeWhatsAppNumber(input: string): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9 && /^[17]/.test(digits)) digits = `254${digits}`;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

export function getWhatsAppBusinessNumber(
  configuredNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER,
) {
  return normalizeWhatsAppNumber(
    configuredNumber?.trim() || DEFAULT_WHATSAPP_BUSINESS_NUMBER,
  );
}

export function buildInquiryWhatsAppMessage(input: {
  name: string;
  phone: string;
  email: string;
  businessName: string;
  productOrService: string;
  productId?: string;
  productUrl?: string;
  message: string;
  reference: string;
}) {
  return [
    "Hello, I would like to make an inquiry.",
    "",
    `Name: ${input.name}`,
    `Business: ${input.businessName}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email}`,
    `Product/Service: ${input.productOrService || "Not specified"}`,
    ...(input.productId ? [`Product ID: ${input.productId}`] : []),
    ...(input.productUrl ? [`Product URL: ${input.productUrl}`] : []),
    `Message: ${input.message}`,
    `Reference: ${input.reference}`,
  ].join("\n");
}

export function buildWhatsAppUrl(number: string, message: string): string | null {
  const digits = normalizeWhatsAppNumber(number);
  if (!digits) return null;
  try {
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  } catch {
    return null;
  }
}
