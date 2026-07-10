'use client'

import { useEffect, useRef } from 'react';
import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';

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
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager/react'
import { SelectionPluginPackage } from '@embedpdf/plugin-selection/react'
import { PagePointerProvider } from '@embedpdf/plugin-interaction-manager/react';
import { SelectionLayer } from '@embedpdf/plugin-selection/react';

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

export const PDFViewer = ({ pdfUrl, initialPage, onSaveLastReadPage }: PDFViewerProps) => {
    // 1. Register the plugins you need
    const plugins = [
        createPluginRegistration(DocumentManagerPluginPackage, {
            initialDocuments: [{ url: pdfUrl ?? 'https://snippet.embedpdf.com/ebook.pdf' }],
        }),
        createPluginRegistration(ViewportPluginPackage),
        createPluginRegistration(ScrollPluginPackage),
        createPluginRegistration(RenderPluginPackage),

        // Add the zoom plugin to the array
        createPluginRegistration(InteractionManagerPluginPackage),
        createPluginRegistration(ZoomPluginPackage, {
            defaultZoomLevel: ZoomMode.Automatic,
        }),

        createPluginRegistration(InteractionManagerPluginPackage),
        createPluginRegistration(SelectionPluginPackage),

    ];
    // 2. Initialize the engine with the React hook
    const { engine, isLoading } = usePdfiumEngine();

    const config = {
        permissions: {
            overrides: {
                print: false,
                modifyContents: false
            }
        }
    };

    if (isLoading || !engine) {
        return <div>Loading PDF Engine...</div>;
    }

    // 3. Wrap your UI with the <EmbedPDF> provider
    return (
        <div style={{ height: '580px' }}>
            <EmbedPDF engine={engine} config={config} plugins={plugins}>
                {({ activeDocumentId }) =>
                    activeDocumentId && (
                        <DocumentContent documentId={activeDocumentId}>
                            {({ isLoaded }) =>
                                isLoaded && (
                                    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                        {/* Headless: restores + reports last read page, renders nothing */}
                                        <LastReadPageSync
                                            documentId={activeDocumentId}
                                            initialPage={initialPage}
                                            onSaveLastReadPage={onSaveLastReadPage}
                                        />

                                        {/* Toolbar */}
                                        <ZoomToolbar documentId={activeDocumentId} />
                                        {/* PDF Viewer Area */}
                                        <div
                                            className="relative h-100 sm:h-125"
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
                    )
                }
            </EmbedPDF>
        </div>
    );
};