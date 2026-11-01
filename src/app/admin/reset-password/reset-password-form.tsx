"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { resetPlatformAdminPassword } from "@/app/actions/admin-security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await resetPlatformAdminPassword({
          token,
          password: String(formData.get("password") ?? ""),
        });
        setMessage(result.message);
        setSuccess(result.ok);
      } catch {
        setMessage("We could not update your password. Please try again or request a new link.");
      }
    });
  }

  if (!token) return <p className="text-sm text-danger">This reset link is missing its token. Request another link from the <a href="/admin/forgot-password" className="text-primary underline">forgot password</a> page.</p>;
  if (success) return <div className="space-y-4"><h1 className="text-xl font-semibold">Password updated</h1><p role="status" className="text-sm text-success">{message}</p><a href="/admin/login" className="text-sm font-medium text-primary hover:underline">Sign in</a></div>;

  return (
    <form action={submit} className="space-y-5">
      <div><h1 className="text-xl font-semibold">Set a new administrator password</h1><p className="mt-1 text-sm text-muted-foreground">Use at least 15 characters. Long passphrases are supported.</p></div>
      <div className="space-y-1.5"><Label htmlFor="admin-new-password">New password</Label><Input id="admin-new-password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={1024} required /></div>
      {message && <p role="alert" className="text-sm text-danger">{message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button>
      <a href="/admin/login" className="block text-center text-sm text-primary hover:underline">Back to admin sign in</a>
    </form>
  );
}
