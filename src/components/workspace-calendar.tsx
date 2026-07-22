"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilePlus2Icon,
  PlusIcon,
} from "lucide-react";

import { NodeType, WorkspaceRole } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

type CalendarWorkspace = {
  id: string;
  name: string;
  icon: string | null;
  currentUserRole: WorkspaceRole;
};

type CalendarPageItem = {
  id: string;
  workspaceId: string;
  title: string;
  icon: string | null;
  calendarDate: string;
};

type CreatePageForm = {
  title: string;
};

function intlLocale(locale: Locale) {
  return locale === "id" ? "id-ID" : "en-US";
}

function dateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function monthLabel(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function longDateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateFromKey(value));
}

function buildMonthDays(month: Date) {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const daysBefore = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, monthIndex, 1 - daysBefore));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return date;
  });
}

export function WorkspaceCalendar({
  workspaces,
  pages,
}: {
  workspaces: CalendarWorkspace[];
  pages: CalendarPageItem[];
}) {
  const router = useRouter();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const { selectedWorkspace, hasHydrated } = useWorkspaceStore();
  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);
  const [visibleMonth, setVisibleMonth] = React.useState(
    () => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
  );
  const [selectedDate, setSelectedDate] = React.useState(() => dateKey(today));
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspace?.id) ??
    workspaces[0];
  const monthDays = React.useMemo(
    () => buildMonthDays(visibleMonth),
    [visibleMonth],
  );
  const workspacePages = React.useMemo(
    () =>
      pages.filter((page) => page.workspaceId === activeWorkspace?.id),
    [activeWorkspace?.id, pages],
  );
  const pagesByDate = React.useMemo(() => {
    const grouped = new Map<string, CalendarPageItem[]>();

    for (const page of workspacePages) {
      const current = grouped.get(page.calendarDate) ?? [];
      current.push(page);
      grouped.set(page.calendarDate, current);
    }

    return grouped;
  }, [workspacePages]);
  const selectedPages = pagesByDate.get(selectedDate) ?? [];
  const canEdit = activeWorkspace?.currentUserRole !== WorkspaceRole.VIEWER;
  const form = useForm<CreatePageForm>({
    defaultValues: {
      title: "",
    },
  });
  const createPageMutation = useMutation({
    mutationFn: async ({ title }: CreatePageForm) => {
      if (!activeWorkspace) {
        throw new Error(dict.calendar.workspaceNotFound);
      }

      const result = await createNode({
        workspaceId: activeWorkspace.id,
        type: NodeType.PAGE,
        title,
        calendarDate: selectedDate,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.node;
    },
    onSuccess: () => {
      form.reset();
      setIsCreateOpen(false);
      router.refresh();
    },
  });

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth() + offset,
            1,
          ),
        ),
    );
  }

  function goToToday() {
    setVisibleMonth(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
    );
    setSelectedDate(dateKey(today));
  }

  function openCreateDialog(date = selectedDate) {
    setSelectedDate(date);
    form.reset({ title: "" });
    createPageMutation.reset();
    setIsCreateOpen(true);
  }

  if (!hasHydrated) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="h-[680px] animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div>
          <CalendarDaysIcon className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">{dict.calendar.noWorkspaceTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dict.calendar.noWorkspaceDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{activeWorkspace.icon || "🏠"}</span>
            <span>{activeWorkspace.name}</span>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {dict.calendar.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dict.calendar.description}
          </p>
        </div>
        {canEdit && <Button onClick={() => openCreateDialog()}>
          <PlusIcon />
          {dict.calendar.addPage}
        </Button>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => changeMonth(-1)}
                aria-label={dict.calendar.prevMonth}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => changeMonth(1)}
                aria-label={dict.calendar.nextMonth}
              >
                <ChevronRightIcon />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={goToToday}>
                {dict.calendar.today}
              </Button>
            </div>
            <h2 className="text-lg font-semibold capitalize">
              {monthLabel(visibleMonth, lang)}
            </h2>
          </div>

          <div className="grid grid-cols-7 border-b bg-muted/30">
            {dict.calendar.weekdaysShort.map((weekday) => (
              <div
                key={weekday}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((date) => {
              const key = dateKey(date);
              const dayPages = pagesByDate.get(key) ?? [];
              const isCurrentMonth =
                date.getUTCMonth() === visibleMonth.getUTCMonth();
              const isSelected = key === selectedDate;
              const isToday = key === dateKey(today);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  onDoubleClick={() => {
                    if (canEdit) openCreateDialog(key);
                  }}
                  className={cn(
                    "relative min-h-24 border-r border-b p-2 text-left transition-colors hover:bg-muted/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:min-h-28",
                    !isCurrentMonth && "bg-muted/20 text-muted-foreground/60",
                    isSelected && "bg-muted/70",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm",
                      isToday && "bg-primary font-medium text-primary-foreground",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>

                  {dayPages.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayPages.slice(0, 2).map((page) => (
                        <span
                          key={page.id}
                          className="block truncate rounded-md bg-primary/10 px-1.5 py-1 text-xs font-medium text-foreground"
                        >
                          {page.icon || "📄"} {page.title}
                        </span>
                      ))}
                      {dayPages.length > 2 && (
                        <span className="block px-1 text-[11px] text-muted-foreground">
                          {formatMessage(dict.calendar.morePages, { count: dayPages.length - 2 })}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border bg-card p-5 xl:sticky xl:top-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {dict.calendar.selectedDateLabel}
          </p>
          <h2 className="mt-2 text-lg font-semibold capitalize">
            {longDateLabel(selectedDate, lang)}
          </h2>
          {canEdit && <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={() => openCreateDialog()}
          >
            <FilePlus2Icon />
            {dict.calendar.addPageForDate}
          </Button>}

          <div className="mt-5 border-t pt-5">
            {selectedPages.length > 0 ? (
              <div className="space-y-2">
                {selectedPages.map((page) => (
                  <Link
                    key={page.id}
                    href={localeHref(`/home/${page.id}`, lang)}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted text-lg">
                      {page.icon || "📄"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {page.title}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CalendarDaysIcon className="mx-auto size-8 text-muted-foreground/60" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {dict.calendar.emptyForDate}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) createPageMutation.reset();
        }}
      >
        <DialogContent>
          <form onSubmit={form.handleSubmit((values) => createPageMutation.mutate(values))}>
            <DialogHeader>
              <DialogTitle>{dict.calendar.dialogTitle}</DialogTitle>
              <DialogDescription className="capitalize">
                {formatMessage(dict.calendar.dialogDescription, {
                  date: longDateLabel(selectedDate, lang),
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="my-6 space-y-2">
              <Label htmlFor="calendar-page-title">{dict.calendar.titleLabel}</Label>
              <Input
                id="calendar-page-title"
                placeholder={dict.calendar.titlePlaceholder}
                autoFocus
                maxLength={100}
                disabled={createPageMutation.isPending}
                aria-invalid={Boolean(form.formState.errors.title)}
                {...form.register("title", {
                  required: dict.calendar.titleRequired,
                  validate: (value) =>
                    value.trim().length > 0 || dict.calendar.titleRequired,
                })}
              />
              {form.formState.errors.title?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
              {createPageMutation.error && (
                <p className="text-sm text-destructive">
                  {createPageMutation.error.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createPageMutation.isPending}
                onClick={() => setIsCreateOpen(false)}
              >
                {dict.common.cancel}
              </Button>
              <Button type="submit" disabled={createPageMutation.isPending}>
                {createPageMutation.isPending ? dict.calendar.submitPending : dict.calendar.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
