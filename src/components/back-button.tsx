"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDictionary } from "@/i18n/dictionary-context";

export function BackButton() {
  const router = useRouter();
  const dict = useDictionary();

  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 cursor-pointer"
      size="sm"
      onClick={() => router.back()}
    >
      <ChevronLeftIcon />
      {dict.common.back}
    </Button>
  );
}
