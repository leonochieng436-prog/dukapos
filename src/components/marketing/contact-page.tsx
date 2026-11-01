"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Mail,
  Phone,
} from "lucide-react";
import { submitContactEnquiry, type ContactActionState } from "@/app/actions/contact";
import { LegalModal, type LegalTab } from "@/components/legal-popups";
import { MarketingFooter, MarketingPageHeader, RevealOnScroll, ScrollToTopButton } from "@/components/marketing/page-shell";
import { SocialLinks } from "@/components/marketing/social-links";

const faqs = [
  ["What is DukaOS?", "DukaOS is a business operating system for sales, inventory, purchases, customers, suppliers, branches, users, and reports in one connected workspace."],
  ["Is DukaOS a POS system?", "Yes. It provides point-of-sale workflows as part of a broader business management system."],
  ["Who is DukaOS designed for?", "DukaOS is designed for retail shops, supermarkets, pharmacies, beauty and cosmetics businesses, wholesalers and growing teams."],
  ["Can DukaOS manage inventory?", "Yes. DukaOS helps track stock movement, availability and valuations across the business."],
  ["Can DukaOS manage multiple branches?", "Yes. DukaOS is designed to support branch visibility and operational coordination as businesses grow."],
  ["Can DukaOS track purchases and suppliers?", "Yes. Businesses can record purchases, manage supplier balances and monitor incoming stock."],
  ["Does DukaOS support different payment methods?", "DukaOS accommodates different payment methods and transaction tracking within the operating workflow."],
  ["Can I use DukaOS for a small business?", "Yes. DukaOS is designed to support small businesses and growing operations alike."],
  ["Can DukaOS grow with my business?", "Yes. The system is designed to scale from simple operations to more complex branch and user workflows."],
  ["How can I request a DukaOS demo?", "Use the contact form on this page or send a request through the DukaOS sales channels and our team will follow up."],
] as const;

const initialState: ContactActionState = {
  ok: false,
  error: "",
  message: "",
  reference: "",
  whatsappUrl: null,
  fieldErrors: {},
};

