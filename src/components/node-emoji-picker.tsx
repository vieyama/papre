"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import EmojiPicker, {
  Theme,
  type EmojiClickData,
} from "emoji-picker-react";

import { updateNodeIcon } from "@/services/node";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NodeEmojiPicker({
  nodeId,
  workspaceId,
  icon,
  fallbackIcon,
  editable = true,
}: {
  nodeId: string;
  workspaceId: string;
  icon: string | null;
  fallbackIcon: string;
  editable?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIcon, setSelectedIcon] = React.useState(icon);
  const updateIconMutation = useMutation({
    mutationFn: async (nextIcon: string) => {
      const result = await updateNodeIcon({
        nodeId,
        workspaceId,
        icon: nextIcon,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.icon ?? nextIcon;
    },
    onSuccess: (savedIcon) => {
      setSelectedIcon(savedIcon);
      router.refresh();
    },
  });

  function handleEmojiClick(emojiData: EmojiClickData) {
    const previousIcon = selectedIcon;

    setSelectedIcon(emojiData.emoji);
    setIsOpen(false);
    updateIconMutation.mutate(emojiData.emoji, {
      onError: () => {
        setSelectedIcon(previousIcon);
      },
    });
  }

  return (
    <Popover
      open={editable && isOpen}
      onOpenChange={(open) => {
        if (editable) setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex size-14 items-center justify-center rounded-lg text-4xl transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={!editable || updateIconMutation.isPending}
          aria-label="Change page icon"
        >
          {selectedIcon || fallbackIcon}
        </button>
      </PopoverTrigger>
      {editable && <PopoverContent
        align="start"
        className="w-auto border-0 bg-transparent p-0 shadow-none ring-0"
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          lazyLoadEmojis
          width={350}
          height={420}
        />
      </PopoverContent>}
    </Popover>
  );
}
