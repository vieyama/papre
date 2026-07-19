import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  DownloadIcon,
  FolderIcon,
  LibraryBigIcon,
  LockKeyholeIcon,
  UsersIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PapreGlyph } from "@/components/brand-glyph";

export const metadata: Metadata = {
  description:
    "Papre is a private space to organize notes, journal by date, and keep your reading library — all in one place, encrypted at rest.",
};

const FEATURES = [
  {
    icon: FolderIcon,
    title: "Pages & folders",
    description:
      "Organize notes into a hierarchy that grows with you, and browse them as a gallery or a simple list — whichever fits your day.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Calendar journal",
    description:
      "Write a dated entry for any day and look back on your notes exactly where you left them.",
  },
  {
    icon: LibraryBigIcon,
    title: "Personal library",
    description:
      "Import PDFs or write volumes from scratch, and keep them organized in collections.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Private by design",
    description:
      "Your page content is encrypted at rest. Nothing is visible to anyone unless you explicitly share it.",
  },
  {
    icon: UsersIcon,
    title: "Workspaces & roles",
    description:
      "Invite people into a workspace as an admin, member, or viewer, or share a single page without opening the rest.",
  },
  {
    icon: DownloadIcon,
    title: "Install it like an app",
    description:
      "Add Papre to your home screen or desktop for a focused, app-like way to write and read.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create a workspace",
    description:
      "Start your own space, or invite collaborators in with the right role for what they need to do.",
  },
  {
    step: "02",
    title: "Write and organize",
    description:
      "Add pages and folders, or drop a dated entry straight into your calendar journal.",
  },
  {
    step: "03",
    title: "Read and reflect",
    description:
      "Bring PDFs into your library, write volumes of your own, and revisit any day whenever you like.",
  },
];

const FAQS = [
  {
    question: "Is my data actually private?",
    answer:
      "Yes. Page content is encrypted at rest, and nothing is visible to anyone else unless you invite them to a workspace or explicitly share a page.",
  },
  {
    question: "Can I collaborate with other people?",
    answer:
      "Yes. Invite people into a workspace as an Owner, Admin, Member, or Viewer, or share an individual page with specific people or via a link.",
  },
  {
    question: "Can I import PDFs into my library?",
    answer:
      "Yes — import existing PDFs, or write volumes from scratch with the built-in editor, all organized into collections.",
  },
  {
    question: "Does Papre work as an installed app?",
    answer:
      "Yes. Papre is installable to your phone's home screen or your desktop, so it opens and feels like a native app.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "You can reset it by email at any time, or sign in with your Google account instead.",
  },
];

export default async function LandingPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium">
          <PapreGlyph className="size-6 text-foreground" />
          Papre
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center md:px-8 md:py-24">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Your private space to think, write, and read.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground text-balance">
            Organize pages and folders, journal by date, and keep a personal
            library of books — all encrypted at rest, in one quiet place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16 md:px-8 md:pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                  <feature.icon className="size-5 text-muted-foreground" />
                </div>
                <h2 className="mt-4 font-semibold tracking-tight">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                How it works
              </h2>
              <p className="mt-2 text-muted-foreground">
                Three steps, no setup required.
              </p>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step}>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-2 font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y rounded-xl border">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                  {faq.question}
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-16 text-center md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Start your first page today.
            </h2>
            <p className="max-w-md text-muted-foreground">
              No credit card, no clutter — just a quiet place for your notes,
              journal, and books.
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link href="/signup">
                Create your account
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row md:px-8">
        <p>&copy; {new Date().getFullYear()} Papre.</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
