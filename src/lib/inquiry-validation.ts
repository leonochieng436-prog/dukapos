import { z } from "zod";

function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const contactInquirySchema = z.object({
  submissionKey: z.string().uuid(),
  website: z.literal(""),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  businessName: z.string().trim().min(2, "Please enter your business name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(24)
    .regex(/^\+?[0-9\s().-]+$/, "Please enter a valid phone number.")
    .refine((phone) => phone.replace(/\D/g, "").length >= 7, "Please enter a valid phone number."),
  businessType: z.string().trim().max(100),
  numberOfLocations: z.string().trim().max(40),
  currentSystem: z.string().trim().max(200),
  interest: z.string().trim().max(120),
  productId: z.string().trim().max(120),
  productUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(isHttpUrl, "Please enter a valid HTTP or HTTPS product URL."),
  message: z
    .string()
    .trim()
    .min(10, "Please share a few more details about your needs.")
    .max(3000, "Please keep your message under 3,000 characters."),
});
