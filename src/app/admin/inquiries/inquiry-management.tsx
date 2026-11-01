"use client";

import { useActionState } from "react";
import { ArrowLeft, MessageCircle, RotateCw, Save } from "lucide-react";
import Link from "next/link";
import {
  retryInquiryNotification,
  updateInquiry,
  type InquiryMutationState,
} from "@/app/admin/inquiries/actions";

const initialState: InquiryMutationState = { ok: false, message: "" };

const statuses = [
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["IN_PROGRESS", "In progress"],
  ["RESOLVED", "Resolved"],
  ["SPAM", "Spam"],
] as const;

export function InquiryManagement({
  id,
  status,
  internalNotes,
  notificationStatus,
  whatsappUrl,
}: {
  id: string;
  status: (typeof statuses)[number][0];
  internalNotes: string | null;
  notificationStatus: "PENDING" | "SENT" | "FAILED";
  whatsappUrl: string | null;
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateInquiry, initialState);
  const [retryState, retryAction, retryPending] = useActionState(
    retryInquiryNotification,
    initialState,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/inquiries"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary"
        >
          <ArrowLeft size={16} /> Inbox
        </Link>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <MessageCircle size={16} /> Follow up on WhatsApp
          </a>
        ) : (
          <p className="self-center text-sm text-muted-foreground">
            WhatsApp follow-up is unavailable for this phone number.
          </p>
        )}
      </div>

      <form action={updateAction} className="rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-2 block min-h-11 w-full rounded-lg border border-border-strong bg-background px-3 text-sm"
          >
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="mt-5 block text-sm font-medium">
          Internal notes
          <textarea
            name="internalNotes"
            defaultValue={internalNotes ?? ""}
            rows={5}
            maxLength={5000}
            className="mt-2 block w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm"
            placeholder="Notes for the DukaOS team (not visible to the customer)"
          />
        </label>
        <button
          type="submit"
          disabled={updatePending}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={16} /> {updatePending ? "Saving..." : "Save changes"}
        </button>
        {updateState.message && (
          <p role={updateState.ok ? "status" : "alert"} className={`mt-3 text-sm ${updateState.ok ? "text-success" : "text-danger"}`}>
            {updateState.message}
          </p>
        )}
      </form>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">Administrator email</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {notificationStatus === "SENT"
                ? "Notification sent."
                : notificationStatus === "FAILED"
                  ? "Notification failed. The inquiry remains saved."
                  : "Notification is pending."}
            </p>
          </div>
          {notificationStatus !== "SENT" && (
            <form action={retryAction}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                disabled={retryPending}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-60"
              >
                <RotateCw size={16} /> {retryPending ? "Retrying..." : "Retry notification"}
              </button>
            </form>
          )}
        </div>
        {retryState.message && (
          <p role={retryState.ok ? "status" : "alert"} className={`mt-3 text-sm ${retryState.ok ? "text-success" : "text-danger"}`}>
            {retryState.message}
          </p>
        )}
      </div>
    </div>
  );
}
