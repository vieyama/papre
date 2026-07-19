import { NodeType, type Node } from "@/generated/prisma/browser";
import { BOOK_COLLECTION_ICON } from "@/lib/book-node";
import { cn } from "@/lib/utils";

type NodeIconSource = Pick<Node, "icon" | "type">;

function fallbackIcon(node: NodeIconSource) {
  switch (node.type) {
    case NodeType.FOLDER:
      return "🗂️";
    case NodeType.BOOK:
      return BOOK_COLLECTION_ICON;
    default:
      return "📄";
  }
}

export function NodeIcon({
  node,
  className,
}: {
  node: NodeIconSource;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center text-sm",
        className,
      )}
    >
      {node.icon || fallbackIcon(node)}
    </span>
  );
}
