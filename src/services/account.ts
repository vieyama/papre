"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, unstable_update } from "@/auth";
import prisma from "@/lib/prisma";

const accountProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(128, "Name is too long."),
});

export type UpdateAccountResult = {
  error?: string;
  success?: true;
  name?: string;
};

export async function updateAccountProfile(
  input: unknown,
): Promise<UpdateAccountResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const parsed = accountProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid name.",
    };
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { name: true },
    });

    await unstable_update({
      user: {
        name: user.name,
      },
    });

    revalidatePath("/[lang]/(protected)", "layout");

    return {
      success: true,
      name: user.name ?? parsed.data.name,
    };
  } catch (error) {
    console.error("Account profile update error:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}
