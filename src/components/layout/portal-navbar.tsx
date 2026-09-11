"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import {
  GraduationCap,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { useAppSession } from "@/hooks/use-session";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { hasPermission, P } from "@/features/identity";

interface PortalNavbarProps {
  initialUser?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  brandName: string;
  brandTagline: string;
  logoUrl?: string | null;
}

export function PortalNavbar({
  initialUser,
  brandName,
  brandTagline,
  logoUrl,
}: PortalNavbarProps) {
  const pathname = usePathname();
  const t = useT();
  const locale = useLocale();
  const isTh = locale === "th";
  const { theme, setTheme } = useTheme();
  const { user: sessionUser, roles, permissions, isSuperAdmin, status } = useAppSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile drawer on route change
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const user = sessionUser ?? initialUser;
  const initials = (user?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const ctx = { roles, permissions, isSuperAdmin };
  const canManageSettings = hasPermission(ctx, P.settingsManage);

  const navItems = [
    { href: "/", label: isTh ? "หน้าแรก" : "Home" },
    { href: "/news", label: isTh ? "ข่าวสารและประกาศ" : "News & PR" },
    { href: "/personnel", label: isTh ? "ทำเนียบคณาจารย์" : "Faculty & Staff" },
    { href: "/programs", label: isTh ? "หลักสูตรการศึกษา" : "Academic Programs" },
  ];

  return (
    <header className="adm-head sticky top-0 z-50 w-full !p-0">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4 h-full">
        {/* Brand Block */}
        <Link className="brand-blk !w-auto hover:opacity-90 transition-opacity" href="/">
          <i>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-1 rounded-sm" />
            ) : (
              <GraduationCap className="h-5 w-5 text-current" />
            )}
          </i>
          <div className="t">
            <b>{brandName}</b>
            <span>{brandTagline}</span>
          </div>
        </Link>

        {/* Portal Navigation Menus */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150",
                  isActive
                    ? "bg-[var(--glass-strong)] text-[var(--brand-ink)] font-semibold shadow-xs"
                    : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-hover)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <span className="sp" />

        {/* Theme Toggle (matching Admin) */}
        <button
          type="button"
          className="icon-btn"
          aria-label={t("nav.themeToggle")}
          title={t("nav.themeToggle")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <svg className="sun" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.3M12 19.7V22M2 12h2.3M19.7 12H22M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
          </svg>
          <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.2 14.7A8.3 8.3 0 0 1 9.3 3.8a8.5 8.5 0 1 0 10.9 10.9Z" />
          </svg>
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher className="lang" />

        {/* User Avatar Menu or Sign In */}
        {status === "loading" && !user ? (
          <div aria-hidden="true" className="h-8 w-8 animate-pulse rounded-full bg-[var(--glass-strong)]" />
        ) : user ? (
          <div className="acct">
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button type="button">
                  <span className="who" aria-hidden="true">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="nm hidden sm:inline">{user.name || "User"}</span>
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </DropdownMenuPrimitive.Trigger>
              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  className="menu-list"
                  align="end"
                  sideOffset={8}
                  style={{ position: "static" }}
                >
                  <DropdownMenuPrimitive.Label asChild>
                    <div className="px-2.5 py-2">
                      <p className="text-sm font-medium">{user.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuPrimitive.Label>
                  <DropdownMenuPrimitive.Separator asChild>
                    <hr />
                  </DropdownMenuPrimitive.Separator>
                  <DropdownMenuPrimitive.Item asChild>
                    <Link href="/dashboard">
                      <ShieldCheck className="h-4 w-4" />
                      {isTh ? "ระบบหลังบ้าน (Staff Console)" : "Staff Console"}
                    </Link>
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item asChild>
                    <Link href="/me">
                      <User className="h-4 w-4" />
                      {t("account.profile")}
                    </Link>
                  </DropdownMenuPrimitive.Item>
                  {canManageSettings && (
                    <DropdownMenuPrimitive.Item asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4" />
                        {t("nav.settings")}
                      </Link>
                    </DropdownMenuPrimitive.Item>
                  )}
                  <DropdownMenuPrimitive.Separator asChild>
                    <hr />
                  </DropdownMenuPrimitive.Separator>
                  <DropdownMenuPrimitive.Item asChild onSelect={() => signOut({ callbackUrl: "/" })}>
                    <button type="button" className="danger">
                      <LogOut className="h-4 w-4" />
                      {t("account.logout")}
                    </button>
                  </DropdownMenuPrimitive.Item>
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-[var(--brand)] text-[var(--on-brand)] hover:opacity-90 transition-opacity shadow-xs"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{isTh ? "เข้าสู่ระบบ" : "Sign In"}</span>
          </Link>
        )}

        {/* Mobile Drawer Hamburger Button */}
        <button
          type="button"
          className="icon-btn md:hidden"
          aria-label={t("nav.openDrawer")}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-b border-[var(--glass-border)] bg-[var(--glass-strong)] backdrop-blur-md px-4 py-3 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--glass-hover)] text-[var(--brand-ink)] font-semibold"
                    : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-hover)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {!user && (
            <div className="pt-2 border-t border-[var(--glass-border)]">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--brand-ink)] hover:bg-[var(--glass-hover)]"
              >
                <LogIn className="h-4 w-4" />
                <span>{isTh ? "เข้าสู่ระบบ" : "Sign In"}</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
