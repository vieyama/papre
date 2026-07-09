import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeType } from '@/generated/prisma/enums';
import React, { startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { deleteNode } from '@/services/node';
import { NodeWithChildren } from './type';

interface DeleteDialogProps {
    workspaceId: string
    nodeToDelete: NodeWithChildren | null
    isPending: boolean
    setNodeToDelete: React.Dispatch<React.SetStateAction<NodeWithChildren | null>>
    setDeleteError: React.Dispatch<React.SetStateAction<string | null>>
    deleteError: string | null
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ workspaceId, nodeToDelete, isPending, setNodeToDelete, setDeleteError, deleteError }) => {
    const deleteButtonRef = React.useRef<HTMLButtonElement | null>(null);

    const router = useRouter();
    const pathname = usePathname();

    function handleDeleteNode() {
        if (!nodeToDelete) return;

        setDeleteError(null);

        startTransition(async () => {
            const result = await deleteNode({
                workspaceId,
                nodeId: nodeToDelete.id,
            });

            if (result.error) {
                setDeleteError(result.error);
                return;
            }

            setNodeToDelete(null);

            const activeNodeId = pathname.startsWith("/home/")
                ? pathname.slice("/home/".length).split("/")[0]
                : null;

            if (
                activeNodeId &&
                result.archivedNodeIds?.includes(activeNodeId)
            ) {
                router.push("/home");
            }

            router.refresh();
        });
    }

    return (
        <Dialog
            open={nodeToDelete !== null}
            onOpenChange={(open) => {
                if (!open && !isPending) {
                    setNodeToDelete(null);
                    setDeleteError(null);
                }
            }}
        >
            <DialogContent
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    deleteButtonRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        Delete {nodeToDelete?.type === NodeType.FOLDER ? "folder" : "page"}?
                    </DialogTitle>
                    <DialogDescription>
                        &quot;{nodeToDelete?.title}&quot;
                        {nodeToDelete?.children.length
                            ? " and all pages inside it"
                            : ""}{" "}
                        will be moved out of the sidebar.
                    </DialogDescription>
                </DialogHeader>

                {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isPending}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        ref={deleteButtonRef}
                        variant="destructive"
                        disabled={isPending}
                        onClick={handleDeleteNode}
                    >
                        {isPending
                            ? "Deleting..."
                            : `Delete ${nodeToDelete?.type === NodeType.FOLDER ? "folder" : "page"
                            }`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteDialog