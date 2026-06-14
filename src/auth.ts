import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authConfig } from "@/lib/auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { verifyPassword } from "@/lib/password"
import { authSchema } from "@/views/auth/authSchema"
import prisma from "./lib/prisma"
import { ensureUserSetup } from "./lib/user-setup"

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
    ...authConfig,
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        Credentials({
            credentials: {
                email: { type: "email" },
                password: { type: "password" },
            },
            async authorize(credentials) {
                const parsed = authSchema.safeParse(credentials)

                if (!parsed.success) return null

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                })

                if (!user?.passwordHash) return null

                const passwordMatches = await verifyPassword(
                    parsed.data.password,
                    user.passwordHash,
                )

                if (!passwordMatches) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                }
            },
        }),
    ],
    events: {
        async createUser({ user }) {
            if (user.id) await ensureUserSetup(user.id)
        },
        async signIn({ user }) {
            if (user.id) await ensureUserSetup(user.id)
        },
    },
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ account, profile }) {
            if (account?.provider === "google") {
                return profile?.email_verified === true
            }

            return true
        },
        async session({ session, token }) {
            if (session.user) session.user.id = token.sub!
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user) token.sub = user.id
            if (trigger === "update" && session?.user?.name) {
                token.name = session.user.name
            }
            return token
        },
    },
})
