"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";

import EditorWrapper from "@/components/editor/editor-wrapper";
import {
  deleteOfflineDraftIfContentMatches,
  getOfflineDraft,
  saveOfflineDraft,
} from "@/lib/offline-drafts";
import { updateNodeContent } from "@/services/node";

const AUTOSAVE_DELAY_MS = 700;

export function NodeContentEditor({
  nodeId,
  userId,
  workspaceId,
  initialContent,
  initialUpdatedAt,
  editable = true,
}: {
  nodeId: string;
  userId: string;
  workspaceId: string;
  initialContent: string;
  initialUpdatedAt: string;
  editable?: boolean;
}) {
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = React.useRef(initialContent);
  const lastSavedContent = React.useRef(initialContent);
  const [editorContent, setEditorContent] = React.useState(initialContent);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState(initialUpdatedAt);
  const [saveState, setSaveState] = React.useState<
    "idle" | "pending" | "saved" | "local" | "error"
  >("idle");

  const saveMutation = useMutation({
    mutationKey: ["node-content", nodeId],
    scope: {
      id: `node-content-${nodeId}`,
    },
    mutationFn: async (content: string) => {
      const result = await updateNodeContent({
        nodeId,
        workspaceId,
        content,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        content,
        updatedAt: result.updatedAt ?? new Date().toISOString(),
      };
    },
    onSuccess: ({ content, updatedAt }) => {
      lastSavedContent.current = content;
      void deleteOfflineDraftIfContentMatches(userId, nodeId, content);
      setLastUpdatedAt(updatedAt);
      setSaveState(
        latestContent.current === content ? "saved" : "pending",
      );
    },
    onError: () => {
      setSaveState(navigator.onLine ? "error" : "local");
    },
  });

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  const saveNow = React.useCallback(() => {
    if (!editable) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const content = latestContent.current;

    if (content === lastSavedContent.current) {
      setSaveState("saved");
      return;
    }

    if (!navigator.onLine) {
      setSaveState("local");
      return;
    }

    setSaveState("pending");
    saveMutation.mutate(content);
  }, [editable, saveMutation]);

  React.useEffect(() => {
    let cancelled = false;

    getOfflineDraft(userId, nodeId)
      .then((draft) => {
        if (cancelled || !draft || draft.content === initialContent) return;

        latestContent.current = draft.content;
        setEditorContent(draft.content);
        setSaveState(navigator.onLine ? "pending" : "local");

        if (navigator.onLine) {
          queueMicrotask(saveNow);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [initialContent, nodeId, saveNow, userId]);

  React.useEffect(() => {
    if (!editable) return;

    function syncWhenOnline() {
      if (latestContent.current !== lastSavedContent.current) {
        saveNow();
      }
    }

    function markOffline() {
      if (latestContent.current !== lastSavedContent.current) {
        setSaveState("local");
      }
    }

    window.addEventListener("online", syncWhenOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", syncWhenOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, [editable, saveNow]);

  React.useEffect(() => {
    if (!editable) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        saveNow();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editable, saveNow]);

  function handleContentChange(content: string) {
    if (!editable) return;

    latestContent.current = content;
    void saveOfflineDraft(userId, nodeId, content).catch(() => {
      setSaveState("error");
    });

    if (content === lastSavedContent.current) {
      setSaveState("saved");
      return;
    }

    setSaveState("pending");

    if (!navigator.onLine) {
      setSaveState("local");
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveMutation.mutate(latestContent.current);
    }, AUTOSAVE_DELAY_MS);
  }

  const statusLabel = {
    idle: "",
    pending: "Saving...",
    saved: "Saved",
    error: "Failed to save",
    local: "Saved on this device",
  }[saveState];
  const lastUpdatedLabel = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(lastUpdatedAt));

  return (
    <section>
      <div className="mb-2 flex min-h-5 items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          Terakhir diperbarui {lastUpdatedLabel}
        </span>
        {editable && <span
          className={
            saveState === "error"
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {statusLabel}
        </span>}
      </div>
      <EditorWrapper
        content={editorContent}
        onChange={handleContentChange}
        editable={editable}
        nodeId={nodeId}
      />
    </section>
  );
}
