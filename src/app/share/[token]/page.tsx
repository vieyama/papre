import { auth } from "@/auth";
import EditorWrapper from "@/components/editor/editor-wrapper";
import { Button } from "@/components/ui/button";
import { getSharedPageByToken } from "@/lib/page-share";
import { LockKeyholeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  const result = await getSharedPageByToken(token, session?.user?.id);

  if (result.status === "login-required") {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/share/${token}`)}`);
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "forbidden") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <LockKeyholeIcon className="size-5 text-muted-foreground" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Akses dibatasi</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Page ini hanya dapat dibuka oleh orang yang diundang. Pastikan kamu
            login menggunakan akun dengan email yang menerima undangan.
          </p>
          <Button asChild className="mt-6">
            <Link href="/home">Kembali ke home</Link>
          </Button>
        </div>
      </main>
    );
  }

  const coverImage = result.page.coverImage?.startsWith("minio://")
    ? `/api/share/${token}/cover`
    : result.page.coverImage;
  const updatedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(result.page.updatedAt);

  return (
    <main className="min-h-svh bg-background">
      {coverImage && (
        <div
          className="h-64 w-full bg-muted bg-cover bg-center"
          style={{
            backgroundImage: `url("${coverImage.replace(/["\\\n\r]/g, "")}")`,
          }}
        />
      )}
      <article className="mx-auto w-full max-w-4xl px-8 py-10">
        <div className="text-5xl">{result.page.icon || "📄"}</div>
        <p className="mt-5 text-sm text-muted-foreground">
          {result.page.workspaceName}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          {result.page.title}
        </h1>
        <p className="mt-3 text-xs text-muted-foreground">
          Terakhir diperbarui {updatedAt}
        </p>
        <div className="mt-8">
          <EditorWrapper
            content={result.page.content}
            editable={false}
            placeholder=""
          />
        </div>
      </article>
    </main>
  );
}
