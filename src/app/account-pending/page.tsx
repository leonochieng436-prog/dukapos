import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Building2, Check, CheckCircle2, Circle, CreditCard, KeyRound, LogOut, MessageCircle } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { getCurrentSession } from "@/server/auth/session";
import { rawPrisma } from "@/server/db/client";
import { submitPaymentReference } from "@/app/actions/admin";
import { buildWhatsAppUrl, getWhatsAppBusinessNumber } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Account activation | DukaOS",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

export default async function AccountPendingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.organizationId) redirect("/login");

  const [user, organization, subscription] = await Promise.all([
    rawPrisma.user.findUniqueOrThrow({ where: { id: session.userId } }),
    rawPrisma.organization.findUniqueOrThrow({ where: { id: session.organizationId } }),
    rawPrisma.subscription.findUnique({ where: { organizationId: session.organizationId } }),
  ]);

  if (subscription?.status === "active" || subscription?.status === "trialing") {
    redirect("/dashboard");
  }

  const planName = PLAN_NAMES[subscription?.plan ?? "starter"] ?? "Selected";
  const isPaused = subscription?.status === "paused";
  const paymentReference = subscription?.paymentReference?.trim() ?? "";
  const registrationDate = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(organization.createdAt));
  const registrationReference = organization.id.slice(-8).toUpperCase();
  const whatsappMessage =
    `Hello DukaOS, I have registered ${organization.name} (${user.email}) for the ${planName} package.${paymentReference ? ` My payment reference is ${paymentReference}.` : " Please send payment instructions."} Please confirm my payment so the account can be activated.`;
  const whatsappNumber = getWhatsAppBusinessNumber();
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, whatsappMessage)
    : null;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Image src="/images/DukaOS-logo2.png" alt="DukaOS" width={160} height={40} className="h-9 w-auto object-contain" priority />
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Registration complete</div>
        </header>

        <div className="grid gap-12 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-16">
          <div className="contents">
            <section className="order-1 lg:col-start-1 lg:row-start-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary-tint text-primary"><CheckCircle2 size={28} /></div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Business onboarding</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">{isPaused ? "Your workspace is temporarily paused" : "Your business is registered"}</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{isPaused ? "The DukaOS administration team has paused this workspace. Contact support if you need help getting it resumed." : "Your DukaOS workspace has been created successfully. Complete payment verification to activate your dashboard."}</p>
            </section>

            <section className="order-3 mt-12 border-y border-border py-7 lg:col-start-1 lg:row-start-2">
              <h2 className="text-sm font-semibold">Activation progress</h2>
              <div className="mt-7 grid grid-cols-4 gap-2">
                {["Business registered", "Workspace created", isPaused ? "Workspace paused" : "Payment verification", "Dashboard activated"].map((step, index) => {
                  const completed = index < 2;
                  const current = index === 2;
                  return <div key={step} className="relative pr-2"><div className="flex items-center gap-2"><span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${completed || current ? "border-primary bg-primary text-white" : "border-border-strong text-muted-foreground"}`}>{completed ? <Check size={15} /> : current ? <span className="h-2 w-2 rounded-full bg-white" /> : <Circle size={14} />}</span>{index < 3 && <span className="hidden h-px flex-1 bg-border sm:block" />}</div><p className={`mt-3 text-[11px] leading-4 ${current ? "font-semibold text-foreground" : completed ? "text-muted-foreground" : "text-muted-foreground/70"}`}>{step}</p></div>;
                })}
              </div>
            </section>

            {!isPaused && <section className="order-4 mt-10 lg:col-start-1 lg:row-start-3">
              <div className="flex items-start gap-3"><CreditCard className="mt-0.5 text-primary" size={20} /><div><h2 className="text-lg font-semibold">Complete payment verification</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Once payment is completed, save your M-Pesa transaction reference and send it to the DukaOS team for verification.</p></div></div>
              <form action={submitPaymentReference} className="mt-6 border-l-2 border-primary pl-5 sm:pl-6">
                <input type="hidden" name="organizationId" value={session.organizationId} />
                <label htmlFor="paymentReference" className="text-sm font-semibold">M-Pesa transaction reference</label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><KeyRound className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={16} /><input id="paymentReference" name="paymentReference" defaultValue={paymentReference} placeholder="e.g. QWE1234ABC" required className="h-11 w-full rounded-lg border border-border-strong bg-surface px-3 pl-9 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" /></div><button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white">Save payment reference <ArrowRight size={16} /></button></div>
              </form>
            </section>}
          </div>

          <aside className="contents">
            <section className="order-2 rounded-[var(--radius-lg)] border border-border bg-surface lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
              <div className="border-b border-border p-6"><div className="flex items-center gap-3"><Building2 className="text-primary" size={20} /><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Business workspace</p><h2 className="mt-1 text-xl font-semibold">{organization.name}</h2></div></div></div>
              <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-6"><p className="text-xs text-muted-foreground">Selected plan</p><p className="mt-2 text-sm font-semibold">{planName}</p></div>
                <div className="p-6"><p className="text-xs text-muted-foreground">Status</p><p className="mt-2 text-sm font-semibold text-primary">{isPaused ? "Paused" : "Awaiting verification"}</p></div>
                <div className="border-t border-border p-6 sm:col-span-2"><p className="text-xs text-muted-foreground">Account</p><a href={`mailto:${user.email}`} className="mt-2 block break-words text-sm font-semibold hover:text-primary">{user.email}</a></div>
                <div className="border-t border-border p-6"><p className="text-xs text-muted-foreground">Registered</p><p className="mt-2 text-sm font-semibold">{registrationDate}</p></div>
                <div className="border-t border-border p-6"><p className="text-xs text-muted-foreground">Reference</p><p className="mt-2 font-mono text-sm font-semibold tracking-wider">{registrationReference}</p></div>
              </div>
            </section>

            <section className="order-5 mt-6 rounded-[var(--radius-lg)] border border-primary bg-primary p-6 text-white lg:col-start-2 lg:row-start-3 lg:mt-0">
              <MessageCircle size={22} />
              <h2 className="mt-5 text-xl font-semibold">{isPaused ? "Need help with your workspace?" : "Ready to activate your workspace?"}</h2>
              <p className="mt-3 text-sm leading-6 text-white/80">{isPaused ? "Contact our team on WhatsApp and we will help you resolve the workspace status." : "Send your business name, selected plan, and payment reference to our team. We will verify the payment and activate your DukaOS dashboard."}</p>
              {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-primary-tint">{isPaused ? "Contact DukaOS support" : "Confirm payment on WhatsApp"} <ArrowRight size={17} /></a> : <p className="mt-6 text-sm text-white/80">WhatsApp is unavailable. <a href="mailto:leonochieng436@gmail.com" className="font-semibold underline">Email DukaOS support</a>.</p>}
              <p className="mt-5 text-xs text-white/75">DukaOS Support{whatsappNumber && <><br /><span className="font-semibold text-white">+{whatsappNumber}</span></>}</p>
            </section>

            <form action={logout} className="order-6 mt-5 lg:col-start-2 lg:row-start-4"><button type="submit" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"><LogOut size={16} /> Log out</button></form>
          </aside>
        </div>
      </div>
    </main>
  );
}
