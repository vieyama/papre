import React, { startTransition } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeWithChildren } from './type';
import { ROOT_PARENT_VALUE } from './node-sidebar';
import { useRouter } from 'next/navigation';
import { moveNode } from '@/services/node';
import { NodeType } from '@/generated/prisma/enums';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '../ui/button';
import { useDictionary } from '@/i18n/dictionary-context';

interface MoveDialogProps {
    isPending: boolean
    nodeToMove: NodeWithChildren | null
    setNodeToMove: React.Dispatch<React.SetStateAction<NodeWithChildren | null>>
    setMoveTargetParentId: React.Dispatch<React.SetStateAction<string>>
    setMoveError: React.Dispatch<React.SetStateAction<string | null>>
    workspaceId: string
    moveTargetParentId: string
    tree: NodeWithChildren[]
    moveError: string | null
}

function buildMoveTargetOptions(
    nodes: NodeWithChildren[],
    excludedNodeIds: Set<string>,
    parentPath: string[] = [],
) {
    const options: Array<{ id: string; label: string }> = [];

    for (const node of nodes) {
        const currentPath = [...parentPath, node.title];

        if (
            node.type === NodeType.FOLDER &&
            !excludedNodeIds.has(node.id)
        ) {
            options.push({
                id: node.id,
                label: currentPath.join(" / "),
            });
        }

        if (node.children.length > 0) {
            options.push(
                ...buildMoveTargetOptions(
                    node.children,
                    excludedNodeIds,
                    currentPath,
                ),
            );
        }
    }

    return options;
}

function collectNodeIds(node: NodeWithChildren, nodeIds = new Set<string>()) {
    nodeIds.add(node.id);

    for (const child of node.children) {
        collectNodeIds(child, nodeIds);
    }

    return nodeIds;
}

const MoveDialog: React.FC<MoveDialogProps> = ({ tree, moveError, workspaceId, moveTargetParentId, isPending, nodeToMove, setNodeToMove, setMoveTargetParentId, setMoveError }) => {
    const router = useRouter();
    const dict = useDictionary();
    const isFolder = nodeToMove?.type === NodeType.FOLDER;

    const moveTargetOptions = React.useMemo(() => {
        if (!nodeToMove) return [];

        return buildMoveTargetOptions(
            tree,
            collectNodeIds(nodeToMove),
        );
    }, [nodeToMove, tree]);

    function handleMoveNode(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!nodeToMove) return;

        setMoveError(null);

        startTransition(async () => {
            const result = await moveNode({
                workspaceId,
                nodeId: nodeToMove.id,
                parentId:
                    moveTargetParentId === ROOT_PARENT_VALUE
                        ? null
                        : moveTargetParentId,
            });

            if (result.error) {
                setMoveError(result.error);
                return;
            }

            setNodeToMove(null);
            setMoveTargetParentId(ROOT_PARENT_VALUE);
            router.refresh();
        });
    }

    return (
        <Dialog
            open={nodeToMove !== null}
            onOpenChange={(open) => {
                if (!open && !isPending) {
                    setNodeToMove(null);
                    setMoveTargetParentId(ROOT_PARENT_VALUE);
                    setMoveError(null);
                }
            }}
        >
            <DialogContent>
                <form onSubmit={handleMoveNode}>
                    <DialogHeader>
                        <DialogTitle>
                            {isFolder ? dict.dialogs.move.titleFolder : dict.dialogs.move.titlePage}
                        </DialogTitle>
                        <DialogDescription>
                            {isFolder ? dict.dialogs.move.descriptionFolder : dict.dialogs.move.descriptionPage}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-6 space-y-2">
                        <Select
                            value={moveTargetParentId}
                            onValueChange={setMoveTargetParentId}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={dict.dialogs.move.chooseDestination} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ROOT_PARENT_VALUE}>
                                    {dict.dialogs.move.topLevel}
                                </SelectItem>
                                {moveTargetOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {moveError && (
                            <p className="text-sm text-destructive">{moveError}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isPending}>
                                {dict.dialogs.move.cancel}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? dict.dialogs.move.moving : dict.dialogs.move.move}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default MoveDialog
