import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(
  "Terms & Conditions | DukaOS",
  "Read the terms and conditions for accessing and using the DukaOS business operations platform.",
  "/terms",
);

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:px-10">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          DukaOS
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms & Conditions
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          These Terms and Conditions govern access to and use of the DukaOS
          platform and all related services. By using DukaOS, you agree to these
          terms and any plan-specific obligations applicable to your account.
        </p>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Draft for compliance review. Final wording should be vetted by a licensed
          Kenyan legal or compliance professional before public launch.
        </div>

        <div className="mt-8 space-y-8 text-sm leading-7 text-foreground">
          <section>
            <h2 className="text-lg font-semibold">1. Acceptance of terms</h2>
            <p className="mt-2 text-muted-foreground">
              By registering for, accessing, or using DukaOS, you agree to these
              Terms and Conditions. If you do not agree, do not use the service.
              We may update these terms from time to time, and continued use after
              updates means you accept the revised version.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Service description</h2>
            <p className="mt-2 text-muted-foreground">
              DukaOS is a business operations platform for sales, inventory,
              purchasing, customer and supplier records, payment tracking,
              operations reporting, and user management. Access levels and features
              may depend on your chosen plan and configuration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. User responsibilities</h2>
            <p className="mt-2 text-muted-foreground">
              You are responsible for the accuracy of the information you provide,
              the confidentiality of your account credentials, and the lawful use of
              the platform. You must not use DukaOS for fraud, money laundering,
              illicit trade, identity abuse, cybercrime, or any activity that breaks
              Kenyan law or the rights of other persons or businesses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Fees and billing</h2>
            <p className="mt-2 text-muted-foreground">
              Subscription fees, setup charges, optional add-ons, and taxes will be
              billed according to the pricing and invoice terms presented at the time
              of purchase. We may suspend access for overdue accounts where
              reasonable and permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Service availability</h2>
            <p className="mt-2 text-muted-foreground">
              We aim to maintain a reliable service, but availability may be affected
              by scheduled maintenance, internet connectivity, third-party outages,
              cybersecurity issues, or other events outside our reasonable control.
              We do not guarantee uninterrupted access or zero downtime.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Intellectual property</h2>
            <p className="mt-2 text-muted-foreground">
              DukaOS, its branding, software, content, and platform materials remain
              the property of DukaOS or its licensors. You retain your own business
              data, but by using the platform you authorise DukaOS to process such
              data as necessary to provide and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Data protection and compliance</h2>
            <p className="mt-2 text-muted-foreground">
              Your use of DukaOS must comply with applicable data protection,
              consumer protection, tax, cyber, and business laws in Kenya and other
              jurisdictions where the platform is used. Where your operations are
              regulated, you remain responsible for obtaining any necessary licences
              or approvals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Limitation of liability</h2>
            <p className="mt-2 text-muted-foreground">
              DukaOS is provided on an “as is” and “as available” basis. To the
              maximum extent permitted by law, we exclude indirect, incidental,
              consequential, and punitive damages, except where such exclusion is
              prohibited by mandatory law or where there is fraud, intentional
              misconduct, or other legally non-excludable liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Termination</h2>
            <p className="mt-2 text-muted-foreground">
              We may suspend or terminate access to DukaOS if you breach these terms,
              fail to pay due amounts, misuse the service, or create material risk to
              security, compliance, or platform stability. Upon termination, we may
              disable account access and delete data in line with our retention and
              legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Contact</h2>
            <p className="mt-2 text-muted-foreground">
              Questions about these terms should be sent to the legal team at
              legal@dukaos.com, the Privacy Team at privacy@dukaos.com, or the Data
              Protection Officer (DPO) at dpo@dukaos.com. You may also use the
              support channels available in the platform.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
