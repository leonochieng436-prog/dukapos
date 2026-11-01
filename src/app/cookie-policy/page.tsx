import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(
  "Cookie Policy | DukaOS",
  "Read how DukaOS uses essential and preference cookies and how to manage cookie settings.",
  "/cookie-policy",
);

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:px-10">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          DukaOS
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Cookie Policy
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This Cookie Policy explains how DukaOS uses cookies and similar
          technologies on our website and related digital experiences. We use
          cookies to keep the site secure, remember user preferences, measure
          performance, and support our service improvements while respecting your
          choices and privacy rights.
        </p>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Draft for compliance review. Final legal wording should be checked by a
          licensed Kenyan legal or compliance professional before public launch or
          broad deployment.
        </div>

        <div className="mt-8 space-y-8 text-sm leading-7 text-foreground">
          <section>
            <h2 className="text-lg font-semibold">1. What are cookies?</h2>
            <p className="mt-2 text-muted-foreground">
              Cookies are small text files placed on your browser or device when
              you visit a website. They help websites remember preferences,
              maintain sessions, detect misuse, understand how people use a site,
              and improve overall product quality and reliability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Types of cookies we use</h2>
            <p className="mt-2 text-muted-foreground">
              We may use the following categories of cookies:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Essential cookies:</strong> required
                for secure access, authentication, sessions, and core website
                functionality.
              </li>
              <li>
                <strong className="text-foreground">Preference cookies:</strong> remember
                your choices such as language, region, or interface settings.
              </li>
              <li>
                <strong className="text-foreground">Analytics cookies:</strong> help us
                understand how visitors use our website and improve performance,
                content, and usability.
              </li>
              <li>
                <strong className="text-foreground">Marketing cookies:</strong> used to
                understand the effectiveness of campaigns and relevant marketing
                interactions where consent is provided.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Why we use cookies</h2>
            <p className="mt-2 text-muted-foreground">
              We use cookies to keep the website functioning correctly, support
              secure authentication, remember user preferences, detect suspicious
              activity, improve platform performance, and understand how visitors
              use our services. This enables us to provide a better user
              experience and improve product quality over time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Consent and control</h2>
            <p className="mt-2 text-muted-foreground">
              Essential cookies are necessary and remain active. Non-essential
              cookies are only used where you have provided consent or where the
              law permits such use. You can accept all cookies, reject optional
              cookies, or adjust your preferences at any time through our cookie
              preference settings or your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Third-party cookies</h2>
            <p className="mt-2 text-muted-foreground">
              Some cookies may be placed by trusted third-party providers we use
              for analytics, hosting, email, support, or related business
              infrastructure. These providers handle data according to their own
              privacy and security standards and may be subject to applicable
              data protection obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Duration and retention</h2>
            <p className="mt-2 text-muted-foreground">
              Cookies may be session-based or persistent. Session cookies are
              removed when you close your browser. Persistent cookies may remain
              for a limited time to remember your choices and support service
              improvement. We retain cookies only for as long as necessary for the
              purpose for which they were set.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Managing your choices</h2>
            <p className="mt-2 text-muted-foreground">
              You may change your cookie preferences at any time through the cookie
              settings available on our website. You can also manage or block
              cookies in your browser settings, although disabling some cookies
              may affect site functionality or limit certain features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Your rights and contact</h2>
            <p className="mt-2 text-muted-foreground">
              If you have questions about our use of cookies, your privacy rights,
              or how we process personal information, please contact the Privacy
              Team at privacy@dukaos.com, the Legal Team at legal@dukaos.com, or
              the Data Protection Officer at dpo@dukaos.com. We review requests in
              line with the Kenya Data Protection Act, 2019 and applicable
              operational requirements.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
