import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeType } from '@/generated/prisma/enums';
import React, { startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { deleteNode } from '@/services/node';
import { NodeWithChildren } from './type';
import { useDictionary } from '@/i18n/dictionary-context';
import { localeHref, stripLocale } from '@/i18n/paths';
import { formatMessage } from '@/i18n/format';
import type { Locale } from '@/i18n/config';

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
    const { lang } = useParams<{ lang: Locale }>();
    const dict = useDictionary();
    const isFolder = nodeToDelete?.type === NodeType.FOLDER;

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

            const { path } = stripLocale(pathname);
            const activeNodeId = path.startsWith("/home/")
                ? path.slice("/home/".length).split("/")[0]
                : null;

            if (
                activeNodeId &&
                result.archivedNodeIds?.includes(activeNodeId)
            ) {
                router.push(localeHref("/home", lang));
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
                        {isFolder ? dict.dialogs.delete.titleFolder : dict.dialogs.delete.titlePage}
                    </DialogTitle>
                    <DialogDescription>
                        {formatMessage(dict.dialogs.delete.description, {
                            title: nodeToDelete?.title ?? "",
                            extra: nodeToDelete?.children.length ? dict.dialogs.delete.extraFolder : dict.dialogs.delete.extraPage,
                        })}
                    </DialogDescription>
                </DialogHeader>

                {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isPending}>
                            {dict.dialogs.delete.cancel}
                        </Button>
                    </DialogClose>
                    <Button
                        ref={deleteButtonRef}
                        variant="destructive"
                        disabled={isPending}
                        onClick={handleDeleteNode}
                    >
                        {isPending
                            ? dict.dialogs.delete.deleting
                            : isFolder ? dict.dialogs.delete.deleteFolder : dict.dialogs.delete.deletePage}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteDialog
