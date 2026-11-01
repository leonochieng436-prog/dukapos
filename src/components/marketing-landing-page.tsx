"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { CookieConsentBanner, LegalModal, type LegalTab } from "@/components/legal-popups";
import { MarketingFooter, RevealOnScroll, ScrollToTopButton } from "@/components/marketing/page-shell";
import { getCookieConsent, setCookieConsent } from "@/lib/cookie-consent";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Menu,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

const navItems = [
  ["About", "/about"],
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Who it is for", "#industries"],
  ["Pricing", "#pricing"],
  ["Contact", "/contact"],
] as const;

const featureGroups = [
  {
    icon: ShoppingCart,
    name: "Sales & POS",
    description:
      "Process sales quickly, manage payments, issue receipts, and keep a reliable transaction history.",
    items: [
      "Fast POS",
      "Multiple payment methods",
      "Receipts and sale corrections",
      "Discounts and tax handling",
    ],
  },
  {
    icon: Boxes,
    name: "Inventory",
    description:
      "Know what you have, where it is, and how it moves across your business.",
    items: [
      "Products, variants, and barcodes",
      "Stock levels and adjustments",
      "Warehouses and transfers",
      "Inventory history and FIFO costing",
    ],
  },
  {
    icon: Truck,
    name: "Purchases",
    description:
      "Record goods as they arrive and see what remains outstanding to suppliers.",
    items: [
      "Direct purchase entry",
      "Received stock and invoices",
      "Partial supplier payments",
      "Purchase and payment history",
    ],
  },
  {
    icon: Users,
    name: "Customers & credit",
    description:
      "Build a clear picture of every customer relationship and balance.",
    items: [
      "Customer profiles and history",
      "Credit sales",
      "Outstanding balances",
      "Payment records and statements",
    ],
  },
  {
    icon: Building2,
    name: "Branches & teams",
    description: "Manage growing operations from one connected workspace.",
    items: [
      "Multiple branches and registers",
      "Warehouses and stock transfers",
      "Branch-level inventory",
      "Roles and permissions",
    ],
  },
  {
    icon: BarChart3,
    name: "Reports",
    description: "Turn everyday transactions into information you can act on.",
    items: [
      "Sales and purchase reports",
      "Profit and inventory analysis",
      "Customer and supplier balances",
      "Branch performance",
    ],
  },
];

const workflows = [
  {
    icon: ShoppingCart,
    title: "Sales flow into the business",
    steps: [
      "Customer",
      "POS sale",
      "Payment & receipt",
      "Inventory updated",
      "Reports updated",
    ],
  },
  {
    icon: PackageCheck,
    title: "Purchases become usable stock",
    steps: [
      "Supplier delivery",
      "Record purchase",
      "Receive stock",
      "Supplier balance",
      "Pay now or later",
    ],
  },
  {
    icon: CreditCard,
    title: "Credit stays visible",
    steps: [
      "Customer",
      "Credit sale",
      "Outstanding balance",
      "Customer payment",
      "Balance reduced",
    ],
  },
];

