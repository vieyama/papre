import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isProtected =
                nextUrl.pathname.startsWith("/home") ||
                nextUrl.pathname.startsWith("/calendar") ||
                nextUrl.pathname.startsWith("/account")
            if (isProtected) return isLoggedIn
            return true
        },
    },
    providers: [],
} satisfies NextAuthConfig
