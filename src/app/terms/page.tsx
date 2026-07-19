import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Papre.",
};

const LAST_UPDATED = "July 19, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Papre
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of Papre (the &quot;Service&quot;), a personal note-taking,
          journaling, and reading application. By creating an account or
          using the Service, you agree to these Terms. If you do not agree,
          please do not use the Service.
        </p>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            1. The Service
          </h2>
          <p className="mt-2 text-muted-foreground">
            Papre lets you create and organize pages and folders, write
            calendar-based journal entries, keep a personal library of
            written volumes and imported PDFs, and optionally share
            individual pages with other people. The Service is provided by
            an independent operator and is not affiliated with any
            third-party brand referenced in these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            2. Accounts
          </h2>
          <p className="mt-2 text-muted-foreground">
            You may create an account with an email and password or by
            signing in with a Google account. You are responsible for
            keeping your login credentials confidential and for all
            activity that happens under your account. Let us know right
            away if you believe your account has been accessed without your
            permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            3. Your Content
          </h2>
          <p className="mt-2 text-muted-foreground">
            You keep ownership of everything you create in Papre — pages,
            folders, journal entries, uploaded files, and library volumes
            (&quot;Your Content&quot;). You grant us only the limited rights
            needed to store, process, and display Your Content back to you
            (and to anyone you explicitly choose to share it with) in order
            to operate the Service. We do not claim ownership over Your
            Content and do not use it to train models or for advertising.
          </p>
          <p className="mt-2 text-muted-foreground">
            Page content is encrypted at rest. This protects your data
            against unauthorized access to the underlying storage, but it
            does not make the Service a zero-knowledge system — the
            operator retains the technical ability to access stored content
            for legitimate purposes such as troubleshooting, legal
            compliance, or account recovery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            4. Sharing Pages
          </h2>
          <p className="mt-2 text-muted-foreground">
            Papre lets you share individual pages either with specific
            invited people or, if you choose, via a public link. Anything
            you share this way becomes visible to whoever holds that
            invitation or link — please make sure you intend to share a
            page before enabling sharing on it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            5. Acceptable Use
          </h2>
          <p className="mt-2 text-muted-foreground">
            You agree not to use the Service to store or share unlawful
            content, infringe on someone else&apos;s rights, attempt to
            gain unauthorized access to the Service or other users&apos;
            data, or interfere with the Service&apos;s normal operation
            (including automated scraping or attempts to overload the
            infrastructure).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            6. Suspension &amp; Termination
          </h2>
          <p className="mt-2 text-muted-foreground">
            You may stop using the Service and request deletion of your
            account at any time by contacting us (see Section 9). We may
            suspend or terminate accounts that violate these Terms or pose a
            security risk to the Service or other users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            7. No Warranty
          </h2>
          <p className="mt-2 text-muted-foreground">
            Papre is provided &quot;as is&quot; and &quot;as available,&quot;
            without warranties of any kind, express or implied. We do not
            guarantee that the Service will be uninterrupted, error-free, or
            available at all times. You are encouraged to keep your own
            backups of anything important, such as PDF volumes you have
            imported.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            8. Limitation of Liability
          </h2>
          <p className="mt-2 text-muted-foreground">
            To the fullest extent permitted by law, the operator of Papre
            will not be liable for any indirect, incidental, or
            consequential damages arising from your use of, or inability to
            use, the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            9. Changes &amp; Contact
          </h2>
          <p className="mt-2 text-muted-foreground">
            We may update these Terms from time to time. Continued use of
            the Service after an update means you accept the revised Terms.
            If you have questions about these Terms, contact us at{" "}
            <a
              href="mailto:support@brisya.my.id"
              className="underline underline-offset-4"
            >
              support@brisya.my.id
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
