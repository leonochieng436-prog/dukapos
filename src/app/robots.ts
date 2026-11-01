import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://dukapos-theta.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/login/",
        "/register/",
        "/forgot-password/",
        "/reset-password/",
        "/account-pending/",
        "/_next/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}