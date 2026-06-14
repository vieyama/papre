"use server";

import { createHash, randomBytes } from "node:crypto";
import { signIn } from "@/auth";
import { sendPasswordResetEmail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  authSchema,
  forgotPasswordSchema,
  type ForgotPasswordFormData,
  RegisterFormData,
  registerSchema,
  resetPasswordSchema,
  type ResetPasswordFormData,
  type AuthFormData,
} from "@/views/auth/authSchema";

export type EmailAuthResult = {
  error?: string;
  success?: true;
  message?: string;
};

const PASSWORD_RESET_PREFIX = "password-reset:";
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_RESET_COOLDOWN_MS = 5 * 60 * 1000;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getPasswordResetIdentifier(email: string) {
  return `${PASSWORD_RESET_PREFIX}${email}`;
}

export async function authenticateWithEmail(
  input: AuthFormData,
): Promise<EmailAuthResult> {
  const parsed = authSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  const { email, password } = parsed.data;

  const destination = await signIn("credentials", {
    email,
    password,
    redirect: false,
    redirectTo: "/home",
  });

  if (
    typeof destination !== "string" ||
    destination.includes("error=CredentialsSignin")
  ) {
    return { error: "Email atau password salah." };
  }

  return { success: true };
}

export async function registerWithEmail(
  input: RegisterFormData,
): Promise<EmailAuthResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  const { email, password, name } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (existingUser?.passwordHash) {
      return { error: "Email sudah terdaftar. Silakan masuk." };
    }

    if (existingUser) {
      const provider = existingUser.accounts[0]?.provider;
      const providerName = provider === "google" ? "Google" : provider;

      return {
        error: `Akun ini terdaftar melalui ${providerName ?? "provider lain"}. Masuk dengan provider tersebut untuk menjaga keamanan akun.`,
      };
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
      },
    });

    // Auto sign in after successful registration
    const destination = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/home",
    });

    if (
      typeof destination !== "string" ||
      destination.includes("error=CredentialsSignin")
    ) {
      return { error: "Registrasi berhasil, tapi gagal masuk otomatis. Silakan masuk manual." };
    }

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Terjadi kesalahan saat registrasi. Silakan coba lagi nanti." };
  }
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/home" });
}

export async function requestPasswordReset(
  input: ForgotPasswordFormData,
): Promise<EmailAuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Masukkan alamat email yang valid." };
  }

  const { email } = parsed.data;
  const genericMessage =
    "Jika akun dengan email tersebut tersedia, tautan reset password telah dikirim.";
  let issuedIdentifier: string | undefined;
  let issuedTokenHash: string | undefined;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return { success: true, message: genericMessage };
    }

    const token = randomBytes(32).toString("hex");
    const identifier = getPasswordResetIdentifier(email);
    const activeToken = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        expires: {
          gt: new Date(
            Date.now() + PASSWORD_RESET_TTL_MS - PASSWORD_RESET_COOLDOWN_MS,
          ),
        },
      },
      select: { token: true },
    });

    if (activeToken) {
      return { success: true, message: genericMessage };
    }

    const tokenHash = hashResetToken(token);
    const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    issuedIdentifier = identifier;
    issuedTokenHash = tokenHash;

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier } }),
      prisma.verificationToken.create({
        data: {
          identifier,
          token: tokenHash,
          expires,
        },
      }),
    ]);

    const appUrl = process.env.AUTH_URL;
    if (!appUrl) {
      throw new Error("AUTH_URL is not configured");
    }

    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("email", email);
    resetUrl.searchParams.set("token", token);

    await sendPasswordResetEmail(email, resetUrl.toString());

    return { success: true, message: genericMessage };
  } catch (error) {
    if (issuedIdentifier && issuedTokenHash) {
      await prisma.verificationToken
        .deleteMany({
          where: {
            identifier: issuedIdentifier,
            token: issuedTokenHash,
          },
        })
        .catch((cleanupError) => {
          console.error("Password reset token cleanup error:", cleanupError);
        });
    }

    console.error("Password reset request error:", error);
    return { error: "Gagal mengirim email reset password. Silakan coba lagi nanti." };
  }
}

export async function resetPassword(
  input: ResetPasswordFormData,
): Promise<EmailAuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Data reset password tidak valid." };
  }

  const { email, token, password } = parsed.data;
  const identifier = getPasswordResetIdentifier(email);
  const tokenHash = hashResetToken(token);

  try {
    await prisma.$transaction(async (transaction) => {
      const consumedToken = await transaction.verificationToken.deleteMany({
        where: {
          identifier,
          token: tokenHash,
          expires: { gt: new Date() },
        },
      });

      if (consumedToken.count !== 1) {
        throw new Error("INVALID_RESET_TOKEN");
      }

      const user = await transaction.user.update({
        where: { email },
        data: { passwordHash: await hashPassword(password) },
        select: { id: true },
      });

      await transaction.session.deleteMany({
        where: { userId: user.id },
      });

      await transaction.verificationToken.deleteMany({
        where: { identifier },
      });
    });

    return {
      success: true,
      message: "Password berhasil diperbarui. Silakan masuk dengan password baru.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      return { error: "Tautan reset password tidak valid atau sudah kedaluwarsa." };
    }

    console.error("Password reset error:", error);
    return { error: "Gagal memperbarui password. Silakan minta tautan reset baru." };
  }
}
