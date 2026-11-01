import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/auth/admin-session";
import { rawPrisma } from "@/server/db/client";
import { AdministratorManagement } from "./administrator-management";

export default async function AdministratorsPage() {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) redirect("/admin/login");
  if (currentAdmin.role !== "SUPER_ADMIN") redirect("/admin");

  const [admins, invitations, events] = await Promise.all([
    rawPrisma.platformAdmin.findMany({
      orderBy: [{ createdAt: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    rawPrisma.platformAdminInvitation.findMany({
      where: { usedAt: null, revokedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        expiresAt: true,
        deliveryStatus: true,
        createdAt: true,
      },
    }),
    rawPrisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        actorAdminId: true,
        targetAdminId: true,
        targetUserId: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 sm:px-8">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-primary hover:underline">DukaOS Admin</Link>
          <p className="text-xs text-muted-foreground">Super Admin account management</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-primary hover:underline">Back to dashboard</Link>
      </header>
      <AdministratorManagement
        currentAdminId={currentAdmin.id}
        admins={admins.map((admin) => ({
          ...admin,
          createdAt: admin.createdAt.toISOString(),
          lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
        }))}
        invitations={invitations.map((invitation) => ({
          ...invitation,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
        }))}
        events={events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() }))}
      />
    </main>
  );
}
