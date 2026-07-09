"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <div className="ml-4 mt-2">
      <Button
        type="button"
        variant="ghost"
        className="cursor-pointer"
        size="sm"
        onClick={() => router.back()}
      >
        <ChevronLeftIcon />
        Back
      </Button>
    </div>
  );
}
