import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inquiry: {
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  sendInquiryNotification: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ rawPrisma: { inquiry: mocks.inquiry } }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/services/inquiry-notification", () => ({
  sendInquiryNotification: mocks.sendInquiryNotification,
}));

import { submitContactEnquiry, type ContactActionState } from "./contact";

const previousState: ContactActionState = {
  ok: false,
  error: "",
  message: "",
  reference: "",
  whatsappUrl: null,
  fieldErrors: {},
};

const record = {
  id: "c1234567890abcdef",
  name: "Amina Njeri",
  businessName: "Amina Shop",
  phone: "+254 700 000 000",
  email: "amina@example.com",
  productOrService: "Inventory Management",
  productId: null,
  productUrl: null,
  message: "I would like to know more about DukaOS.",
};

function validFormData() {
  const data = new FormData();
  data.set("submissionKey", "81bf5bf6-e35d-44be-87c4-ec20aa70b24a");
  data.set("website", "");
  data.set("fullName", record.name);
  data.set("businessName", record.businessName);
  data.set("email", record.email);
  data.set("phone", record.phone);
  data.set("businessType", "Retail Shop");
  data.set("numberOfLocations", "1");
  data.set("currentSystem", "");
  data.set("interest", record.productOrService);
  data.set("productId", "");
  data.set("productUrl", "");
  data.set("message", record.message);
  return data;
}

describe("submitContactEnquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER", "254757308631");
    mocks.headers.mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.5" }));
    mocks.inquiry.findUnique.mockResolvedValue(null);
    mocks.inquiry.count.mockResolvedValue(0);
    mocks.inquiry.create.mockResolvedValue(record);
    mocks.inquiry.update.mockResolvedValue(record);
    mocks.sendInquiryNotification.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists a validated inquiry, records notification success and prepares WhatsApp follow-up", async () => {
    const result = await submitContactEnquiry(previousState, validFormData());

    expect(result.ok).toBe(true);
    expect(result.reference).toBe(`INQ-${record.id.toUpperCase()}`);
    expect(result.whatsappUrl).toContain("https://wa.me/254757308631?text=");
    expect(decodeURIComponent(result.whatsappUrl!.split("?text=")[1])).toContain(record.message);
    expect(mocks.inquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: record.name,
          phoneDigits: "254700000000",
          email: record.email,
          subject: record.productOrService,
        }),
      }),
    );
    expect(mocks.sendInquiryNotification).toHaveBeenCalledWith(record);
    expect(mocks.inquiry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: record.id },
        data: expect.objectContaining({ notificationStatus: "SENT" }),
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/inquiries");
  });

  it("does not create a duplicate record when the submission token was already saved", async () => {
    mocks.inquiry.findUnique.mockResolvedValue(record);

    const result = await submitContactEnquiry(previousState, validFormData());

    expect(result.ok).toBe(true);
    expect(mocks.inquiry.create).not.toHaveBeenCalled();
    expect(mocks.sendInquiryNotification).not.toHaveBeenCalled();
  });

  it("rejects invalid input and honeypot submissions before database access", async () => {
    const invalid = validFormData();
    invalid.set("email", "not-an-email");
    expect((await submitContactEnquiry(previousState, invalid)).ok).toBe(false);

    const spam = validFormData();
    spam.set("website", "bot");
    expect((await submitContactEnquiry(previousState, spam)).ok).toBe(false);
    expect(mocks.inquiry.findUnique).not.toHaveBeenCalled();
  });

  it("rate-limits repeated submissions from the same connection", async () => {
    mocks.inquiry.count.mockResolvedValue(5);

    const result = await submitContactEnquiry(previousState, validFormData());

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Too many inquiries");
    expect(mocks.inquiry.create).not.toHaveBeenCalled();
  });

  it("keeps the saved inquiry successful when the administrator email fails", async () => {
    mocks.sendInquiryNotification.mockRejectedValue(new Error("provider details"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await submitContactEnquiry(previousState, validFormData());

    expect(result.ok).toBe(true);
    expect(mocks.inquiry.create).toHaveBeenCalledOnce();
    expect(mocks.inquiry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: record.id },
        data: { notificationStatus: "FAILED" },
      }),
    );
    expect(log).toHaveBeenCalledWith(
      "[inquiry] admin_email_delivery_failed",
      { inquiryId: record.id },
    );
    log.mockRestore();
  });

  it("returns an explicit failure when database persistence fails", async () => {
    mocks.inquiry.create.mockRejectedValue(new Error("database details"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await submitContactEnquiry(previousState, validFormData());

    expect(result.ok).toBe(false);
    expect(result.error).toContain("couldn't save your inquiry");
    expect(mocks.sendInquiryNotification).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
