import type { Metadata } from "next";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { AboutPageContent } from "@/components/marketing/about-page";

export const metadata: Metadata = createPageMetadata(
  "About DukaOS | Business Management & POS Software in Kenya",
  "Learn how DukaOS helps Kenyan businesses manage sales, inventory, purchases, customers, suppliers, branches and reports from one business management system.",
  "/about",
);

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About DukaOS",
    description:
      "Learn how DukaOS helps Kenyan businesses manage sales, inventory, purchases, customers, suppliers, branches and reports from one business operating system.",
    url: `${siteUrl}/about`,
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "DukaOS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      areaServed: "Kenya",
      description:
        "DukaOS is a business operating system for POS, inventory, purchases, customers, suppliers, reports and multi-branch management.",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <AboutPageContent />
    </>
  );
}
