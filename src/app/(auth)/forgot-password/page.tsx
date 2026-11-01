"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      try {
        await requestPasswordReset({ email: String(formData.get("email") || "") });
        setSent(true);
      } catch {
        setError("We could not process that request right now. Please try again later.");
      }
    });
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a link to
          reset your password. It expires in 30 minutes.
        </p>
        <a href="/login" className="text-[13px] text-primary hover:underline">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send a reset link.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
