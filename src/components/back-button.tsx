"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 cursor-pointer"
      size="sm"
      onClick={() => router.back()}
    >
      <ChevronLeftIcon />
      Back
    </Button>
  );
}
