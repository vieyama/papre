"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { renameNode } from "@/services/node";

type NodeTitleForm = {
  title: string;
};

interface NodeTitleEditorProps {
  nodeId: string;
  workspaceId: string;
  title: string;
  editable?: boolean;
}

export function NodeTitleEditor({
  nodeId,
  workspaceId,
  title,
  editable = true,
}: NodeTitleEditorProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<NodeTitleForm>({
    defaultValues: {
      title,
    },
  });
  const titleField = register("title", {
    required: "Name cannot be empty.",
    maxLength: {
      value: 100,
      message: "Name must be 100 characters or fewer.",
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (values: NodeTitleForm) => {
      const nextTitle = values.title.trim();
      const result = await renameNode({
        nodeId,
        workspaceId,
        title: nextTitle,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.title ?? nextTitle;
    },
    onSuccess: (renamedTitle) => {
      reset({ title: renamedTitle });
      router.refresh();
    },
    onError: (error) => {
      setError("title", {
        type: "server",
        message: error.message,
      });
    },
  });

  const submitTitle = handleSubmit((values) => {
    if (!isDirty || renameMutation.isPending) return;

    renameMutation.mutate(values);
  });

  return (
    <>
      {!editable ? (
        <h1 className="flex min-h-16 items-center text-4xl font-bold tracking-tight">
          {title}
        </h1>
      ) : (
      <input
        {...titleField}
        onBlur={(event) => {
          void titleField.onBlur(event);
          void submitTitle();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            reset();
            clearErrors("title");
            event.currentTarget.blur();
          }
        }}
        disabled={renameMutation.isPending}
        aria-label="Node title"
        aria-invalid={errors.title !== undefined}
        className="w-full border-0 bg-transparent p-0 h-16 text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-70"
      />
      )}
      {errors.title?.message && (
        <p className="mt-2 text-sm text-destructive">
          {errors.title.message}
        </p>
      )}
    </>
  );
}
