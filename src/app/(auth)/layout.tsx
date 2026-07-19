import type { Metadata } from "next";
import Link from "next/link";
import { PapreGlyph } from "@/components/brand-glyph";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f172a] p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium">
          <PapreGlyph className="size-6" />
          Papre
        </Link>
        <div className="max-w-sm">
          <p className="text-3xl font-semibold tracking-tight text-balance">
            Your private space to think, write, and read.
          </p>
          <p className="mt-4 text-sm text-white/60">
            Every page you write is encrypted for your eyes only.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6 md:p-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium lg:hidden"
        >
          <PapreGlyph className="size-6 text-foreground" />
          Papre
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
