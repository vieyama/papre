import { type Node } from "@/generated/prisma/browser";

export type NodeWithChildren = Node & {
    children: NodeWithChildren[];
};