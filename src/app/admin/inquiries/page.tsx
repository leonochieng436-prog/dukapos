import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { InquiryStatus, type Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/server/auth/admin-session";
import { rawPrisma } from "@/server/db/client";

const pageSize = 25;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateParam(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatStatus(status: InquiryStatus) {
  return status.replace("_", " ");
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!await getCurrentAdmin()) redirect("/admin/login");
  const params = await searchParams;
  const query = (first(params.q) ?? "").trim().slice(0, 100);
  const statusValue = first(params.status);
  const status = Object.values(InquiryStatus).find((item) => item === statusValue);
  const from = first(params.from);
  const to = first(params.to);
  const requestedPage = Number(first(params.page) ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const createdAt: Prisma.DateTimeFilter = {};
  const start = dateParam(from);
  const end = dateParam(to, true);
  if (start) createdAt.gte = start;
  if (end) createdAt.lte = end;

  const where: Prisma.InquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(start || end ? { createdAt } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" } },
            ...(query.replace(/\D/g, "")
              ? [{ phoneDigits: { contains: query.replace(/\D/g, "") } }]
              : []),
          ],
        }
      : {}),
  };
  const [total, newCount, filteredCount] = await Promise.all([
    rawPrisma.inquiry.count(),
    rawPrisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
    rawPrisma.inquiry.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));
  const activePage = Math.min(page, pageCount);
  const inquiries = await rawPrisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (activePage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      businessName: true,
      phone: true,
      email: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  function pageHref(targetPage: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    next.set("page", String(targetPage));
    return `/admin/inquiries?${next.toString()}`;
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Platform administration</p>
            <h1 className="mt-2 text-3xl font-semibold">Inquiry inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">Review, prioritize and follow up on customer inquiries.</p>
          </div>
          <Link href="/admin" className="text-sm font-semibold text-primary hover:underline">Admin dashboard</Link>
        </header>

        <section aria-label="Inquiry totals" className="grid gap-4 sm:grid-cols-3">
          {[
            ["Total inquiries", total],
            ["New / unread", newCount],
            ["Matching filters", filteredCount],
          ].map(([label, count]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{count}</p>
            </div>
          ))}
        </section>

        <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] lg:items-end">
          <label className="text-sm font-medium">
            Search name, phone or email
            <span className="relative mt-2 block">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input name="q" defaultValue={query} maxLength={100} className="h-10 w-full rounded-lg border border-border-strong bg-background pl-9 pr-3 text-sm" />
            </span>
          </label>
          <label className="text-sm font-medium">
            Status
            <select name="status" defaultValue={status ?? ""} className="mt-2 h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm">
              <option value="">All statuses</option>
              {Object.values(InquiryStatus).map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            From
            <input name="from" type="date" defaultValue={from} className="mt-2 h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm" />
          </label>
          <label className="text-sm font-medium">
            To
            <input name="to" type="date" defaultValue={to} className="mt-2 h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">Apply filters</button>
        </form>

        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          {inquiries.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <h2 className="font-semibold">No inquiries found</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try changing the search or filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{inquiry.name}</h2>
                      <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[10px] font-semibold uppercase text-primary">{formatStatus(inquiry.status)}</span>
                      <span className="text-xs text-muted-foreground">{inquiry.businessName}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{inquiry.subject}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{inquiry.message}</p>
                    <p className="mt-2 break-all text-xs text-muted-foreground">{inquiry.phone} · {inquiry.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                    <time dateTime={inquiry.createdAt.toISOString()} className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(inquiry.createdAt)}
                    </time>
                    <Link href={`/admin/inquiries/${encodeURIComponent(inquiry.id)}`} className="inline-flex min-h-10 items-center rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                      View inquiry
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          {filteredCount > 0 && (
            <nav aria-label="Inquiry pages" className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
              <p className="text-muted-foreground">Page {activePage} of {pageCount} · {filteredCount} results</p>
              <div className="flex gap-2">
                {activePage > 1 && <Link href={pageHref(activePage - 1)} className="rounded-md border border-border px-3 py-2 hover:border-primary">Previous</Link>}
                {activePage < pageCount && <Link href={pageHref(activePage + 1)} className="rounded-md border border-border px-3 py-2 hover:border-primary">Next</Link>}
              </div>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
