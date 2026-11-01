import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { ContactPageContent } from "@/components/marketing/contact-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact DukaOS | POS & Business Management Software Kenya",
  description:
    "Contact DukaOS for POS software, inventory management, business management solutions, demos, onboarding and support for businesses in Kenya.",
};

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact DukaOS",
    description:
      "Contact DukaOS for POS software, inventory management, business management solutions, demos, onboarding and support for businesses in Kenya.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dukapos-theta.vercel.app"}/contact`,
    about: {
      "@type": "SoftwareApplication",
      name: "DukaOS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      areaServed: "Kenya",
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
      <ContactPageContent submissionKey={randomUUID()} />
    </>
  );
}
