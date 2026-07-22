import React, { startTransition } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeType } from '@/generated/prisma/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NodeWithChildren } from './type';
import { renameNode } from '@/services/node';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/i18n/dictionary-context';

interface RenameNodeDialogProps {
    isPending: boolean,
    workspaceId: string,
    nodeToRename: NodeWithChildren | null,
    renameTitle: string,
    renameError: string | null
    setRenameError: React.Dispatch<React.SetStateAction<string | null>>
    setRenameTitle: React.Dispatch<React.SetStateAction<string>>
    setNodeToRename: React.Dispatch<React.SetStateAction<NodeWithChildren | null>>
}
const RenameNodeDialog: React.FC<RenameNodeDialogProps> = ({
    isPending,
    workspaceId,
    nodeToRename,
    renameError,
    renameTitle,
    setRenameError,
    setRenameTitle,
    setNodeToRename
}) => {
    const router = useRouter();
    const dict = useDictionary();
    const isFolder = nodeToRename?.type === NodeType.FOLDER;

    function handleRenameNode(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!nodeToRename) return;

        setRenameError(null);

        startTransition(async () => {
            const result = await renameNode({
                workspaceId,
                nodeId: nodeToRename.id,
                title: renameTitle,
            });

            if (result.error) {
                setRenameError(result.error);
                return;
            }

            setNodeToRename(null);
            setRenameTitle("");
            router.refresh();
        });
    }

    return (
        <Dialog
            open={nodeToRename !== null}
            onOpenChange={(open) => {
                if (!open && !isPending) {
                    setNodeToRename(null);
                    setRenameTitle("");
                    setRenameError(null);
                }
            }}
        >
            <DialogContent>
                <form onSubmit={handleRenameNode}>
                    <DialogHeader>
                        <DialogTitle>
                            {isFolder ? dict.dialogs.rename.titleFolder : dict.dialogs.rename.titlePage}
                        </DialogTitle>
                        <DialogDescription>
                            {isFolder ? dict.dialogs.rename.descriptionFolder : dict.dialogs.rename.descriptionPage}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-6">
                        <Input
                            value={renameTitle}
                            onChange={(event) => setRenameTitle(event.target.value)}
                            maxLength={100}
                            autoFocus
                            disabled={isPending}
                            aria-invalid={renameError !== null}
                        />
                        {renameError && (
                            <p className="mt-2 text-sm text-destructive">{renameError}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isPending}>
                                {dict.dialogs.rename.cancel}
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={isPending || !renameTitle.trim()}
                        >
                            {isPending ? dict.dialogs.rename.renaming : dict.dialogs.rename.rename}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default RenameNodeDialog
