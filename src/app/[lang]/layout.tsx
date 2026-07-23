import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { hasLocale, getDictionary } from "@/i18n/dictionaries";
import { DictionaryProvider } from "@/i18n/dictionary-context";
import { ThemeProvider } from "@/components/theme-provider";
import type { Locale } from "@/i18n/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const metadataBase = new URL(
  process.env.AUTH_URL ?? "http://localhost:3000",
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : "en";
  const siteName = "Papre";
  const siteDescription =
    "Create, organize, and share notes, pages, and folders.";

  return {
    metadataBase,
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    applicationName: siteName,
    openGraph: {
      title: siteName,
      description: siteDescription,
      siteName,
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
    },
    twitter: {
      card: "summary",
      title: siteName,
      description: siteDescription,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang as Locale);

  return (
    <html
      lang={lang}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DictionaryProvider dict={dict}>{children}</DictionaryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
