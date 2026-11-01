import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(
  "Privacy Policy | DukaOS",
  "Read the DukaOS privacy policy covering personal data, business information, security, and data subject rights.",
  "/privacy-policy",
);

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:px-10">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          DukaOS
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This Privacy Policy explains how DukaOS handles personal data and business
          information in accordance with the Kenya Data Protection Act, 2019, the
          Constitution of Kenya, and best practice information security standards.
        </p>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Draft for compliance review. Final legal wording should be checked by a
          licensed Kenyan legal or compliance professional before launch or public
          deployment.
        </div>

        <div className="mt-8 space-y-8 text-sm leading-7 text-foreground">
          <section>
            <h2 className="text-lg font-semibold">1. Purpose</h2>
            <p className="mt-2 text-muted-foreground">
              DukaOS provides business operations software for sales, inventory,
              purchases, customers, suppliers, payments, and reporting. We process
              personal and business information solely to operate the platform,
              support our customers, maintain service quality, protect security, and
              meet legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Information we collect</h2>
            <p className="mt-2 text-muted-foreground">
              We may collect names, phone numbers, email addresses, business name,
              business registration details, address information, login credentials,
              physical device data, IP addresses, transaction records, supplier and
              customer details, payment references, and other information necessary to
              deliver the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. How we use data</h2>
            <p className="mt-2 text-muted-foreground">
              We use data to onboard customers, provide the platform, maintain
              transaction history, support account access, process payments, detect
              fraud, maintain records, improve product quality, and comply with
              applicable law. We do not sell personal data to third parties for
              marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Lawful basis</h2>
            <p className="mt-2 text-muted-foreground">
              We rely on the lawful basis applicable to each activity, including
              contract performance, legitimate business interests, compliance with
              legal obligations, and consent where required by law or best practice.
              For marketing communications, we will obtain clear consent and provide
              a simple opt-out mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Security and IT controls</h2>
            <p className="mt-2 text-muted-foreground">
              We maintain reasonable technical and organisational safeguards,
              including role-based access controls, encrypted communication,
              secure hosting, access logging, staff confidentiality obligations, and
              routine review of system risks. No digital system is immune from
              attack, but we take commercially reasonable steps to reduce risk and
              respond to incidents responsibly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Data retention</h2>
            <p className="mt-2 text-muted-foreground">
              We retain personal data only for as long as necessary to deliver the
              service, meet contractual and legal obligations, support accounting or
              audit needs, resolve disputes, and maintain operational records. When
              data is no longer needed, we securely delete or anonymise it where
              feasible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Data subject rights</h2>
            <p className="mt-2 text-muted-foreground">
              In accordance with the Kenya Data Protection Act, individuals may
              request access to their personal data, correction of inaccurate data,
              deletion where appropriate, restriction or objection to processing, and
              portability where applicable. To exercise any right, please contact us
              using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Third-party processors</h2>
            <p className="mt-2 text-muted-foreground">
              We may use third-party providers for hosting, payment processing,
              email delivery, analytics, support tools, and business infrastructure.
              These providers are expected to process data securely and only as
              instructed by DukaOS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Contact</h2>
            <p className="mt-2 text-muted-foreground">
              If you have questions about this Privacy Policy, your data rights, or a
              privacy concern, contact the Privacy Team at privacy@dukaos.com, the
              legal team at legal@dukaos.com, or the Data Protection Officer (DPO) at
              dpo@dukaos.com. You may also reach us through the support channels
              available in the DukaOS application.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
