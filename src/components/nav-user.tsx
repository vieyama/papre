"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { BadgeCheckIcon, ChevronsUpDownIcon, LogOutIcon, Sun, Moon, Monitor } from "lucide-react"
import { User } from "next-auth"
import { useTheme } from "next-themes"
import { useDictionary } from "@/i18n/dictionary-context"
import { localeHref, stripLocale } from "@/i18n/paths"
import { locales, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  id: "ID",
}

const THEME_OPTIONS = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const

export function NavUser({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()
  const { lang } = useParams<{ lang: Locale }>()
  const pathname = usePathname()
  const { locale: currentLocale, path } = stripLocale(pathname)
  const { theme, setTheme } = useTheme()
  const dict = useDictionary()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.image || ""} alt={user.name || ""} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name || ""}</span>
                <span className="truncate text-xs">{user.email || ""}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || ""}</span>
                  <span className="truncate text-xs">{user.email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={localeHref("/account", lang)}>
                  <BadgeCheckIcon />
                  {dict.nav.account}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span className="text-muted-foreground">{dict.nav.theme}</span>
              <div className="flex items-center gap-1">
                {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "rounded-md p-1 transition-colors",
                      value === theme
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </button>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span className="text-muted-foreground">{dict.nav.language}</span>
              <div className="flex items-center gap-1">
                {locales.map((locale) => (
                  <Link
                    key={locale}
                    href={localeHref(path, locale)}
                    className={cn(
                      "rounded-md px-2 py-0.5 transition-colors",
                      locale === currentLocale
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {LOCALE_LABEL[locale]}
                  </Link>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <form action={async () => {
              await signOut({ redirectTo: localeHref("/", lang) })
            }}>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <button type="submit" className="w-full">
                  <LogOutIcon
                  />
                  {dict.nav.logout}
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
