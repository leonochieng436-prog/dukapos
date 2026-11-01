"use client"; 
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  Layers3,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { MarketingFooter, MarketingPageHeader, RevealOnScroll, ScrollToTopButton } from "@/components/marketing/page-shell";
import { LegalModal, type LegalTab } from "@/components/legal-popups";

const problemFlow = [
  "Sale",
  "Manual stock updates",
  "Separate records",
  "Manual reports",
  "Guesswork",
];

const businessTypes = [
  "Retail shops",
  "Supermarkets",
  "Wholesalers",
  "Pharmacies",
  "Hardware stores",
  "Beauty & cosmetics businesses",
  "Electronics shops",
  "Restaurants",
  "Distributors",
  "Growing multi-branch businesses",
];

const kenyaValues = [
  {
    title: "Local business operations",
    description:
      "Designed for Kenyan SMEs and growing businesses that need clarity across daily operations.",
    icon: Building2,
  },
  {
    title: "Mobile-money ready",
    description:
      "Built for modern Kenyan payment workflows, including mobile-money-based transactions where enabled by the business setup.",
    icon: CreditCard,
  },
  {
    title: "Multi-branch visibility",
    description:
      "Monitor activity across locations from a single workspace without losing operational context.",
    icon: Layers3,
  },
  {
    title: "KES-first experience",
    description:
      "Use Kenyan Shilling naturally throughout pricing, sales, and reporting experiences.",
    icon: BarChart3,
  },
  {
    title: "Simple operations",
    description:
      "Give owners and staff practical tools that hold up in daily business operations.",
    icon: ShieldCheck,
  },
];

const platformAreas = [
  {
    title: "Point of sale",
    description: "Process sales quickly and accurately.",
    icon: ShoppingCart,
  },
  {
    title: "Inventory",
    description: "Track stock movement, availability and valuation.",
    icon: Boxes,
  },
  {
    title: "Purchases",
    description: "Manage purchases, suppliers and incoming stock.",
    icon: Truck,
  },
  {
    title: "Customers",
    description: "Maintain customer records and purchase history.",
    icon: Users,
  },
  {
    title: "Suppliers",
    description: "Organize supplier relationships and purchasing activity.",
    icon: Building2,
  },
  {
    title: "Branches",
    description: "Manage multiple business locations from one system.",
    icon: MapPin,
  },
  {
    title: "Users & roles",
    description: "Give team members the access they need.",
    icon: ShieldCheck,
  },
  {
    title: "Payments",
    description: "Track different payment methods and transactions.",
    icon: CreditCard,
  },
  {
    title: "Reports & analytics",
    description: "Turn business activity into useful insights.",
    icon: BarChart3,
  },
];

