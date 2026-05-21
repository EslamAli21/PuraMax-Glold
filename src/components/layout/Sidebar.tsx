import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useMockState } from "@/lib/mock-state";
import { Role } from "@/lib/mock-data";
import {
  LayoutDashboard, ShoppingCart, Scale, ArrowRightLeft, BellRing,
  BarChart3, Settings as SettingsIcon, LogOut, PenTool, Printer,
  Hammer, Database, Diamond, Menu, PackageSearch, History, TreePine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";

interface NavItem {
  key: string;
  path: string;
  icon: React.ElementType;
  roles: Role[];
  badge?: number;
}

const navItems: NavItem[] = [
  { key: "nav.dashboard",   path: "/dashboard",   icon: LayoutDashboard, roles: ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"] },
  { key: "nav.orders",      path: "/orders",       icon: ShoppingCart,    roles: ["Owner","Production Manager","Section Manager"] },
  { key: "nav.newOrders",   path: "/new-orders",   icon: PackageSearch,   roles: ["Owner","Production Manager"] },
  { key: "nav.scale",       path: "/scale",        icon: Scale,           roles: ["Owner","Production Manager","Scale Operator"] },
  { key: "nav.movements",   path: "/movements",    icon: ArrowRightLeft,  roles: ["Owner","Production Manager","Scale Operator","Section Manager"] },
  { key: "nav.treeBuild",   path: "/tree-build",   icon: TreePine,        roles: ["Owner","Production Manager","Tree Responsible"] },
  { key: "nav.alerts",      path: "/alerts",       icon: BellRing,        roles: ["Owner","Production Manager"] },
  { key: "nav.analytics",   path: "/analytics",    icon: BarChart3,       roles: ["Owner","Production Manager"] },
  { key: "nav.auditLog",    path: "/audit-log",    icon: History,         roles: ["Owner","Production Manager"] },
  { key: "nav.models",      path: "/models",       icon: Diamond,         roles: ["Owner","Production Manager"] },
  { key: "nav.masterData",  path: "/master-data",  icon: Database,        roles: ["Owner","Production Manager"] },
  { key: "nav.settings",    path: "/settings",     icon: SettingsIcon,    roles: ["Owner"] },
  { key: "nav.myDesigns",   path: "/my-designs",   icon: PenTool,         roles: ["Designer"] },
  { key: "nav.printQueue",  path: "/print-queue",  icon: Printer,         roles: ["3D Printer"] },
  { key: "nav.myWork",      path: "/my-work",      icon: Hammer,          roles: ["Worker","Tree Responsible"] },
];

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { currentRole, factoryName, logout } = useAuth();
  const { t } = useTranslation();
  const { unreadAlertsCount } = useMockState();

  if (!currentRole) return null;

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-e border-sidebar-border text-sidebar-foreground", className)}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
        <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shrink-0">
          <Diamond className="w-5 h-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-lg truncate tracking-tight">{factoryName}</span>
          <span className="text-xs text-sidebar-foreground/60 uppercase tracking-wider font-semibold">{t("nav.proTracking")}</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {allowedNavItems.map(item => {
          const isActive = location === item.path || location.startsWith(item.path + "/");
          const Icon = item.icon;
          const badge = item.key === "nav.alerts" ? unreadAlertsCount : 0;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary rounded-e-full" />
                )}
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                <span className="flex-1 text-sm">{t(item.key)}</span>
                {badge > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 min-w-[1rem] bg-destructive text-destructive-foreground">{badge}</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div className="p-4 border-t border-sidebar-border/50 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center border border-sidebar-border shrink-0">
            <span className="font-semibold text-sm">{currentRole.charAt(0)}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{t("nav.user")}</span>
            <span className="text-xs text-sidebar-foreground/60 truncate">{currentRole}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-9 gap-2"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    const check = () => setIsRtl(document.documentElement.dir === "rtl");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isRtl ? "right" : "left"} className="p-0 w-[280px] bg-sidebar border-e-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
