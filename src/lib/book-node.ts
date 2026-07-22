import { NodeType, type Node } from "@/generated/prisma/browser";

export const BOOK_COLLECTION_ICON = "📚";
export const BOOK_HTML_ICON = "📖";
export const BOOK_PDF_ICON = "📕";

export function isBookCollectionNode(node: Pick<Node, "type">) {
  return node.type === NodeType.BOOK;
}

export function excludeBookNodes<T extends Pick<Node, "id" | "parentId" | "type">>(
  nodes: T[],
): T[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const bookNodeIds = new Set<string>();

  for (const node of nodes) {
    if (isBookCollectionNode(node)) {
      bookNodeIds.add(node.id);
    }
  }

  for (const node of nodes) {
    let current = node.parentId ? nodesById.get(node.parentId) : undefined;

    while (current) {
      if (bookNodeIds.has(current.id)) {
        bookNodeIds.add(node.id);
        break;
      }

      current = current.parentId ? nodesById.get(current.parentId) : undefined;
    }
  }

  return nodes.filter((node) => !bookNodeIds.has(node.id));
}
