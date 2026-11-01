"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  invitePlatformAdmin,
  resendPlatformAdminInvitation,
  revokePlatformAdminInvitation,
  updatePlatformAdmin,
  type AdminSecurityActionResult,
} from "@/app/actions/admin-security";

type AdminRecord = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};
type Invitation = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  expiresAt: string;
  deliveryStatus: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
};
type SecurityEventRecord = {
  id: string;
  action: string;
  actorAdminId: string | null;
  targetAdminId: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

function ResultMessage({ result }: { result: AdminSecurityActionResult | null }) {
  if (!result) return null;
  return (
    <p role="status" className={`mt-3 text-sm ${result.ok ? "text-success" : "text-danger"}`}>
      {result.message}
    </p>
  );
}

function AdminRow({ admin, currentAdminId }: { admin: AdminRecord; currentAdminId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(admin.name);
  const [role, setRole] = useState(admin.role);
  const [active, setActive] = useState(admin.isActive);
  const [result, setResult] = useState<AdminSecurityActionResult | null>(null);

  function save() {
    if (admin.isActive && !active && !window.confirm(`Deactivate ${admin.name}? Their administrator sessions will be revoked.`)) return;
    if (admin.role !== role && !window.confirm(`Change ${admin.name}'s role to ${role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}?`)) return;
    setResult(null);
    startTransition(async () => {
      try {
        const updated = await updatePlatformAdmin({ id: admin.id, name, role, isActive: active });
        setResult(updated);
        if (updated.ok) router.refresh();
      } catch {
        setResult({ ok: false, message: "The administrator could not be updated. Please try again." });
      }
    });
  }

  return (
    <article className="grid gap-4 border-b border-border p-5 last:border-0 lg:grid-cols-[minmax(13rem,1fr)_12rem_11rem_auto] lg:items-center">
      <div className="min-w-0">
        <label className="sr-only" htmlFor={`admin-name-${admin.id}`}>Name</label>
        <input
          id={`admin-name-${admin.id}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          className="h-9 w-full rounded-md border border-border-strong bg-surface px-2 text-sm font-semibold"
        />
        <p className="mt-1 break-all text-sm text-muted-foreground">{admin.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">Created {formatDate(admin.createdAt)} · Last login {formatDate(admin.lastLoginAt)}</p>
      </div>
      <label className="text-xs text-muted-foreground">
        Role
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AdminRecord["role"])}
          disabled={admin.id === currentAdminId}
          className="mt-1 block h-9 w-full rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground disabled:opacity-60"
        >
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </label>
      <label className="text-xs text-muted-foreground">
        Account status
        <select
          value={active ? "active" : "inactive"}
          onChange={(event) => setActive(event.target.value === "active")}
          disabled={admin.id === currentAdminId}
          className="mt-1 block h-9 w-full rounded-md border border-border-strong bg-surface px-2 text-sm text-foreground disabled:opacity-60"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <button type="button" onClick={save} disabled={pending} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save changes"}
      </button>
      <div className="lg:col-span-4"><ResultMessage result={result} /></div>
    </article>
  );
}

export function AdministratorManagement({
  currentAdminId,
  admins,
  invitations,
  events,
}: {
  currentAdminId: string;
  admins: AdminRecord[];
  invitations: Invitation[];
  events: SecurityEventRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [inviteResult, setInviteResult] = useState<AdminSecurityActionResult | null>(null);
  const [invitationResult, setInvitationResult] = useState<AdminSecurityActionResult | null>(null);

  const visibleAdmins = useMemo(() => admins.filter((admin) => {
    const matchesText = `${admin.name} ${admin.email} ${admin.role}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? admin.isActive : !admin.isActive);
    return matchesText && matchesStatus;
  }), [admins, query, statusFilter]);

  function sendInvite(formData: FormData) {
    setInviteResult(null);
    startTransition(async () => {
      try {
        const result = await invitePlatformAdmin({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          role: String(formData.get("role") ?? ""),
        });
        setInviteResult(result);
        if (result.ok) {
          (document.getElementById("invite-admin-form") as HTMLFormElement | null)?.reset();
        }
        router.refresh();
      } catch {
        setInviteResult({ ok: false, message: "The invitation could not be processed. Check email settings and try again." });
      }
    });
  }

  function handleInvitationAction(action: "resend" | "revoke", invitation: Invitation) {
    if (action === "revoke" && !window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
    setInvitationResult(null);
    startTransition(async () => {
      try {
        const result = action === "resend"
          ? await resendPlatformAdminInvitation(invitation.id)
          : await revokePlatformAdminInvitation(invitation.id);
        setInvitationResult(result);
        router.refresh();
      } catch {
        setInvitationResult({ ok: false, message: "That invitation action could not be completed. Please try again." });
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Restricted to Super Admins</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Administrator management</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Invite administrators, control roles and access, and review security events. Passwords are set by account holders through single-use email links.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Invite administrator</h2>
        <p className="mt-1 text-sm text-muted-foreground">The recipient sets their own password using a link that expires in 30 minutes.</p>
        <form id="invite-admin-form" action={sendInvite} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end">
          <label className="text-sm font-medium">Name<input name="name" required minLength={2} maxLength={120} className="mt-1 block h-10 w-full rounded-md border border-border-strong bg-surface px-3" /></label>
          <label className="text-sm font-medium">Email<input name="email" type="email" required maxLength={254} className="mt-1 block h-10 w-full rounded-md border border-border-strong bg-surface px-3" /></label>
          <label className="text-sm font-medium">Role<select name="role" defaultValue="ADMIN" className="mt-1 block h-10 w-full rounded-md border border-border-strong bg-surface px-3"><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
          <button type="submit" disabled={pending} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Sending…" : "Send invitation"}</button>
        </form>
        <ResultMessage result={inviteResult} />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-semibold">Administrator accounts</h2><p className="mt-1 text-sm text-muted-foreground">{admins.length} total accounts</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted-foreground">Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email or role" className="mt-1 block h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground"><option value="ALL">All accounts</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          </div>
        </div>
        {visibleAdmins.length === 0
          ? <p className="p-8 text-center text-sm text-muted-foreground">No administrators match this search.</p>
          : visibleAdmins.map((admin) => <AdminRow key={admin.id} admin={admin} currentAdminId={currentAdminId} />)}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-5"><h2 className="text-lg font-semibold">Pending invitations</h2><p className="mt-1 text-sm text-muted-foreground">Resending creates a new token and invalidates the previous link.</p></div>
        {invitations.length === 0
          ? <p className="p-8 text-center text-sm text-muted-foreground">There are no pending invitations.</p>
          : <div className="divide-y divide-border">{invitations.map((invitation) => {
            const expired = new Date(invitation.expiresAt) <= new Date();
            return <div key={invitation.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold">{invitation.name} <span className="font-normal text-muted-foreground">· {invitation.email}</span></p><p className="mt-1 text-xs text-muted-foreground">{invitation.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"} · {expired ? "Expired" : "Expires"} {formatDate(invitation.expiresAt)} · Email {invitation.deliveryStatus.toLowerCase()}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => handleInvitationAction("resend", invitation)} disabled={pending} className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Resend</button><button type="button" onClick={() => handleInvitationAction("revoke", invitation)} disabled={pending} className="rounded-md border border-danger/30 px-3 py-2 text-sm font-semibold text-danger">Revoke</button></div>
            </div>;
          })}</div>}
        <div className="px-5 pb-3"><ResultMessage result={invitationResult} /></div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-5"><h2 className="text-lg font-semibold">Recent security events</h2><p className="mt-1 text-sm text-muted-foreground">Latest 50 administrator and password-recovery events.</p></div>
        {events.length === 0
          ? <p className="p-8 text-center text-sm text-muted-foreground">No security events have been recorded.</p>
          : <div className="divide-y divide-border">{events.map((event) => <div key={event.id} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[1fr_10rem_10rem_10rem] sm:items-center"><span className="font-medium">{event.action.replaceAll("_", " ").toLowerCase()}</span><span className="break-all text-xs text-muted-foreground">Actor: {event.actorAdminId ?? "System"}</span><span className="break-all text-xs text-muted-foreground">Target: {event.targetAdminId ?? event.targetUserId ?? "—"}</span><span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}{event.ipAddress ? ` · ${event.ipAddress}` : ""}</span></div>)}</div>}
      </section>
    </div>
  );
}
