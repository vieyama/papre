import { Block, BlockNoteEditor, DefaultBlockSchema } from "@blocknote/core";
import { SideMenuExtension } from "@blocknote/core/extensions";
import {
    useBlockNoteEditor,
    useComponentsContext,
    useExtensionState,
} from "@blocknote/react";
import { ReactNode } from "react";

// Derive tipe dari schema, bukan import BlockType yang tidak ada
type BlockType = Block<DefaultBlockSchema>["type"];

interface ChangeBlockTypeItemProps {
    children: ReactNode;
    type: BlockType;
    blockProps?: Record<string, unknown>;
}

export function ChangeBlockTypeItem({
    children,
    type,
    blockProps,
}: ChangeBlockTypeItemProps) {
    const editor = useBlockNoteEditor();
    const Components = useComponentsContext()!;

    const block = useExtensionState(SideMenuExtension, {
        selector: (state) => state?.block,
    });

    if (!block) return null;

    // Cek apakah block sudah bertipe sama + props sama
    const isSameType =
        block.type === type &&
        (!blockProps ||
            Object.entries(blockProps).every(
                ([k, v]) => (block.props as Record<string, unknown>)[k] === v
            ));

    return (
        <Components.Generic.Menu.Item
            onClick={() => {
                // Guard manual karena disabled prop tidak ada
                if (isSameType) return;
                editor.updateBlock(block, {
                    type,
                    ...(blockProps ? { props: blockProps } : {}),
                });
            }}
            icon={undefined}
            // Gunakan className/style untuk efek visual "disabled"
            className={isSameType ? "bn-menu-item--active" : undefined}
        >
            {children}
        </Components.Generic.Menu.Item>
    );
}