const plans = [
  {
    name: "Starter",
    audience: "For small shops and businesses getting started.",
    monthly: 1200,
    annual: 12960,
    effectiveMonthly: 1080,
    details: [
      "1 branch",
      "1 register",
      "2 users",
      "Product and inventory management",
      "POS and sales",
      "Customer management",
      "Basic reports",
      "Receipt printing",
      "Stock adjustments",
      "Basic business dashboard",
      "Email support",
    ],
  },
  {
    name: "Growth",
    audience: "For growing businesses with more staff and operations.",
    monthly: 2500,
    annual: 27000,
    effectiveMonthly: 2250,
    popular: true,
    details: [
      "3 branches",
      "3 registers",
      "8 users",
      "Everything in Starter",
      "Multi-branch inventory",
      "Stock transfers",
      "Purchases and supplier payments",
      "Credit sales and customer balances",
      "Advanced reports and sales analytics",
      "User roles and permissions",
      "Low-stock alerts",
      "WhatsApp/SMS notification integration",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    audience: "For established businesses operating multiple locations.",
    monthly: 5000,
    annual: 54000,
    effectiveMonthly: 4500,
    details: [
      "Everything in Growth",
      "10 branches",
      "15 registers",
      "30 users",
      "Advanced multi-branch management",
      "Centralized inventory",
      "Advanced user permissions",
      "Branch performance analytics",
      "Advanced financial reports",
      "Purchase and supplier analytics",
      "Customer credit management",
      "Audit logs",
      "Custom receipt and invoice branding",
      "API and integration capabilities",
      "Priority support",
    ],
  },
];

const comparison = [
  ["POS and receipts", true, true, true],
  ["Products and inventory", true, true, true],
  ["Customers and suppliers", true, true, true],
  ["Purchases and supplier payments", false, true, true],
  ["Customer credit", false, true, true],
  ["Stock transfers", false, true, true],
  ["Multiple branches", false, true, true],
  ["Advanced reports", false, true, true],
  ["Advanced permissions", false, false, true],
  ["Priority support", false, false, true],
] as const;

const faqs = [
  [
    "What is DukaOS?",
    "DukaOS is a business operating system for sales, inventory, purchases, customers, suppliers, branches, users, and reports in one secure workspace.",
  ],
  [
    "Who is DukaOS for?",
    "DukaOS is designed for retail shops, supermarkets, pharmacies, beauty and cosmetics businesses, wholesalers, and growing teams.",
  ],
  [
    "Can I manage multiple branches and warehouses?",
    "Yes. DukaOS connects branches, registers, warehouses, users, and stock movements as your operation grows.",
  ],
  [
    "Can I sell products on credit?",
    "Yes. Record credit sales, track outstanding customer balances, and capture partial or full payments.",
  ],
  [
    "Can I record purchases without a purchase order?",
    "Yes. Direct purchases can be recorded when goods arrive, with received stock and supplier balances updated together.",
  ],
  [
    "Do I need special hardware?",
    "DukaOS runs in a web browser on compatible computers and POS devices, so you can use equipment that fits your business.",
  ],
  [
    "How do I get started?",
    "Create an account, set up your business, add products and opening stock, then begin processing sales through your workspace.",
  ],
] as const;

function Logo({ footer = false }: { footer?: boolean }) {
  return footer ? (
    <Link href="/" className="flex items-center gap-2" aria-label="DukaOS home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
        D
      </span>
      <span className="text-lg font-bold tracking-[0.16em]">
        DUKA<span className="text-[#8de0c1]">OS</span>
      </span>
    </Link>
  ) : (
    <Link href="/" aria-label="DukaOS home">
      <Image
        src="/images/DukaOS-logo2.png"
        alt="DukaOS"
        width={160}
        height={40}
        className="h-10 w-auto object-contain"
        style={{ width: "auto", height: "auto" }}
        priority
      />
    </Link>
  );
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f3f7f5]">
            <th className="p-4 font-semibold">Capability</th>
            <th className="p-4 text-center font-semibold">Starter</th>
            <th className="p-4 text-center font-semibold text-primary">
              Growth
            </th>
            <th className="p-4 text-center font-semibold">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map(([name, starter, business, enterprise]) => (
            <tr key={name} className="border-b border-border last:border-0">
              <td className="p-4 text-muted-foreground">{name}</td>
              {[starter, business, enterprise].map((enabled, index) => (
                <td key={index} className="p-4 text-center">
                  {enabled ? (
                    <Check className="mx-auto text-primary" size={18} />
                  ) : (
                    <span className="text-border-strong">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const formatKes = (amount: number) => `KES ${amount.toLocaleString("en-KE")}`;

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Simple pricing. Powerful business management.
          </p>
          <h2 className="premium-serif mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Start small, grow without limits.
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Choose the DukaOS plan that fits your business, then add the setup
            support you need to get operational.
          </p>
        </div>
        <div className="inline-flex self-start rounded-lg border border-border bg-white p-1 shadow-sm lg:self-end">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold tracking-[0.02em] ${!annual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            aria-pressed={!annual}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold tracking-[0.02em] ${annual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            aria-pressed={annual}
          >
            Annual <span className="text-[#8de0c1]">(-10%)</span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex flex-col rounded-xl border p-7 ${plan.popular ? "border-primary bg-[#effaf5] shadow-[0_16px_35px_rgba(15,123,108,0.12)]" : "border-border bg-white"}`}
          >
            {plan.popular && (
              <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="mt-2 min-h-10 max-w-[16rem] text-sm leading-5 text-muted-foreground">
              {plan.audience}
            </p>
            <div className="mt-7">
              <p className="text-3xl font-semibold tracking-tight text-primary">
                {annual ? formatKes(plan.effectiveMonthly) : formatKes(plan.monthly)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </p>
              {annual ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatKes(plan.annual)} billed annually
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Cancel anytime</p>
              )}
            </div>
            <div className="my-6 border-t border-border" />
            <div className="flex-1">
              {plan.details.map((item) => (
                <p key={item} className="mb-3 flex gap-2 text-sm">
                  <Check className="mt-0.5 shrink-0 text-primary" size={16} />
                  {item}
                </p>
              ))}
            </div>
            <Link
              href={plan.name === "Enterprise" ? "/contact#form" : "/register"}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold ${plan.popular ? "bg-primary text-white hover:bg-primary-hover" : "border border-border-strong hover:border-primary hover:text-primary"}`}
            >
              {plan.name === "Starter" ? "Get started" : plan.name === "Growth" ? "Start growing" : "Contact sales"}
              <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-primary/20 bg-[#e9f8f0] p-5 text-center text-sm text-muted-foreground">
        <strong className="text-foreground">Annual billing saves 10%.</strong>{" "}
        Need more branches, registers, or users? Contact our sales team for a
        custom DukaOS plan.
      </div>

      <div className="mt-12 rounded-2xl border border-[#c6e7d8] bg-[#103f38] p-6 text-white shadow-[0_20px_45px_rgba(16,63,56,0.14)] sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8de0c1]">
              DukaOS launch offer
            </p>
            <h3 className="premium-serif mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Get your business operational from day one.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">
              The first 10 businesses get 30% off installation. The software
              subscription remains separate and starts from KES 1,200/month.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#8de0c1]/50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8de0c1]">
            First 10 clients
          </span>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#8de0c1]/50 bg-[#8de0c1]/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8de0c1]">
              Simple Desktop POS
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl font-semibold">KES 35,000</p>
              <p className="text-xs text-emerald-50/65">one-time</p>
            </div>
            <p className="mt-1 text-xs text-emerald-50/65">
              A clean starting point for small shops, boutiques, salons, and growing businesses.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-emerald-50/85">
              {["Desktop system unit", "19-20 inch monitor", "Keyboard and mouse", "Thermal receipt printer", "DukaOS POS installation", "Register and business configuration", "Basic product setup", "Staff training"].map((item) => <li key={item} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#8de0c1]" />{item}</li>)}
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-sm font-medium text-[#d8f7e8]">
              Subscription from KES 1,200/month.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8de0c1]">
              Complete Retail POS
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl font-semibold">KES 50,000+</p>
              <p className="text-xs text-emerald-50/65">configured to fit</p>
            </div>
            <p className="mt-1 text-xs text-emerald-50/65">
              Add the hardware and setup needed for busier retail operations.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-emerald-50/85">
              {["Everything in Simple Desktop POS", "Barcode scanner", "Cash drawer", "Power backup options", "Expanded product and register setup", "Staff onboarding and training"].map((item) => <li key={item} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#8de0c1]" />{item}</li>)}
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-sm font-medium text-[#d8f7e8]">
              Optional hardware is quoted around your workflow.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8de0c1]">
              Custom POS Setup
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl font-semibold">Quote</p>
              <p className="text-xs text-emerald-50/65">for complex operations</p>
            </div>
            <p className="mt-1 text-xs text-emerald-50/65">
              Built for supermarkets, multi-branch businesses, and multiple-register deployments.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-emerald-50/85">
              {["Multi-register configuration", "Multi-branch setup", "Custom hardware planning", "Advanced onboarding", "Workflow and permissions setup", "Deployment support"].map((item) => <li key={item} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#8de0c1]" />{item}</li>)}
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-sm font-medium text-[#d8f7e8]">
              Talk to sales about your operating model.
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-5">
          <p className="text-sm font-semibold text-[#d8f7e8]">Already have your hardware?</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold">KES 7,000</p>
            <p className="text-sm text-emerald-50/50 line-through">KES 10,000</p>
            <p className="text-xs text-emerald-50/65">launch installation price for the first 10 clients</p>
          </div>
          <p className="mt-2 text-sm text-emerald-50/75">DukaOS installation, POS and register configuration, business setup, product import assistance, printer/scanner configuration, staff onboarding, and basic training. You provide the hardware. We make it work with DukaOS.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-emerald-50/65">
          <span>Optional: barcode scanner</span>
          <span>Optional: cash drawer</span>
          <span>Optional: UPS</span>
          <span>Optional: customer display</span>
          <span>Optional: additional monitor</span>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/15 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-emerald-50/75">Software subscription required from <strong className="text-white">KES 1,200/month</strong>.</p>
          <Link href="/contact#form" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8de0c1] px-5 py-3 text-sm font-semibold text-[#103f38] hover:bg-white">Get complete setup <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>
  );
}

export function MarketingLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("privacy");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const cookieBannerOpen = isClient && !bannerDismissed && !getCookieConsent();

  const persistConsent = (preferences: {
    essential: boolean;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => {
    setCookieConsent(preferences);
    setBannerDismissed(true);
  };

  const handleAcceptConsent = () => {
    persistConsent({
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectConsent = () => {
    persistConsent({
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = (preferences: {
    essential: boolean;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => {
    persistConsent(preferences);
  };

  return (
    <>
      <main className="overflow-hidden bg-[#f8faf9] text-foreground">
      <RevealOnScroll />
      <ScrollToTopButton />
      <header className="sticky top-0 z-50 border-b border-[#dce8e3]/80 bg-[#f8faf9]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium hover:text-primary"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(15,123,108,0.18)] hover:bg-primary-hover"
            >
              Get started <ArrowRight size={15} />
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-md border border-border bg-white lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-nav-backdrop fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              className="absolute inset-0 bg-[#0f172a]/30"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="mobile-nav-panel relative flex h-full w-[min(84vw,360px)] flex-col border-r border-border bg-white p-5 shadow-[16px_0_40px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Menu</span>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={19} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 pt-4 text-sm">
                {navItems.map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-3 font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto space-y-2 border-t border-border pt-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex rounded-md border border-border px-3 py-3 font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-white"
                >
                  Get started <ArrowRight size={15} />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </header>

      <section
        className="reveal-on-scroll relative overflow-hidden border-b border-[#dce8e3]"
        style={{
          backgroundImage: "url('/images/hero1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.86)_32%,rgba(255,255,255,0.72)_48%,rgba(255,255,255,0.22)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-10 lg:pb-24">
          <div className="max-w-xl">
            <p className="mb-6 inline-flex items-center gap-2 border border-primary/20 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="h-1.5 w-1.5 bg-primary" /> Business
              operations, connected
            </p>
            <h1 className="premium-serif text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-5xl lg:text-[4.1rem]">
              The complete operating system{" "}
              <span className="text-primary">for your business.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              DukaOS brings sales, inventory, purchases, customers, suppliers,
              branches, and reporting into one connected platform for growing
              businesses.
            </p>
            <div className="mt-8 flex flex-row flex-wrap justify-start gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold tracking-[0.02em] text-white shadow-[0_12px_24px_rgba(15,123,108,0.2)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Start free <ArrowRight size={17} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-white/80 px-6 py-3.5 text-sm font-semibold tracking-[0.02em] text-foreground transition-all duration-150 hover:border-primary hover:text-primary"
              >
                Explore features
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {[
                "Sales & POS",
                "Inventory",
                "Purchases",
                "Customer credit",
                "Multi-branch",
                "Reports",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={14} className="text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      <section className="reveal-on-scroll border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <div className="grid overflow-hidden border border-border bg-[#f8fbfa] shadow-[0_10px_24px_rgba(15,123,108,0.04)] sm:grid-cols-3">
            {[
              {
                icon: ReceiptText,
                title: "Sell with confidence",
                text: "Every transaction accounted for",
              },
              {
                icon: WalletCards,
                title: "Know what is owed",
                text: "Credit and supplier balances in view",
              },
              {
                icon: ShieldCheck,
                title: "Keep control",
                text: "Secure roles and isolated workspaces",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group relative flex gap-3 border-l border-border px-5 py-5 first:border-l-0 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[inset_0_1px_0_rgba(15,123,108,0.08)]"
              >
                <Icon className="mt-0.5 shrink-0 text-primary transition-transform duration-200 group-hover:scale-[1.04]" size={22} />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            The everyday questions
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
            Running a business should not mean running around for information.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            DukaOS replaces memory, loose paper, and scattered spreadsheets with
            one reliable operational picture.
          </p>
        </div>
        <div className="mt-10 grid overflow-hidden border border-border bg-white sm:grid-cols-2 lg:grid-cols-5">
          {[
            [
              "How much stock do I have?",
              "See stock levels across products, warehouses, and branches.",
            ],
            [
              "Where is my money going?",
              "Follow sales, purchases, payments, and balances.",
            ],
            ["Who owes me?", "Keep customer credit visible and actionable."],
            [
              "What do I owe suppliers?",
              "Record purchases and know what remains outstanding.",
            ],
            [
              "How is the business performing?",
              "Turn daily transactions into useful reports.",
            ],
          ].map(([title, text], index) => {
            const isLastColumn = (index + 1) % 5 === 0;
            const isLastRow = index >= 3;

            return (
              <div
                key={title}
                className={[
                  "group bg-white p-5 transition-colors duration-200 hover:bg-[#f3f8ff]",
                  !isLastColumn ? "border-r border-border" : "",
                  !isLastRow ? "border-b border-border" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-tint font-tabular text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Query
                  </span>
                </div>
                <h3 className="mt-5 text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="reveal-on-scroll bg-[#103f38] text-white">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8de0c1]">
              More than a till
            </p>
            <h2 className="premium-serif mt-4 text-3xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-4xl">
              DukaOS is your business operating system.
            </h2>
            <p className="mt-5 text-sm leading-7 text-emerald-50/70">
              A POS records a sale. DukaOS connects the sale to inventory,
              revenue, customer history, and business reports.
            </p>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="reveal-on-scroll mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            The complete toolkit
          </p>
          <h2 className="premium-serif mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-4xl">
            Everything you need to operate with confidence.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Each part of DukaOS is useful on its own. Together, they give your
            business one source of truth.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-0 overflow-hidden border border-border bg-white sm:grid-cols-2 lg:grid-cols-3">
          {featureGroups.map(({ name, description, items }, index) => {
            const isLastColumn = (index + 1) % 3 === 0;
            const isLastRow = index >= featureGroups.length - (featureGroups.length % 3 === 0 ? 3 : featureGroups.length % 3);

            return (
              <article
                key={name}
                className={[
                  "reveal-on-scroll bg-white p-7 transition-colors duration-200 hover:bg-[#f3f8ff]",
                  !isLastColumn ? "border-r border-border" : "",
                  !isLastRow ? "border-b border-border" : "",
                ].join(" ")}
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-tint text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-tabular text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">
                  {name}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
                <ul className="mt-5 space-y-2 border-t border-border pt-5">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-xs text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 shrink-0 text-primary"
                        size={15}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      

      <section
        id="workflows"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Workflows that make sense
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-5xl">
            From the first action to the full picture.
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            When work happens in one place, the next step does not get lost.
          </p>
        </div>
        <div className="mt-12 grid overflow-hidden border border-border bg-white lg:grid-cols-3">
          {workflows.map(({ title, steps }, index) => {
            const isLastColumn = index === workflows.length - 1;

            return (
              <article
                key={title}
                className={[
                  "group bg-white p-6 transition-colors duration-200 hover:bg-[#f3f8ff]",
                  !isLastColumn ? "border-r border-border" : "",
                  "border-b border-border lg:border-b-0",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-tint text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-tabular text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {title}
                </h3>
                <div className="mt-6 space-y-2">
                  {steps.map((step, stepIndex) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-tint font-tabular text-[10px] font-bold text-primary">
                        {stepIndex + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {step}
                      </span>
                      {stepIndex < steps.length - 1 && (
                        <ArrowRight
                          className="ml-auto text-border-strong"
                          size={14}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="industries" className="border-y border-border bg-[#eef5f1]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Built around real businesses
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-5xl">
            A clearer way to run the business you already have.
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Retail shops",
                "Manage sales, stock, suppliers, customers, and daily operations.",
              ],
              [
                "Supermarkets",
                "Coordinate large product catalogs, registers, and replenishment.",
              ],
              [
                "Pharmacies",
                "Keep inventory, suppliers, and customer transactions structured.",
              ],
              [
                "Beauty and cosmetics",
                "Track variants, fast-moving products, and repeat customers.",
              ],
              [
                "Wholesalers",
                "Manage large purchases, customer accounts, and supplier balances.",
              ],
              [
                "Growing teams",
                "Give each person the access they need to do good work.",
              ],
            ].map(([name, text], index) => (
              <div
                key={name}
                className="flex gap-4 rounded-lg border border-border bg-white p-5"
              >
                <span className="font-tabular text-xs font-semibold text-primary">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Before and after
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">
              Trade uncertainty for a business you can see.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <div className="bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Without DukaOS
              </p>
              {[
                "Manual stock counting",
                "Paper sales records",
                "Forgotten customer debts",
                "Supplier balances in notebooks",
                "Separate spreadsheets",
                "Difficult branch management",
              ].map((item) => (
                <p key={item} className="mt-4 text-sm text-muted-foreground">
                  {item}
                </p>
              ))}
            </div>
            <div className="bg-[#e9f8f0] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                With DukaOS
              </p>
              {[
                "Real-time stock records",
                "Digital transaction history",
                "Customer credit tracking",
                "Supplier payment history",
                "One connected system",
                "Centralized branch management",
              ].map((item) => (
                <p
                  key={item}
                  className="mt-4 flex items-center gap-2 text-sm font-medium"
                >
                  <Check className="text-primary" size={15} />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Your first day
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Get your business running in four steps.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              [
                "01",
                "Create your account",
                "Register your business and owner account.",
              ],
              [
                "02",
                "Configure your business",
                "Set up branches, warehouses, registers, and team members.",
              ],
              [
                "03",
                "Add your products",
                "Create products or import your opening inventory.",
              ],
              [
                "04",
                "Start operating",
                "Process sales and manage the business from one workspace.",
              ],
            ].map(([number, title, text]) => (
              <div key={number} className="border-t-2 border-primary pt-5">
                <span className="font-tabular text-xs font-semibold text-primary">
                  {number}
                </span>
                <h3 className="mt-7 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="border-y border-border bg-[#eef5f1]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Plan details
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">
              Compare what is included.
            </h2>
          </div>
          <ComparisonTable />
        </div>
      </section>

      

      <section className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Questions, answered
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">
              Clarity before commitment.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The practical details you need before bringing your business into
              DukaOS.
            </p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {question}
                  <ChevronDown
                    className="shrink-0 text-primary transition-transform group-open:rotate-180"
                    size={18}
                  />
                </summary>
                <p className="max-w-2xl pr-8 pt-3 text-sm leading-6 text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-[#dff3e9]">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Ready to run smarter?
          </p>
          <h2 className="premium-serif mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Ready to run your business smarter?
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Start managing sales, inventory, customers, payments, and reporting
            in one connected workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold tracking-[0.02em] text-white shadow-[0_10px_20px_rgba(15,123,108,0.18)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              Get started <ArrowRight size={17} />
            </Link>
            <Link
              href="/login"
              className="text-center text-sm font-semibold tracking-[0.01em] text-primary hover:underline"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter onOpenLegal={(tab) => {
        setLegalTab(tab);
        setLegalOpen(true);
      }} />

      <CookieConsentBanner
        open={cookieBannerOpen}
        onAccept={handleAcceptConsent}
        onReject={handleRejectConsent}
        onSavePreferences={handleSavePreferences}
        onOpenLegal={(tab) => {
          setLegalTab(tab);
          setLegalOpen(true);
        }}
      />

      <LegalModal
        open={legalOpen}
        tab={legalTab}
        onTabChange={setLegalTab}
        onClose={() => setLegalOpen(false)}
      />
    </main>
    </>
  );
}
