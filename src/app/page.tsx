import { redirect } from "next/navigation";
import { createPageMetadata, siteUrl } from "@/lib/seo";
import { getCurrentSession } from "@/server/auth/session";
import { MarketingLandingPage } from "@/components/marketing-landing-page";

export const metadata = createPageMetadata(
  "POS, Inventory & Business Management Software for Kenyan Businesses | DukaOS",
  "Manage sales, inventory, purchases, customer credit, suppliers, branches, and reports with DukaOS, a business platform built for Kenyan businesses.",
  "/",
);

export default async function RootPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "DukaOS",
        url: siteUrl,
        logo: `${siteUrl}/images/DukaOS-logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "DukaOS",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "DukaOS",
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "A POS and business management platform for sales, inventory, purchases, customer credit, suppliers, branches, and reporting.",
        featureList: [
          "Point of sale",
          "Inventory control",
          "Supplier and purchase management",
          "Customer credit tracking",
          "Branch and warehouse management",
          "Business reporting",
        ],
        publisher: { "@id": `${siteUrl}/#organization` },
        areaServed: { "@type": "Country", name: "Kenya" },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <MarketingLandingPage />
    </>
  );
}
