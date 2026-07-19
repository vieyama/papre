import type { Metadata } from "next"
import { SignupForm } from "@/views/auth/signup-form"
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Papre account to organize your notes and pages.",
}

export default async function SignupPage() {
  const session = await auth()
  if (session?.user?.id) redirect("/")

  return <SignupForm />
}
