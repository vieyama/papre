import type { LegalContent } from "./types";

const en = {
  backToPapre: "← Back to Papre",
  lastUpdatedLabel: "Last updated",
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "July 19, 2026",
    intro:
      "This Privacy Policy explains what information Papre collects, how it is used, and the choices you have. Papre is a personal note-taking, journaling, and reading application.",
    sections: [
      {
        heading: "1. Information We Collect",
        list: [
          {
            term: "Account information:",
            description:
              "your name, email address, and a securely hashed password if you sign up with email and password, or your name, email, and profile photo if you sign in with Google.",
          },
          {
            term: "Content you create:",
            description:
              "pages, folders, journal entries, book collections, and any files you upload (cover images, imported PDFs). Page content is encrypted at rest.",
          },
          {
            term: "Workspace & sharing data:",
            description:
              "workspace membership, roles, and information about pages you choose to share and with whom.",
          },
          {
            term: "Cookies:",
            description:
              "a session cookie to keep you signed in, and a small cookie that remembers which workspace you last selected. We do not use advertising or third-party tracking cookies.",
          },
        ],
      },
      {
        heading: "2. How We Use Your Information",
        paragraphs: [
          "We use the information above to operate the Service: to authenticate you, keep your workspaces and pages organized, remember your preferences, and send transactional emails you request — for example, a password reset link. We do not use your content or account information for advertising, and we do not sell personal data to third parties.",
        ],
      },
      {
        heading: "3. Third-Party Services",
        paragraphs: ["We rely on a small number of third-party services to run Papre:"],
        list: [
          {
            term: "Google",
            description:
              "— used only if you choose \"Login with Google,\" to verify your identity via OAuth.",
          },
          {
            term: "Email delivery provider",
            description: "— used to send transactional emails such as password reset links.",
          },
        ],
        listFootnote:
          "These providers only receive the minimum information needed to perform their function and are not permitted to use it for their own purposes.",
      },
      {
        heading: "4. Data Storage & Security",
        paragraphs: [
          "Passwords are stored as salted hashes, never in plain text. Page content is encrypted at rest using a unique key per account. This protects your data from unauthorized access to the underlying database, but — as noted in our Terms of Service — it is not a zero-knowledge design, and the operator retains the technical ability to access stored content when necessary (for example, to investigate abuse or comply with the law).",
        ],
      },
      {
        heading: "5. Sharing With Other Users",
        paragraphs: [
          "If you invite someone to a workspace, they can see the pages that workspace contains, according to their assigned role. If you use the page-sharing feature, the page is visible to whoever you invite, or to anyone with the link if you choose to make it public. We only share your content with other users as a direct result of actions you take.",
        ],
      },
      {
        heading: "6. Data Retention & Your Choices",
        paragraphs: [
          "We retain your account and content for as long as your account is active. You can request access to, correction of, or deletion of your data at any time by contacting us at the address below; we will delete your account and associated content within a reasonable time after a verified request, except where we are required to retain certain records by law.",
        ],
      },
      {
        heading: "7. Children's Privacy",
        paragraphs: [
          "Papre is not directed at children under 13, and we do not knowingly collect personal information from children under 13.",
        ],
      },
      {
        heading: "8. Changes & Contact",
        paragraphs: [
          "We may update this Privacy Policy from time to time; material changes will be reflected by updating the date at the top of this page. If you have questions about this policy or want to exercise your data rights, contact us at",
        ],
      },
    ],
    contactPrefix: "contact us at",
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "July 19, 2026",
    intro:
      "These Terms of Service (\"Terms\") govern your access to and use of Papre (the \"Service\"), a personal note-taking, journaling, and reading application. By creating an account or using the Service, you agree to these Terms. If you do not agree, please do not use the Service.",
    sections: [
      {
        heading: "1. The Service",
        paragraphs: [
          "Papre lets you create and organize pages and folders, write calendar-based journal entries, keep a personal library of written volumes and imported PDFs, and optionally share individual pages with other people. The Service is provided by an independent operator and is not affiliated with any third-party brand referenced in these Terms.",
        ],
      },
      {
        heading: "2. Accounts",
        paragraphs: [
          "You may create an account with an email and password or by signing in with a Google account. You are responsible for keeping your login credentials confidential and for all activity that happens under your account. Let us know right away if you believe your account has been accessed without your permission.",
        ],
      },
      {
        heading: "3. Your Content",
        paragraphs: [
          "You keep ownership of everything you create in Papre — pages, folders, journal entries, uploaded files, and library volumes (\"Your Content\"). You grant us only the limited rights needed to store, process, and display Your Content back to you (and to anyone you explicitly choose to share it with) in order to operate the Service. We do not claim ownership over Your Content and do not use it to train models or for advertising.",
          "Page content is encrypted at rest. This protects your data against unauthorized access to the underlying storage, but it does not make the Service a zero-knowledge system — the operator retains the technical ability to access stored content for legitimate purposes such as troubleshooting, legal compliance, or account recovery.",
        ],
      },
      {
        heading: "4. Sharing Pages",
        paragraphs: [
          "Papre lets you share individual pages either with specific invited people or, if you choose, via a public link. Anything you share this way becomes visible to whoever holds that invitation or link — please make sure you intend to share a page before enabling sharing on it.",
        ],
      },
      {
        heading: "5. Acceptable Use",
        paragraphs: [
          "You agree not to use the Service to store or share unlawful content, infringe on someone else's rights, attempt to gain unauthorized access to the Service or other users' data, or interfere with the Service's normal operation (including automated scraping or attempts to overload the infrastructure).",
        ],
      },
      {
        heading: "6. Suspension & Termination",
        paragraphs: [
          "You may stop using the Service and request deletion of your account at any time by contacting us (see Section 9). We may suspend or terminate accounts that violate these Terms or pose a security risk to the Service or other users.",
        ],
      },
      {
        heading: "7. No Warranty",
        paragraphs: [
          "Papre is provided \"as is\" and \"as available,\" without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or available at all times. You are encouraged to keep your own backups of anything important, such as PDF volumes you have imported.",
        ],
      },
      {
        heading: "8. Limitation of Liability",
        paragraphs: [
          "To the fullest extent permitted by law, the operator of Papre will not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, the Service.",
        ],
      },
      {
        heading: "9. Changes & Contact",
        paragraphs: [
          "We may update these Terms from time to time. Continued use of the Service after an update means you accept the revised Terms. If you have questions about these Terms, contact us at",
        ],
      },
    ],
    contactPrefix: "contact us at",
  },
} satisfies LegalContent;

export default en;
