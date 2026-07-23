import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <WifiOff size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-foreground">
          Connection lost
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Papre can’t load this page yet. Check your internet connection,
          then try again.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
        >
          Try Again
        </Link>
      </section>
    </main>
  );
}
