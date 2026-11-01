import { describe, expect, it } from "vitest";
import { contactInquirySchema } from "./inquiry-validation";

const validInquiry = {
  submissionKey: "81bf5bf6-e35d-44be-87c4-ec20aa70b24a",
  website: "",
  fullName: "  Amina Njeri ",
  businessName: "Amina Shop",
  email: "amina@example.com",
  phone: "+254 700 000 000",
  businessType: "Retail Shop",
  numberOfLocations: "1",
  currentSystem: "",
  interest: "Inventory Management",
  productId: "",
  productUrl: "",
  message: "I would like to know more about DukaOS.",
};

describe("contact inquiry validation", () => {
  it("accepts valid details and trims user input", () => {
    const result = contactInquirySchema.safeParse(validInquiry);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe("Amina Njeri");
  });

  it("rejects malformed contact information and spam trap submissions", () => {
    expect(contactInquirySchema.safeParse({ ...validInquiry, email: "not-an-email" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...validInquiry, phone: "---------" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...validInquiry, website: "spam" }).success).toBe(false);
  });

  it("rejects non-HTTP product links and oversized messages", () => {
    expect(contactInquirySchema.safeParse({ ...validInquiry, productUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...validInquiry, message: "x".repeat(3001) }).success).toBe(false);
  });
});
