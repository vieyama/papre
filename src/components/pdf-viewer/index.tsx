'use client'

import { useEffect, useMemo, useRef } from 'react';
import { createPluginRegistration, type DocumentState } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { AlertCircleIcon, LoaderCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import the essential plugins
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import {
    Scroller,
    ScrollPluginPackage,
    useScroll,
    useScrollCapability,
} from '@embedpdf/plugin-scroll/react';
import {
    DocumentContent,
    DocumentManagerPluginPackage,
} from '@embedpdf/plugin-document-manager/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';

import { ZoomPluginPackage, ZoomMode } from '@embedpdf/plugin-zoom/react';
import { ZoomToolbar, TextSelectionMenu } from './toolbar';
import {
    InteractionManagerPluginPackage,
    PagePointerProvider,
    useInteractionManagerCapability,
    usePointerHandlers,
} from '@embedpdf/plugin-interaction-manager/react'
import {
    SelectionPluginPackage,
    SelectionLayer,
    useSelectionCapability,
} from '@embedpdf/plugin-selection/react'
import type { Position } from '@embedpdf/models';
import type { EmbedPdfPointerEvent } from '@embedpdf/plugin-interaction-manager';

// The stock "pointerMode" wants raw touch events (touchAction: 'none' +
// preventDefault on touchmove), which is what let a swipe be interpreted as a
// text-selection drag instead of a scroll. We keep that mode id (so it stays
// the plugin's default) but turn raw-touch off, and add a second mode that
// only a long-press switches into, where selection is actually enabled.
const POINTER_MODE = 'pointerMode';
const TEXT_SELECT_MODE = 'textSelect';
const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE = 10;

// Params sent whenever the "last read page" should be persisted.
// The actual API call lives wherever this component is consumed -
// this file only decides *when* and *with what params* to fire it.
export interface SaveLastReadPageParams {
    documentId: string;
    pageNumber: number;
    totalPages: number;
}

interface PDFViewerProps {
    pdfUrl: string;
    /** Page to jump to once the document has finished its initial layout. */
    initialPage?: number;
    /** Called (debounced) whenever the user settles on a new page. */
    onSaveLastReadPage?: (params: SaveLastReadPageParams) => void;
}

// Headless helper component: no UI of its own, just wires up scroll
// events to (1) restore the last read page on load and (2) report
// page changes back to the caller so it can persist them.
const LastReadPageSync = ({
    documentId,
    initialPage,
    onSaveLastReadPage,
}: {
    documentId: string;
    initialPage?: number;
    onSaveLastReadPage?: (params: SaveLastReadPageParams) => void;
}) => {
    const { provides: scroll } = useScroll(documentId);
    const { provides: scrollCapability } = useScrollCapability();
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Restore: jump to the saved page once, right after the initial layout is ready.
    useEffect(() => {
        if (!scrollCapability || !scroll || !initialPage || initialPage <= 1) return;

        const unsubscribe = scrollCapability.onLayoutReady(({ documentId: eventDocId, isInitial }) => {
            if (eventDocId !== documentId || !isInitial) return;
            scroll.scrollToPage({ pageNumber: initialPage, behavior: 'auto' });
        });

        return () => unsubscribe?.();
    }, [scrollCapability, scroll, documentId, initialPage]);

    // Persist: report the current page as the user reads, debounced so we
    // don't fire on every intermediate page while scrolling fast.
    useEffect(() => {
        if (!scrollCapability || !onSaveLastReadPage) return;

        const unsubscribe = scrollCapability.onPageChange(({ documentId: eventDocId, pageNumber, totalPages }) => {
            if (eventDocId !== documentId) return;

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                onSaveLastReadPage({ documentId: eventDocId, pageNumber, totalPages });
            }, 600);
        });

        return () => {
            unsubscribe?.();
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [scrollCapability, documentId, onSaveLastReadPage]);

    return null;
};

// Headless helper: configures the two interaction modes described above and
// enables text selection only for the long-press mode, then auto-reverts back
// to the (scrollable) default mode once a selection ends or the user taps
// empty space.
const TouchSelectionModes = ({ documentId }: { documentId: string }) => {
    const { provides: interactionManager } = useInteractionManagerCapability();
    const { provides: selection } = useSelectionCapability();

    useEffect(() => {
        if (!interactionManager || !selection) return;

        interactionManager.registerMode({
            id: POINTER_MODE,
            scope: 'page',
            exclusive: false,
            cursor: 'auto',
            wantsRawTouch: false,
        });
        interactionManager.registerMode({
            id: TEXT_SELECT_MODE,
            scope: 'page',
            exclusive: false,
            cursor: 'text',
        });

        selection.enableForMode(
            POINTER_MODE,
            { enableSelection: false, showSelectionRects: false, enableMarquee: false },
            documentId,
        );
        selection.enableForMode(
            TEXT_SELECT_MODE,
            { enableSelection: true, showSelectionRects: true, enableMarquee: false },
            documentId,
        );

        const revertToScrollMode = () => interactionManager.forDocument(documentId).activateDefaultMode();

        const unsubEnd = selection.onEndSelection(({ documentId: eventDocId }) => {
            if (eventDocId === documentId) revertToScrollMode();
        });
        const unsubEmptyClick = selection.onEmptySpaceClick(({ documentId: eventDocId }) => {
            if (eventDocId === documentId) revertToScrollMode();
        });

        return () => {
            unsubEnd();
            unsubEmptyClick();
        };
    }, [interactionManager, selection, documentId]);

    return null;
};

// Headless helper, one per page: detects a press-and-hold with little
// movement and switches that document into text-select mode, replaying the
// original pointer-down into the (now active) selection handler so the same
// continuous touch drag carries on as a text selection instead of needing a
// second gesture.
const LongPressToSelect = ({
    documentId,
    pageIndex,
}: {
    documentId: string;
    pageIndex: number;
}) => {
    const { provides: interactionManager } = useInteractionManagerCapability();
    const { register } = usePointerHandlers({ documentId, pageIndex, modeId: POINTER_MODE });

    useEffect(() => {
        if (!interactionManager) return;

        let timer: ReturnType<typeof setTimeout> | null = null;
        let startPos: Position | null = null;
        let startEvt: EmbedPdfPointerEvent | null = null;

        const clearPress = () => {
            if (timer) clearTimeout(timer);
            timer = null;
            startPos = null;
            startEvt = null;
        };

        const unregister = register({
            onPointerDown: (pos, evt) => {
                startPos = pos;
                startEvt = evt;
                timer = setTimeout(() => {
                    if (!startPos || !startEvt) return;

                    const scope = interactionManager.forDocument(documentId);
                    scope.activate(TEXT_SELECT_MODE);

                    const handlers = interactionManager.getHandlersForScope({
                        type: 'page',
                        documentId,
                        pageIndex,
                    });
                    handlers?.onPointerDown?.(startPos, startEvt, scope.getActiveMode());
                }, LONG_PRESS_MS);
            },
            onPointerMove: (pos) => {
                if (!startPos || !timer) return;

                const dx = pos.x - startPos.x;
                const dy = pos.y - startPos.y;
                if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_TOLERANCE) clearPress();
            },
            onPointerUp: clearPress,
            onPointerCancel: clearPress,
        });

        return () => {
            clearPress();
            unregister?.();
        };
    }, [interactionManager, register, documentId, pageIndex]);

    return null;
};

