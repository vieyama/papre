import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { defaultLocale, locales, type Locale } from "@/i18n/config"
import { localeHref, PROTECTED_PATHS } from "@/i18n/paths"

// Exported as named "proxy" — sesuai Next.js 16
//
// Note: this intentionally does NOT wrap the handler in NextAuth's `auth()`
// HOC. That wrapper reconstructs the returned response via
// `new Response(response?.body, response)`, which strips the internal
// NextResponse marker that Next.js's proxy runtime relies on to apply
// NextResponse.rewrite() — causing bare (non-locale-prefixed) requests to
// loop between a rewrite and a redirect back to themselves. `getToken()` is
// NextAuth's documented lower-level helper for exactly this case: reading
// session state in middleware/proxy without going through that wrapper.
export async function proxy(req: NextRequest) {
    const nextUrl = req.nextUrl.clone()
    const { pathname } = nextUrl

    let locale: Locale = defaultLocale
    let strippedPath = pathname
    let hasExplicitPrefix = false

    for (const candidate of locales) {
        if (pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`)) {
            locale = candidate
            strippedPath = pathname === `/${candidate}` ? "/" : pathname.slice(1 + candidate.length)
            hasExplicitPrefix = true
            break
        }
    }

    const isProtected = PROTECTED_PATHS.some(
        (path) => strippedPath === path || strippedPath.startsWith(`${path}/`),
    )

    if (isProtected) {
        // `getToken()` defaults `secureCookie` to `false`, so behind a TLS-terminating
        // reverse proxy (AUTH_URL="https://...") it looks for the plain
        // "authjs.session-token" cookie while NextAuth actually issues
        // "__Secure-authjs.session-token" — causing every authenticated request to a
        // protected path to be treated as unauthenticated. Must match @auth/core's own
        // secure-cookie decision (see node_modules/@auth/core/lib/init.js), which is
        // based on whether AUTH_URL is https.
        const secureCookie = process.env.AUTH_URL?.startsWith("https://") ?? false
        const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie })

        if (!token) {
            const loginUrl = req.nextUrl.clone()
            loginUrl.pathname = localeHref("/login", locale)
            loginUrl.search = `?callbackUrl=${encodeURIComponent(pathname + req.nextUrl.search)}`
            return NextResponse.redirect(loginUrl)
        }
    }

    // Only bare (no explicit locale prefix) requests need an internal rewrite to
    // resolve against the [lang] segment. A request that already carries an
    // explicit prefix — including a stray "/en" — matches the file structure
    // directly and must NOT be rewritten or redirected: rewriting it again here
    // would create a rewrite/redirect cycle once Next reprocesses the rewritten
    // path through this same proxy.
    if (!hasExplicitPrefix) {
        nextUrl.pathname = `/${defaultLocale}${strippedPath === "/" ? "" : strippedPath}`
        return NextResponse.rewrite(nextUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Exclude api routes, static/public files (anything with a file extension),
        // and /offline — that route intentionally lives outside app/[lang]/ (see
        // proxy.ts's locale rewrite logic) since it's precached by the service
        // worker before any locale is known, so it must never be rewritten.
        "/((?!api|_next/static|_next/image|favicon.ico|offline|.*\\..*).*)",
    ],
}
