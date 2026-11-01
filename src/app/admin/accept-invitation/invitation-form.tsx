"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { acceptPlatformAdminInvitation } from "@/app/actions/admin-security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminInvitationForm() {
  const token = useSearchParams().get("token") ?? "";
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await acceptPlatformAdminInvitation({
          token,
          password: String(formData.get("password") ?? ""),
        });
        setMessage(result.message);
        setSuccess(result.ok);
      } catch {
        setMessage("We could not complete this invitation. Ask a Super Admin to send a new one.");
      }
    });
  }

  if (!token) return <p className="text-sm text-danger">This invitation link is missing its token. Ask a Super Admin to send a new invitation.</p>;
  if (success) return <div className="space-y-4"><h1 className="text-xl font-semibold">Invitation accepted</h1><p role="status" className="text-sm text-success">{message}</p><a href="/admin/login" className="text-sm font-medium text-primary hover:underline">Continue to admin sign in</a></div>;

  return (
    <form action={submit} className="space-y-5">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Administrator account</p><h1 className="mt-2 text-xl font-semibold">Set your password</h1><p className="mt-1 text-sm text-muted-foreground">Choose at least 15 characters. Your invitation link is single-use and expires after 30 minutes.</p></div>
      <div className="space-y-1.5"><Label htmlFor="invitation-password">New password</Label><Input id="invitation-password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={1024} required /></div>
      {message && <p role="alert" className="text-sm text-danger">{message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Setting up…" : "Accept invitation"}</Button>
      <a href="/admin/login" className="block text-center text-sm text-primary hover:underline">Back to admin sign in</a>
    </form>
  );
}
