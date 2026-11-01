import { notFound, redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/admin-session";
import { rawPrisma } from "@/server/db/client";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { InquiryManagement } from "../inquiry-management";

function referenceFor(id: string) {
  return `INQ-${id.toUpperCase()}`;
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!await getCurrentAdmin()) redirect("/admin/login");
  const { id } = await params;
  const inquiry = await rawPrisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();

  const reference = referenceFor(inquiry.id);
  const whatsappUrl = buildWhatsAppUrl(
    inquiry.phone,
    `Hello ${inquiry.name}, thank you for contacting DukaOS. We are following up on your inquiry ${reference}${inquiry.productOrService ? ` about ${inquiry.productOrService}` : ""}.`,
  );
  const submittedAt = new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(inquiry.createdAt);
  const safeProductUrl = (() => {
    if (!inquiry.productUrl) return null;
    try {
      const url = new URL(inquiry.productUrl);
      return url.protocol === "https:" || url.protocol === "http:"
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  })();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Inquiry inbox</p>
            <h1 className="mt-2 text-3xl font-semibold">{reference}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Submitted {submittedAt}</p>
          </div>
          <a href="/admin" className="text-sm font-semibold text-primary hover:underline">Admin dashboard</a>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-5">
            <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{inquiry.subject}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{inquiry.businessName}</p>
                </div>
                <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">
                  {inquiry.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original message</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{inquiry.message}</p>
              </div>
              {inquiry.productOrService && (
                <p className="mt-5 text-sm"><strong>Product/service:</strong> {inquiry.productOrService}</p>
              )}
              {inquiry.productId && (
                <p className="mt-2 break-all text-sm"><strong>Product ID:</strong> {inquiry.productId}</p>
              )}
              {safeProductUrl && (
                <p className="mt-2 break-all text-sm">
                  <strong>Product URL:</strong>{" "}
                  <a href={safeProductUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {safeProductUrl}
                  </a>
                </p>
              )}
            </article>

            <InquiryManagement
              id={inquiry.id}
              status={inquiry.status}
              internalNotes={inquiry.internalNotes}
              notificationStatus={inquiry.notificationStatus}
              whatsappUrl={whatsappUrl}
            />
          </section>

          <aside className="h-fit rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold">Customer details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="mt-1 font-medium">{inquiry.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Business</dt><dd className="mt-1 font-medium">{inquiry.businessName}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="mt-1"><a href={`tel:${inquiry.phone}`} className="break-all font-medium text-primary">{inquiry.phone}</a></dd></div>
              <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1"><a href={`mailto:${inquiry.email}`} className="break-all font-medium text-primary">{inquiry.email}</a></dd></div>
              {inquiry.businessType && <div><dt className="text-xs text-muted-foreground">Business type</dt><dd className="mt-1">{inquiry.businessType}</dd></div>}
              {inquiry.numberOfLocations && <div><dt className="text-xs text-muted-foreground">Locations</dt><dd className="mt-1">{inquiry.numberOfLocations}</dd></div>}
              {inquiry.currentSystem && <div><dt className="text-xs text-muted-foreground">Current system</dt><dd className="mt-1">{inquiry.currentSystem}</dd></div>}
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
