import { Block, BlockNoteEditor, DefaultBlockSchema } from "@blocknote/core";
import { SideMenuExtension } from "@blocknote/core/extensions";
import {
    blockTypeSelectItems,
    useBlockNoteEditor,
    useExtensionState,
} from "@blocknote/react";
import { Menu } from "@mantine/core";
import { useMemo } from "react";

type BlockType = Block<DefaultBlockSchema>["type"];

type EditorBlock<E extends BlockNoteEditor> =
    NonNullable<ReturnType<E["getBlock"]>>;

export function BlockTypeSubMenu() {
    const editor = useBlockNoteEditor();

    const rawBlock = useExtensionState(SideMenuExtension, {
        selector: (state) => state?.block,
    });

    // Panggil dengan editor.dictionary — bukan editor langsung
    const items = useMemo(
        () => blockTypeSelectItems(editor.dictionary),
        [editor.dictionary]
    );

    if (!rawBlock) return null;

    const block = rawBlock as EditorBlock<typeof editor>;

    // Active check: sama persis dengan MUI example dari docs
    const activeItem = items.find((item) => {
        const typesMatch = item.type === block.type;
        const propsMatch =
            Object.entries(item.props ?? {}).every(
                ([k, v]) => (block.props as Record<string, unknown>)[k] === v
            );
        return typesMatch && propsMatch;
    });

    const activeLabel = activeItem?.name ?? "Turn into";

    return (
        <>
            <Menu.Sub>
                <Menu.Sub.Target>
                    <Menu.Sub.Item>{activeLabel}</Menu.Sub.Item>
                </Menu.Sub.Target>

                <Menu.Sub.Dropdown>
                    {items.map((item) => {
                        const isActive = item.type === block.type &&
                            Object.entries(item.props ?? {}).every(
                                ([k, v]) => (block.props as Record<string, unknown>)[k] === v
                            );

                        return (
                            <Menu.Item
                                key={item.name}
                                leftSection={<item.icon size={16} />}
                                rightSection={isActive ? "✓" : undefined}
                                fw={isActive ? 500 : undefined}
                                onClick={() => {
                                    if (isActive) return;
                                    editor.updateBlock(block, {
                                        type: item.type as BlockType,
                                        // item.props sudah berisi misal { level: 1 } untuk Heading 1
                                        ...(item.props ? { props: item.props } : {}),
                                    });
                                }}
                            >
                                {item.name}
                            </Menu.Item>
                        );
                    })}
                </Menu.Sub.Dropdown>
            </Menu.Sub>
        </>
    );
}