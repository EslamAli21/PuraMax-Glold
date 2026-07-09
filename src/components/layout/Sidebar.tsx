// ============================================================
// الشريط الجانبي للتنقل — Sidebar Component
// يعرض روابط التنقل بناءً على دور المستخدم الحالي
// الأدوار المتاحة: Owner, Production Manager, Designer, 3D Printer,
//                  Tree Responsible, Scale Operator, Section Manager, Worker
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useMockState } from "@/lib/mock-state";
import { useTheme } from "@/components/theme-provider";
import { Role } from "@/lib/mock-data";
import {
  LayoutDashboard, ShoppingCart, Scale, ArrowRightLeft, BellRing,
  BarChart3, Settings as SettingsIcon, LogOut, PenTool, Printer,
  Hammer, Database, Diamond, Menu, PackageSearch, History, TreePine,
  ChevronDown, Wind, Repeat2, Calculator, Scissors, GitMerge,
  MoveRight, Beaker, XCircle, CheckCircle2,
  GripVertical, Pencil, Check, RotateCcw, ShieldCheck, Factory,
  Building2, Users, Cpu, TrendingDown, GitCompare,
} from "lucide-react";
import { analyticsNav } from "@/lib/analytics-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useEditMode } from "@/contexts/EditModeContext";

type AllRoles = Role | "Owner" | "Production Manager" | "Designer" | "3D Printer" | "Tree Responsible" | "Scale Operator" | "Section Manager" | "Worker";
const ALL_ROLES: Role[] = ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"];

interface NavItem {
  key: string;
  label?: string;
  path: string;
  icon: React.ElementType;
  roles: Role[];
  children?: NavItem[];
  defaultTab?: string;
}

interface NavGroup {
  id: string;
  labelKey?: string;
  items: NavItem[];
}

