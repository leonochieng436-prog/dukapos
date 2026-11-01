import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration | DukaOS",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}