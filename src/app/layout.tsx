import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DukaOS | POS, Inventory & Business Management Software for Kenyan Businesses",
  description:
    "DukaOS is a modern POS, inventory, purchases, customer credit, supplier, and reporting system built for growing Kenyan retail and service businesses.",
  applicationName: "DukaOS",
  keywords: [
    "POS system in Kenya",
    "POS software Kenya",
    "Best POS in Kenya",
    "inventory management software Kenya",
    "retail POS Kenya",
    "business management system Kenya",
    "small business POS",
    "multi-branch POS Kenya",
    "customer credit management",
    "supplier management software",
    "DukaOS",
  ],
  authors: [{ name: "DukaOS" }],
  creator: "DukaOS",
  publisher: "DukaOS",
  verification: {
    google: "9yUtOp4x4_dyRzn_RLhsCLNsI2W8O-43j6Kr6iWFIAY",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/images/DukaOS-logo.png",
    shortcut: "/images/DukaOS-logo.png",
    apple: "/images/DukaOS-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${playfairDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          id="dukaos-theme-bootstrap"
          dangerouslySetInnerHTML={{
            __html:
              'try { if (localStorage.getItem("dukaos-theme") === "dark") document.documentElement.classList.add("dark"); } catch {}',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
