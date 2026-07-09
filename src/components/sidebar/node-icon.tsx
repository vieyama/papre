import { NodeType, type Node } from "@/generated/prisma/browser";

export function NodeIcon({ node }: { node: Node }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-sm">
      {node.icon || (node.type === NodeType.FOLDER ? "🗂️" : "📄")}
    </span>
  );
}