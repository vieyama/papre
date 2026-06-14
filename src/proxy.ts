import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Export sebagai named "proxy" — sesuai Next.js 16
export const proxy = NextAuth(authConfig).auth

export const config = {
    matcher: [
        // Exclude api, static files, images, login page
        "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
    ],
}