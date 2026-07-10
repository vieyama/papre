import { SelectionSelectionMenuProps, useSelectionCapability } from '@embedpdf/plugin-selection/react';
import { useScroll } from '@embedpdf/plugin-scroll/react';
import { useZoom, ZoomMode } from '@embedpdf/plugin-zoom/react';
import { ZoomIn, ZoomOut, RotateCcw, Check, Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react';

interface ZoomToolbarProps {
    documentId: string
}

// Compact dark pagination pill: [<] [page] total [>]
const PageNavigation = ({ documentId }: { documentId: string }) => {
    const { provides: scroll, state } = useScroll(documentId)
    const [pageInput, setPageInput] = useState(String(state.currentPage))

    // Keep the input in sync whenever the page changes from elsewhere (scrolling, next/prev, etc.)
    useEffect(() => {
        setPageInput(String(state.currentPage))
    }, [state.currentPage])

    if (!scroll) return null

    const commitPage = () => {
        const pageNumber = parseInt(pageInput, 10)
        if (!Number.isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= state.totalPages) {
            scroll.scrollToPage({ pageNumber })
        } else {
            setPageInput(String(state.currentPage))
        }
    }

    return (
        <div className="flex items-center gap-0.5 rounded-full bg-gray-900/95 p-1 shadow-md ring-1 ring-black/10 dark:bg-black/70 dark:ring-white/10">
            <button
                onClick={() => scroll.scrollToPreviousPage()}
                disabled={state.currentPage <= 1}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Previous Page"
            >
                <ChevronLeft size={16} />
            </button>

            <input
                type="text"
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitPage}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                }}
                aria-label="Current page"
                className="h-7 w-9 rounded-full border-0 bg-white text-center font-mono text-sm font-semibold text-gray-900 outline-none ring-0 focus:ring-2 focus:ring-blue-500"
            />

            <span className="min-w-6 px-1 text-center font-mono text-sm font-medium text-gray-400">
                {state.totalPages}
            </span>

            <button
                onClick={() => scroll.scrollToNextPage()}
                disabled={state.currentPage >= state.totalPages}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Next Page"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    )
}

export const ZoomToolbar = ({ documentId }: ZoomToolbarProps) => {
    const { provides: zoom, state } = useZoom(documentId)

    if (!zoom) return null

    const zoomPercentage = Math.round(state.currentZoomLevel * 100)

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-linear-to-b from-gray-50 to-gray-100 px-3 py-2 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
            {/* Pagination */}
            <PageNavigation documentId={documentId} />

            <div className="hidden h-6 w-px bg-gray-300 sm:block dark:bg-gray-600" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200 dark:bg-gray-700 dark:ring-gray-600">
                <button
                    onClick={zoom.zoomOut}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100"
                    title="Zoom Out"
                >
                    <ZoomOut size={15} />
                </button>

                {/* Zoom level indicator */}
                <div className="min-w-12 select-none px-1 text-center">
                    <span className="font-mono text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                        {zoomPercentage}%
                    </span>
                </div>

                <button
                    onClick={zoom.zoomIn}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100"
                    title="Zoom In"
                >
                    <ZoomIn size={15} />
                </button>

                <div className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600" />

                <button
                    onClick={() => zoom.requestZoom(ZoomMode.FitPage)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100"
                    title="Reset Zoom to Fit Page"
                >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">Reset</span>
                </button>
            </div>
        </div>
    )
}

export const TextSelectionMenu = ({
    rect,
    menuWrapperProps,
    placement,
    documentId,
}: SelectionSelectionMenuProps & { documentId: string }) => {
    const { provides: selectionCapability } = useSelectionCapability()
    const [copied, setCopied] = useState(false)

    // Reset copied state when placement changes
    useEffect(() => {
        setCopied(false)
    }, [placement])

    const handleCopy = () => {
        if (!selectionCapability) return

        const scope = selectionCapability.forDocument(documentId)
        if (!scope) return

        scope.copyToClipboard()
        scope.clear()

        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const menuStyle: React.CSSProperties = {
        position: 'absolute',
        pointerEvents: 'auto',
        cursor: 'default',
    }

    // Position above or below based on available space
    if (placement.suggestTop) {
        menuStyle.top = -40 - 8
    } else {
        menuStyle.top = rect.size.height + 8
    }

    return (
        <div {...menuWrapperProps}>
            <div
                style={menuStyle}
                className="rounded-full border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
                <div className="flex items-center gap-1 px-1.5 py-1">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        aria-label="Copy selected text"
                        title="Copy"
                    >
                        {copied ? (
                            <>
                                <Check
                                    size={16}
                                    className="text-green-600 dark:text-green-400"
                                />
                                <span className="text-green-600 dark:text-green-400">
                                    Copied!
                                </span>
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}