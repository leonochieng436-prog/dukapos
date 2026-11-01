"use client";

import { useState, useTransition } from "react";
import { adminLogin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export function AdminLoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await adminLogin({ email: String(formData.get("email") || ""), password: String(formData.get("password") || "") });
      if (!result.ok) setError(result.error ?? "Unable to sign in.");
      else if (result.data) window.location.assign(result.data.redirectTo);
    });
  }
  return <form action={submit} className="admin-login-form space-y-6">
    <div className="mb-8 flex items-center justify-center lg:hidden"><img src="/images/DukaOS-logo.png" alt="DukaOS logo" className="h-auto w-60 object-contain" /></div>
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-primary-tint p-3 text-primary shadow-[0_10px_24px_rgba(15,123,108,0.12)] sm:h-28 sm:w-28"><img src="/images/DukaOS-logo.png" alt="DukaOS logo" className="h-full w-full object-contain" /></div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Platform administration</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Admin sign in</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Review payments and manage registered business workspaces.</p>
    </div>
    <div className="grid grid-cols-2 rounded-md border border-border bg-surface-muted p-1 text-center text-sm font-semibold"><a href="/login" className="rounded px-3 py-2 text-muted-foreground hover:text-primary">Business login</a><span className="rounded bg-surface px-3 py-2 text-foreground shadow-sm">Admin login</span></div>
    {error && <div className="rounded-[var(--radius-sm)] bg-danger-tint px-3 py-2 text-[13px] text-danger">{error}</div>}
    <div className="space-y-2"><Label htmlFor="admin-email">Admin email</Label><div className="relative"><Mail size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="admin-email" name="email" type="email" placeholder="admin@yourcompany.com" required className="h-11 pl-10" /></div></div>
    <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="admin-password">Password</Label><a href="/admin/forgot-password" className="text-[12px] font-medium text-primary hover:underline">Forgot password?</a></div><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="admin-password" name="password" type={showPassword ? "text" : "password"} required className="h-11 pl-10 pr-11" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div><a href="/login" className="text-[12px] font-medium text-primary hover:underline">Return to business login</a></div>
    <Button type="submit" size="lg" className="h-12 w-full justify-center gap-2 bg-primary text-white shadow-[0_10px_22px_rgba(15,123,108,0.2)] hover:bg-primary-hover" disabled={pending}>{pending ? "Signing in..." : "Open admin panel"} {!pending && <ArrowRight size={17} />}</Button>
    <p className="border-t border-border pt-5 text-center text-[13px] text-muted-foreground"><ShieldCheck size={15} className="mr-1 inline text-primary" />Authorized platform administrators only</p>
  </form>;
}