export function ContactPageContent({ submissionKey }: { submissionKey: string }) {
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("privacy");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [state, formAction, isPending] = useActionState(submitContactEnquiry, initialState);

  const fields = useMemo(
    () => [
      { name: "fullName", label: "Full Name *" },
      { name: "businessName", label: "Business Name *" },
      { name: "email", label: "Email Address *", type: "email" },
      { name: "phone", label: "Phone Number *", type: "tel" },
    ],
    [],
  );

  return (
    <>
      <main className="min-h-screen bg-[#f8faf9] text-foreground">
        <RevealOnScroll />
        <ScrollToTopButton />
        <MarketingPageHeader active="contact" onOpenLegal={(tab) => {
          setLegalTab(tab);
          setLegalOpen(true);
        }} />

        <section className="reveal-on-scroll border-b border-border bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Contact DukaOS</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-5xl lg:text-[4rem]">
                Let&apos;s make running your business simpler.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                Have a question about DukaOS, need a product demo, or want to discuss how it can fit your business? Our team is ready to help.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#form" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-hover">
                  Request a Demo <ArrowRight size={16} />
                </a>
                <Link href="#form" className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-white px-6 py-3.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                  Talk to DukaOS
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-[#edf7f4] p-4 shadow-[0_22px_50px_rgba(15,123,108,0.08)]">
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-[10px] font-bold text-white">D</span>
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">DukaOS</span>
                  </div>
                  <span className="rounded-full bg-[#e8f6ef] px-2 py-1 text-[10px] font-semibold text-primary">Kenya ready</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["POS & business management", "Built for growing Kenyan businesses"],
                    ["Inventory visibility", "Know what you have across locations"],
                    ["Operational reporting", "Make faster decisions from live data"],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-xl border border-border bg-[#f8faf9] p-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
                      <p className="mt-1 text-sm text-foreground">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

       

        <section id="form" className="reveal-on-scroll border-y border-border bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Tell us about your business</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                Start the conversation.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Share your business needs and we&apos;ll get back to you with the right next step.
              </p>
              <div className="mt-8 space-y-4 text-sm text-muted-foreground">
                <a href="mailto:leonochieng436@gmail.com" className="flex items-start gap-3 transition hover:text-primary">
                  <Mail className="mt-0.5 text-primary" size={18} />
                  <span>leonochieng436@gmail.com</span>
                </a>
                <a href="tel:+254757308631" className="flex items-start gap-3 transition hover:text-primary">
                  <Phone className="mt-0.5 text-primary" size={18} />
                  <span>+254 757 308 631</span>
                </a>
                <SocialLinks
                  className="flex flex-wrap gap-x-4 gap-y-2"
                  linkClassName="inline-flex items-center gap-2 hover:text-primary"
                />
              </div>
            </div>

            <form action={formAction} className="rounded-2xl border border-border bg-[#f8faf9] p-5 shadow-sm sm:p-6">
              {state.ok ? (
                <div role="status" aria-live="polite" className="rounded-xl border border-success/20 bg-success-tint p-5">
                  <p className="text-lg font-semibold text-success">Inquiry received</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{state.message}</p>
                  <p className="mt-3 text-sm text-foreground">
                    Reference: <strong className="font-mono">{state.reference}</strong>
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {state.whatsappUrl ? (
                      <a
                        href={state.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
                      >
                        Continue to WhatsApp <ArrowRight size={16} />
                      </a>
                    ) : (
                      <p className="max-w-lg text-sm text-muted-foreground">
                        WhatsApp follow-up is unavailable right now. Your inquiry is saved; copy the reference above if you contact us another way.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(state.reference);
                          setCopyFeedback("Reference copied.");
                        } catch {
                          setCopyFeedback("Copy failed. Please select and copy the reference above.");
                        }
                      }}
                      className="min-h-11 rounded-xl border border-border-strong bg-white px-4 py-3 text-sm font-semibold text-foreground hover:border-primary"
                    >
                      Copy reference
                    </button>
                  </div>
                  {copyFeedback && <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">{copyFeedback}</p>}
                </div>
              ) : (
                <>
              <input type="hidden" name="submissionKey" value={submissionKey} />
              <label aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                Leave this field empty
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <label key={field.name} className="block text-sm font-medium text-foreground">
                    {field.label}
                    <input
                      id={`contact-${field.name}`}
                      name={field.name}
                      type={field.type ?? "text"}
                      required
                      autoComplete={field.name === "fullName" ? "name" : field.name === "email" ? "email" : field.name === "phone" ? "tel" : "organization"}
                      aria-invalid={Boolean(state.fieldErrors[field.name]?.[0])}
                      aria-describedby={state.fieldErrors[field.name]?.[0] ? `contact-${field.name}-error` : undefined}
                      className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    {state.fieldErrors[field.name]?.[0] ? (
                      <span id={`contact-${field.name}-error`} className="mt-1 block text-[12px] text-danger">{state.fieldErrors[field.name][0]}</span>
                    ) : null}
                  </label>
                ))}

                <label className="block text-sm font-medium text-foreground">
                  Business Type
                  <select name="businessType" className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                    <option value="">Select</option>
                    <option>Retail Shop</option>
                    <option>Supermarket</option>
                    <option>Wholesale</option>
                    <option>Pharmacy</option>
                    <option>Hardware</option>
                    <option>Beauty &amp; Cosmetics</option>
                    <option>Restaurant</option>
                    <option>Electronics</option>
                    <option>Distribution</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-foreground">
                  Number of Locations
                  <select name="numberOfLocations" className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                    <option value="">Select</option>
                    <option>1</option>
                    <option>2–5</option>
                    <option>6–10</option>
                    <option>11+</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  Current POS / Business System
                  <input name="currentSystem" type="text" className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="e.g. manual records, spreadsheet, another POS" />
                </label>

                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  What are you interested in?
                  <select name="interest" className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                    <option value="">Select</option>
                    <option>POS</option>
                    <option>Inventory Management</option>
                    <option>Sales Management</option>
                    <option>Purchases</option>
                    <option>Customer Management</option>
                    <option>Multi-Branch Management</option>
                    <option>Reports &amp; Analytics</option>
                    <option>Business Management System</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  Message *
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    aria-invalid={Boolean(state.fieldErrors.message?.[0])}
                    aria-describedby={state.fieldErrors.message?.[0] ? "contact-message-error" : undefined}
                    className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Tell us more about your workflow, goals, and current challenges"
                  />
                  {state.fieldErrors.message?.[0] && (
                    <span id="contact-message-error" className="mt-1 block text-[12px] text-danger">{state.fieldErrors.message[0]}</span>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending || !submissionKey}
                aria-busy={isPending}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving inquiry..." : "Send Inquiry"} <ArrowRight size={16} />
              </button>

              {state.error ? (
                <p role="alert" className="mt-4 text-sm text-danger">{state.error}</p>
              ) : null}
                </>
              )}
            </form>
          </div>
        </section>


        <section className="reveal-on-scroll bg-[#eef5f1]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Built for businesses in Kenya</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                Kenya-first support, practical workflows.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Whether you&apos;re running a single shop in Nairobi, managing several branches, or growing your business across Kenya, DukaOS is designed to help you bring your operations together.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">FAQ</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em]">Questions, answered.</h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                    {question}
                    <ChevronDown className="shrink-0 text-primary transition-transform group-open:rotate-180" size={18} />
                  </summary>
                  <p className="max-w-2xl pr-8 pt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        
        <section className="border-t border-border bg-[#dff3e9]">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your business has enough moving parts.</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              DukaOS brings them together.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-hover">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#form" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-white px-6 py-3.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                Request a Demo
              </a>
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
