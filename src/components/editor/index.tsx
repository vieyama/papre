'use client'

import "@blocknote/core/fonts/inter.css";
import { editorHasBlockWithType } from "@blocknote/core";
import {
    BasicTextStyleButton,
    blockTypeSelectItems,
    ColorStyleButton,
    CreateLinkButton,
    DragHandleButton,
    ExperimentalMobileFormattingToolbarController,
    FormattingToolbar,
    FormattingToolbarProps,
    NestBlockButton,
    SideMenu,
    SideMenuController,
    SideMenuProps,
    TextAlignButton,
    UnnestBlockButton,
    useCreateBlockNote,
    useBlockNoteEditor,
    useEditorState,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useRef, useEffect, useMemo } from "react";
import { CustomDragHandleMenu } from "./CustomDragHandleMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

interface EditorProps {
    content?: string
    onChange?: (content: string) => void
    placeholder?: string
    editable?: boolean
}

const emptyDocument = [{ type: "paragraph" as const }]

const CustomSideMenu = (props: SideMenuProps) => (
    <SideMenu {...props} dragHandleMenu={CustomDragHandleMenu} />
);

const MobileSideMenu = (props: SideMenuProps) => (
    <SideMenu {...props} dragHandleMenu={CustomDragHandleMenu}>
        <DragHandleButton {...props} />
    </SideMenu>
);

const MobileBlockTypeDropdown = (props: FormattingToolbarProps) => {
    const editor = useBlockNoteEditor();
    const selectedBlocks = useEditorState({
        editor,
        selector: ({ editor }) =>
            editor.getSelection()?.blocks || [editor.getTextCursorPosition().block],
    });
    const firstSelectedBlock = selectedBlocks[0];

    const items = useMemo(
        () =>
            (props.blockTypeSelectItems || blockTypeSelectItems(editor.dictionary)).filter((item) =>
                editorHasBlockWithType(
                    editor,
                    item.type,
                    Object.fromEntries(
                        Object.entries(item.props || {}).map(([propName, propValue]) => [
                            propName,
                            typeof propValue,
                        ]),
                    ) as Record<string, "string" | "number" | "boolean">,
                ),
            ),
        [editor, props.blockTypeSelectItems],
    );

    const selectedItem = items.find((item) => {
        const typesMatch = item.type === firstSelectedBlock.type;
        const propsMatch =
            Object.entries(item.props || {}).filter(
                ([propName, propValue]) =>
                    propValue !== firstSelectedBlock.props[propName],
            ).length === 0;

        return typesMatch && propsMatch;
    });

    if (!selectedItem || !editor.isEditable) {
        return null;
    }

    const SelectedIcon = selectedItem.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-7 gap-1 px-2 text-[13px] font-normal"
                >
                    <SelectedIcon className="size-4" />
                    <span>{selectedItem.name}</span>
                    <ChevronDownIcon className="size-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-48">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isSelected = item === selectedItem;

                    return (
                        <DropdownMenuItem
                            key={`${item.type}:${JSON.stringify(item.props || {})}`}
                            onSelect={() => {
                                editor.focus();
                                editor.transact(() => {
                                    for (const block of selectedBlocks) {
                                        editor.updateBlock(block, {
                                            type: item.type as never,
                                            props: item.props as never,
                                        });
                                    }
                                });
                            }}
                        >
                            <Icon className="size-4" />
                            <span className="flex-1">{item.name}</span>
                            {isSelected && <CheckIcon className="size-4" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const MobileFormattingToolbar = (props: FormattingToolbarProps) => (
    <FormattingToolbar {...props}>
        <MobileBlockTypeDropdown {...props} />
        <BasicTextStyleButton basicTextStyle="bold" />
        <BasicTextStyleButton basicTextStyle="italic" />
        <BasicTextStyleButton basicTextStyle="underline" />
        <BasicTextStyleButton basicTextStyle="strike" />
        <TextAlignButton textAlignment="left" />
        <TextAlignButton textAlignment="center" />
        <TextAlignButton textAlignment="right" />
        <ColorStyleButton />
        <NestBlockButton />
        <UnnestBlockButton />
        <CreateLinkButton />
    </FormattingToolbar>
);

const Editor = ({ content, onChange, placeholder, editable = true }: EditorProps) => {
    const isMobile = useIsMobile()
    const { theme } = useTheme()
    console.log(theme);

    const lastSyncedHtml = useRef<string | null>(null)
    const hasSyncedInitialContent = useRef(false)
    const isApplyingExternalContent = useRef(false)
    const editor = useCreateBlockNote(
        {
            initialContent: emptyDocument,
            placeholders: placeholder ? { default: placeholder } : undefined,
        },
        [placeholder],
    )

    useEffect(() => {
        if (hasSyncedInitialContent.current && content === lastSyncedHtml.current) {
            return
        }

        isApplyingExternalContent.current = true
        const nextBlocks = (content?.trim() ?? '') ? editor.tryParseHTMLToBlocks(content || '') : emptyDocument
        editor.replaceBlocks(editor.document, nextBlocks)
        lastSyncedHtml.current = content || ''
        hasSyncedInitialContent.current = true
        isApplyingExternalContent.current = false
    }, [content, editor])

    return (
        <div className="border border-zinc-100 rounded-md p-4 bg-white dark:bg-[#1f1f1f]">
            <BlockNoteView
                editor={editor}
                theme={theme === 'light' ? 'light' : 'dark'}
                editable={editable}
                formattingToolbar={!isMobile}
                slashMenu={!isMobile}
                sideMenu={false}
                className="p-0"
                onChange={() => {
                    if (!hasSyncedInitialContent.current || isApplyingExternalContent.current) {
                        return
                    }

                    const nextHtml = editor.blocksToHTMLLossy()

                    if (nextHtml === lastSyncedHtml.current) {
                        return
                    }

                    lastSyncedHtml.current = nextHtml
                    if (onChange) {
                        onChange(nextHtml)
                    }
                }}
            >
                {editable && (
                    <SideMenuController sideMenu={isMobile ? MobileSideMenu : CustomSideMenu} />
                )}
                {editable && isMobile && (
                    <ExperimentalMobileFormattingToolbarController
                        formattingToolbar={MobileFormattingToolbar}
                    />
                )}
            </BlockNoteView>
        </div>
    );
}

export default Editor
