"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await resetPassword({
          token,
          password: String(formData.get("password") || ""),
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        window.location.assign(result.data.redirectTo);
      } catch {
        setError("We could not update your password. Please try again or request a new link.");
      }
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-danger">
        This reset link is missing its token. Request a new one from the{" "}
        <a href="/forgot-password" className="text-primary hover:underline">
          forgot password
        </a>{" "}
        page.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use at least 15 characters. Long passphrases are supported.</p>
      </div>
      {error && (
        <div className="rounded-[var(--radius-sm)] bg-danger-tint px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={15}
            maxLength={1024}
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}