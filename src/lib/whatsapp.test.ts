import { describe, expect, it } from "vitest";
import {
  buildInquiryWhatsAppMessage,
  buildWhatsAppUrl,
  getWhatsAppBusinessNumber,
} from "./whatsapp";

describe("inquiry WhatsApp links", () => {
  it("uses the configured international number without punctuation", () => {
    expect(getWhatsAppBusinessNumber("+254 757-308-631")).toBe("254757308631");
    expect(buildWhatsAppUrl("+254 757-308-631", "Hello")).toBe(
      "https://wa.me/254757308631?text=Hello",
    );
  });

  it("encodes the inquiry details as a click-to-chat message", () => {
    const message = buildInquiryWhatsAppMessage({
      name: "Amina Njeri",
      businessName: "Amina's Shop",
      phone: "+254 700 000 000",
      email: "amina@example.com",
      productOrService: "Inventory",
      message: "I would like a demo & pricing.",
      reference: "INQ-ABC123",
    });

    const url = buildWhatsAppUrl("254757308631", message);
    expect(url).toContain("https://wa.me/254757308631?text=");
    expect(decodeURIComponent(url!.split("?text=")[1])).toContain(
      "Reference: INQ-ABC123",
    );
    expect(decodeURIComponent(url!.split("?text=")[1])).toContain(
      "I would like a demo & pricing.",
    );
  });

  it("returns no link when a number is not a valid international number", () => {
    expect(getWhatsAppBusinessNumber("not-a-number")).toBeNull();
    expect(buildWhatsAppUrl("123", "Hello")).toBeNull();
  });
});
