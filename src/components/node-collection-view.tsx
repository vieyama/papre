"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRightIcon,
  Clock3Icon,
  FilePlus2Icon,
  LayoutGridIcon,
  ListIcon,
} from "lucide-react";

import { NodeType } from "@/generated/prisma/browser";
import { NodeIcon } from "@/components/sidebar/node-icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatShortDate } from "@/lib/format-date";
import { useDictionary } from "@/i18n/dictionary-context";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary.types";

export type NodeCollectionItem = {
  id: string;
  title: string;
  type: NodeType;
  icon: string | null;
  coverImage?: string | null;
  updatedAt?: string | null;
};

type ViewMode = "gallery" | "list";

function getCoverUrl(item: NodeCollectionItem) {
  if (!item.coverImage) return null;

  return item.coverImage.startsWith("minio://")
    ? `/api/nodes/${item.id}/cover`
    : item.coverImage;
}

function nodeTypeLabel(type: NodeType, dict: Dictionary) {
  return type === NodeType.FOLDER ? dict.nodeCollection.folder : dict.nodeCollection.page;
}

function GalleryCard({
  item,
  href,
  locale,
}: {
  item: NodeCollectionItem;
  href: string;
  locale: Locale;
}) {
  const coverUrl = getCoverUrl(item);

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border transition-colors hover:bg-muted/40"
    >
      <div
        className="flex h-24 items-center justify-center bg-muted/60 bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      >
        {!coverUrl && <NodeIcon node={item} className="size-8 text-3xl" />}
      </div>
      <div className="flex items-center gap-3 p-4">
        <NodeIcon node={item} className="size-5 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.title}</p>
          {item.updatedAt && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3Icon className="size-3" />
              {formatShortDate(item.updatedAt, locale)}
            </p>
          )}
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function ListRow({
  item,
  href,
  locale,
  dict,
}: {
  item: NodeCollectionItem;
  href: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const coverUrl = getCoverUrl(item);

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      >
        {!coverUrl && <NodeIcon node={item} className="size-5 text-lg" />}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {nodeTypeLabel(item.type, dict)}
      </span>
      {item.updatedAt && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatShortDate(item.updatedAt, locale)}
        </span>
      )}
      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export function NodeCollectionView({
  items,
  getHref,
  title,
  description,
  actions,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  items: NodeCollectionItem[];
  getHref: (item: NodeCollectionItem) => string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
}) {
  const [view, setView] = React.useState<ViewMode>("gallery");
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();

  return (
    <section>
      <div className="mb-4 flex flex-col min-[830px]:flex-row min-[830px]:items-center justify-between gap-4">
        <div>
          {title && (
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {items.length > 0 && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={view}
              onValueChange={(value) => {
                if (value) setView(value as ViewMode);
              }}
            >
              <ToggleGroupItem value="gallery" aria-label={dict.nodeCollection.galleryView}>
                <LayoutGridIcon className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={dict.nodeCollection.listView}>
                <ListIcon className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        view === "gallery" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <GalleryCard key={item.id} item={item} href={getHref(item)} locale={lang} />
            ))}
          </div>
        ) : (
          <div className="divide-y rounded-xl border">
            {items.map((item) => (
              <ListRow key={item.id} item={item} href={getHref(item)} locale={lang} dict={dict} />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
            <FilePlus2Icon className="size-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium">{emptyTitle}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {emptyDescription}
          </p>
          {emptyAction}
        </div>
      )}
    </section>
  );
}
