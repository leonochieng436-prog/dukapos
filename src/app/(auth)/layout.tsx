import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account access | DukaOS",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="auth-welcome relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="auth-orbit auth-orbit-one" />
        <div className="auth-orbit auth-orbit-two" />
        <Link href="/" className="relative z-10 text-xl font-bold tracking-[0.18em]">
          DUKA<span className="text-[#8de0c1]">OS</span>
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9de1c7]">Premium retail operations</p>
          <h1 className="max-w-md text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">
            Welcome back. Manage your business smarter.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-emerald-50/75">
            Real-time sales, smart inventory, customer insights, and a fast POS system in one secure workspace.
          </p>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-3 border-t border-white/15 pt-5">
            <div><p className="text-lg font-semibold">Sales</p><p className="mt-1 text-[11px] text-emerald-50/60">Track every transaction</p></div>
            <div><p className="text-lg font-semibold">Stock</p><p className="mt-1 text-[11px] text-emerald-50/60">Stay ahead of demand</p></div>
            <div><p className="text-lg font-semibold">Control</p><p className="mt-1 text-[11px] text-emerald-50/60">Run with confidence</p></div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-emerald-50/45">
          &copy; {new Date().getFullYear()} DukaOS. Every business is an isolated workspace.
        </p>
      </div>
      <div className="auth-form-pane flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
