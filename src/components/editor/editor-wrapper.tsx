'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('.'), { ssr: false });

export default function EditorWrapper({
    content,
    onChange,
    placeholder = "Type / to add blocks, headings, checklists, quotes, or dividers.",
    editable = true,
}: {
    content?: string
    onChange?: (content: string) => void
    placeholder?: string
    editable?: boolean
}) {
    return (
        <Editor
            content={content}
            onChange={onChange}
            placeholder={placeholder}
            editable={editable}
        />
    );
}
