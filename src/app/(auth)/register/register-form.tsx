"use client";

import { useState, useTransition } from "react";
import { registerOrganization } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "general_store", label: "General store" },
  { value: "retail", label: "Retail shop" },
  { value: "supermarket", label: "Supermarket / mini-market" },
  { value: "hardware", label: "Hardware store" },
  { value: "electronics", label: "Electronics shop" },
  { value: "clothing", label: "Clothing store" },
  { value: "beauty", label: "Beauty / cosmetics" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "restaurant", label: "Restaurant" },
  { value: "wholesale", label: "Wholesaler / distributor" },
];

const PLANS = [
  { value: "starter", label: "Starter", description: "For small shops getting started" },
  { value: "growth", label: "Growth", description: "For growing businesses" },
  { value: "enterprise", label: "Enterprise", description: "For multi-branch operations" },
] as const;

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    const payload = {
      businessName: String(formData.get("businessName") || ""),
      ownerName: String(formData.get("ownerName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      phone: String(formData.get("phone") || ""),
      businessType: String(formData.get("businessType") || "general_store"),
      country: "KE",
      plan: String(formData.get("plan") || "starter"),
      purchaseMode: String(formData.get("purchaseMode") || "trial"),
    };

    startTransition(async () => {
      const result = await registerOrganization(payload);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      window.location.assign(result.data.redirectTo);
    });
  }

  return (
    <form action={handleSubmit} className="register-form space-y-6">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-primary text-white shadow-[0_8px_18px_rgba(15,123,108,0.22)]">D</span>
        <span className="text-lg font-bold tracking-[0.16em] text-foreground">DUKAOS</span>
      </div>
      <div>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-tint text-primary"><Building2 size={22} /></div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Create your workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Set up DUKAOS</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Start managing sales, stock, customers, and payments in one secure business workspace.</p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] bg-danger-tint px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <div className="relative"><Building2 size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="businessName" name="businessName" placeholder="Leon Retail Store" required className="h-11 pl-10" /></div>
        {fieldErrors.businessName && (
          <p className="text-[12px] text-danger">{fieldErrors.businessName[0]}</p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">How would you like to start?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-[var(--radius-sm)] border border-primary/40 bg-primary/5 p-3 has-[:checked]:ring-2 has-[:checked]:ring-primary">
            <input type="radio" name="purchaseMode" value="trial" defaultChecked className="mt-1 accent-primary" />
            <span><span className="block text-sm font-medium">Start free trial</span><span className="mt-1 block text-xs text-muted-foreground">Use the selected package for 7 days, no payment required.</span></span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-[var(--radius-sm)] border border-border p-3 has-[:checked]:ring-2 has-[:checked]:ring-primary">
            <input type="radio" name="purchaseMode" value="direct" className="mt-1 accent-primary" />
            <span><span className="block text-sm font-medium">Purchase directly</span><span className="mt-1 block text-xs text-muted-foreground">Request payment instructions and activate after confirmation.</span></span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="businessType">Business type</Label>
        <select
          id="businessType"
          name="businessType"
          className="h-9 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          defaultValue="general_store"
        >
          {BUSINESS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Choose a package</Label>
        <select
          id="plan"
          name="plan"
          className="h-11 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          defaultValue="starter"
          required
        >
          {PLANS.map((plan) => (
            <option key={plan.value} value={plan.value}>
              {plan.label} — {plan.description}
            </option>
          ))}
        </select>
        <p className="text-[12px] text-muted-foreground">
          Start with a 7-day free trial. Your workspace opens immediately, with no payment required during the trial.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Your name</Label>
          <div className="relative"><UserRound size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="ownerName" name="ownerName" placeholder="Leon Otieno" required className="h-11 pl-10" /></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="relative"><Phone size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="phone" name="phone" placeholder="07xx xxx xxx" className="h-11 pl-10" /></div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative"><Mail size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="email" name="email" type="email" placeholder="you@business.co.ke" required className="h-11 pl-10" /></div>
        {fieldErrors.email && (
          <p className="text-[12px] text-danger">{fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="At least 15 characters" minLength={15} maxLength={1024} autoComplete="new-password" required className="h-11 pl-10 pr-11" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-surface-muted hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        {fieldErrors.password && (
          <p className="text-[12px] text-danger">{fieldErrors.password[0]}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-12 w-full justify-center gap-2 bg-primary text-white shadow-[0_10px_22px_rgba(15,123,108,0.2)] hover:bg-primary-hover" disabled={isPending}>
        {isPending ? "Creating your workspace…" : "Create business account"} {!isPending && <ArrowRight size={17} />}
      </Button>

      <p className="border-t border-border pt-5 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
}
