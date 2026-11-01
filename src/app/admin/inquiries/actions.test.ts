import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inquiry: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  sendInquiryNotification: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ rawPrisma: { inquiry: mocks.inquiry } }));
vi.mock("@/server/auth/admin-session", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/services/inquiry-notification", () => ({
  sendInquiryNotification: mocks.sendInquiryNotification,
}));

import { retryInquiryNotification, updateInquiry } from "./actions";
import type { InquiryMutationState } from "./actions";

const initialState: InquiryMutationState = { ok: false, message: "" };
const inquiry = {
  id: "c1234567890abcdef",
  notificationStatus: "FAILED",
  name: "Amina Njeri",
  businessName: "Amina Shop",
  phone: "+254 700 000 000",
  email: "amina@example.com",
  productOrService: "Inventory",
  message: "I would like to know more about DukaOS.",
};

describe("admin inquiry actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin1" });
    mocks.inquiry.findUnique.mockResolvedValue({ id: inquiry.id });
    mocks.inquiry.update.mockResolvedValue({});
    mocks.sendInquiryNotification.mockResolvedValue(undefined);
  });

  it("protects inquiry mutations with the existing admin session", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("ADMIN_AUTH_REQUIRED"));
    const formData = new FormData();
    formData.set("id", inquiry.id);
    formData.set("status", "CONTACTED");
    formData.set("internalNotes", "");

    await expect(updateInquiry(initialState, formData)).rejects.toThrow("ADMIN_AUTH_REQUIRED");
    expect(mocks.inquiry.update).not.toHaveBeenCalled();
  });

  it("lets an authenticated admin update inquiry status and internal notes", async () => {
    const formData = new FormData();
    formData.set("id", inquiry.id);
    formData.set("status", "IN_PROGRESS");
    formData.set("internalNotes", "Call the customer tomorrow.");

    const result = await updateInquiry(initialState, formData);

    expect(result).toEqual({ ok: true, message: "Inquiry updated." });
    expect(mocks.inquiry.update).toHaveBeenCalledWith({
      where: { id: inquiry.id },
      data: { status: "IN_PROGRESS", internalNotes: "Call the customer tomorrow." },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/inquiries");
  });

  it("retries failed admin email notification and records delivery", async () => {
    mocks.inquiry.findUnique.mockResolvedValue(inquiry);
    const formData = new FormData();
    formData.set("id", inquiry.id);

    const result = await retryInquiryNotification(initialState, formData);

    expect(result).toEqual({ ok: true, message: "Administrator notification sent." });
    expect(mocks.sendInquiryNotification).toHaveBeenCalledWith(inquiry);
    expect(mocks.inquiry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: inquiry.id },
        data: expect.objectContaining({ notificationStatus: "SENT" }),
      }),
    );
  });
});
