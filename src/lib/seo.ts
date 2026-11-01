import type { Metadata } from "next";

const defaultSiteUrl = "https://dukapos-theta.vercel.app";
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || defaultSiteUrl,
).origin;

const socialImage = "/images/DukaOS-logo2.png";

export function createPageMetadata(
  title: string,
  description: string,
  pathname: string,
): Metadata {
  const canonical = new URL(pathname, siteUrl).toString();

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_KE",
      url: canonical,
      siteName: "DukaOS",
      title,
      description,
      images: [{ url: socialImage, alt: "DukaOS business management software" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}
