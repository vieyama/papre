"use server";

import { createHash, randomBytes } from "node:crypto";
import { signIn } from "@/auth";
import { sendPasswordResetEmail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  createAuthSchema,
  createForgotPasswordSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  type ForgotPasswordFormData,
  type RegisterFormData,
  type ResetPasswordFormData,
  type AuthFormData,
} from "@/views/auth/authSchema";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/paths";
import { formatMessage } from "@/i18n/format";

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
  lang: Locale = defaultLocale,
): Promise<EmailAuthResult> {
  const dict = await getDictionary(lang);
  const parsed = createAuthSchema(dict.auth.validation).safeParse(input);

  if (!parsed.success) {
    return { error: dict.auth.login.invalidInput };
  }

  const { email, password } = parsed.data;

  const destination = await signIn("credentials", {
    email,
    password,
    redirect: false,
    redirectTo: localeHref("/home", lang),
  });

  if (
    typeof destination !== "string" ||
    destination.includes("error=CredentialsSignin")
  ) {
    return { error: dict.auth.login.wrongCredentials };
  }

  return { success: true };
}

export async function registerWithEmail(
  input: RegisterFormData,
  lang: Locale = defaultLocale,
): Promise<EmailAuthResult> {
  const dict = await getDictionary(lang);
  const parsed = createRegisterSchema(dict.auth.validation).safeParse(input);

  if (!parsed.success) {
    return { error: dict.auth.signup.invalidInput };
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
      return { error: dict.auth.signup.emailTaken };
    }

    if (existingUser) {
      const provider = existingUser.accounts[0]?.provider;
      const providerName =
        provider === "google" ? "Google" : provider ?? dict.auth.signup.unknownProvider;

      return {
        error: formatMessage(dict.auth.signup.registeredViaProvider, {
          provider: providerName,
        }),
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
      redirectTo: localeHref("/home", lang),
    });

    if (
      typeof destination !== "string" ||
      destination.includes("error=CredentialsSignin")
    ) {
      return { error: dict.auth.signup.autoLoginFailed };
    }

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: dict.auth.signup.genericError };
  }
}

export async function signInWithGoogle(lang: Locale = defaultLocale) {
  await signIn("google", { redirectTo: localeHref("/home", lang) });
}

export async function requestPasswordReset(
  input: ForgotPasswordFormData,
  lang: Locale = defaultLocale,
): Promise<EmailAuthResult> {
  const dict = await getDictionary(lang);
  const parsed = createForgotPasswordSchema(dict.auth.validation).safeParse(input);

  if (!parsed.success) {
    return { error: dict.auth.forgotPassword.invalidEmail };
  }

  const { email } = parsed.data;
  const genericMessage = dict.auth.forgotPassword.successMessage;
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

    const resetUrl = new URL(localeHref("/reset-password", lang), appUrl);
    resetUrl.searchParams.set("email", email);
    resetUrl.searchParams.set("token", token);

    await sendPasswordResetEmail(email, resetUrl.toString(), lang);

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
    return { error: dict.auth.forgotPassword.genericError };
  }
}

export async function resetPassword(
  input: ResetPasswordFormData,
  lang: Locale = defaultLocale,
): Promise<EmailAuthResult> {
  const dict = await getDictionary(lang);
  const parsed = createResetPasswordSchema(dict.auth.validation).safeParse(input);

  if (!parsed.success) {
    return { error: dict.auth.resetPassword.invalidInput };
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
      message: dict.auth.resetPassword.successMessage,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      return { error: dict.auth.resetPassword.expiredToken };
    }

    console.error("Password reset error:", error);
    return { error: dict.auth.resetPassword.genericError };
  }
}
