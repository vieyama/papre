'use client'

import "@blocknote/core/fonts/inter.css";
import { SideMenu, SideMenuController, SideMenuProps, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useRef, useEffect } from "react";
import { CustomDragHandleMenu } from "./CustomDragHandleMenu";

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

const Editor = ({ content, onChange, placeholder, editable = true }: EditorProps) => {
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
        <div className="border border-zinc-100 rounded-md p-4 bg-white">
            <BlockNoteView
                editor={editor}
                theme="light"
                editable={editable}
                sideMenu={false}
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
                {editable && <SideMenuController sideMenu={CustomSideMenu} />}
            </BlockNoteView>
        </div>
    );
}

export default Editor
