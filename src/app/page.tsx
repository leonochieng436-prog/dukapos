import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { MarketingLandingPage } from "@/components/marketing-landing-page";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DukaOS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "1200",
      priceCurrency: "KES",
      category: "POS and business management software",
    },
    description:
      "DukaOS is a POS, inventory, customer credit, purchase, and reporting platform for Kenyan businesses.",
    featureList: [
      "Point of sale",
      "Inventory control",
      "Supplier and purchase management",
      "Customer credit tracking",
      "Branch and warehouse management",
      "Business reporting",
    ],
    publisher: {
      "@type": "Organization",
      name: "DukaOS",
      sameAs: "https://dukapos-theta.vercel.app",
    },
    areaServed: "Kenya",
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
