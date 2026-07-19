import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Papre.",
};

const LAST_UPDATED = "July 19, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Papre
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
        <p>
          This Privacy Policy explains what information Papre collects, how
          it is used, and the choices you have. Papre is a personal
          note-taking, journaling, and reading application.
        </p>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            1. Information We Collect
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Account information:
              </span>{" "}
              your name, email address, and a securely hashed password if
              you sign up with email and password, or your name, email, and
              profile photo if you sign in with Google.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Content you create:
              </span>{" "}
              pages, folders, journal entries, book collections, and any
              files you upload (cover images, imported PDFs). Page content
              is encrypted at rest.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Workspace &amp; sharing data:
              </span>{" "}
              workspace membership, roles, and information about pages you
              choose to share and with whom.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Cookies:
              </span>{" "}
              a session cookie to keep you signed in, and a small cookie
              that remembers which workspace you last selected. We do not
              use advertising or third-party tracking cookies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            2. How We Use Your Information
          </h2>
          <p className="mt-2 text-muted-foreground">
            We use the information above to operate the Service: to
            authenticate you, keep your workspaces and pages organized,
            remember your preferences, and send transactional emails you
            request — for example, a password reset link. We do not use
            your content or account information for advertising, and we do
            not sell personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            3. Third-Party Services
          </h2>
          <p className="mt-2 text-muted-foreground">
            We rely on a small number of third-party services to run Papre:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Google</span> —
              used only if you choose &quot;Login with Google,&quot; to
              verify your identity via OAuth.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Email delivery provider
              </span>{" "}
              — used to send transactional emails such as password reset
              links.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            These providers only receive the minimum information needed to
            perform their function and are not permitted to use it for
            their own purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            4. Data Storage &amp; Security
          </h2>
          <p className="mt-2 text-muted-foreground">
            Passwords are stored as salted hashes, never in plain text. Page
            content is encrypted at rest using a unique key per account.
            This protects your data from unauthorized access to the
            underlying database, but — as noted in our Terms of Service —
            it is not a zero-knowledge design, and the operator retains the
            technical ability to access stored content when necessary (for
            example, to investigate abuse or comply with the law).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            5. Sharing With Other Users
          </h2>
          <p className="mt-2 text-muted-foreground">
            If you invite someone to a workspace, they can see the pages
            that workspace contains, according to their assigned role. If
            you use the page-sharing feature, the page is visible to
            whoever you invite, or to anyone with the link if you choose to
            make it public. We only share your content with other users as
            a direct result of actions you take.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            6. Data Retention &amp; Your Choices
          </h2>
          <p className="mt-2 text-muted-foreground">
            We retain your account and content for as long as your account
            is active. You can request access to, correction of, or
            deletion of your data at any time by contacting us at the
            address below; we will delete your account and associated
            content within a reasonable time after a verified request,
            except where we are required to retain certain records by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            7. Children&apos;s Privacy
          </h2>
          <p className="mt-2 text-muted-foreground">
            Papre is not directed at children under 13, and we do not
            knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            8. Changes &amp; Contact
          </h2>
          <p className="mt-2 text-muted-foreground">
            We may update this Privacy Policy from time to time; material
            changes will be reflected by updating the date at the top of
            this page. If you have questions about this policy or want to
            exercise your data rights, contact us at{" "}
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
