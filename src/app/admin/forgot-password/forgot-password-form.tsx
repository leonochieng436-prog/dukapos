"use client";

import { useState, useTransition } from "react";
import { requestPlatformAdminPasswordReset } from "@/app/actions/admin-security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      try {
        await requestPlatformAdminPasswordReset({ email: String(formData.get("email") ?? "") });
        setSent(true);
      } catch {
        setError("We could not process that request right now. Please try again later.");
      }
    });
  }

  return sent ? (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Check your email</h1>
      <p className="text-sm leading-6 text-muted-foreground">If an active administrator account exists for that address, a reset link will be sent. The link expires in 30 minutes.</p>
      <a href="/admin/login" className="text-sm font-medium text-primary hover:underline">Back to admin sign in</a>
    </div>
  ) : (
    <form action={submit} className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Account security</p>
        <h1 className="mt-2 text-xl font-semibold">Forgot administrator password?</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Enter your administrator email and, if the account is eligible, we will send a secure reset link.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-reset-email">Email</Label>
        <Input id="admin-reset-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
      <a href="/admin/login" className="block text-center text-sm text-primary hover:underline">Back to admin sign in</a>
    </form>
  );
}