const PdfLoadingState = ({ progress, label }: { progress?: number; label: string }) => {
    const normalizedProgress = progress === undefined
        ? undefined
        : Math.min(100, Math.max(0, progress <= 1 ? progress * 100 : progress));

    return (
        <div className="flex h-full min-h-80 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="w-full max-w-xs text-center">
                <LoaderCircleIcon className="mx-auto size-6 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">{label}</p>
                <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={normalizedProgress === undefined ? undefined : Math.round(normalizedProgress)}
                >
                    <div
                        className={normalizedProgress === undefined
                            ? "h-full w-1/3 animate-pulse rounded-full bg-primary"
                            : "h-full rounded-full bg-primary transition-[width] duration-200"
                        }
                        style={normalizedProgress === undefined
                            ? undefined
                            : { width: `${normalizedProgress}%` }
                        }
                    />
                </div>
                {normalizedProgress !== undefined && (
                    <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                        {Math.round(normalizedProgress)}%
                    </p>
                )}
            </div>
        </div>
    );
};

const PdfErrorState = ({ message }: { message?: string | null }) => (
    <div className="flex h-full min-h-80 items-center justify-center rounded-xl border border-destructive/30 bg-white px-6 dark:bg-gray-900">
        <div className="max-w-sm text-center">
            <AlertCircleIcon className="mx-auto size-7 text-destructive" />
            <p className="mt-3 text-sm font-medium">Unable to load this PDF</p>
            {message && (
                <p className="mt-1 text-xs text-muted-foreground">{message}</p>
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
            >
                <RefreshCwIcon />
                Retry
            </Button>
        </div>
    </div>
);

const PdfDocumentStatus = ({ document }: { document: DocumentState | null }) => {
    if (!document) {
        return <PdfLoadingState label="Preparing PDF..." />;
    }

    if (document.status === 'error') {
        return <PdfErrorState message={document.error} />;
    }

    if (document.status === 'loading') {
        return (
            <PdfLoadingState
                label="Loading PDF..."
                progress={document.loadingProgress}
            />
        );
    }

    return null;
};

export const PDFViewer = ({ pdfUrl, initialPage, onSaveLastReadPage }: PDFViewerProps) => {
    // 1. Register the plugins you need
    const plugins = useMemo(
        () => [
            createPluginRegistration(DocumentManagerPluginPackage, {
                initialDocuments: [{ url: pdfUrl }],
            }),
            createPluginRegistration(ViewportPluginPackage),
            createPluginRegistration(ScrollPluginPackage),
            createPluginRegistration(RenderPluginPackage),
            createPluginRegistration(InteractionManagerPluginPackage),
            createPluginRegistration(ZoomPluginPackage, {
                defaultZoomLevel: ZoomMode.Automatic,
            }),
            createPluginRegistration(SelectionPluginPackage),
        ],
        [pdfUrl],
    );
    // 2. Initialize the engine with the React hook
    const { engine, isLoading, error: engineError } = usePdfiumEngine();

    const config = {
        permissions: {
            overrides: {
                print: false,
                modifyContents: false
            }
        }
    };

    if (engineError) {
        return <PdfErrorState message={engineError.message} />;
    }

    if (isLoading || !engine) {
        return <PdfLoadingState label="Preparing PDF reader..." />;
    }

    // 3. Wrap your UI with the <EmbedPDF> provider
    return (
        <div className="h-full min-h-0">
            <EmbedPDF engine={engine} config={config} plugins={plugins}>
                {({ activeDocumentId, activeDocument }) =>
                    activeDocumentId && activeDocument?.status === 'loaded' ? (
                        <DocumentContent documentId={activeDocumentId}>
                            {({ isLoaded }) =>
                                isLoaded && (
                                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                        {/* Headless: restores + reports last read page, renders nothing */}
                                        <LastReadPageSync
                                            documentId={activeDocumentId}
                                            initialPage={initialPage}
                                            onSaveLastReadPage={onSaveLastReadPage}
                                        />
                                        {/* Headless: swipe scrolls by default, long-press enables text selection */}
                                        <TouchSelectionModes documentId={activeDocumentId} />

                                        {/* Toolbar */}
                                        <ZoomToolbar documentId={activeDocumentId} />
                                        {/* PDF Viewer Area */}
                                        <div
                                            className="relative h-[78vh] min-h-0 md:h-auto md:flex-1"
                                            style={{ userSelect: 'none' }}
                                        >
                                            <Viewport
                                                documentId={activeDocumentId}
                                                className="absolute inset-0 bg-gray-200 dark:bg-gray-800"
                                            >
                                                <Scroller
                                                    documentId={activeDocumentId}
                                                    renderPage={({ pageIndex }) => (
                                                        <PagePointerProvider
                                                            documentId={activeDocumentId}
                                                            pageIndex={pageIndex}
                                                        >
                                                            <LongPressToSelect
                                                                documentId={activeDocumentId}
                                                                pageIndex={pageIndex}
                                                            />
                                                            <RenderLayer
                                                                documentId={activeDocumentId}
                                                                pageIndex={pageIndex}
                                                                scale={1}
                                                                className="pointer-events-none"
                                                            />
                                                            <SelectionLayer
                                                                documentId={activeDocumentId}
                                                                pageIndex={pageIndex}
                                                                selectionMenu={(props) => (
                                                                    <TextSelectionMenu
                                                                        {...props}
                                                                        documentId={activeDocumentId}
                                                                    />
                                                                )}
                                                            />
                                                        </PagePointerProvider>
                                                    )}
                                                />
                                            </Viewport>
                                        </div>
                                    </div>
                                )
                            }
                        </DocumentContent>
                    ) : (
                        <PdfDocumentStatus document={activeDocument} />
                    )
                }
            </EmbedPDF>
        </div>
    );
};