const DEFAULT_NAV_GROUPS: NavGroup[] = [
    {
      id: "g-dashboard",
      items: [
        { key: "nav.dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
      ],
    },
    {
      id: "g-orders",
      labelKey: "nav.group.orders",
      items: [
        { key: "nav.newOrders", path: "/new-orders", icon: PackageSearch, roles: ["Owner","Production Manager"] },
      ],
    },
    {
      id: "g-models",
      items: [
        { key: "nav.models", path: "/models", icon: Diamond, roles: ["Owner","Production Manager"] },
      ],
    },
    {
      id: "g-scale",
      labelKey: "nav.group.scale",
      items: [
        {
          key: "nav.scale",
          path: "/scale",
          icon: Scale,
          roles: ["Owner","Production Manager","Scale Operator","Tree Responsible"],
        },
      ],
    },
    {
      id: "g-dust",
      labelKey: "nav.group.dust",
      items: [
        { key: "nav.dustManagement", path: "/dust-management", icon: Wind, roles: ["Owner","Production Manager","Scale Operator"] },
      ],
    },
    {
      id: "g-tracking",
      labelKey: "nav.group.tracking",
      items: [
        {
          key: "nav.analyticsTitle", path: "/analytics", defaultTab: "overview", icon: BarChart3, roles: ["Owner","Production Manager"],
                    children: [
            { key: "nav.analytics.overview",    path: "/analytics?tab=overview",    icon: BarChart3,      roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.orders",      path: "/analytics?tab=orders",      icon: ShoppingCart,   roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.departments", path: "/analytics?tab=departments", icon: Building2,      roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.workers",     path: "/analytics?tab=workers",     icon: Users,          roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.movements",   path: "/analytics?tab=movements",   icon: ArrowRightLeft, roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.alerts",      path: "/analytics?tab=alerts",      icon: BellRing,       roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.dust",        path: "/analytics?tab=dust",        icon: Wind,           roles: ["Owner","Production Manager"] },
            { key: "nav.analytics.comparisons", path: "/analytics?tab=comparisons", icon: GitCompare,     roles: ["Owner","Production Manager"] },
          ],
        },
        { key: "nav.auditLog",  path: "/audit-log",  icon: History,   roles: ["Owner","Production Manager"] },
      ],
    },
    {
      id: "g-workspace",
      labelKey: "nav.group.workspace",
      items: [
        { key: "nav.myDesigns",  path: "/my-designs",  icon: PenTool, roles: ["Designer"] },
        { key: "nav.printQueue", path: "/print-queue",  icon: Printer, roles: ["3D Printer"] },
        { key: "nav.myWork",     path: "/my-work",      icon: Hammer,  roles: ["Worker","Tree Responsible"] },
      ],
    },
    {
      id: "g-management",
      labelKey: "nav.group.management",
      items: [
        { key: "nav.masterData", path: "/master-data", icon: Database,     roles: ["Owner","Production Manager"] },
        { key: "nav.settings",   path: "/settings",    icon: SettingsIcon, roles: ["Owner"] },
      ],
    },

    // ─── قسم لوحة الإدارة العليا (للمالك فقط) ──────────────────────────────
    {
      id: "g-admin",
      labelKey: "nav.group.admin",
      items: [
        { key: "nav.adminFactories", path: "/admin/factories", icon: Factory,      roles: ["Owner"] },
        { key: "nav.adminRoles",     path: "/admin/roles",     icon: ShieldCheck,  roles: ["Owner"] },
      ],
    },
];

// ─── NAV ITEM ROW ──────────────────────────────────────────────────────────────
interface NavItemRowProps {
  item: NavItem;
  isExpanded: boolean;
  currentRole: Role;
  unreadAlertsCount: number;
  isRtl: boolean;
  depth?: number;
  isEditMode?: boolean;
  customLabels?: Record<string, string>;
  onRename?: (key: string, value: string) => void;
}

function NavItemRow({
  item, isExpanded, currentRole, unreadAlertsCount, isRtl, depth = 0,
  isEditMode = false, customLabels = {}, onRename,
}: NavItemRowProps) {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");

  const hasChildren = item.children && item.children.length > 0;
  const allowedChildren = hasChildren ? item.children!.filter(c => c.roles.includes(currentRole)) : [];
  const showChildren = hasChildren && allowedChildren.length > 0;

  const itemBasePath = item.path.split("?")[0];
  const itemTabValue = item.path.includes("?tab=") ? item.path.split("?tab=")[1] : null;

  const isActive = itemTabValue
    ? (location === "/analytics" && analyticsNav.currentTab() === itemTabValue)
    : (location === itemBasePath || (location.startsWith(itemBasePath + "/") && !hasChildren));

  const isChildActive = showChildren && allowedChildren.some(c => {
    const cTab = c.path.includes("?tab=") ? c.path.split("?tab=")[1] : null;
    if (cTab) return location === "/analytics" && analyticsNav.currentTab() === cTab;
    const childBase = c.path.split("?")[0];
    return location === childBase;
  });
  const isOpenState = manuallyClosed ? false : (open || isChildActive);
  const Icon = item.icon;
  const badge = item.key === "nav.alerts" ? unreadAlertsCount : 0;
  const displayLabel = customLabels[item.key] || item.label || t(item.key);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditVal(customLabels[item.key] || t(item.key));
    setEditing(true);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRename) onRename(item.key, editVal.trim() || t(item.key));
    setEditing(false);
  };

  // ─── COLLAPSED MODE ───────────────────────────────────────────────────────
  if (!isExpanded && depth === 0) {
    const collapsedContent = (
      <div
        className={cn(
          "relative flex items-center justify-center w-full cursor-pointer",
          "py-[10px] transition-colors duration-150",
          (isActive && !isChildActive)
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/90 hover:bg-sidebar-accent/50"
        )}
      >
        {(isActive && !isChildActive) && (
          <div className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-e-full" />
        )}
        <Icon className="w-[22px] h-[22px] shrink-0" />
        {badge > 0 && (
          <span className="absolute top-1 end-1 flex h-2 w-2 rounded-full bg-destructive" />
        )}
      </div>
    );

    return (
      <Tooltip delayDuration={120}>
        <TooltipTrigger asChild>
          <div className="w-full">
            {item.defaultTab ? (
              <div className="block w-full cursor-pointer" onClick={() => { analyticsNav.emit(item.defaultTab!); if (location !== "/analytics") navigate("/analytics"); }}>
                {collapsedContent}
              </div>
            ) : (
              <Link href={itemBasePath} className="block w-full">{collapsedContent}</Link>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side={isRtl ? "left" : "right"} className="flex items-center gap-2">
          {displayLabel}
          {badge > 0 && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-destructive text-destructive-foreground">{badge}</Badge>}
        </TooltipContent>
      </Tooltip>
    );
  }

  // ─── EXPANDED LABEL (with optional inline edit) ───────────────────────────
  const labelNode = editing ? (
    <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        value={editVal}
        onChange={e => setEditVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(e); if (e.key === "Escape") setEditing(false); }}
        className="flex-1 text-xs bg-sidebar-accent/80 border border-sidebar-primary/50 rounded px-1.5 py-0.5 text-sidebar-foreground outline-none focus:ring-1 focus:ring-sidebar-primary"
      />
      <button
        onClick={handleSaveEdit}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-500/20 text-emerald-500"
      >
        <Check className="w-3 h-3" />
      </button>
    </div>
  ) : (
    <>
      <span className={cn("flex-1 truncate whitespace-nowrap", depth === 0 ? "text-sm" : "text-xs")}>
        {displayLabel}
      </span>
      {isEditMode && isExpanded && (
        <button
          onClick={handleStartEdit}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-primary transition-all shrink-0"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </>
  );

  // ─── EXPANDED MODE ────────────────────────────────────────────────────────
  const rowContent = (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md cursor-pointer group relative",
        "transition-colors duration-150",
        isExpanded ? "py-2 px-3 mx-2" : "py-1.5 mx-2 px-0 justify-center",
        depth > 0 && isExpanded && "py-1.5 mx-3 pl-3 border-l border-sidebar-border/40 rounded-none rounded-r-md",
        (isActive && !isChildActive)
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        isEditMode && "cursor-default"
      )}
      onClick={showChildren && isExpanded ? (e) => { e.preventDefault(); if (isOpenState) { setOpen(false); setManuallyClosed(true); } else { setOpen(true); setManuallyClosed(false); if (item.defaultTab) { analyticsNav.emit(item.defaultTab); if (location !== "/analytics") navigate("/analytics"); } } } : undefined}
    >
      {(isActive && !isChildActive) && depth === 0 && (
        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-e-full" />
      )}
      <Icon className={cn(
        "shrink-0",
        depth === 0 ? "w-[18px] h-[18px]" : "w-3.5 h-3.5",
        (isActive && !isChildActive) ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
      )} />
      {labelNode}
      {badge > 0 && (
        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-destructive text-destructive-foreground shrink-0">{badge}</Badge>
      )}
      {showChildren && isExpanded && !editing && (
        <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-200 text-sidebar-foreground/40", isOpenState && "rotate-180")} />
      )}
    </div>
  );

  if (itemTabValue && !isEditMode) {
    return (
      <div
        className="cursor-pointer"
        onClick={() => {
          analyticsNav.emit(itemTabValue);
          if (location !== "/analytics") navigate("/analytics");
        }}
      >
        {rowContent}
      </div>
    );
  }

  return (
    <div>
      {(showChildren && isExpanded) || isEditMode ? (
        rowContent
      ) : (
        <Link href={item.path}>{rowContent}</Link>
      )}
      {showChildren && isExpanded && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: isOpenState ? "1fr" : "0fr",
            transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div className="mt-0.5 mb-1">
              {allowedChildren.map(child => (
                <NavItemRow
                  key={child.key}
                  item={child}
                  isExpanded={isExpanded}
                  currentRole={currentRole}
                  unreadAlertsCount={unreadAlertsCount}
                  isRtl={isRtl}
                  depth={depth + 1}
                  isEditMode={isEditMode}
                  customLabels={customLabels}
                  onRename={onRename}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR HEADER (logo + toggle, mirrors top Header height h-16) ────────────
function SidebarHeader({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/puramax-gold.png" : "/puramax-white.png";

  return (
    <div
      className={cn(
        // Exactly mirrors the top Header: h-16, border-b, shadow-sm, backdrop-blur bg
        "h-[64px] shrink-0 flex items-center border-b border-sidebar-border/50",
        "bg-sidebar shadow-sm",
        isExpanded ? "px-4 gap-2.5" : "flex-col justify-center gap-1 px-2"
      )}
    >
      {/* Logo — links to dashboard */}
      <Link href="/dashboard" className={cn("flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none", !isExpanded && "justify-center flex-none")}>
        <img
          src={logoSrc}
          alt="PuraMax"
          className={cn(
            "object-contain shrink-0 transition-all duration-300",
            isExpanded ? "h-8 w-auto" : "h-6 w-auto"
          )}
        />
        {isExpanded && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">PuraMax</span>
            <span className="text-[9px] text-sidebar-foreground/50 uppercase tracking-widest font-semibold">Pro Tracking</span>
          </div>
        )}
      </Link>

      {/* Toggle button — same row, end side */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-center rounded-md shrink-0",
          "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
          isExpanded ? "w-7 h-7" : "w-6 h-6"
        )}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Menu className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── MAIN SIDEBAR ──────────────────────────────────────────────────────────────
export function Sidebar() {
  const { currentRole, logout, displayName, factoryName } = useAuth();
  const { unreadAlertsCount } = useMockState();
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const isRtl = i18n.language === "ar";
  const { isEditMode, customLabels, setCustomLabel, navGroupOrder, setNavGroupOrder, resetAll } = useEditMode();

  // Drag-to-reorder state
  const dragGroupId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Re-render when analytics tab changes (to update active child highlight)
  const [, forceUpdate] = useState(0);
  useEffect(() => analyticsNav.subscribe(() => forceUpdate(n => n + 1)), []);

  // Sort groups by saved order
  const sortedGroups: NavGroup[] = navGroupOrder.length > 0
    ? navGroupOrder
        .map(id => DEFAULT_NAV_GROUPS.find(g => g.id === id))
        .filter(Boolean)
        .concat(DEFAULT_NAV_GROUPS.filter(g => !navGroupOrder.includes(g.id))) as NavGroup[]
    : DEFAULT_NAV_GROUPS;

  const handleDragStart = useCallback((id: string) => {
    dragGroupId.current = id;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragGroupId.current;
    if (!sourceId || sourceId === targetId) { setDragOverId(null); return; }
    const ids = sortedGroups.map(g => g.id);
    const fromIdx = ids.indexOf(sourceId);
    const toIdx   = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) { setDragOverId(null); return; }
    const next = [...ids];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, sourceId);
    setNavGroupOrder(next);
    setDragOverId(null);
    dragGroupId.current = null;
  }, [sortedGroups, setNavGroupOrder]);

  const handleDragEnd = useCallback(() => {
    setDragOverId(null);
    dragGroupId.current = null;
  }, []);

  if (!currentRole) return null;

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-sidebar border-e border-sidebar-border/50",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )}
    >
      {/* ── Unified Header: logo + toggle, mirrors top Header h-16 ── */}
      <SidebarHeader isExpanded={isExpanded} onToggle={() => setIsExpanded(v => !v)} />



      {/* ── Edit Mode tip bar ─────────────────────────────────────── */}
      {isEditMode && isExpanded && (
        <div className="mx-2 mb-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 flex items-center justify-between gap-1">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-tight">{t("editMode.hint")}</span>
          <button
            onClick={resetAll}
            title={t("editMode.resetAll")}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Scrollable Nav (hidden scrollbar) ─────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        <style>{`.sidebar-scroll::-webkit-scrollbar { display: none; }`}</style>
        {sortedGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
          if (visibleItems.length === 0) return null;

          const isDragTarget = dragOverId === group.id;

          return (
            <div
              key={group.id}
              className={cn("mb-1 transition-all duration-150",
                isEditMode && "cursor-grab active:cursor-grabbing",
                isDragTarget && "ring-2 ring-sidebar-primary/40 rounded-md bg-sidebar-accent/20"
              )}
              draggable={isEditMode}
              onDragStart={() => handleDragStart(group.id)}
              onDragOver={e => handleDragOver(e, group.id)}
              onDrop={e => handleDrop(e, group.id)}
              onDragEnd={handleDragEnd}
            >
              {group.labelKey && isExpanded && (
                <div className={cn("flex items-center gap-1 px-4 py-1", isEditMode && "pe-2")}>
                  {isEditMode && (
                    <GripVertical className="w-3 h-3 text-sidebar-foreground/20 shrink-0 me-0.5" />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30 truncate flex-1">
                    {customLabels[group.labelKey!] || t(group.labelKey!)}
                  </p>
                  {isEditMode && (
                    <button
                      onClick={() => {
                        const curr = customLabels[group.labelKey!] || t(group.labelKey!);
                        const val = window.prompt(t("editMode.dragHint") + " — rename:", curr);
                        if (val !== null) setCustomLabel(group.labelKey!, val.trim() || t(group.labelKey!));
                      }}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground/30 hover:text-sidebar-primary"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
              {!group.labelKey && isEditMode && isExpanded && (
                <div className="flex items-center px-4 py-0.5">
                  <GripVertical className="w-3 h-3 text-sidebar-foreground/20" />
                </div>
              )}
              {visibleItems.map(item => (
                isEditMode ? (
                  <NavItemRow
                    key={item.key}
                    item={item}
                    isExpanded={isExpanded}
                    currentRole={currentRole}
                    unreadAlertsCount={unreadAlertsCount}
                    isRtl={isRtl}
                    isEditMode={isEditMode}
                    customLabels={customLabels}
                    onRename={setCustomLabel}
                  />
                ) : (
                  <NavItemRow
                    key={item.key}
                    item={item}
                    isExpanded={isExpanded}
                    currentRole={currentRole}
                    unreadAlertsCount={unreadAlertsCount}
                    isRtl={isRtl}
                  />
                )
              ))}
            </div>
          );
        })}
      </div>

      {/* ── User Footer ────────────────────────────────────────────── */}
      <div className={cn(
        "shrink-0 border-t border-sidebar-border/30 p-2",
        isExpanded ? "flex items-center gap-2" : "flex flex-col items-center gap-1"
      )}>
        <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
          <span className="font-bold text-xs text-sidebar-primary">{currentRole?.charAt(0) || "U"}</span>
        </div>
        {isExpanded && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-sidebar-foreground">{displayName || currentRole}</p>
            <p className="text-[10px] truncate text-sidebar-foreground/50">{factoryName}</p>
          </div>
        )}
        <button
          onClick={() => logout()}
          className="w-7 h-7 rounded-md flex items-center justify-center text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          title={t("header.logOut")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── MOBILE SIDEBAR ────────────────────────────────────────────────────────────
export function MobileSidebar() {
  const { currentRole, logout, displayName, factoryName } = useAuth();
  const { unreadAlertsCount } = useMockState();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRtl = i18n.language === "ar";
  const logoSrc = theme === "dark" ? "/puramax-gold.png" : "/puramax-white.png";

  if (!currentRole) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isRtl ? "right" : "left"} className="p-0 w-72 bg-sidebar border-sidebar-border/50 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 h-[64px] border-b border-sidebar-border/30 shrink-0">
          <img src={logoSrc} alt="PuraMax" className="h-7 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground">PuraMax</span>
            <span className="text-[9px] text-sidebar-foreground/50 uppercase tracking-widest font-semibold">Pro Tracking</span>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {DEFAULT_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.id} className="mb-1">
                {group.labelKey && (
                  <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30">
                    {t(group.labelKey)}
                  </p>
                )}
                {visibleItems.map(item => (
                  <NavItemRow
                    key={item.key}
                    item={item}
                    isExpanded={true}
                    currentRole={currentRole}
                    unreadAlertsCount={unreadAlertsCount}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <div className="shrink-0 border-t border-sidebar-border/30 p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center">
            <span className="font-bold text-xs text-sidebar-primary">{currentRole?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-sidebar-foreground">{displayName || currentRole}</p>
            <p className="text-[10px] truncate text-sidebar-foreground/50">{factoryName}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