export function AboutPageContent() {
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("privacy");

  return (
    <>
      <main className="min-h-screen bg-[#f8faf9] text-foreground">
        <RevealOnScroll />
        <ScrollToTopButton />
        <MarketingPageHeader active="about" onOpenLegal={(tab) => {
          setLegalTab(tab);
          setLegalOpen(true);
        }} />

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
                <span className="h-1.5 w-1.5 bg-primary" /> About DukaOS
              </p>
              <h1 className="premium-serif text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-5xl lg:text-[4.1rem]">
                More than a till. <span className="text-primary">Your business operating system.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                DukaOS connects the moving parts of your business in one place — from the moment a sale is made to the moment you understand your stock, revenue, customers, and performance.
              </p>
              <div className="mt-8 flex flex-row flex-wrap justify-start gap-3">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold tracking-[0.02em] text-white shadow-[0_12px_24px_rgba(15,123,108,0.2)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-primary-hover">
                  Get started <ArrowRight size={17} />
                </Link>
                <Link href="/#features" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-white/80 px-6 py-3.5 text-sm font-semibold tracking-[0.02em] text-foreground transition-all duration-150 hover:border-primary hover:text-primary">
                  Explore DukaOS
                </Link>
              </div>
            </div>

            
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">The problem</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Running a business shouldn&apos;t mean piecing everything together.
            </h2>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                Many businesses manage different parts of their operations separately: sales at the till, stock in notebooks, purchases in spreadsheets, customer information scattered across messages and personal contacts, and branch performance difficult to compare.
              </p>
              <p>
                DukaOS replaces that disconnected workflow with one business picture, so leaders can respond to what is actually happening instead of guessing.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_16px_38px_rgba(18,57,51,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Traditional POS</p>
              <div className="mt-6 space-y-3">
                {problemFlow.map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-tint text-[10px] font-bold text-primary">{index + 1}</span>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Built for real businesses</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Built for the way businesses actually operate.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-0 overflow-hidden border border-border bg-white sm:grid-cols-2 lg:grid-cols-3">
            {businessTypes.map((item, index) => {
              const isLastColumn = (index + 1) % 3 === 0;
              const isLastRow = index >= businessTypes.length - (businessTypes.length % 3 === 0 ? 3 : businessTypes.length % 3);

              return (
                <div
                  key={item}
                  className={[
                    "flex items-center gap-3 bg-white p-5 transition-colors duration-200 hover:bg-[#f3f8ff]",
                    !isLastColumn ? "border-r border-border" : "",
                    !isLastRow ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <span className="font-tabular text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[#eef5f1]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Built for Kenya</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                Built with Kenyan businesses in mind.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                DukaOS is designed around the realities of running a business in Kenya — where owners need visibility across sales, stock, cash flow, suppliers, customers and multiple locations without unnecessary complexity.
              </p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
              {kenyaValues.map(({ title, description, icon: Icon }) => (
                <div key={title} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                  <Icon className="text-primary" size={22} />
                  <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What DukaOS connects</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Everything your business needs. Connected.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-0 overflow-hidden border border-border bg-white sm:grid-cols-2 lg:grid-cols-3">
            {platformAreas.map(({ title, description, icon: Icon }, index) => {
              const isLastColumn = (index + 1) % 3 === 0;
              const isLastRow = index >= platformAreas.length - (platformAreas.length % 3 === 0 ? 3 : platformAreas.length % 3);

              return (
                <div
                  key={title}
                  className={[
                    "rounded-none bg-white p-7 shadow-none transition-colors duration-200 hover:bg-[#f3f8ff]",
                    !isLastColumn ? "border-r border-border" : "",
                    !isLastRow ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="text-primary" size={22} />
                    <span className="font-tabular text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-white">
  <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">

    {/* Section heading */}
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        From transactions to insights
      </p>

      <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
        Don&apos;t just record what happened.
        <span className="block text-muted-foreground">
          Understand your business.
        </span>
      </h2>

      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Every transaction moves through DukaOS, turning everyday business
        activity into connected information you can use to make better
        decisions.
      </p>
    </div>

    {/* Process */}
    <div className="mt-16">
      <div className="relative">

        {/* Desktop connector */}
        <div className="absolute left-[7%] right-[7%] top-7 hidden h-px bg-border lg:block" />

        <div className="grid gap-10 lg:grid-cols-7 lg:gap-0">
          {[
            {
              number: "01",
              title: "Sale",
              description: "A customer makes a purchase.",
            },
            {
              number: "02",
              title: "Stock movement",
              description: "Inventory updates automatically.",
            },
            {
              number: "03",
              title: "Revenue",
              description: "The transaction becomes financial data.",
            },
            {
              number: "04",
              title: "Customer history",
              description: "The customer record stays connected.",
            },
            {
              number: "05",
              title: "Business data",
              description: "Everything comes together in one system.",
            },
            {
              number: "06",
              title: "Reports",
              description: "Your data becomes clear insights.",
            },
            {
              number: "07",
              title: "Better decisions",
              description: "You know what to do next.",
            },
          ].map((step, index) => (
            <div
              key={step.number}
              className="relative flex gap-4 lg:block lg:px-3"
            >

              {/* Mobile connector */}
              {index < 6 && (
                <div className="absolute left-[15px] top-9 h-[calc(100%+40px)] w-px bg-border lg:hidden" />
              )}

              {/* Number node */}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-[10px] font-bold text-primary lg:mx-auto">
                {step.number}
              </div>

              {/* Content */}
              <div className="pt-0 lg:mt-6 lg:text-center">
                <h3 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom message */}
    <div className="mt-16 border-t border-border pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          DukaOS connects sales, inventory, customers, revenue and reporting
          so you can see what is happening across your business — not just
          what happened at the till.
        </p>

        <div className="shrink-0 text-sm font-semibold text-primary">
          One transaction. Connected data. Better decisions.
        </div>
      </div>
    </div>

  </div>
</section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="rounded-[2rem] border border-border bg-[#103f38] p-8 text-white shadow-[0_24px_60px_rgba(16,63,56,0.14)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8de0c1]">Our vision</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Helping African businesses run smarter.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-emerald-50/80">
              Our vision is simple: give businesses the technology they need to operate with greater clarity, control and confidence.
            </p>
            <p className="mt-3 max-w-3xl text-base leading-8 text-emerald-50/80">
              From a single shop to a growing network of branches, DukaOS is being built to become the operating system behind modern African businesses.
            </p>
          </div>
        </section>

       

        <section className="border-t border-border bg-[#dff3e9]">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready to run smarter?</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Ready to run your business smarter?
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Bring sales, stock, purchases, customers and business reports together with DukaOS.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-hover">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-white px-6 py-3.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                Talk to Us
              </Link>
            </div>
          </div>
        </section>

        <MarketingFooter onOpenLegal={(tab) => {
          setLegalTab(tab);
          setLegalOpen(true);
        }} />

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
