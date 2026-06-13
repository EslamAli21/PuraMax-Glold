// ============================================================
// مكوّن شريط الرأس — يحتوي على البحث والإشعارات وتبديل الثيم
// ============================================================
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useMockState } from "@/lib/mock-state";
import { Bell, Moon, Sun, Search, Edit3, X, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./Sidebar";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n/index";
import { useEditMode } from "@/contexts/EditModeContext";

export function Header() {
  const { factoryName, currentRole, displayName, logout } = useAuth();
  const { unreadAlertsCount, alerts } = useMockState();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { isEditMode, toggleEditMode } = useEditMode();

  const pageName = location === "/" ? t("nav.dashboard") :
    location.substring(1).split("?")[0].split("/")[0].split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const toggleLang = () => {
    const next = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(next);
    applyDirection(next);
  };

  const isDark = theme === "dark";
  const unreadAlertsList = (alerts || []).filter((a: any) => !a.isRead && !a.isDismissed).slice(0, 5);

  // ── Online / Offline indicator ──────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <>
      {/* ── Edit Mode Banner ─────────────────────────────────────────── */}
      {isEditMode && (
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-amber-500/90 text-amber-950 text-sm font-semibold backdrop-blur border-b border-amber-600/40 shadow-sm">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            <span>{t("editMode.active")}</span>
            <span className="text-xs font-normal opacity-70">— {t("editMode.hint")}</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-950 hover:bg-amber-600/20" onClick={toggleEditMode}>
            <X className="w-4 h-4 me-1" /> {t("editMode.discard")}
          </Button>
        </div>
      )}

      {/* ── Main Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 sm:px-6 shadow-sm">
        <MobileSidebar />

        {/* Page name only (logo is in sidebar) */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm hidden md:block">{pageName}</span>
        </div>

        <div className="relative w-full max-w-sm hidden lg:block ml-auto rtl:ml-0 rtl:mr-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-2.5" />
          <input
            type="search"
            placeholder={t("header.search")}
            className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 pl-9 rtl:pl-3 rtl:pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0 ms-auto">
          {/* ── Online / Offline dot ──────────────────────────────────── */}
          <div
            title={isOnline ? t("system.online") : t("system.offline")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border transition-all duration-500 ${
              isOnline
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="hidden sm:inline">{isOnline ? t("system.online") : t("system.offline")}</span>
          </div>

          {/* Edit Mode button — Owner only */}
          {currentRole === "Owner" && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              className={`h-8 px-2.5 text-xs font-bold gap-1.5 hidden md:flex ${isEditMode ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditMode ? t("settings.exitEditMode") : t("settings.editMode")}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLang}
            className="h-8 px-2.5 text-xs font-bold border-border text-muted-foreground hover:text-foreground"
          >
            {i18n.language === "en" ? "AR" : "EN"}
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="shrink-0 text-muted-foreground hover:text-foreground">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0 text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">{t("header.notifications")}</span>
                {unreadAlertsCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] leading-none">{unreadAlertsCount} {t("header.unread")}</Badge>
                )}
              </div>
              <div className="flex flex-col py-1">
                {unreadAlertsList.length > 0 ? (
                  unreadAlertsList.map((alert: any) => (
                    <div key={alert.id} className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/50 border-b border-border/50 last:border-0 cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{alert.type.replace(/-/g, " ").toUpperCase()}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <span className="text-sm text-muted-foreground line-clamp-2">{alert.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("header.noNotifications")}</div>
                )}
              </div>
              <div className="p-2 border-t">
                <Link href="/alerts">
                  <Button variant="ghost" className="w-full text-xs h-8 text-primary">{t("header.viewAllAlerts")}</Button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 rtl:ml-0 rtl:mr-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                  <span className="font-bold text-sm">{currentRole?.charAt(0)}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName || t("nav.user")}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentRole} · {factoryName}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => logout()}>
                <span>{t("header.logOut")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
