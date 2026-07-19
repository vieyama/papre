import { NodeType, type Node } from "@/generated/prisma/browser";

export const BOOK_COLLECTION_ICON = "📚";
export const BOOK_HTML_ICON = "📖";
export const BOOK_PDF_ICON = "📕";

export function isBookCollectionNode(node: Pick<Node, "type">) {
  return node.type === NodeType.BOOK;
}
