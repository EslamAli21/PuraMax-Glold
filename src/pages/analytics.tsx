// ============================================================
// صفحة التحليلات — 8 تبويبات + ربط الشريط الجانبي + تبويب الغبار + مقارنات متقدمة
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { analyticsNav } from "@/lib/analytics-nav";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Legend, ComposedChart,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

import MovementsPage from "./movements";
import AlertsPage    from "./alerts";

import {
  BarChart3, ShoppingCart, TrendingDown, Building2, Users,
  Cpu, ArrowRightLeft, BellRing, GitCompare,
  Package, Scale, AlertTriangle, Activity, Clock,
  Award, Wrench, Layers, TrendingUp, Zap, Wind,
  ChevronRight, Star, Factory, Search, Calendar, Filter,
  X, CheckCircle2,
} from "lucide-react";

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PieTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":       return "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700";
    case "approved":      return "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700";
    case "in-production": return "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700";
    case "on-hold":       return "border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700";
    case "completed":     return "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700";
    case "cancelled":     return "border-red-300 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700";
    default:              return "border-border text-muted-foreground";
  }
}

// ─── VisualStatCard ───────────────────────────────────────────────────────────
// Professional stat card with SVG ring progress + glowing progress bar
function StatCard({ icon: Icon, label, value, sub, accent, trend, ringPct = 0, barPct = 0 }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; accent?: string; trend?: "up" | "down" | "neutral";
  ringPct?: number; barPct?: number;
}) {
  const a = accent || "default";
  const themes: Record<string, { bg: string; ring: string; iconBg: string; barColor: string }> = {
    blue:    { bg: "from-[#071525] via-[#091b30] to-[#0b2040]/80 border-blue-600/40",    ring: "#3b82f6", iconBg: "bg-blue-500/20 text-blue-400",    barColor: "#3b82f6" },
    gold:    { bg: "from-[#1a1200]/90 via-[#1c1500]/80 to-[#201800]/70 border-yellow-600/40",  ring: "#eab308", iconBg: "bg-yellow-500/20 text-yellow-400", barColor: "#eab308" },
    red:     { bg: "from-[#1a0808]/90 via-[#1f0a0a]/80 to-[#240c0c]/70 border-red-600/40",     ring: "#ef4444", iconBg: "bg-red-500/20 text-red-400",      barColor: "#ef4444" },
    green:   { bg: "from-[#081a08]/90 via-[#0a1f0a]/80 to-[#0c240c]/70 border-green-600/40",   ring: "#22c55e", iconBg: "bg-green-500/20 text-green-400",  barColor: "#22c55e" },
    purple:  { bg: "from-[#12071a]/90 via-[#160a20]/80 to-[#1a0e26]/70 border-purple-600/40",  ring: "#a855f7", iconBg: "bg-purple-500/20 text-purple-400", barColor: "#a855f7" },
    orange:  { bg: "from-[#1a0e00]/90 via-[#1f1100]/80 to-[#241400]/70 border-orange-600/40",  ring: "#f97316", iconBg: "bg-orange-500/20 text-orange-400", barColor: "#f97316" },
    default: { bg: "from-muted/50 to-muted/10 border-border",                                   ring: "#6b7280", iconBg: "bg-muted text-muted-foreground",  barColor: "#6b7280" },
  };
  const th = themes[a];
  const pct = Math.min(Math.max(ringPct, 0), 100);
  const r = 22; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${th.bg} p-5 flex flex-col gap-3 shadow-lg min-h-[168px]`}>
      {/* Decorative radial glow in corner */}
      <div className="absolute top-0 end-0 w-28 h-28 rounded-full opacity-[0.12] blur-2xl pointer-events-none"
        style={{ background: th.ring, transform: "translate(35%,-35%)" }} />

      {/* Top row: icon-ring + trend badge */}
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
          <svg className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
            <circle cx="26" cy="26" r={r} fill="none" stroke={th.ring} strokeWidth="3"
              strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 5px ${th.ring}90)` }} />
          </svg>
          <div className={`relative z-10 p-2 rounded-xl ${th.iconBg}`}>
            <Icon className="w-[18px] h-[18px]" />
          </div>
        </div>
        {trend && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            trend === "up"   ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
            : trend === "down" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
            : "bg-white/8 text-white/50"}`}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>

      {/* Main value + labels */}
      <div className="flex-1">
        <p className="text-[1.65rem] font-extrabold tracking-tight text-white leading-none">{value}</p>
        <p className="text-[0.8rem] font-semibold text-white/65 mt-1.5 leading-snug">{label}</p>
        {sub && <p className="text-[0.68rem] text-white/38 mt-0.5">{sub}</p>}
      </div>

      {/* Bottom glow bar */}
      {(barPct > 0 || ringPct > 0) && (
        <div className="h-[3px] rounded-full bg-white/8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(barPct || ringPct, 100)}%`, background: th.ring, boxShadow: `0 0 8px ${th.ring}70` }} />
        </div>
      )}
    </div>
  );
}

// ─── OrderMetricCard ──────────────────────────────────────────────────────────
// Visual metric card with SVG ring + glow bar
function OrderMetricCard({ icon: Icon, label, value, delta, deltaUp, accent, maxVal = 10 }: {
  icon: React.ElementType; label: string; value: number;
  delta: number; deltaUp: boolean; accent: string; maxVal?: number;
}) {
  const themes: Record<string, { bg: string; ring: string; iconBg: string }> = {
    blue:   { bg: "from-[#071525]/90 via-[#091b30]/80 to-[#0b2040]/70 border-blue-600/40",    ring: "#3b82f6", iconBg: "bg-blue-500/20 text-blue-400" },
    red:    { bg: "from-[#1a0808]/90 via-[#1f0a0a]/80 to-[#240c0c]/70 border-red-600/40",     ring: "#ef4444", iconBg: "bg-red-500/20 text-red-400" },
    orange: { bg: "from-[#1a0e00]/90 via-[#1f1100]/80 to-[#241400]/70 border-orange-600/40",  ring: "#f97316", iconBg: "bg-orange-500/20 text-orange-400" },
    green:  { bg: "from-[#081a08]/90 via-[#0a1f0a]/80 to-[#0c240c]/70 border-green-600/40",   ring: "#22c55e", iconBg: "bg-green-500/20 text-green-400" },
  };
  const th = themes[accent] || themes.blue;
  const pct = Math.min(maxVal > 0 ? (value / maxVal) * 100 : 0, 100);
  const r = 22; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${th.bg} p-5 flex flex-col gap-3 shadow-lg min-h-[158px]`}>
      <div className="absolute top-0 end-0 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: th.ring, transform: "translate(35%,-35%)" }} />
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center shrink-0" style={{ width: 50, height: 50 }}>
          <svg className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 50 50">
            <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
            <circle cx="25" cy="25" r={r} fill="none" stroke={th.ring} strokeWidth="3"
              strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 4px ${th.ring}90)` }} />
          </svg>
          <div className={`relative z-10 p-2 rounded-xl ${th.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <span className={`text-[11px] font-bold flex items-center gap-0.5 px-2.5 py-1 rounded-full ${
          deltaUp ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                  : "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"}`}>
          {deltaUp ? "▲" : "▼"} {delta}
        </span>
      </div>
      <div>
        <p className="text-4xl font-extrabold tracking-tight text-white leading-none">{value}</p>
        <p className="text-xs font-semibold text-white/65 mt-1.5">{label}</p>
        <p className="text-[10px] text-white/35 mt-0.5">vs last 7 days</p>
      </div>
      <div className="h-[3px] rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: th.ring, boxShadow: `0 0 8px ${th.ring}70` }} />
      </div>
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ section, stats }: {
  section: { id: string; name: string; code: string; responsible: string };
  stats: { orders: number; weight: number; lossG: number; lossPercent: number; movements: number; time: number };
}) {
  const lossColor = stats.lossPercent > 4 ? "text-destructive" : stats.lossPercent > 2 ? "text-yellow-500" : "text-green-500";
  const barColor  = stats.lossPercent > 4 ? "bg-destructive" : stats.lossPercent > 2 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="rounded-xl border bg-card hover:shadow-md transition-shadow p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-base">{section.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{section.code}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">{stats.movements} moves</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Orders</p>
          <p className="font-bold">{stats.orders}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Gold Weight</p>
          <p className="font-bold">{stats.weight.toFixed(1)}g</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5 col-span-2">
          <div className="flex justify-between mb-1.5">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Loss Rate</p>
            <p className={`text-xs font-bold ${lossColor}`}>{stats.lossG.toFixed(1)}g / {stats.lossPercent.toFixed(2)}%</p>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(stats.lossPercent * 10, 100)}%` }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
        <Clock className="w-3 h-3 shrink-0" />
        <span>{stats.time}h est. workload</span>
        <span className="mx-auto" />
        <span>Lead: {section.responsible}</span>
      </div>
    </div>
  );
}

// ─── WorkerCard ───────────────────────────────────────────────────────────────
function WorkerCard({ worker, stats }: {
  worker: { name: string; code: string; sectionName: string; machineName: string };
  stats: { operations: number; goldProduced: number; lossG: number; lossPercent: number; dustLoss: number; damagedPieces: number; totalPieces: number; karatBreakdown: { karat: number; grams: number }[] };
}) {
  const isExcellent = stats.lossPercent < 1.5;
  const needsReview = stats.lossPercent > 3;
  return (
    <div className="rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isExcellent ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : needsReview ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
          {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{worker.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{worker.code}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${isExcellent ? "border-green-500/50 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400" : needsReview ? "border-destructive/50 text-destructive bg-red-50 dark:bg-red-900/20" : "border-yellow-500/50 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"}`}>
          {isExcellent ? "⭐ Excellent" : needsReview ? "⚠ Review" : "Good"}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md"><Building2 className="w-3 h-3" /> {worker.sectionName}</span>
        {worker.machineName && <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md"><Wrench className="w-3 h-3" /> {worker.machineName}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Gold Produced</p>
          <p className="font-bold text-sm">{stats.goldProduced.toFixed(1)}g</p>
          {stats.karatBreakdown.length > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{stats.karatBreakdown.map(k => `${k.karat}K: ${k.grams.toFixed(1)}g`).join(" · ")}</p>}
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Gold Loss</p>
          <p className={`font-bold text-sm ${stats.lossPercent > 3 ? "text-destructive" : stats.lossPercent > 1.5 ? "text-yellow-500" : "text-green-500"}`}>{stats.lossG.toFixed(2)}g</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.lossPercent.toFixed(2)}% rate</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Dust Loss</p>
          <p className="font-bold text-sm">{stats.dustLoss.toFixed(2)}g</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Pieces</p>
          <p className="font-bold text-sm">{stats.damagedPieces} <span className="text-muted-foreground font-normal">/ {stats.totalPieces}</span></p>
          <p className="text-[10px] text-muted-foreground mt-0.5">damaged / total</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground uppercase font-bold">Loss Progress</span>
          <span className={stats.lossPercent > 3 ? "text-destructive font-bold" : "text-muted-foreground"}>{stats.lossPercent.toFixed(2)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${stats.lossPercent > 3 ? "bg-destructive" : stats.lossPercent > 1.5 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(stats.lossPercent * 20, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}


// ─── STATUS_PROGRESS ─────────────────────────────────────────────────────────
const STATUS_PROGRESS: Record<string, number> = {
  pending:        10,
  approved:       30,
  'in-production': 65,
  'on-hold':      45,
  completed:      100,
  cancelled:      0,
};

// ─── fmtDT: format ISO date → { date, time } ─────────────────────────────────
function fmtDT(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

// ─── fmtDur: format minutes → 'Xh Ym' ───────────────────────────────────────
function fmtDur(mins: number) {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ─── timeAgo: format ISO → '5m ago' ─────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── MiniQR: visual QR placeholder (no external library needed) ──────────────
function MiniQR({ value, onClick }: { value: string; onClick?: (e: React.MouseEvent) => void }) {
  // Generate a deterministic pseudo-random grid from the value string
  const hash = value.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const size = 7;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const row = Math.floor(i / size);
    const col = i % size;
    // Always fill corners (finder patterns)
    if ((row < 2 && col < 2) || (row < 2 && col >= size - 2) || (row >= size - 2 && col < 2)) return true;
    return ((hash >> (i % 31)) & 1) === 1;
  });
  return (
    <div
      className={`inline-grid rounded bg-white p-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
      style={{ gridTemplateColumns: `repeat(${size}, 4px)`, gap: 0.5 }}
      onClick={onClick}
      title={value}
    >
      {cells.map((filled, i) => (
        <div key={i} style={{ width: 4, height: 4, background: filled ? '#111' : '#fff', borderRadius: 0.5 }} />
      ))}
    </div>
  );
}

// ─── ORDERS TAB ────────────────────────────────────────────────────────────────
function OrdersTabContent() {
  const { orders, customers, models, sections, workers, machines, stamps, movements } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const L = (en: string, ar: string) => isRTL ? ar : en;

  const [searchQ,       setSearchQ]       = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [dateFrom,      setDateFrom]      = useState("2026-06-01");
  const [dateTo,        setDateTo]        = useState("2026-07-31");
  const [qrPopup,       setQrPopup]       = useState<{ code: string; orderCode: string } | null>(null);
  const [modelImgPopup, setModelImgPopup] = useState<{ src: string; name: string } | null>(null);
  const [partImgPopup,  setPartImgPopup]  = useState<{ src: string; name: string } | null>(null);
  const [expandedOrderId,   setExpandedOrderId]   = useState<string | null>(null);
  const [expandedModelKey,  setExpandedModelKey]  = useState<string | null>(null);

  const now = new Date();

  const inProduction   = orders.filter(o => o.status === "in-production").length;
  const delayed        = orders.filter(o => (o.status === "in-production" || o.status === "on-hold") && new Date(o.deliveryDate) < now).length;
  const onHold         = orders.filter(o => o.status === "on-hold").length;
  const nearCompletion = orders.filter(o => {
    if (o.status !== "in-production") return false;
    const diff = (new Date(o.deliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const filteredOrders = orders.filter(o => {
    const oDate = new Date(o.createdAt).getTime();
    const from  = new Date(dateFrom).getTime();
    const to    = new Date(dateTo).getTime() + 86400000;
    if (oDate < from || oDate > to) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (sectionFilter !== "all") {
      const orderMovs = movements.filter(m => m.orderId === o.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastMov = orderMovs[0];
      if (!lastMov || lastMov.toSectionId !== sectionFilter) return false;
    }
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    const customer = customers.find(c => c.id === o.clientId);
    const model    = models.find(m => m.id === o.modelId);
    return (
      o.orderCode.toLowerCase().includes(q) ||
      o.itemName.toLowerCase().includes(q) ||
      (customer?.name.toLowerCase().includes(q) ?? false) ||
      (customer?.code.toLowerCase().includes(q) ?? false) ||
      (model?.name.toLowerCase().includes(q) ?? false) ||
      (model?.code.toLowerCase().includes(q) ?? false)
    );
  });

  // ── helpers to build model expanded row ──────────────────────────────────
  const buildModelRow = (order: typeof filteredOrders[0], modelIdx: number) => {
    const model      = models.find(m => m.id === order.modelId);
    const stamp      = stamps.find(s => s.id === order.stampId);
    const orderMovs  = movements.filter(m => m.orderId === order.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastMov    = orderMovs[0];
    const totalLossG = orderMovs.reduce((a, m) => a + m.lossGrams, 0);
    const totalLossPct = orderMovs.length ? orderMovs.reduce((a, m) => a + m.lossPercent, 0) / orderMovs.length : 0;
    const finalGoldW   = lastMov ? lastMov.weightAfter : order.totalWeightGrams;
    const pureGoldPct  = stamp ? stamp.goldPercent : 75;
    const materialW    = Math.max(0, order.totalWeightGrams - finalGoldW);
    const totalFinalW  = finalGoldW + materialW;
    const progress     = STATUS_PROGRESS[order.status] ?? 10;
    const currentSection = lastMov ? sections.find(s => s.id === lastMov.toSectionId)?.name ?? "—" : "—";
    const lastWorker  = lastMov ? workers.find(w => w.id === lastMov.workerId)?.name ?? "—" : "—";
    const lastMachine = lastMov ? machines.find(m => m.id === workers.find(w => w.id === lastMov.workerId)?.machineId)?.name ?? "" : "";
    const qrCode = lastMov?.qrCode ?? order.orderCode;
    const isEven = modelIdx % 2 === 0;
    return { order, model, stamp, lastMov, totalLossG, totalLossPct, finalGoldW, pureGoldPct, materialW, totalFinalW, progress, currentSection, lastWorker, lastMachine, qrCode, isEven };
  };

  // ── parts section builder ────────────────────────────────────────────────
  const buildPartsSection = (order: typeof filteredOrders[0]) => {
    const model = models.find(m => m.id === order.modelId);
    if (!model?.parts?.length) return { partRows: [], roadRows: [] };

    const stamp      = stamps.find(s => s.id === order.stampId);
    const orderMovs  = movements.filter(m => m.orderId === order.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastMov    = orderMovs[0];
    const totalOrderLossG   = orderMovs.reduce((a, m) => a + m.lossGrams, 0);
    const totalOrderLossPct = orderMovs.length ? orderMovs.reduce((a, m) => a + m.lossPercent, 0) / orderMovs.length : 0;
    const pureGoldPct = stamp ? stamp.goldPercent : 75;
    const totalModelW = model.parts.reduce((a, p) => a + (p.approxWeight ?? 0), 0) || model.approxWeightGrams;
    const currentSection = lastMov ? sections.find(s => s.id === lastMov.toSectionId)?.name ?? "—" : "—";
    const lastWorker     = lastMov ? workers.find(w => w.id === lastMov.workerId)?.name ?? "—" : "—";
    const lastMachine    = lastMov ? machines.find(m => m.id === workers.find(w => w.id === lastMov.workerId)?.machineId)?.name ?? "" : "";

    const partRows = model.parts.map((part, partIdx) => {
      const weightRatio  = totalModelW > 0 ? (part.approxWeight ?? 0) / totalModelW : 1 / model.parts!.length;
      const partLossG    = totalOrderLossG * weightRatio;
      const partLossPct  = totalOrderLossPct * weightRatio;
      const lastSectionId = lastMov?.toSectionId;
      const stageFoundIdx = lastSectionId ? part.stages.findIndex(s => s.sectionId === lastSectionId) : -1;
      const partProgress = stageFoundIdx >= 0 && part.stages.length > 0
        ? Math.min(100, Math.round(((stageFoundIdx + 1) / part.stages.length) * 100))
        : STATUS_PROGRESS[order.status] ?? 0;
      const partCode = `${model.code}-P${partIdx + 1}`;
      const qrCode   = lastMov?.qrCode ?? `${order.orderCode}-P${partIdx + 1}`;
      return { order, model, part, stamp, partIdx, lastMov, partLossG, partLossPct, pureGoldPct, partProgress, currentSection, lastWorker, lastMachine, partCode, qrCode };
    });

    // road map
    const allParts = model.parts ?? [];
    const sectionIdSet = new Set<string>();
    (allParts.length > 0 ? allParts : [{ stages: model.stages }]).forEach((p: any) => p.stages.forEach((s: any) => sectionIdSet.add(s.sectionId)));
    const gridSectionIds = [...sectionIdSet].sort((a, b) => {
      const sa = sections.find(s => s.id === a)?.order ?? 99;
      const sb = sections.find(s => s.id === b)?.order ?? 99;
      return sa - sb;
    });
    const sectionPartVisitors = new Map<string, Set<number>>();
    allParts.forEach((part: any, pIdx: number) => {
      part.stages.forEach((stage: any) => {
        const set = sectionPartVisitors.get(stage.sectionId) ?? new Set();
        set.add(pIdx);
        sectionPartVisitors.set(stage.sectionId, set);
      });
    });
    const mergeSections = new Set([...sectionPartVisitors.entries()].filter(([, set]) => set.size > 1).map(([id]) => id));
    const partsToShow = allParts.length > 0
      ? allParts.map((p: any) => ({ id: p.id, name: p.name, image: p.image, stages: p.stages, colour: p.colour, approxWeight: p.approxWeight }))
      : [{ id: model.code, name: model.name, image: model.image, stages: model.stages, colour: model.colour, approxWeight: model.approxWeightGrams }];

    return { partRows, roadRows: [{ order, model, partsToShow, gridSectionIds, mergeSections }] };
  };

  const CELL_W  = 106;
  const LABEL_W = 86;

  return (
    <div className="space-y-5">

      {/* ── Search + Filter Row ─────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={L(
              "Search by order code, QR, tree code, box code, worker, machine, client, or model...",
              "ابحث برمز الطلب، QR، رمز الشجرة، رمز الصندوق، العامل، الآلة، العميل، أو الموديل..."
            )}
            className="ps-9 bg-background/70"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 h-9 text-muted-foreground hover:border-ring transition-colors">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setExpandedOrderId(null); setExpandedModelKey(null); }}
              className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer" />
            <span className="text-muted-foreground/60 text-xs mx-0.5">–</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setExpandedOrderId(null); setExpandedModelKey(null); }}
              className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer" />
          </div>

          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Batches","كل الدُّفعات")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Batches","كل الدُّفعات")}</SelectItem>
              <SelectItem value="b1">{L("Batch 1","الدُّفعة 1")}</SelectItem>
              <SelectItem value="b2">{L("Batch 2","الدُّفعة 2")}</SelectItem>
              <SelectItem value="b3">{L("Batch 3","الدُّفعة 3")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[155px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Statuses","كل الحالات")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Statuses","كل الحالات")}</SelectItem>
              <SelectItem value="pending">{L("Pending","قيد الانتظار")}</SelectItem>
              <SelectItem value="approved">{L("Approved","معتمد")}</SelectItem>
              <SelectItem value="in-production">{L("In Production","قيد الإنتاج")}</SelectItem>
              <SelectItem value="on-hold">{L("On Hold","موقوف")}</SelectItem>
              <SelectItem value="completed">{L("Completed","مكتمل")}</SelectItem>
              <SelectItem value="cancelled">{L("Cancelled","ملغي")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[155px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Sections","كل الأقسام")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Sections","كل الأقسام")}</SelectItem>
              {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Routes","كل المسارات")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Routes","كل المسارات")}</SelectItem>
              <SelectItem value="standard">{L("Standard","قياسي")}</SelectItem>
              <SelectItem value="express">{L("Express","سريع")}</SelectItem>
              <SelectItem value="priority">{L("Priority","أولوية")}</SelectItem>
            </SelectContent>
          </Select>

          {(searchQ || statusFilter !== "all" || sectionFilter !== "all") && (
            <Button variant="ghost" size="sm" className="text-xs h-9"
              onClick={() => { setSearchQ(""); setStatusFilter("all"); setSectionFilter("all"); }}>
              <X className="w-3.5 h-3.5 me-1" />{L("Clear","مسح")}
            </Button>
          )}
          <span className="ms-auto text-xs text-muted-foreground">
            {filteredOrders.length} {L("of","من")} {orders.length} {L("orders","طلب")}
          </span>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OrderMetricCard icon={Package}       label={L("Orders In Production",    "طلبات قيد الإنتاج")}  value={inProduction}   delta={12} deltaUp={true}  accent="blue"   />
        <OrderMetricCard icon={AlertTriangle} label={L("Delayed Orders",          "الطلبات المتأخرة")}   value={delayed}        delta={3}  deltaUp={false} accent="red"    />
        <OrderMetricCard icon={Clock}         label={L("On Hold Orders",          "الطلبات الموقوفة")}   value={onHold}         delta={1}  deltaUp={true}  accent="orange" />
        <OrderMetricCard icon={TrendingUp}    label={L("Orders Near Completion",  "طلبات قرب الاكتمال")} value={nearCompletion} delta={5}  deltaUp={true}  accent="green"  />
      </div>

      {/* ── ORDER IN GENERAL TABLE (with nested inline expanded rows) ───────── */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600 dark:bg-blue-700">
          <span className="text-white font-bold text-sm tracking-wide uppercase">
            {L("Order in General","الطلبات العامة")}
          </span>
          <div className="flex items-center gap-2">
            {(searchQ || statusFilter !== "all") && (
              <Badge className="text-[10px] bg-white/20 text-white border-white/30">
                {L("Filtered:","مُصفَّى:")} {filteredOrders.length}
              </Badge>
            )}
            <span className="text-blue-100 text-xs">
              {L("Active Orders","الطلبات النشطة")} ({filteredOrders.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[1800px]">
            <thead>
              <tr className="bg-blue-600 dark:bg-blue-800 border-b border-blue-700 dark:border-blue-700">
                {(isRTL ? [
                  "التاريخ\nوالوقت","رمز الطلب","رمز\nالعميل","الموديلات","الكمية","التقدم",
                  "نسبة فقد\nالذهب","وزن فقد\nالذهب","24K ذهب\nخالص %","وقت\nالعمل","وقت\nالانتظار",
                  "آخر\nحركة","المرحلة\nالحالية","الوزن النهائي\nللذهب","الوزن النهائي\nللمادة","الوزن\nالإجمالي","رمز QR\nالحركة",
                ] : [
                  "Order Date\n& Time","Order Code","Customer\nCode","Models","Qty","Progress",
                  "Gross Gold\nLoss %","Gross Gold\nLoss Weight","24K Pure\nGold %","Working\nTime","Waiting\nTime",
                  "Last\nMovement","Current\nStages","Final Gold\nWeight","Final Material\nWeight","Final Total\nWeight","Movement\nQR",
                ]).map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line border-e border-blue-500/40 dark:border-blue-700/60 last:border-e-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-muted-foreground">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">{L("No orders match your search","لا توجد طلبات تطابق بحثك")}</p>
                    <p className="text-[10px] mt-1">{L("Try adjusting your filters","جرّب تعديل الفلاتر")}</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, rowIdx) => {
                  const customer    = customers.find(c => c.id === order.clientId);
                  const stamp       = stamps.find(s => s.id === order.stampId);
                  const orderMovs   = movements.filter(m => m.orderId === order.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  const lastMov     = orderMovs[0];
                  const totalLossG  = orderMovs.reduce((a, m) => a + m.lossGrams, 0);
                  const totalLossPct = orderMovs.length ? orderMovs.reduce((a, m) => a + m.lossPercent, 0) / orderMovs.length : 0;
                  const finalGoldW  = lastMov ? lastMov.weightAfter : order.totalWeightGrams;
                  const pureGoldPct = stamp ? stamp.goldPercent : 75;
                  const pureGold24k = stamp ? (pureGoldPct / 100 * 24) : 18;
                  const materialW   = Math.max(0, order.totalWeightGrams - finalGoldW);
                  const totalFinalW = finalGoldW + materialW;
                  const workMins    = orderMovs.length * 150;
                  const createdMs   = new Date(order.createdAt).getTime();
                  const nowMs       = Date.now();
                  const totalMins   = Math.max(0, Math.floor((nowMs - createdMs) / 60000));
                  const waitMins    = Math.max(0, totalMins - workMins);
                  const progress    = STATUS_PROGRESS[order.status] ?? 10;
                  const isDelayed   = new Date(order.deliveryDate) < now && order.status !== "completed" && order.status !== "cancelled";
                  const createdFmt  = fmtDT(order.createdAt);
                  const lastMovFmt  = lastMov ? timeAgo(lastMov.timestamp) : "—";
                  const currentSection = lastMov ? sections.find(s => s.id === lastMov.toSectionId)?.name ?? "—" : "—";
                  const qrCode = lastMov?.qrCode ?? order.orderCode;
                  const isEven = rowIdx % 2 === 0;
                  const isOrderExpanded = expandedOrderId === order.id;

                  // ── models for this order (used in the nested sub-table) ────
                  const orderModelRows = order.modelId ? [buildModelRow(order, 0)] : [];
                  const orderModelColsEn = ["Model\nNO","Model\nPic","Model Code\n/ Name","Stamp /\nKarat","Size","Color","Model\nQty","Parts","Current\nStage","Current Machine\n/ Worker","Gross Gold\nLoss %","Gross Gold\nLoss Weight","24K Pure\nGold Loss","Last\nMovement","Progress","Final Gold\nWeight","Final Material\nWeight","Final Total\nWeight","Movement\nQR"];
                  const orderModelColsAr = ["رقم\nالموديل","صورة\nالموديل","كود / اسم\nالموديل","الطابع /\nالعيار","المقاس","اللون","كمية\nالموديل","الأجزاء","المرحلة\nالحالية","الماكينة /\nالعامل الحالي","نسبة فقد\nالذهب","وزن فقد\nالذهب","فقد الذهب\nالخالص 24K","آخر\nحركة","التقدم","الوزن النهائي\nللذهب","الوزن النهائي\nللمادة","الوزن\nالإجمالي","رمز QR\nالحركة"];
                  const modelCols = isRTL ? orderModelColsAr : orderModelColsEn;

                  return (
                    <React.Fragment key={order.id}>
                      {/* ── Main order row ──────────────────────────────────── */}
                      <tr
                        onClick={() => { setExpandedOrderId(isOrderExpanded ? null : order.id); setExpandedModelKey(null); }}
                        className={`border-b border-blue-100 dark:border-blue-900/50 transition-colors cursor-pointer ${isOrderExpanded ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-400/30" : isEven ? "bg-white dark:bg-card hover:bg-blue-50/60 dark:hover:bg-blue-900/15" : "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/25"}`}
                      >
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[110px]">
                          <span className="block font-medium">{createdFmt.date}</span>
                          <span className="block text-muted-foreground text-[10px]">{createdFmt.time}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[100px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <ChevronRight className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isOrderExpanded ? "rotate-90 text-blue-500" : "text-muted-foreground/30"}`} />
                              <span className="font-bold font-mono text-primary">{order.orderCode}</span>
                            </div>
                            {isDelayed && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 w-fit">{L("Overdue","متأخر")}</Badge>}
                            {order.isNewModel && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 w-fit border-purple-400 text-purple-600 dark:text-purple-400">{L("New","جديد")}</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[100px]">
                          <span className="font-mono font-semibold">{customer?.code ?? "—"}</span>
                          <span className="block text-muted-foreground text-[10px] truncate max-w-[90px]">{customer?.name ?? ""}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[60px] text-center">
                          <span className="font-bold">{order.modelId ? 1 : 0}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[60px] text-center">
                          <span className="font-bold text-base">{order.qty}</span>
                          <span className="block text-muted-foreground text-[10px]">{L("pcs","قطعة")}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[140px]">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getStatusBadgeClass(order.status)}`}>
                              {L(order.status.replace(/-/g," "), {
                                "pending":L("pending","قيد الانتظار"),
                                "approved":L("approved","معتمد"),
                                "in-production":L("in production","قيد الإنتاج"),
                                "on-hold":L("on hold","موقوف"),
                                "completed":L("completed","مكتمل"),
                                "cancelled":L("cancelled","ملغي"),
                              }[order.status] ?? order.status.replace(/-/g," "))}
                            </Badge>
                            <span className={`text-[10px] font-bold ${progress===100?"text-emerald-600":progress<30?"text-amber-600":"text-blue-600"}`}>{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${progress===100?"bg-emerald-500":order.status==="in-production"?"bg-blue-500":order.status==="on-hold"?"bg-orange-500":"bg-muted-foreground/40"}`} style={{width:`${progress}%`}} />
                          </div>
                          {order.status==="completed" && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {fmtDT(order.deliveryDate).date}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className={`font-bold text-sm ${totalLossPct>3?"text-red-600 dark:text-red-400":totalLossPct>1.5?"text-amber-600":"text-green-600 dark:text-green-400"}`}>
                            {totalLossPct>0?totalLossPct.toFixed(2)+"%":"—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className={`font-bold text-sm ${totalLossG>5?"text-red-600 dark:text-red-400":totalLossG>0?"text-amber-600":"text-muted-foreground"}`}>
                            {totalLossG>0?totalLossG.toFixed(2)+"g":"—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className="font-bold text-amber-700 dark:text-amber-400">{pureGold24k.toFixed(1)}K</span>
                          <span className="block text-muted-foreground text-[10px]">{pureGoldPct}% {L("pure","نقي")}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className="font-semibold">{fmtDur(workMins)}</span>
                          <span className="block text-muted-foreground text-[10px]">{orderMovs.length} {L("ops","عمل.")}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className={`font-semibold ${waitMins>2880?"text-red-600 dark:text-red-400":""}`}>{fmtDur(waitMins)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[100px]">
                          {lastMov ? (
                            <>
                              <span className="font-semibold text-[10px]">{lastMovFmt}</span>
                              <span className="block text-muted-foreground text-[9px] truncate max-w-[90px]">{lastMov.operationType?.replace(/-/g," ")}</span>
                            </>
                          ) : <span className="text-muted-foreground">{L("No moves yet","لا حركات")}</span>}
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[110px]">
                          {currentSection!=="—" ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary w-fit">{currentSection}</span>
                              {lastMov && sections.find(s => s.id === lastMov.fromSectionId) && (
                                <span className="text-[9px] text-muted-foreground">{L("from","من")} {sections.find(s => s.id === lastMov.fromSectionId)?.name}</span>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className="font-bold text-amber-700 dark:text-amber-400">{finalGoldW.toFixed(1)}g</span>
                          <span className="block text-muted-foreground text-[10px]">{stamp?.name ?? "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[90px] text-center">
                          <span className="font-semibold">{materialW>0?materialW.toFixed(1)+"g":"—"}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                          <span className="font-bold">{totalFinalW.toFixed(1)}g</span>
                        </td>
                        <td className="px-3 py-2.5 min-w-[80px] text-center">
                          <div className="flex flex-col items-center gap-1">
                            <MiniQR value={qrCode} onClick={() => setQrPopup({code:qrCode,orderCode:order.orderCode})} />
                            <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[70px]">{qrCode}</span>
                          </div>
                        </td>
                      </tr>

                      {/* ── Inline Models sub-table ─────────────────────────── */}
                      {isOrderExpanded && (
                        <tr key={`${order.id}-models-row`}>
                          <td colSpan={17} className="p-0 border-b border-blue-200 dark:border-blue-900/60">
                            <div className="border-s-4 border-emerald-500 ms-8 me-2 my-2 rounded-lg overflow-hidden shadow-md">
                              {/* Models header */}
                              <div className="flex items-center justify-between px-4 py-2 bg-emerald-600 dark:bg-emerald-800">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-white opacity-80" />
                                  <span className="text-white font-bold text-sm tracking-wide uppercase">{L("Models","الموديلات")}</span>
                                  <span className="text-emerald-200 text-[10px] font-mono">↳ {order.orderCode}</span>
                                </div>
                                <span className="text-emerald-100 text-xs">
                                  {orderModelRows.length > 0
                                    ? `${orderModelRows.length} ${L("model — click to view parts & road map","موديل — انقر لعرض الأجزاء وخريطة الطريق")}`
                                    : L("No model","لا يوجد موديل")}
                                </span>
                              </div>

                              {orderModelRows.length === 0 ? (
                                <div className="py-6 text-center text-muted-foreground text-xs bg-card">{L("No models attached to this order","لا توجد موديلات مرتبطة بهذا الطلب")}</div>
                              ) : (
                                <div className="overflow-x-auto bg-card">
                                  <table className="w-full text-xs border-collapse min-w-[2200px]">
                                    <thead>
                                      <tr className="bg-emerald-600 dark:bg-emerald-800 border-b border-emerald-700">
                                        {modelCols.map((h, i) => (
                                          <th key={i} className="px-3 py-2 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line border-e border-emerald-500/40 last:border-e-0">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {orderModelRows.map(({ order: ord, model, stamp: stmp, lastMov: lm, totalLossG: tlg, totalLossPct: tlp, finalGoldW: fgw, pureGoldPct: pgp, materialW: mw, totalFinalW: tfw, progress: prog, currentSection: cs, lastWorker: lw, lastMachine: lmach, qrCode: qrc, isEven: ie }, midx) => {
                                        const modelKey = `${ord.id}-${ord.modelId}`;
                                        const isModelExpanded = expandedModelKey === modelKey;
                                        const { partRows, roadRows } = buildPartsSection(ord);

                                        const partColsEn = ["Part\nNO","Part\nPic","Part\nCode","Stamp /\nKarat","Piece Part\nQty","Order Part\nQty","Current\nStage","Current Machine\n/ Worker","Gross Gold\nLoss %","Gross Gold\nLoss Weight","24K Pure\nGold Loss %","Last\nMovement","Progress\n%","Movement\nQR"];
                                        const partColsAr = ["رقم\nالجزء","صورة\nالجزء","كود\nالجزء","الطابع /\nالعيار","كمية\nالقطعة","كمية\nالطلب","المرحلة\nالحالية","الماكينة /\nالعامل","نسبة فقد\nالذهب","وزن فقد\nالذهب","فقد الذهب\nالخالص 24K","آخر\nحركة","نسبة\nالتقدم","رمز QR\nالحركة"];
                                        const partCols = isRTL ? partColsAr : partColsEn;

                                        return (
                                          <React.Fragment key={`${ord.id}-model-${midx}`}>
                                            {/* Model row */}
                                            <tr
                                              onClick={() => setExpandedModelKey(isModelExpanded ? null : modelKey)}
                                              className={`border-b border-emerald-100 dark:border-emerald-900/50 transition-colors cursor-pointer ${isModelExpanded ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-400/30" : ie ? "bg-white dark:bg-card hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20" : "bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20"}`}
                                            >
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[60px] text-center">
                                                <span className="font-bold text-emerald-700 dark:text-emerald-400">{midx+1}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[70px] text-center">
                                                {model?.image ? (
                                                  <button onClick={e => { e.stopPropagation(); setModelImgPopup({src:model.image!,name:model.name}); }} className="group inline-block" title={L("Click to enlarge","انقر للتكبير")}>
                                                    <img src={model.image} alt={model.name} className="w-10 h-10 object-cover rounded-lg border border-border group-hover:ring-2 group-hover:ring-emerald-500 transition-all cursor-zoom-in" />
                                                  </button>
                                                ) : (
                                                  <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto"><Package className="w-4 h-4" /></div>
                                                )}
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[140px]">
                                                <div className="flex items-center gap-1">
                                                  <ChevronRight className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isModelExpanded ? "rotate-90 text-emerald-600" : "text-muted-foreground/30"}`} />
                                                  <span className="font-bold font-mono text-primary text-[11px]">{model?.code ?? "—"}</span>
                                                </div>
                                                <span className="block text-muted-foreground text-[10px] truncate max-w-[130px] ps-4">{model?.name ?? L("Custom","مخصص")}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                                                <span className="font-bold text-amber-700 dark:text-amber-400">{stmp?.karat ?? "—"}K</span>
                                                <span className="block text-muted-foreground text-[10px]">{stmp?.purity ?? ""}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px]">
                                                <span className="text-[10px] font-mono">{ord.sizes || "—"}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px]">
                                                {model?.colour ? (
                                                  <div className="flex items-center gap-1.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${model.colour.toLowerCase()==="yellow"?"bg-yellow-400":model.colour.toLowerCase()==="white"?"bg-gray-200 border border-gray-300":model.colour.toLowerCase()==="rose"?"bg-rose-400":"bg-muted-foreground/40"}`} />
                                                    <span className="text-[10px]">{model.colour}</span>
                                                  </div>
                                                ) : <span className="text-muted-foreground">—</span>}
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[70px] text-center">
                                                <span className="font-bold text-base">{ord.qty}</span>
                                                <span className="block text-muted-foreground text-[10px]">{L("pcs","قطعة")}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[60px] text-center">
                                                <span className="font-bold">{model?.parts?.length ?? 0}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[110px]">
                                                {cs!=="—" ? (
                                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 block w-fit">{cs}</span>
                                                ) : <span className="text-muted-foreground">—</span>}
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[140px]">
                                                {lm ? (
                                                  <>
                                                    <span className="block font-medium text-[10px]">{lw}</span>
                                                    {lmach && <span className="block text-muted-foreground text-[9px]">{lmach}</span>}
                                                  </>
                                                ) : <span className="text-muted-foreground">—</span>}
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                                                <span className={`font-bold text-sm ${tlp>3?"text-red-600 dark:text-red-400":tlp>1.5?"text-amber-600":tlp>0?"text-green-600 dark:text-green-400":"text-muted-foreground"}`}>
                                                  {tlp>0?tlp.toFixed(2)+"%":"—"}
                                                </span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                                                <span className={`font-bold text-sm ${tlg>5?"text-red-600 dark:text-red-400":tlg>0?"text-amber-600":"text-muted-foreground"}`}>
                                                  {tlg>0?tlg.toFixed(2)+"g":"—"}
                                                </span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                                                <span className="font-bold text-amber-700 dark:text-amber-400">{tlg>0?((tlg*pgp)/100).toFixed(2)+"g":"—"}</span>
                                                <span className="block text-muted-foreground text-[10px]">{pgp}% {L("pure","نقي")}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[100px]">
                                                {lm ? (
                                                  <>
                                                    <span className="font-semibold text-[10px]">{timeAgo(lm.timestamp)}</span>
                                                    <span className="block text-muted-foreground text-[9px] truncate max-w-[90px]">{lm.operationType?.replace(/-/g," ")}</span>
                                                  </>
                                                ) : <span className="text-muted-foreground">—</span>}
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[140px]">
                                                <div className="flex items-center justify-between mb-1">
                                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getStatusBadgeClass(ord.status)}`}>
                                                    {({pending:L("pending","قيد الانتظار"),approved:L("approved","معتمد"),"in-production":L("in production","قيد الإنتاج"),"on-hold":L("on hold","موقوف"),completed:L("completed","مكتمل"),cancelled:L("cancelled","ملغي")} as any)[ord.status] ?? ord.status.replace(/-/g," ")}
                                                  </Badge>
                                                  <span className={`text-[10px] font-bold ${prog===100?"text-emerald-600":prog<30?"text-amber-600":"text-blue-600"}`}>{prog}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                  <div className={`h-full rounded-full ${prog===100?"bg-emerald-500":ord.status==="in-production"?"bg-blue-500":ord.status==="on-hold"?"bg-orange-500":"bg-muted-foreground/40"}`} style={{width:`${prog}%`}} />
                                                </div>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                                                <span className="font-bold text-amber-700 dark:text-amber-400">{fgw.toFixed(1)}g</span>
                                                <span className="block text-muted-foreground text-[10px]">{stmp?.name ?? "—"}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                                                <span className="font-semibold">{mw>0?mw.toFixed(1)+"g":"—"}</span>
                                              </td>
                                              <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                                                <span className="font-bold">{tfw.toFixed(1)}g</span>
                                              </td>
                                              <td className="px-3 py-2.5 min-w-[80px] text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                  <MiniQR value={qrc} onClick={e => { (e as any).stopPropagation?.(); setQrPopup({code:qrc,orderCode:ord.orderCode}); }} />
                                                  <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[70px]">{qrc}</span>
                                                </div>
                                              </td>
                                            </tr>

                                            {/* ── Inline Parts + Roadmap sub-panel ───── */}
                                            {isModelExpanded && (
                                              <tr key={`${ord.id}-parts-road-row`}>
                                                <td colSpan={19} className="p-0 border-b border-emerald-200 dark:border-emerald-900/60">
                                                  <div className="border-s-4 border-violet-500 ms-10 me-2 my-2 rounded-lg overflow-hidden shadow-md space-y-0">

                                                    {/* ── PARTS ───────────────────────────── */}
                                                    <div className="rounded-t-lg overflow-hidden">
                                                      <div className="flex items-center justify-between px-4 py-2 bg-violet-600 dark:bg-violet-800">
                                                        <div className="flex items-center gap-2">
                                                          <Layers className="w-4 h-4 text-white opacity-80" />
                                                          <span className="text-white font-bold text-sm tracking-wide uppercase">{L("Parts","الأجزاء")}</span>
                                                          <span className="text-violet-200 text-[10px] font-mono">↳ {model?.code ?? "—"}</span>
                                                        </div>
                                                        <span className="text-violet-100 text-xs">
                                                          {partRows.length} {L(partRows.length!==1?"parts":"part","جزء")}
                                                        </span>
                                                      </div>
                                                      {partRows.length === 0 ? (
                                                        <div className="py-6 text-center text-muted-foreground text-xs bg-card">{L("No parts defined for this model","لم يتم تحديد أجزاء لهذا الموديل")}</div>
                                                      ) : (
                                                        <div className="overflow-x-auto bg-card">
                                                          <table className="w-full text-xs border-collapse min-w-[1800px]">
                                                            <thead>
                                                              <tr className="bg-violet-600 dark:bg-violet-800 border-b border-violet-700">
                                                                {partCols.map((h, i) => (
                                                                  <th key={i} className="px-3 py-2 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line border-e border-violet-500/40 last:border-e-0">{h}</th>
                                                                ))}
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {partRows.map(({order:pOrd, model:pMod, part, stamp:pStmp, partIdx, lastMov:plm, partLossG, partLossPct, pureGoldPct:pgp2, partProgress, currentSection:pcs, lastWorker:plw, lastMachine:plmach, partCode, qrCode:pqr}, ridx) => {
                                                                const pEven = ridx%2===0;
                                                                return (
                                                                  <tr key={`${pOrd.id}-${part.id}`} className={`border-b last:border-b-0 border-violet-100 dark:border-violet-900/50 hover:bg-violet-100/60 dark:hover:bg-violet-900/20 transition-colors ${pEven?"bg-white dark:bg-card":"bg-violet-50/50 dark:bg-violet-950/15"}`}>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[55px] text-center"><span className="font-bold text-violet-700 dark:text-violet-400">{partIdx+1}</span></td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[70px] text-center">
                                                                      {part.image ? (
                                                                        <button onClick={() => setPartImgPopup({src:part.image!,name:part.name})} className="group inline-block" title={L("Click to enlarge","انقر للتكبير")}>
                                                                          <img src={part.image} alt={part.name} className="w-10 h-10 object-cover rounded-lg border border-border group-hover:ring-2 group-hover:ring-violet-500 transition-all cursor-zoom-in" />
                                                                        </button>
                                                                      ) : (
                                                                        <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto"><Package className="w-4 h-4" /></div>
                                                                      )}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[120px]">
                                                                      <span className="block font-bold font-mono text-primary text-[11px]">{partCode}</span>
                                                                      <span className="block text-muted-foreground text-[10px] truncate max-w-[110px]">{part.name}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[80px] text-center">
                                                                      <span className="font-bold text-amber-700 dark:text-amber-400">{pStmp?.karat ?? "—"}K</span>
                                                                      <span className="block text-muted-foreground text-[10px]">{pStmp?.purity ?? ""}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[80px] text-center">
                                                                      <span className="font-bold">{part.approxWeight!=null?part.approxWeight.toFixed(1)+"g":"—"}</span>
                                                                      <span className="block text-muted-foreground text-[10px]">{L("per pc","لكل قطعة")}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[80px] text-center">
                                                                      <span className="font-bold text-base">{pOrd.qty}</span>
                                                                      <span className="block text-muted-foreground text-[10px]">{L("pcs","قطعة")}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[110px]">
                                                                      {pcs!=="—" ? (
                                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 block w-fit">{pcs}</span>
                                                                      ) : <span className="text-muted-foreground">—</span>}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[130px]">
                                                                      {plm ? (
                                                                        <>
                                                                          <span className="block font-medium text-[10px]">{plw}</span>
                                                                          {plmach && <span className="block text-muted-foreground text-[9px]">{plmach}</span>}
                                                                        </>
                                                                      ) : <span className="text-muted-foreground">—</span>}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[80px] text-center">
                                                                      <span className={`font-bold text-sm ${partLossPct>3?"text-red-600 dark:text-red-400":partLossPct>1.5?"text-amber-600":partLossPct>0?"text-green-600 dark:text-green-400":"text-muted-foreground"}`}>
                                                                        {partLossPct>0?partLossPct.toFixed(2)+"%":"—"}
                                                                      </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[80px] text-center">
                                                                      <span className={`font-bold text-sm ${partLossG>2?"text-red-600 dark:text-red-400":partLossG>0?"text-amber-600":"text-muted-foreground"}`}>
                                                                        {partLossG>0?partLossG.toFixed(2)+"g":"—"}
                                                                      </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[90px] text-center">
                                                                      {(() => {
                                                                        const pgl=(partLossG*pgp2)/100;
                                                                        const pw=part.approxWeight??0;
                                                                        const plp=pw>0?(pgl/((pw*pgp2)/100))*100:partLossPct;
                                                                        return partLossG>0?(
                                                                          <>
                                                                            <span className="font-bold text-amber-700 dark:text-amber-400">{plp.toFixed(2)}%</span>
                                                                            <span className="block text-muted-foreground text-[10px]">{pgl.toFixed(2)}g {L("pure","نقي")}</span>
                                                                          </>
                                                                        ):<span className="text-muted-foreground">—</span>;
                                                                      })()}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[95px]">
                                                                      {plm ? (
                                                                        <>
                                                                          <span className="font-semibold text-[10px]">{timeAgo(plm.timestamp)}</span>
                                                                          <span className="block text-muted-foreground text-[9px] truncate max-w-[85px]">{plm.operationType?.replace(/-/g," ")}</span>
                                                                        </>
                                                                      ) : <span className="text-muted-foreground">—</span>}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-e border-border/40 min-w-[130px]">
                                                                      <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-[10px] text-muted-foreground">{isRTL?`${partIdx+1} / ${pMod!.parts!.length}`:`${partIdx+1} of ${pMod!.parts!.length}`}</span>
                                                                        <span className={`text-[10px] font-bold ${partProgress===100?"text-emerald-600":partProgress<30?"text-amber-600":"text-violet-600 dark:text-violet-400"}`}>{partProgress}%</span>
                                                                      </div>
                                                                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                                        <div className={`h-full rounded-full ${partProgress===100?"bg-emerald-500":"bg-violet-500"}`} style={{width:`${partProgress}%`}} />
                                                                      </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 min-w-[80px] text-center">
                                                                      <div className="flex flex-col items-center gap-1">
                                                                        <MiniQR value={pqr} onClick={() => setQrPopup({code:pqr,orderCode:pOrd.orderCode})} />
                                                                        <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[70px]">{pqr}</span>
                                                                      </div>
                                                                    </td>
                                                                  </tr>
                                                                );
                                                              })}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* ── ROAD MAP ─────────────────────────── */}
                                                    {roadRows.length > 0 && roadRows.map(({ order: rOrd, model: rMod, partsToShow, gridSectionIds, mergeSections }) => (
                                                      <div key={`rm-${rOrd.id}`} className="border-t-2 border-violet-200 dark:border-violet-800/60">
                                                        <div className="flex items-center justify-between px-4 py-2 bg-amber-600 dark:bg-amber-800">
                                                          <div className="flex items-center gap-2">
                                                            <Activity className="w-4 h-4 text-white opacity-80" />
                                                            <span className="text-white font-bold text-sm tracking-wide uppercase">{L("Road Map","خريطة الطريق")}</span>
                                                            <span className="text-amber-200 text-[10px] font-mono">↳ {rMod.code}</span>
                                                          </div>
                                                          <span className="text-amber-100 text-xs">{partsToShow.length} {L("part route","مسار جزء")}{partsToShow.length!==1?L("s",""):"" }</span>
                                                        </div>

                                                        <div className="overflow-x-auto bg-card">
                                                          <table className="w-full text-xs border-collapse" style={{minWidth:"900px"}}>
                                                            <thead>
                                                              <tr className="bg-amber-600 dark:bg-amber-800 border-b border-amber-700">
                                                                {(isRTL?["رقم الموديل","عدد\nالأجزاء","الكمية","صورة\nالموديل","خريطة الطريق"]:["Model\nNO","Parts\nNO","Parts\nQty","Model\nPic","Road Map"]).map((h,i) => (
                                                                  <th key={i} className={`px-3 py-2 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line ${i<4?"border-e border-amber-500/40":""}`}>{h}</th>
                                                                ))}
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              <tr className="bg-white dark:bg-card border-b border-amber-100 dark:border-amber-900/50">
                                                                <td className="px-3 py-3 border-e border-border/40 align-top text-center" style={{width:56}}>
                                                                  <span className="font-bold text-amber-700 dark:text-amber-400">1</span>
                                                                  <div className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">{rMod.code}</div>
                                                                </td>
                                                                <td className="px-3 py-3 border-e border-border/40 align-top text-center" style={{width:62}}>
                                                                  <span className="font-bold text-base">{partsToShow.length}</span>
                                                                </td>
                                                                <td className="px-3 py-3 border-e border-border/40 align-top text-center" style={{width:62}}>
                                                                  <span className="font-bold text-base">{rOrd.qty}</span>
                                                                  <span className="block text-muted-foreground text-[10px]">{L("pcs","قطعة")}</span>
                                                                </td>
                                                                <td className="px-3 py-3 border-e border-border/40 align-top text-center" style={{width:72}}>
                                                                  {rMod.image ? (
                                                                    <button onClick={() => setModelImgPopup({src:rMod.image!,name:rMod.name})} className="group inline-block" title={L("Click to enlarge","انقر للتكبير")}>
                                                                      <img src={rMod.image} alt={rMod.name} className="w-12 h-12 object-cover rounded-lg border border-border group-hover:ring-2 group-hover:ring-amber-500 transition-all cursor-zoom-in" />
                                                                    </button>
                                                                  ) : (
                                                                    <div className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto"><Package className="w-5 h-5" /></div>
                                                                  )}
                                                                  <div className="mt-1 text-[9px] text-muted-foreground font-medium truncate max-w-[56px] mx-auto">{rMod.name}</div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                  <div style={{overflowX:"auto"}}>
                                                                    <div style={{minWidth:LABEL_W+gridSectionIds.length*CELL_W,direction:isRTL?"rtl":"ltr"}}>
                                                                      {partsToShow.map((part: any, partIdx: number) => {
                                                                        const stageMap=new Map(part.stages.map((s: any)=>[s.sectionId,s]));
                                                                        const activeIdxs=gridSectionIds.map((sid,i)=>(stageMap.has(sid)?i:-1)).filter(i=>i>=0);
                                                                        const firstActiveIdx=activeIdxs[0]??-1;
                                                                        const lastActiveIdx=activeIdxs[activeIdxs.length-1]??-1;
                                                                        const nextPartStageMap=partIdx<partsToShow.length-1?new Map(partsToShow[partIdx+1].stages.map((s: any)=>[s.sectionId,s])):null;
                                                                        const hasMergeWithNext=nextPartStageMap?gridSectionIds.some(sid=>mergeSections.has(sid)&&stageMap.has(sid)&&nextPartStageMap.has(sid)):false;
                                                                        return (
                                                                          <div key={part.id??partIdx}>
                                                                            <div style={{display:"flex",alignItems:"center",minHeight:52}}>
                                                                              <div style={{width:LABEL_W,flexShrink:0,[isRTL?"paddingLeft":"paddingRight"]:6}}>
                                                                                <div className="text-center rounded border px-1 py-0.5" style={{fontSize:8,fontFamily:"monospace",fontWeight:700,background:"rgb(245 208 254/0.5)",borderColor:"rgb(192 132 252)",color:"rgb(107 33 168)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                                                                  {String(part.id??`P${partIdx+1}`).toUpperCase()}
                                                                                </div>
                                                                                <div className="text-center mt-0.5 truncate" style={{fontSize:7,color:"#6b7280"}}>{part.name}</div>
                                                                              </div>
                                                                              {gridSectionIds.map((sectionId,colIdx)=>{
                                                                                const stage=stageMap.get(sectionId);
                                                                                const section=sections.find(s=>s.id===sectionId);
                                                                                const isMerge=mergeSections.has(sectionId);
                                                                                const isActive=!!stage;
                                                                                const isLastCell=colIdx===lastActiveIdx;
                                                                                const isPassthrough=!isActive&&colIdx>firstActiveIdx&&colIdx<lastActiveIdx;
                                                                                return (
                                                                                  <div key={sectionId} style={{width:CELL_W,flexShrink:0,display:"flex",alignItems:"center"}}>
                                                                                    {isActive?(
                                                                                      <>
                                                                                        <div className="flex flex-col items-center text-center rounded-md" style={{width:74,padding:"4px 5px",flexShrink:0,border:`1.5px solid ${isMerge?"#22c55e":"#93c5fd"}`,background:isMerge?"rgba(34,197,94,0.12)":"rgba(147,197,253,0.15)"}}>
                                                                                          <span style={{fontSize:9,fontWeight:700,color:isMerge?"#15803d":"#1d4ed8"}}>{section?.name?.toUpperCase()??sectionId}</span>
                                                                                          <span style={{fontSize:7,color:"#6b7280",marginTop:1}}>{(stage as any).approxLossPercent}% {L("loss","فقد")}</span>
                                                                                          {isMerge&&<span style={{fontSize:7,color:"#15803d",fontWeight:700,marginTop:1}}>⟷ {L("MERGE","دمج")}</span>}
                                                                                        </div>
                                                                                        {!isLastCell&&(
                                                                                          <div style={{flex:1,display:"flex",alignItems:"center",padding:"0 2px"}}>
                                                                                            {!isRTL&&<div style={{flex:1,height:1,background:"#94a3b8"}}/>}
                                                                                            <span style={{fontSize:10,color:"#94a3b8",lineHeight:1}}>{isRTL?"‹":"›"}</span>
                                                                                            {isRTL&&<div style={{flex:1,height:1,background:"#94a3b8"}}/>}
                                                                                          </div>
                                                                                        )}
                                                                                      </>
                                                                                    ):isPassthrough?(
                                                                                      <div style={{width:"100%",height:1,borderTop:"1.5px dashed rgba(148,163,184,0.35)"}}/>
                                                                                    ):(
                                                                                      <div style={{width:"100%"}}/>
                                                                                    )}
                                                                                  </div>
                                                                                );
                                                                              })}
                                                                            </div>
                                                                            {hasMergeWithNext&&nextPartStageMap&&(
                                                                              <div style={{display:"flex",alignItems:"center",height:14}}>
                                                                                <div style={{width:LABEL_W,flexShrink:0}}/>
                                                                                {gridSectionIds.map(sectionId=>{
                                                                                  const thisVisits=stageMap.has(sectionId);
                                                                                  const nextVisits=nextPartStageMap.has(sectionId);
                                                                                  const showLine=mergeSections.has(sectionId)&&thisVisits&&nextVisits;
                                                                                  return (
                                                                                    <div key={sectionId} style={{width:CELL_W,flexShrink:0,display:"flex",justifyContent:"center",alignItems:"center"}}>
                                                                                      {showLine&&<div style={{width:2,height:14,background:"linear-gradient(to bottom, #22c55e, #16a34a)",borderRadius:1}}/>}
                                                                                    </div>
                                                                                  );
                                                                                })}
                                                                              </div>
                                                                            )}
                                                                          </div>
                                                                        );
                                                                      })}
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-2 border-t bg-muted/20 flex items-center text-xs text-muted-foreground gap-2">
          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
          {expandedOrderId
            ? <span>{L("Showing models for","عرض الموديلات للطلب")} <span className="font-semibold text-foreground">{filteredOrders.find(o => o.id === expandedOrderId)?.orderCode}</span> — {L("click again to collapse","انقر مجدداً للطيّ")}</span>
            : <span>{L("Click any order row to drill down into its models, parts, and road map","انقر على أي صف طلب للتعمق في موديلاته وأجزائه وخريطة الطريق")}</span>
          }
        </div>
      </div>

      {/* QR Popup */}
      {qrPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setQrPopup(null)}>
          <div className="bg-card rounded-2xl border shadow-2xl p-6 max-w-xs w-full mx-4 flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <p className="font-bold text-sm">{L("Movement QR","رمز QR الحركة")}</p>
              <button onClick={() => setQrPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <MiniQR value={qrPopup.code} />
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">{L("Order","الطلب")}</p>
              <p className="font-bold font-mono">{qrPopup.orderCode}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{qrPopup.code}</p>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {L("Scan this QR to track the current movement of this order in the factory","امسح هذا الرمز لتتبع الحركة الحالية لهذا الطلب في المصنع")}
            </p>
          </div>
        </div>
      )}

      {/* Model Image Popup */}
      {modelImgPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModelImgPopup(null)}>
          <div className="bg-card rounded-2xl border shadow-2xl p-4 max-w-lg w-full mx-4 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <p className="font-bold text-sm">{modelImgPopup.name}</p>
              <button onClick={() => setModelImgPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <img src={modelImgPopup.src} alt={modelImgPopup.name} className="w-full max-h-80 object-contain rounded-xl border border-border" />
          </div>
        </div>
      )}

      {/* Part Image Popup */}
      {partImgPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPartImgPopup(null)}>
          <div className="bg-card rounded-2xl border shadow-2xl p-4 max-w-lg w-full mx-4 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <p className="font-bold text-sm">{L(`Part — ${partImgPopup.name}`,`صورة الجزء — ${partImgPopup.name}`)}</p>
              <button onClick={() => setPartImgPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <img src={partImgPopup.src} alt={partImgPopup.name} className="w-full max-h-80 object-contain rounded-xl border border-border" />
          </div>
        </div>
      )}
    </div>
  );
}


// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { orders, movements, sections, workers, machines, stamps, alerts } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const L = (en: string, ar: string) => isRTL ? ar : en;

  // ── Filter state ────────────────────────────────────────────────────────
  const [searchQ,       setSearchQ]       = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [dateFrom,      setDateFrom]      = useState("2025-01-01");
  const [dateTo,        setDateTo]        = useState("2027-12-31");

  const _dFrom = new Date(dateFrom).getTime();
  const _dTo   = new Date(dateTo).getTime() + 86400000;

  const filteredOrders = orders.filter((o: any) => {
    const oDate = new Date(o.createdAt).getTime();
    if (oDate < _dFrom || oDate > _dTo) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (sectionFilter !== "all") {
      const lastMov = movements
        .filter((m: any) => m.orderId === o.id)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (!lastMov || lastMov.toSectionId !== sectionFilter) return false;
    }
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (o.orderCode?.toLowerCase().includes(q) || o.itemName?.toLowerCase().includes(q) || o.status?.includes(q));
  });

  const isFiltered = !!(searchQ || statusFilter !== "all" || sectionFilter !== "all" || dateFrom !== "2025-01-01" || dateTo !== "2027-12-31");
  const filteredOrderIds = new Set(filteredOrders.map((o: any) => o.id));
  const filteredMovements = movements.filter((m: any) => filteredOrderIds.has(m.orderId));

  const totalOrders      = filteredOrders.length;
  const activeOrders     = filteredOrders.filter((o: any) => o.status === "in-production").length;
  const totalGoldWeightG = filteredOrders.reduce((acc: number, o: any) => acc + o.totalWeightGrams, 0);
  const totalLossG       = filteredMovements.reduce((acc: number, m: any) => acc + m.lossGrams, 0);
  const totalWeightProc  = filteredMovements.filter((m: any) => m.weightBefore > 0).reduce((acc: number, m: any) => acc + m.weightBefore, 0);
  const totalLossPct     = totalWeightProc > 0 ? (totalLossG / totalWeightProc) * 100 : 0;
  const activeAlerts     = alerts.filter((a: any) => !a.isDismissed).length;
  const dustLoss         = totalLossG * 0.08 || 2.4;
  const totalWorkingHours = filteredMovements.length * 4.2;

  const sectionStats = sections.map((s: any) => {
    const sMovs   = filteredMovements.filter((m: any) => m.toSectionId === s.id);
    const sLossG  = sMovs.reduce((a: number, m: any) => a + m.lossGrams, 0);
    const sWgtIn  = sMovs.reduce((a: number, m: any) => a + m.weightBefore, 0);
    const sPct    = sWgtIn > 0 ? (sLossG / sWgtIn) * 100 : Math.random() * 3 + 0.5;
    const sOrds   = filteredOrders.filter((o: any) => sMovs.some((m: any) => m.orderId === o.id));
    const sWeight = sMovs.reduce((a: number, m: any) => a + m.weightAfter, 0) || totalGoldWeightG / sections.length;
    const sTime   = Math.floor(sMovs.length * 4.5 + 2);
    return { section: s, stats: { orders: Math.max(sOrds.length, 1), weight: sWeight, lossG: sLossG, lossPercent: parseFloat(sPct.toFixed(2)), movements: sMovs.length, time: sTime } };
  });

  const topSection  = [...sectionStats].sort((a, b) => b.stats.movements - a.stats.movements)[0];
  const totalMoves  = Math.max(filteredMovements.length, 1);

  const karatGroups = stamps.map((st: any) => {
    const kOrders = filteredOrders.filter((o: any) => o.stampId === st.id);
    const kWeight = kOrders.reduce((a: number, o: any) => a + o.totalWeightGrams, 0);
    const kMoves  = filteredMovements.filter((m: any) => kOrders.some((o: any) => o.id === m.orderId));
    const kLossG  = kMoves.reduce((a: number, m: any) => a + m.lossGrams, 0);
    return { stamp: st, orders: kOrders.length, weight: kWeight, lossG: kLossG };
  }).filter((k: any) => k.orders > 0);

  const workerStats = workers.map(w => {
    const section  = sections.find(s => s.id === w.sectionId);
    const machine  = machines.find(m => m.id === w.machineId);
    const wMovs    = movements.filter(m => m.workerId === w.id);
    const wLossG   = wMovs.reduce((a, m) => a + m.lossGrams, 0);
    const wWgtIn   = wMovs.reduce((a, m) => a + m.weightBefore, 0);
    const wLossPct = wWgtIn > 0 ? (wLossG / wWgtIn) * 100 : Math.random() * 2 + 0.3;
    const wGoldOut = wMovs.reduce((a, m) => a + m.weightAfter, 0) || Math.floor(Math.random() * 200 + 50);
    const wOrders  = [...new Set(wMovs.map(m => m.orderId))].map(id => orders.find(o => o.id === id)).filter(Boolean) as typeof orders;
    const karatBreak = stamps.map(st => {
      const stMoves = wMovs.filter(m => wOrders.some(o => o.id === m.orderId && o.stampId === st.id));
      const stOut   = stMoves.reduce((a, m) => a + m.weightAfter, 0);
      return stOut > 0 ? { karat: st.karat, grams: stOut } : null;
    }).filter(Boolean) as { karat: number; grams: number }[];
    const totalPieces   = wOrders.reduce((a, o) => a + o.qty, 0) || Math.floor(Math.random() * 50 + 10);
    const damagedPieces = Math.floor(totalPieces * (wLossPct / 100));
    return {
      worker: { name: w.name, code: w.code, sectionName: section?.name || "—", machineName: machine?.name || "" },
      stats:  { operations: wMovs.length, goldProduced: wGoldOut, lossG: parseFloat(wLossG.toFixed(2)), lossPercent: parseFloat(wLossPct.toFixed(2)), dustLoss: parseFloat((wLossG * 0.1 || Math.random() * 2).toFixed(2)), damagedPieces, totalPieces, karatBreakdown: karatBreak },
    };
  }).sort((a, b) => a.stats.lossPercent - b.stats.lossPercent);

  const statusPie = [
    { name: "Pending",   value: filteredOrders.filter((o: any) => o.status === "pending").length },
    { name: "Approved",  value: filteredOrders.filter((o: any) => o.status === "approved").length },
    { name: "In Prod.",  value: filteredOrders.filter((o: any) => o.status === "in-production").length },
    { name: "On Hold",   value: filteredOrders.filter((o: any) => o.status === "on-hold").length },
    { name: "Completed", value: filteredOrders.filter((o: any) => o.status === "completed").length },
  ].filter(d => d.value > 0);

  const deptWorkload = sectionStats.map(ss => ({
    name: ss.section.name, moves: ss.stats.movements,
    pct:  Math.round((ss.stats.movements / totalMoves) * 100),
  })).sort((a, b) => b.moves - a.moves);

  // ── Ring / bar percentages for visual cards ──────────────────────────────
  const allOrdersLen     = orders.length || 1;
  const orderRingPct     = Math.round((totalOrders / allOrdersLen) * 100);
  const activeRingPct    = Math.round((activeOrders / Math.max(totalOrders, 1)) * 100);
  const goldRingPct      = Math.min(Math.round((totalGoldWeightG / 5000) * 100), 100);
  const lossRingPct      = Math.min(Math.round(totalLossPct * 12), 100);          // 0→8% loss = 0→100%
  const hoursRingPct     = Math.min(Math.round((totalWorkingHours / 400) * 100), 100);
  const dustRingPct      = totalLossG > 0 ? Math.min(Math.round((dustLoss / totalLossG) * 100), 100) : 50;
  const alertsRingPct    = Math.min(Math.round((activeAlerts / 10) * 100), 100);
  const highAlerts       = alerts.filter((a: any) => a.severity === "high" && !a.isDismissed).length;

  return (
    <div className="space-y-8">

      {/* ── Professional Search Filter Bar ─────────────────────────────────── */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <BarChart3 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">{L("Factory Overview Filter","فلتر نظرة عامة للمصنع")}</span>
          {isFiltered && (
            <span className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {L("Filtered","مُفلتَر")} · {filteredOrders.length} / {orders.length} {L("orders","طلب")}
            </span>
          )}
        </div>
        <div className="p-4 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={L("Search orders by code, item name, or status…","ابحث بكود الطلب، اسم المادة، أو الحالة…")}
              className="ps-9 bg-background/70 h-9 text-sm"
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Filter dropdowns + date range */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Date range */}
            <div className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 h-9 text-muted-foreground hover:border-ring transition-colors">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[115px] cursor-pointer" />
              <span className="text-muted-foreground/60 text-xs">–</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[115px] cursor-pointer" />
            </div>
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-background h-9 text-sm">
                <SelectValue placeholder={L("All Statuses","كل الحالات")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Statuses","كل الحالات")}</SelectItem>
                <SelectItem value="pending">{L("Pending","قيد الانتظار")}</SelectItem>
                <SelectItem value="approved">{L("Approved","معتمد")}</SelectItem>
                <SelectItem value="in-production">{L("In Production","قيد الإنتاج")}</SelectItem>
                <SelectItem value="on-hold">{L("On Hold","موقوف")}</SelectItem>
                <SelectItem value="completed">{L("Completed","مكتمل")}</SelectItem>
                <SelectItem value="cancelled">{L("Cancelled","ملغي")}</SelectItem>
              </SelectContent>
            </Select>
            {/* Section filter */}
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[150px] bg-background h-9 text-sm">
                <SelectValue placeholder={L("All Sections","كل الأقسام")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Sections","كل الأقسام")}</SelectItem>
                {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Clear */}
            {isFiltered && (
              <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => { setSearchQ(""); setStatusFilter("all"); setSectionFilter("all"); setDateFrom("2025-01-01"); setDateTo("2027-12-31"); }}>
                <X className="w-3.5 h-3.5 me-1" />{L("Clear","مسح")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Visual Stat Cards ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Factory className="w-5 h-5 text-primary" />{L("Factory Overview","نظرة عامة على المصنع")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Package}       label={L("Total Orders","إجمالي الطلبات")}      value={totalOrders}                       sub={`${activeOrders} ${L("in production","قيد الإنتاج")}`}   accent="blue"   trend="up"   ringPct={orderRingPct}  barPct={activeRingPct} />
          <StatCard icon={Scale}         label={L("Gold in Factory","ذهب في المصنع")}     value={`${totalGoldWeightG.toFixed(0)}g`} sub={L("Across all orders","عبر كل الطلبات")}                  accent="gold"           ringPct={goldRingPct}   barPct={goldRingPct} />
          <StatCard icon={TrendingDown}  label={L("Total Loss","إجمالي الفقد")}           value={`${totalLossG.toFixed(1)}g`}       sub={`${totalLossPct.toFixed(2)}% ${L("rate","نسبة")}`}        accent="red"    trend="down" ringPct={lossRingPct}   barPct={lossRingPct} />
          <StatCard icon={Clock}         label={L("Working Hours","ساعات العمل")}         value={`${totalWorkingHours.toFixed(0)}h`} sub={L("Factory total","إجمالي المصنع")}                      accent="purple"          ringPct={hoursRingPct}  barPct={hoursRingPct} />
          <StatCard icon={Wind}          label={L("Dust Return","عائد الغبار")}           value={`${dustLoss.toFixed(1)}g`}         sub={L("Total dust loss","إجمالي فقد الغبار")}                 accent="orange"          ringPct={dustRingPct}   barPct={dustRingPct} />
          <StatCard icon={AlertTriangle} label={L("Active Alerts","التنبيهات النشطة")}   value={activeAlerts}                      sub={`${highAlerts} ${L("high priority","أولوية عالية")}`}     accent={activeAlerts > 2 ? "red" : "green"} ringPct={alertsRingPct} barPct={alertsRingPct} />
        </div>
      </section>

      <section>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-base">Order Distribution</CardTitle><CardDescription>Current status breakdown</CardDescription></CardHeader>
            <CardContent className="h-[220px] flex items-center justify-center">
              <div className="w-full h-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Gold by Karat</CardTitle><CardDescription>Weight & orders per karat type</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(karatGroups.length > 0 ? karatGroups : [{ stamp: { id: "st1", name: "18K / 750", code: "ST-18K", karat: 18, purity: 750, goldPercent: 75, pureGoldPerGram: 0.75 }, orders: totalOrders, weight: totalGoldWeightG, lossG: totalLossG }]).map((k, i) => {
                  const maxW = Math.max(...(karatGroups.length > 0 ? karatGroups : [k]).map(g => g.weight), 1);
                  const pct  = Math.round((k.weight / maxW) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold">{k.stamp.name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5">{k.orders} orders</Badge>
                        </div>
                        <div className="text-end">
                          <span className="font-bold">{k.weight.toFixed(0)}g</span>
                          {k.lossG > 0 && <span className="text-muted-foreground text-xs ms-2">loss: {k.lossG.toFixed(1)}g</span>}
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Department Workload</h2>
          {topSection && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Highest load:</span>
              <span className="font-semibold text-primary">{topSection.section.name}</span>
              <Badge className="text-[10px]">{Math.round((topSection.stats.movements / totalMoves) * 100)}%</Badge>
            </div>
          )}
        </div>
        <div className="space-y-2.5">
          {deptWorkload.map((d, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 shrink-0 truncate">{d.name}</span>
              <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(d.pct, 4)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
              </div>
              <div className="text-sm text-end w-20 shrink-0">
                <span className="font-bold">{d.pct}%</span>
                <span className="text-muted-foreground text-xs ms-1">({d.moves})</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />Section-by-Section Breakdown</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sectionStats.map(({ section, stats }) => <SectionCard key={section.id} section={section} stats={stats} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-destructive" />Loss Summary</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 p-5">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Loss (g)</p>
            <p className="text-3xl font-bold text-destructive">{totalLossG.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground mt-1">Across all movements</p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 p-5">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Loss Rate</p>
            <p className="text-3xl font-bold text-orange-500">{totalLossPct.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Of total weight processed</p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 p-5">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Dust Return Loss</p>
            <p className="text-3xl font-bold text-yellow-500">{dustLoss.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground mt-1">Scrap & melt operations</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Highest Loss Dept.</p>
            <p className="text-2xl font-bold">{[...sectionStats].sort((a, b) => b.stats.lossG - a.stats.lossG)[0]?.section.name || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">{[...sectionStats].sort((a, b) => b.stats.lossG - a.stats.lossG)[0]?.stats.lossPercent.toFixed(2)}% loss rate</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Worker Performance</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workerStats.map(({ worker, stats }) => <WorkerCard key={worker.code} worker={worker} stats={stats} />)}
        </div>
      </section>
    </div>
  );
}


// ─── DEPARTMENTS TAB ──────────────────────────────────────────────────────────
function DepartmentsTab() {
    const { sections, orders, movements, workers, machines } = useMockState();
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const [searchQ, setSearchQ]           = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom]         = useState("2026-06-01");
    const [dateTo,   setDateTo]           = useState("2026-07-31");

    const _dFrom = new Date(dateFrom).getTime();
    const _dTo   = new Date(dateTo).getTime() + 86400000;
    const dateFilteredMovements = (movements as any[]).filter((m: any) =>
      new Date(m.timestamp).getTime() >= _dFrom && new Date(m.timestamp).getTime() <= _dTo
    );

    const deptStats = sections.map((s: any) => {
      const sMovs = dateFilteredMovements.filter((m: any) => m.toSectionId === s.id);
      const sOrderIds     = [...new Set(sMovs.map((m: any) => m.orderId))];
      const sOrders       = orders.filter((o: any) => sOrderIds.includes(o.id));
      const activeOrds    = sOrders.filter((o: any) => o.status === "in-production");
      const completedOrds = sOrders.filter((o: any) => o.status === "completed");
      const qtyProcessed  = sOrders.reduce((a: number, o: any) => a + o.qty, 0);
      const totalWeight   = sMovs.reduce((a: number, m: any) => a + (m.weightAfter > 0 ? m.weightAfter : 0), 0);
      const lossGrams     = sMovs.reduce((a: number, m: any) => a + m.lossGrams, 0);
      const wgtIn         = sMovs.reduce((a: number, m: any) => a + m.weightBefore, 0);
      const lossPct       = wgtIn > 0 ? (lossGrams / wgtIn) * 100 : (s.order * 0.4 + 0.6);
      const hoursWorked   = sMovs.length * 4.5 + s.order * 2.1;
      const ordCount      = Math.max(sOrders.length, 1);
      const avgTimePerOrd = hoursWorked / ordCount;
      const delayCount    = sOrders.filter((o: any) =>
        (o.status === "in-production" || o.status === "on-hold") &&
        new Date(o.deliveryDate) < new Date()
      ).length;
      const workerMovCounts = workers
        .map((w: any) => ({ w, cnt: sMovs.filter((m: any) => m.workerId === w.id).length }))
        .filter((x: any) => x.cnt > 0)
        .sort((a: any, b: any) => b.cnt - a.cnt);
      const topWorker = workerMovCounts[0]?.w ?? null;
      const sectionMachines = machines.filter((mc: any) => mc.sectionId === s.id);
      const machineCounts = sectionMachines
        .map((mc: any) => ({
          mc,
          cnt: sMovs.filter((m: any) => {
            const w = workers.find((wk: any) => wk.id === m.workerId);
            return (w as any)?.machineId === mc.id;
          }).length,
        }))
        .sort((a: any, b: any) => b.cnt - a.cnt);
      const topMachine = machineCounts[0]?.mc ?? null;
      return {
        section: s,
        activeOrders:    activeOrds.length,
        completedOrders: completedOrds.length,
        qtyProcessed,
        totalWeight:     parseFloat(totalWeight.toFixed(1)),
        hoursWorked:     parseFloat(hoursWorked.toFixed(1)),
        avgTimePerOrder: parseFloat(avgTimePerOrd.toFixed(1)),
        netLoss:         parseFloat(lossGrams.toFixed(3)),
        lossPercent:     parseFloat(lossPct.toFixed(2)),
        delayCount,
        topWorkerName:   topWorker ? (topWorker as any).name.split(" ").map((n: string, i: number) => i === 0 ? n : n[0] + ".").join(" ") : "—",
        topMachineCode:  topMachine ? (topMachine as any).serialCode : "—",
      };
    });

    // Active departments = sections that have at least one movement in the date range
    const activeDepts           = deptStats.filter((d: any) => d.activeOrders > 0 || d.completedOrders > 0 || dateFilteredMovements.some((m: any) => m.toSectionId === d.section.id)).length || sections.length;
    // Total orders that touched at least one department in the date range (unique set)
    const allWorkedOrderIds     = [...new Set(dateFilteredMovements.map((m: any) => m.orderId))];
    const totalOrdersWorked     = allWorkedOrderIds.length;
    const totalHoursWorked      = deptStats.reduce((a: number, d: any) => a + d.hoursWorked, 0);
    // Qty processed: use unique orders that went through movements in the date range
    const totalQtyProcessed     = orders.filter((o: any) => allWorkedOrderIds.includes(o.id)).reduce((a: number, o: any) => a + o.qty, 0);
    const highestThroughputDept = [...deptStats].sort((a: any, b: any) => b.qtyProcessed - a.qtyProcessed)[0];

    const filteredStats = deptStats.filter((d: any) => {
      const q = searchQ.toLowerCase();
      if (q && !d.section.name.toLowerCase().includes(q) &&
               !d.section.code.toLowerCase().includes(q) &&
               !d.topWorkerName.toLowerCase().includes(q) &&
               !d.topMachineCode.toLowerCase().includes(q)) return false;
      if (statusFilter === "active"    && d.activeOrders === 0)    return false;
      if (statusFilter === "completed" && d.completedOrders === 0) return false;
      if (statusFilter === "delayed"   && d.delayCount === 0)      return false;
      return true;
    });

    const barData = deptStats.map((d: any) => ({
      name:       d.section.name,
      efficiency: Math.min(100, Math.max(60, 100 - d.lossPercent * 10)),
      lossRate:   d.lossPercent,
    }));

    const fmtHours = (h: number) => {
      const hrs  = Math.floor(h);
      const mins = Math.round((h - hrs) * 60);
      return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
    };

    const L = (en: string, ar: string) => isRTL ? ar : en;

    return (
      <div className="space-y-6">

        {/* ── Search + Filter Row ───────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={L("Search by department, code, worker, or machine…","بحث باسم القسم، الكود، العامل، أو الآلة…")}
              className="w-full ps-9 pe-9 h-10 rounded-md border border-input bg-background/70 px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchQ}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQ(e.target.value)}
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 h-9 text-muted-foreground hover:border-ring transition-colors">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <input
                type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer"
              />
              <span className="text-muted-foreground/60 text-xs mx-0.5">–</span>
              <input
                type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background h-9 text-sm">
                <SelectValue placeholder={L("All Departments","جميع الأقسام")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Departments","جميع الأقسام")}</SelectItem>
                <SelectItem value="active">{L("Has Active Orders","لديه طلبات نشطة")}</SelectItem>
                <SelectItem value="completed">{L("Has Completed Orders","لديه طلبات مكتملة")}</SelectItem>
                <SelectItem value="delayed">{L("Has Delayed Orders","لديه طلبات متأخرة")}</SelectItem>
              </SelectContent>
            </Select>
            {(searchQ || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => { setSearchQ(""); setStatusFilter("all"); }}>
                <X className="w-3.5 h-3.5 me-1" />{L("Clear","مسح")}
              </Button>
            )}
            <span className="ms-auto text-xs text-muted-foreground">
              {filteredStats.length} {L("of","من")} {deptStats.length} {L("departments","قسم")}
            </span>
          </div>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-purple-500/25 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400"><Building2 className="w-4 h-4" /></div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">▲ {activeDepts}</span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{activeDepts}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{L("Active Departments","الأقسام النشطة")}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{L("All Departments Active","جميع الأقسام نشطة")}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/25 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><Package className="w-4 h-4" /></div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">▲ 18</span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{totalOrdersWorked}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{L("Total Orders Worked","إجمالي الطلبات المُنفَّذة")}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{L("+18 vs yesterday","+18 مقارنةً بالأمس")}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-orange-500/15 to-orange-500/5 border-orange-500/25 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><Clock className="w-4 h-4" /></div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">▲ 8h 15m</span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{fmtHours(totalHoursWorked)}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{L("Total Hours Worked","إجمالي ساعات العمل")}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{L("+8h 15m vs yesterday","+8س 15د مقارنةً بالأمس")}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border-cyan-500/25 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Layers className="w-4 h-4" /></div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">▲ 6,420</span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{totalQtyProcessed.toLocaleString()} <span className="text-base font-medium text-muted-foreground">{L("pcs","قطعة")}</span></p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{L("Total Qty Processed","إجمالي الكميات المُعالَجة")}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{L("+6,420 vs yesterday","+6,420 مقارنةً بالأمس")}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/25 p-5 flex flex-col gap-3 col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"><TrendingUp className="w-4 h-4" /></div>
              <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-700">{L("Top","الأعلى")}</Badge>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{highestThroughputDept?.section.name ?? "—"}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{L("Highest Throughput Dept.","أعلى قسم إنتاجية")}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{highestThroughputDept ? `${highestThroughputDept.qtyProcessed.toLocaleString()} ${L("pcs","قطعة")}` : "—"}</p>
            </div>
          </div>
        </div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{L("Department Efficiency","كفاءة الأقسام")}</CardTitle>
              <CardDescription>{L("Efficiency score (%)","درجة الكفاءة (%)")}</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <div className="w-full h-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="efficiency" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={28} name={L("Efficiency %","الكفاءة %")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{L("Loss Rate by Department","نسبة الفقد حسب القسم")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <div className="w-full h-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="lossRate" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={28} name={L("Loss %","الفقد %")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Departments Detailed Performance Table ───────────────────────── */}
        <div className="rounded-xl border overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 bg-purple-600 dark:bg-purple-700">
            <span className="text-white font-bold text-sm tracking-wide uppercase">
              {L("Departments Detailed Performance","الأداء التفصيلي للأقسام")}
            </span>
            <div className="flex items-center gap-2">
              {(searchQ || statusFilter !== "all") && (
                <Badge className="text-[10px] bg-white/20 text-white border-white/30">{L("Filtered:","مُصفَّى:")} {filteredStats.length}</Badge>
              )}
              <span className="text-purple-100 text-xs">
                {L("Active Orders","الطلبات النشطة")} ({filteredStats.reduce((a: number, d: any) => a + d.activeOrders, 0)})
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-purple-600 dark:bg-purple-800 border-b border-purple-700 dark:border-purple-700">
                  {(isRTL ? ["القسم","الطلبات النشطة","الطلبات المكتملة","الكمية المُعالَجة","الوزن الإجمالي","ساعات العمل","متوسط وقت الطلب","صافي الفقد (g)","نسبة الفقد %","التأخيرات","أفضل عامل","أفضل آلة"]
                           : ["Department","Active Orders","Completed Orders","Qty Processed","Total Weight","Hours Worked","Avg Time / Order","Net Loss (g)","Loss %","Delay Count","Top Worker","Top Machine"]
                  ).map((h: string, i: number) => (
                    <th key={i} className="px-3 py-2.5 text-start text-[10px] font-bold text-white uppercase whitespace-nowrap border-e border-purple-500/40 dark:border-purple-700/60 last:border-e-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-muted-foreground">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">{L("No departments match your search","لا توجد أقسام تطابق بحثك")}</p>
                      <p className="text-[10px] mt-1">{L("Try adjusting your filters","حاول تعديل الفلاتر")}</p>
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((d: any, rowIdx: number) => {
                    const isEven    = rowIdx % 2 === 0;
                    const lossColor = d.lossPercent > 3 ? "text-destructive font-bold"
                      : d.lossPercent > 1.5 ? "text-yellow-600 dark:text-yellow-400"
                      : "text-green-600 dark:text-green-400";
                    return (
                      <tr key={d.section.id} className={`border-b border-border/50 last:border-b-0 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors ${isEven ? "bg-background" : "bg-muted/20"}`}>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {d.section.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-xs whitespace-nowrap">{d.section.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{d.section.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">{d.activeOrders}</span>
                            <button onClick={() => analyticsNav.emit("movements")} className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors font-medium whitespace-nowrap w-fit">
                              {L("Active Package","الباقة النشطة")}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-green-700 dark:text-green-300 text-sm">{d.completedOrders}</span>
                            <button onClick={() => analyticsNav.emit("movements")} className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors font-medium whitespace-nowrap w-fit">
                              {L("Completed Package","الباقة المكتملة")}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <span className="font-mono font-semibold">{d.qtyProcessed.toLocaleString()}</span>
                          <span className="text-muted-foreground ms-1 text-[10px]">{L("pcs","قطعة")}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <span className="font-mono font-semibold">{d.totalWeight.toLocaleString()}</span>
                          <span className="text-muted-foreground ms-1 text-[10px]">g</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <span className="font-mono">{fmtHours(d.hoursWorked)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <span className="font-mono">{fmtHours(d.avgTimePerOrder)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <span className={`font-mono ${d.netLoss > 5 ? "text-destructive font-bold" : "text-muted-foreground"}`}>{d.netLoss.toFixed(3)}g</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <span className={`font-mono font-bold ${lossColor}`}>{d.lossPercent.toFixed(2)}%</span>
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30 text-center">
                          {d.delayCount > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-destructive/15 text-destructive font-bold text-xs">{d.delayCount}</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-bold">0</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-e border-border/30">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {d.topWorkerName !== "—" ? d.topWorkerName[0] : "—"}
                            </div>
                            <span className="whitespace-nowrap text-[11px] font-medium">{d.topWorkerName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d.topMachineCode}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
                {filteredStats.length > 0 && (
                  <tr className="border-t-2 border-purple-300 dark:border-purple-700 bg-purple-50/60 dark:bg-purple-900/20 font-bold">
                    <td className="px-3 py-2.5 border-e border-border/30 text-purple-700 dark:text-purple-300 text-xs uppercase">{L("Total","الإجمالي")}</td>
                    <td className="px-3 py-2.5 border-e border-border/30 text-sm text-blue-700 dark:text-blue-300">{filteredStats.reduce((a: number, d: any) => a + d.activeOrders, 0)}</td>
                    <td className="px-3 py-2.5 border-e border-border/30 text-sm text-green-700 dark:text-green-300">{filteredStats.reduce((a: number, d: any) => a + d.completedOrders, 0)}</td>
                    <td className="px-3 py-2.5 border-e border-border/30 font-mono">{filteredStats.reduce((a: number, d: any) => a + d.qtyProcessed, 0).toLocaleString()} <span className="font-normal text-[10px] text-muted-foreground">{L("pcs","قطعة")}</span></td>
                    <td className="px-3 py-2.5 border-e border-border/30 font-mono">{filteredStats.reduce((a: number, d: any) => a + d.totalWeight, 0).toFixed(1)} <span className="font-normal text-[10px] text-muted-foreground">g</span></td>
                    <td className="px-3 py-2.5 border-e border-border/30 font-mono">{fmtHours(filteredStats.reduce((a: number, d: any) => a + d.hoursWorked, 0))}</td>
                    <td className="px-3 py-2.5 border-e border-border/30 font-mono">{fmtHours(filteredStats.length ? filteredStats.reduce((a: number, d: any) => a + d.avgTimePerOrder, 0) / filteredStats.length : 0)}</td>
                    <td className="px-3 py-2.5 border-e border-border/30 font-mono">{filteredStats.reduce((a: number, d: any) => a + d.netLoss, 0).toFixed(3)}g</td>
                    <td className="px-3 py-2.5 border-e border-border/30 font-mono text-destructive">{filteredStats.length ? (filteredStats.reduce((a: number, d: any) => a + d.lossPercent, 0) / filteredStats.length).toFixed(2) : "0.00"}%</td>
                    <td className="px-3 py-2.5 border-e border-border/30 text-center">{filteredStats.reduce((a: number, d: any) => a + d.delayCount, 0)}</td>
                    <td className="px-3 py-2.5 border-e border-border/30 text-muted-foreground">—</td>
                    <td className="px-3 py-2.5 text-muted-foreground">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
}
// ─── WORKERS TAB ──────────────────────────────────────────────────────────────
function WorkersTab() {
  const { workers, sections, movements, orders, machines, alerts } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const L = (en: string, ar: string) => isRTL ? ar : en;

  // ── Search / filter state ────────────────────────────────────────────────
  const [searchQ, setSearchQ]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [dateFrom, setDateFrom]         = useState("2026-06-01");
  const [dateTo,   setDateTo]           = useState("2026-07-31");
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // ── Per-worker statistics ────────────────────────────────────────────────
  // Visual shift badge (not the filter) — deterministic, separate from production status
  const SHIFT_BADGES = ["active","active","active","active","break","active","off"];
  const workerStats = workers.map((w: any, idx: number) => {
    const section   = sections.find((s: any) => s.id === w.sectionId);
    const machine   = machines.find((m: any) => m.id === w.machineId);
    const _wFrom = new Date(dateFrom).getTime();
    const _wTo   = new Date(dateTo).getTime() + 86400000;
    const wMovs  = movements.filter((m: any) =>
      m.workerId === w.id &&
      new Date(m.timestamp).getTime() >= _wFrom &&
      new Date(m.timestamp).getTime() <= _wTo
    );
    const wOrderIds = [...new Set(wMovs.map((m: any) => m.orderId))];
    const wOrders   = orders.filter((o: any) => wOrderIds.includes(o.id));

    const seed             = idx + 1;
    const packageHandled   = wMovs.length || seed * 3 + 4;
    const qtyHandled       = wOrders.reduce((a: number, o: any) => a + o.qty, 0) || seed * 18 + 30;
    const totalWeightG     = wMovs.reduce((a: number, m: any) => a + m.weightBefore, 0) || seed * 95 + 100;
    const lossGrams        = wMovs.reduce((a: number, m: any) => a + m.lossGrams, 0) || parseFloat((seed * 0.28 + 0.42).toFixed(3));
    const wgtIn            = wMovs.reduce((a: number, m: any) => a + m.weightBefore, 0) || totalWeightG;
    const lossPct          = wgtIn > 0 ? (lossGrams / wgtIn) * 100 : parseFloat((seed * 0.38 + 0.55).toFixed(2));
    const hoursWorked      = wMovs.length * 4.5 + seed * 1.15 + 3.2;
    const goldWeightG      = parseFloat((totalWeightG * 0.75).toFixed(1));
    const nonGoldWeightG   = parseFloat((totalWeightG * 0.25).toFixed(1));
    const loss18k          = parseFloat((lossGrams * 0.58).toFixed(3));
    const loss20k          = parseFloat((lossGrams * 0.26).toFixed(3));
    const loss22k          = parseFloat((lossGrams - loss18k - loss20k).toFixed(3));
    const pureLoss18k      = parseFloat((loss18k * 0.75).toFixed(3));
    const pureLoss20k      = parseFloat((loss20k * 0.875).toFixed(3));
    const pureLoss22k      = parseFloat((loss22k * 0.916).toFixed(3));
    const pureLossTotal    = parseFloat((pureLoss18k + pureLoss20k + pureLoss22k).toFixed(3));
    const returnDustG      = parseFloat((lossGrams * 0.07 + 0.05).toFixed(3));
    const workerAlerts     = (alerts as any[]).filter((a: any) => a.workerId === w.id && !a.isDismissed);
    const sortedMovs       = [...wMovs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastMov          = sortedMovs[0];
    const currentQR        = lastMov?.qrCode ?? "—";
    const currentTask      = lastMov ? ((orders as any[]).find((o: any) => o.id === lastMov.orderId)?.itemName ?? "—") : "—";

    // Visual shift badge (separate from production status filter)
    const shiftStatus = w.status === "active" ? SHIFT_BADGES[idx % SHIFT_BADGES.length] : "off";

    // Production status for the filter — derived from real order data:
    // ACTIVE   = has at least one in-production order
    // HOLDING  = has an on-hold order and nothing in-production
    // FINISHED = all orders completed or no orders at all
    const hasActive  = (wOrders as any[]).some((o: any) => o.status === "in-production");
    const hasHolding = (wOrders as any[]).some((o: any) => o.status === "on-hold" || o.status === "approved");
    const prodStatus: "active" | "holding" | "finished" =
      hasActive  ? "active"   :
      hasHolding ? "holding"  :
      "finished";

    const activeOrder = (wOrders as any[]).find((o: any) => o.status === "in-production")
      ?? (wOrders as any[]).find((o: any) => o.status === "on-hold")
      ?? wOrders[0] ?? null;
    const progressPct = activeOrder
      ? (activeOrder.status === "completed" ? 100 : Math.min(95, Math.max(12, seed * 12 + 5)))
      : 0;
    const qtyTarget   = activeOrder
      ? parseFloat((Math.max(totalWeightG, seed * 80) / 42).toFixed(2))
      : 0;
    const qtyDone     = parseFloat((qtyTarget * progressPct / 100).toFixed(2));
    const etaMinutes  = Math.max(25, 115 - progressPct);
    const etaH        = Math.floor((7 + seed * 0.75 + etaMinutes / 60) % 24);
    const etaM        = Math.round(etaMinutes % 60);
    const etaStr      = `${String(etaH).padStart(2,"0")}:${String(etaM).padStart(2,"0")} ${etaH < 12 ? "AM" : "PM"}`;
    const clockH      = 7 + (idx % 2);
    const clockM      = (seed * 7) % 60;
    const clockInStr  = `${String(clockH).padStart(2,"0")}:${String(clockM).padStart(2,"0")} AM`;

    return {
      worker: w, sectionName: section?.name ?? "—",
      machineName: machine?.serialCode ?? "—", machineFullName: machine?.name ?? "—",
      currentTask, currentQR, packageHandled, qtyHandled,
      totalWeightG, goldWeightG, nonGoldWeightG,
      hoursWorked: parseFloat(hoursWorked.toFixed(1)),
      grossLossPct: parseFloat(lossPct.toFixed(2)),
      loss18k, loss20k, loss22k,
      pureLossTotal, pureLoss18k, pureLoss20k, pureLoss22k,
      returnDustG, alertCount: workerAlerts.length,
      alertSeverity: workerAlerts[0]?.severity ?? null,
      shiftStatus, prodStatus, activeOrder, progressPct, qtyTarget, qtyDone, etaStr, clockInStr,
    };
  });

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredStats = workerStats.filter((d: any) => {
    const q = searchQ.toLowerCase();
    if (q && ![d.worker.name, d.worker.code, d.sectionName, d.machineName, d.currentQR]
               .some((v: string) => v.toLowerCase().includes(q))) return false;
    // statusFilter matches prodStatus: "active" | "holding" | "finished"
    if (statusFilter !== "all" && d.prodStatus !== statusFilter) return false;
    if (sectionFilter !== "all" && d.worker.sectionId !== sectionFilter) return false;
    if (machineFilter !== "all" && d.worker.machineId !== machineFilter) return false;
    return true;
  });

  // ── Chart data ──────────────────────────────────────────────────────────
  const chartData = workerStats.map((d: any) => ({
    name: d.worker.name.split(" ")[0],
    hours: parseFloat(d.hoursWorked.toFixed(1)),
    qty: d.qtyHandled,
  }));

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmtH = (h: number) => {
    const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60);
    return `${String(hrs).padStart(2,"0")}h ${String(mins).padStart(2,"0")}m`;
  };
  const shiftBadgeCls = (s: string) =>
    s === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700"
    : s === "break" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700"
    : "bg-muted text-muted-foreground border-border";
  const shiftLabel = (s: string) =>
    isRTL ? (s === "active" ? "في الشيفت" : s === "break" ? "استراحة" : "خارج")
           : (s === "active" ? "In Shift"  : s === "break" ? "On Break" : "Off Shift");
  const lossColor = (pct: number) =>
    pct > 3 ? "text-destructive font-bold"
    : pct > 1.5 ? "text-amber-600 dark:text-amber-400"
    : "text-green-600 dark:text-green-400";

  return (
    <div className="space-y-5">

      {/* ══ 1. Search + Filter Bar ══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={L(
              "Search by worker name, code, section, machine or QR…",
              "بحث باسم العامل، الكود، القسم، الآلة أو رمز QR…"
            )}
            className="w-full ps-9 pe-9 h-10 rounded-md border border-input bg-background/70 px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchQ}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 h-9 text-muted-foreground hover:border-ring transition-colors">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <input
              type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer"
            />
            <span className="text-muted-foreground/60 text-xs mx-0.5">–</span>
            <input
              type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer"
            />
          </div>
          {/* Status — matches prodStatus: active | holding | finished */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Statuses","جميع الحالات")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Statuses","جميع الحالات")}</SelectItem>
              <SelectItem value="active">{L("ACTIVE","نشط")}</SelectItem>
              <SelectItem value="holding">{L("HOLDING","متوقف")}</SelectItem>
              <SelectItem value="finished">{L("FINISHED","منتهي")}</SelectItem>
            </SelectContent>
          </Select>
          {/* All Workers */}
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[150px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Sections","جميع الأقسام")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Sections","جميع الأقسام")}</SelectItem>
              {(sections as any[]).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* All Machines */}
          <Select value={machineFilter} onValueChange={setMachineFilter}>
            <SelectTrigger className="w-[150px] bg-background h-9 text-sm">
              <SelectValue placeholder={L("All Machines","جميع الآلات")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Machines","جميع الآلات")}</SelectItem>
              {(machines as any[]).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.serialCode}</SelectItem>)}
            </SelectContent>
          </Select>
          {(searchQ || statusFilter !== "all" || sectionFilter !== "all" || machineFilter !== "all") && (
            <Button variant="ghost" size="sm" className="text-xs h-9"
              onClick={() => { setSearchQ(""); setStatusFilter("all"); setSectionFilter("all"); setMachineFilter("all"); }}>
              <X className="w-3.5 h-3.5 me-1" />{L("Clear","مسح")}
            </Button>
          )}
          <span className="ms-auto text-xs text-muted-foreground font-medium">
            {filteredStats.length} {L("of","من")} {workerStats.length} {L("workers","عامل")}
            {" — "}
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {workerStats.filter((d: any) => d.prodStatus === "active").length} {L("ACTIVE","نشط")}
            </span>
            {" · "}
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {workerStats.filter((d: any) => d.prodStatus === "holding").length} {L("HOLDING","متوقف")}
            </span>
            {" · "}
            <span className="text-muted-foreground font-semibold">
              {workerStats.filter((d: any) => d.prodStatus === "finished").length} {L("FINISHED","منتهي")}
            </span>
          </span>
        </div>
      </div>

      {/* ══ Standalone chart: Hours Worked vs Qty Processed ════════════════ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {L("Workers: Hours Worked vs Qty Processed","العمال: ساعات العمل مقابل الكمية المنتجة")}
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {L("Green bars = hours worked  ·  Blue line = pieces processed","الأعمدة الخضراء = ساعات العمل  ·  الخط الأزرق = الكمية المنتجة")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[260px] pt-0">
          <div className="w-full h-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ left: 16, right: 56, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} interval={0} />
                <YAxis
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false} axisLine={false}
                  tick={{ fontSize: 10 }} width={42}
                  label={{ value: L("Hours","hrs"), angle: -90, position: "insideLeft", offset: -4, style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false} axisLine={false}
                  tick={{ fontSize: 10 }} width={52}
                  label={{ value: L("Qty (pcs)","القطع"), angle: 90, position: "insideRight", offset: 0, style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar yAxisId="left" dataKey="hours" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} barSize={28} name={L("Hours Worked","ساعات العمل")} />
                <Line yAxisId="right" type="monotone" dataKey="qty" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 5, fill: "hsl(var(--chart-1))", strokeWidth: 2 }} activeDot={{ r: 6 }} name={L("Qty Processed","الكمية المعالجة")} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ══ Main layout: table + optional detail side-panel ════════════════ */}
      <div className="flex gap-4 items-start">

        {/* ══ 3. Workers Performance Table ═══════════════════════════════════ */}
        <div className="flex-1 min-w-0 rounded-xl border overflow-hidden shadow-sm">
          {/* Table title bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-600 dark:bg-emerald-700">
            <span className="text-white font-bold text-sm tracking-wide uppercase">
              {L("Workers Performance","أداء العمال")} ({filteredStats.length})
            </span>
            <span className="text-emerald-100 text-xs">
              {L("Click a row to view details","انقر على صف لعرض التفاصيل")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: "1680px" }}>
              <thead>
                {/* ── Row 1: column groups ─────────────────────────────── */}
                <tr className="bg-emerald-600 dark:bg-emerald-800">
                  <th rowSpan={2} className="px-3 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[160px] align-bottom pb-1">
                    {L("WORKER","العامل")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[85px] align-bottom pb-1">
                    {L("SECTION","القسم")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[110px] align-bottom pb-1">
                    <span>{L("CURRENT TASK","المهمة الحالية")}</span>
                    <span className="block text-[9px] font-normal opacity-70 mt-0.5">{L("Current QR","رمز QR")}</span>
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 align-bottom pb-1">
                    {L("PKGS","الباقات")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 align-bottom pb-1">
                    {L("QTY","الكمية")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[80px] align-bottom pb-1">
                    {L("TOTAL WT","إجمالي الوزن")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[75px] align-bottom pb-1">
                    {L("GOLD WT","وزن الذهب")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[78px] align-bottom pb-1">
                    {L("NON-GOLD WT","وزن غير ذهب")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[72px] align-bottom pb-1">
                    {L("HOURS","الساعات")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[58px] align-bottom pb-1">
                    {L("LOSS %","الفقد %")}
                  </th>
                  {/* Gross Loss spans 3 */}
                  <th colSpan={3} className="px-2 py-1 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 border-b border-emerald-400/50">
                    {L("GROSS LOSS (g)","إجمالي الفقد (g)")}
                  </th>
                  {/* Pure Loss 24K spans 4 */}
                  <th colSpan={4} className="px-2 py-1 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 border-b border-emerald-400/50">
                    {L("PURE LOSS 24K (g)","الفقد الخالص 24K (g)")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase border-e border-emerald-500/40 min-w-[68px] align-bottom pb-1">
                    {L("RETURN/DUST","عائد/غبار")}
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center text-[10px] font-bold text-white uppercase min-w-[58px] align-bottom pb-1">
                    {L("ALERTS","تنبيه")}
                  </th>
                </tr>
                {/* ── Row 2: karat sub-headers ─────────────────────────── */}
                <tr className="bg-emerald-700 dark:bg-emerald-900">
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">18K</th>
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">20K</th>
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">22K</th>
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">{L("Total","الإجمالي")}</th>
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">18K</th>
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">20K</th>
                  <th className="px-2 py-1 text-center text-[9px] font-bold text-emerald-200 border-e border-emerald-500/40">22K</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-14 text-center text-muted-foreground">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">{L("No workers match your search","لا يوجد عمال يطابقون بحثك")}</p>
                    </td>
                  </tr>
                ) : filteredStats.map((d: any, ri: number) => {
                  const isEven  = ri % 2 === 0;
                  const isSel   = selectedWorker?.worker.id === d.worker.id;
                  const initials = d.worker.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
                  return (
                    <tr
                      key={d.worker.id}
                      onClick={() => setSelectedWorker(isSel ? null : d)}
                      className={`border-b border-border/40 last:border-b-0 cursor-pointer transition-colors
                        ${isSel
                          ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-400/40"
                          : isEven
                          ? "bg-background hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"
                          : "bg-muted/20 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"}`}
                    >
                      {/* Worker */}
                      <td className="px-2 py-2 border-e border-border/30">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0
                            ${d.shiftStatus === "active"
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                              : d.shiftStatus === "break"
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : "bg-muted text-muted-foreground"}`}>
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[11px] truncate">{d.worker.name}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{d.worker.code}</p>
                            {d.machineName !== "—" && <p className="text-[9px] text-muted-foreground/70">{d.machineName}</p>}
                          </div>
                          <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap ${shiftBadgeCls(d.shiftStatus)}`}>
                            {shiftLabel(d.shiftStatus)}
                          </span>
                        </div>
                      </td>
                      {/* Section */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="text-[11px] font-medium">{d.sectionName}</span>
                      </td>
                      {/* Current Task / QR */}
                      <td className="px-2 py-2 border-e border-border/30">
                        <p className="text-[11px] font-medium truncate max-w-[100px]" title={d.currentTask}>{d.currentTask}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">{d.currentQR}</p>
                      </td>
                      {/* Packages */}
                      <td className="px-2 py-2 border-e border-border/30 text-center font-mono font-semibold">{d.packageHandled}</td>
                      {/* Qty */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="font-mono font-semibold">{d.qtyHandled}</span>
                        <span className="text-[9px] text-muted-foreground ms-0.5">{L("pcs","ق")}</span>
                      </td>
                      {/* Total Weight */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="font-mono text-[11px]">{d.totalWeightG}g</span>
                      </td>
                      {/* Gold Wt */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="font-mono text-[11px] text-yellow-600 dark:text-yellow-400">{d.goldWeightG}g</span>
                      </td>
                      {/* Non-Gold Wt */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="font-mono text-[11px] text-muted-foreground">{d.nonGoldWeightG}g</span>
                      </td>
                      {/* Hours */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="font-mono text-[11px]">{fmtH(d.hoursWorked)}</span>
                      </td>
                      {/* Loss % */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className={`font-mono font-bold text-sm ${lossColor(d.grossLossPct)}`}>{d.grossLossPct.toFixed(2)}%</span>
                      </td>
                      {/* Gross Loss 18K / 20K / 22K */}
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px]">{d.loss18k}g</span></td>
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px]">{d.loss20k}g</span></td>
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px]">{d.loss22k}g</span></td>
                      {/* Pure Loss Total / 18K / 20K / 22K */}
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px] font-semibold">{d.pureLossTotal}g</span></td>
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px]">{d.pureLoss18k}g</span></td>
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px]">{d.pureLoss20k}g</span></td>
                      <td className="px-2 py-2 border-e border-border/30 text-center"><span className="font-mono text-[11px]">{d.pureLoss22k}g</span></td>
                      {/* Return/Dust */}
                      <td className="px-2 py-2 border-e border-border/30 text-center">
                        <span className="font-mono text-[11px] text-muted-foreground">{d.returnDustG}g</span>
                      </td>
                      {/* Alerts */}
                      <td className="px-2 py-2 text-center">
                        {d.alertCount > 0 ? (
                          <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold
                            ${d.alertSeverity === "high"
                              ? "bg-destructive/15 text-destructive"
                              : d.alertSeverity === "medium"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"}`}>
                            {d.alertCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Table footer */}
          <div className="px-4 py-2 border-t bg-muted/20 flex items-center text-xs text-muted-foreground gap-3">
            <span>{L(`Showing ${filteredStats.length} of ${workerStats.length} workers`,`عرض ${filteredStats.length} من ${workerStats.length} عامل`)}</span>
            <span className="ms-auto">{L("↑ Click any row to open worker detail panel","↑ انقر على أي صف لفتح لوحة تفاصيل العامل")}</span>
          </div>
        </div>

        {/* ══ 2 + 4 + 5. Worker Detail Side-Panel ════════════════════════════ */}
        {selectedWorker && (
          <div className="w-[340px] shrink-0 space-y-4 sticky top-4">

            {/* ── Worker profile ──────────────────────────────────────────── */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-600 dark:bg-emerald-700">
                <span className="text-white font-bold text-sm">{L("Worker Details","تفاصيل العامل")}</span>
                <button onClick={() => setSelectedWorker(null)} className="text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Avatar + name + badge */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 ring-2 ring-offset-2 ring-offset-card
                    ${selectedWorker.shiftStatus === "active"
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-400/40"
                      : selectedWorker.shiftStatus === "break"
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-400/40"
                      : "bg-muted text-muted-foreground ring-border"}`}>
                    {selectedWorker.worker.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight">{selectedWorker.worker.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedWorker.machineName !== "—" ? selectedWorker.machineFullName : selectedWorker.sectionName}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded border font-semibold ${shiftBadgeCls(selectedWorker.shiftStatus)}`}>
                      {shiftLabel(selectedWorker.shiftStatus)}
                    </span>
                  </div>
                </div>
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [L("Employee ID","رقم الموظف"), selectedWorker.worker.code],
                    [L("Section","القسم"),           selectedWorker.sectionName],
                    [L("Clock In","وقت الدخول"),     selectedWorker.clockInStr],
                    [L("Hours Worked","ساعات العمل"), fmtH(selectedWorker.hoursWorked)],
                    [L("Packages","الباقات"),         String(selectedWorker.packageHandled)],
                    [L("Loss Rate","نسبة الفقد"),     `${selectedWorker.grossLossPct.toFixed(2)}%`],
                  ].map(([label, val]: any) => (
                    <div key={label} className="bg-muted/40 rounded-lg p-2.5">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5 tracking-wide">{label}</p>
                      <p className="text-xs font-semibold font-mono">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 4. Current Order Assignments ────────────────────────────── */}
            {selectedWorker.activeOrder && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-blue-600 dark:bg-blue-700">
                  <p className="font-bold text-sm text-white">{L("Current Order Assignments","مهام الطلب الحالي")}</p>
                </div>
                <div className="p-4 space-y-3">
                  {/* Order ID row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{selectedWorker.activeOrder.orderCode}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{selectedWorker.currentTask}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 whitespace-nowrap">
                        {L("In Progress","قيد التنفيذ")}
                      </Badge>
                      <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                        {isRTL ? "← عرض الطلب" : "View Order →"}
                      </button>
                    </div>
                  </div>
                  {/* Qty cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{L("Qty Target","الكمية المستهدفة")}</p>
                      <p className="text-base font-bold font-mono">{selectedWorker.qtyTarget} <span className="text-[11px] font-normal">kg</span></p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{L("Qty Done","الكمية المنجزة")}</p>
                      <p className="text-base font-bold font-mono text-green-600 dark:text-green-400">{selectedWorker.qtyDone} <span className="text-[11px] font-normal">kg</span></p>
                    </div>
                  </div>
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="font-bold">{selectedWorker.progressPct}% {L("Complete","مكتمل")}</span>
                      <span className="text-muted-foreground font-mono">ETA: {selectedWorker.etaStr}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                        style={{ width: `${selectedWorker.progressPct}%` }}
                      />
                    </div>
                  </div>
                  {/* Extra info */}
                  <div className="rounded-lg border border-border/50 divide-y divide-border/50 text-xs overflow-hidden">
                    {[
                      [L("Task","المهمة"),               selectedWorker.currentTask],
                      [L("Total Pkgs Handled","إجمالي الباقات"), String(selectedWorker.packageHandled)],
                      [L("Gross Loss %","الفقد الإجمالي %"), `${selectedWorker.grossLossPct.toFixed(2)}%`],
                      [L("Return / Dust","عائد / غبار"),   `${selectedWorker.returnDustG}g`],
                    ].map(([k, v]: any) => (
                      <div key={k} className="flex justify-between px-3 py-1.5">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. Selected worker highlight in chart ───────────────────── */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/50">
                <p className="font-bold text-sm">{L("This Worker vs All","هذا العامل مقابل الكل")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{L("Hours worked · Qty processed","ساعات العمل · الكمية المعالجة")}</p>
              </div>
              <div className="p-3">
                <div className="h-[230px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ left: 10, right: 44, top: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} interval={0} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} width={34} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                      <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} />
                      <Bar yAxisId="left" dataKey="hours" fill="hsl(var(--chart-2))" radius={[3,3,0,0]} barSize={14}
                        name={L("Hours Worked","ساعات العمل")} />
                      <Line yAxisId="right" type="monotone" dataKey="qty" stroke="hsl(var(--chart-1))" strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--chart-1))" }} activeDot={{ r: 4 }}
                        name={L("Qty Processed","الكمية المعالجة")} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <button className="mt-2 w-full text-[10px] text-blue-600 dark:text-blue-400 hover:underline text-center font-semibold">
                  {isRTL ? "← عرض تحليلات القوى العاملة الكاملة" : "View Full Workforce Analytics →"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}


// ─── DUST TAB ─────────────────────────────────────────────────────────────────
function DustTab() {
  const { sections, workers, movements, orders } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const L = (en: string, ar: string) => isRTL ? ar : en;

  const [filterSection, setFilterSection] = useState("all");
  const [filterWorker,  setFilterWorker]  = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo,   setDateTo]   = useState("2026-07-31");

  // ── Derive dust data from movements (dust ≈ 8–14% of gold loss per move) ──
  const DUST_TYPES = [
    { key: "filing",    labelEn: "Filing Dust",    labelAr: "غبار البرد",    color: "hsl(var(--chart-1))", pct: 0.38 },
    { key: "polishing", labelEn: "Polishing Dust", labelAr: "غبار التلميع",  color: "hsl(var(--chart-2))", pct: 0.27 },
    { key: "casting",   labelEn: "Casting Dust",   labelAr: "غبار الصهر",    color: "hsl(var(--chart-3))", pct: 0.19 },
    { key: "grinding",  labelEn: "Grinding Dust",  labelAr: "غبار الطحن",    color: "hsl(var(--chart-4))", pct: 0.16 },
  ];

  const seed = (s: string) => s.split("").reduce((a,c) => (Math.imul(a,31)+c.charCodeAt(0))>>>0, 0);

  const dustRecords = React.useMemo(() => {
    const from = new Date(dateFrom).getTime();
    const to   = new Date(dateTo).getTime() + 86400000;
    return (movements as any[]).filter((m: any) => {
      const ts = new Date(m.timestamp).getTime();
      return ts >= from && ts <= to;
    }).map((m: any) => {
      const rng     = (seed(m.id) % 60 + 80) / 1000;   // 0.08–0.14 g dust per g loss
      const dustG   = parseFloat((m.lossGrams * rng).toFixed(3));
      const recovered = parseFloat((dustG * (0.6 + (seed(m.id + "r") % 30) / 100)).toFixed(3));
      const section = (sections as any[]).find(s => s.id === m.toSectionId);
      const worker  = (workers  as any[]).find(w => w.id === m.workerId);
      const typeIdx = seed(m.id) % 4;
      return {
        id: m.id, orderId: m.orderId, timestamp: m.timestamp,
        sectionId: m.toSectionId,  sectionName: section?.name   ?? "—",
        workerId:  m.workerId,     workerName:  worker?.name    ?? "—",
        dustG, recovered, lossRate: parseFloat(((dustG - recovered) / (dustG || 1) * 100).toFixed(1)),
        dustType: DUST_TYPES[typeIdx].key,
      };
    });
  }, [movements, sections, workers, dateFrom, dateTo]);

  const filtered = React.useMemo(() => dustRecords.filter(r =>
    (filterSection === "all" || r.sectionId === filterSection) &&
    (filterWorker  === "all" || r.workerId  === filterWorker)
  ), [dustRecords, filterSection, filterWorker]);

  const totalDustG   = filtered.reduce((a,r) => a + r.dustG,    0);
  const totalRecov   = filtered.reduce((a,r) => a + r.recovered, 0);
  const totalLostG   = totalDustG - totalRecov;
  const recoveryRate = totalDustG > 0 ? (totalRecov / totalDustG) * 100 : 0;

  // By section
  const bySection = React.useMemo(() => {
    const map: Record<string, { name: string; dustG: number; recovered: number; records: number }> = {};
    filtered.forEach(r => {
      if (!map[r.sectionId]) map[r.sectionId] = { name: r.sectionName, dustG: 0, recovered: 0, records: 0 };
      map[r.sectionId].dustG     += r.dustG;
      map[r.sectionId].recovered += r.recovered;
      map[r.sectionId].records++;
    });
    return Object.values(map).sort((a,b) => b.dustG - a.dustG).map(s => ({
      ...s, dustG: parseFloat(s.dustG.toFixed(3)), recovered: parseFloat(s.recovered.toFixed(3)),
      lostG: parseFloat((s.dustG - s.recovered).toFixed(3)),
      rate:  s.dustG > 0 ? parseFloat(((s.recovered / s.dustG) * 100).toFixed(1)) : 0,
    }));
  }, [filtered]);

  // By worker (top 8)
  const byWorker = React.useMemo(() => {
    const map: Record<string, { name: string; dustG: number; recovered: number; records: number }> = {};
    filtered.forEach(r => {
      if (!r.workerId) return;
      if (!map[r.workerId]) map[r.workerId] = { name: r.workerName, dustG: 0, recovered: 0, records: 0 };
      map[r.workerId].dustG     += r.dustG;
      map[r.workerId].recovered += r.recovered;
      map[r.workerId].records++;
    });
    return Object.values(map).sort((a,b) => b.dustG - a.dustG).slice(0, 8).map(w => ({
      ...w, dustG: parseFloat(w.dustG.toFixed(3)), recovered: parseFloat(w.recovered.toFixed(3)),
      lostG: parseFloat((w.dustG - w.recovered).toFixed(3)),
      rate:  w.dustG > 0 ? parseFloat(((w.recovered / w.dustG) * 100).toFixed(1)) : 0,
    }));
  }, [filtered]);

  // Dust type breakdown
  const byType = DUST_TYPES.map(t => {
    const recs = filtered.filter(r => r.dustType === t.key);
    const g    = parseFloat(recs.reduce((a,r) => a + r.dustG, 0).toFixed(3));
    return { name: isRTL ? t.labelAr : t.labelEn, value: g, color: t.color };
  }).filter(t => t.value > 0);

  // Weekly trend (last 8 weeks)
  const weeklyTrend = React.useMemo(() => {
    const from = new Date(dateFrom).getTime();
    const to   = new Date(dateTo).getTime() + 86400000;
    const weeks: { week: string; collected: number; recovered: number }[] = [];
    let w = 0;
    for (let wStart = from; wStart <= to && w < 12; wStart += 7*86400000, w++) {
      const wEnd  = Math.min(wStart + 7*86400000, to);
      const wRecs = filtered.filter(r => { const ts = new Date(r.timestamp).getTime(); return ts >= wStart && ts < wEnd; });
      const coll  = parseFloat(wRecs.reduce((a,r) => a + r.dustG,    0).toFixed(3));
      const recov = parseFloat(wRecs.reduce((a,r) => a + r.recovered, 0).toFixed(3));
      if (coll > 0 || w < 4) weeks.push({ week: `W${w+1}`, collected: coll, recovered: recov });
    }
    return weeks;
  }, [filtered, dateFrom, dateTo]);

  const highestSection = bySection[0];
  const pendingRecs    = filtered.filter(r => r.recovered < r.dustG * 0.5).length;

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-3 items-center shadow-sm">
        <Wind className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-muted-foreground">{L("Dust Filters","فلاتر الغبار")}</span>
        <div className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 h-9">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[115px]" />
          <span className="text-muted-foreground/60 text-xs">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[115px]" />
        </div>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-[160px] h-9 bg-background text-sm"><SelectValue placeholder={L("All Departments","كل الأقسام")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L("All Departments","كل الأقسام")}</SelectItem>
            {(sections as any[]).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterWorker} onValueChange={setFilterWorker}>
          <SelectTrigger className="w-[160px] h-9 bg-background text-sm"><SelectValue placeholder={L("All Workers","كل العمال")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L("All Workers","كل العمال")}</SelectItem>
            {(workers as any[]).map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterSection !== "all" || filterWorker !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs"
            onClick={() => { setFilterSection("all"); setFilterWorker("all"); }}>
            <X className="w-3.5 h-3.5 me-1" />{L("Clear","مسح")}
          </Button>
        )}
        <span className="ms-auto text-xs text-muted-foreground">{filtered.length} {L("records","سجل")}</span>
      </div>

      {/* ── Summary Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/30 p-5 flex flex-col gap-3">
          <div className="p-2 rounded-lg bg-background/60 text-amber-500 w-fit"><Wind className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold">{totalDustG.toFixed(2)}g</p>
            <p className="text-sm text-muted-foreground mt-0.5">{L("Total Dust Collected","إجمالي الغبار المجمَّع")}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{filtered.length} {L("operations","عملية")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 p-5 flex flex-col gap-3">
          <div className="p-2 rounded-lg bg-background/60 text-green-500 w-fit"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold">{recoveryRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-0.5">{L("Recovery Rate","معدل الاسترداد")}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{totalRecov.toFixed(2)}g {L("recovered","مُستردَّة")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30 p-5 flex flex-col gap-3">
          <div className="p-2 rounded-lg bg-background/60 text-red-500 w-fit"><TrendingDown className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold">{totalLostG.toFixed(2)}g</p>
            <p className="text-sm text-muted-foreground mt-0.5">{L("Unrecovered Dust","غبار غير مُستردَّ")}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{totalDustG > 0 ? (100 - recoveryRate).toFixed(1) : "0.0"}% {L("of total","من الإجمالي")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30 p-5 flex flex-col gap-3">
          <div className="p-2 rounded-lg bg-background/60 text-orange-500 w-fit"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold">{highestSection?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{L("Highest Dust Dept.","القسم الأكثر غبارًا")}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{highestSection?.dustG.toFixed(2) ?? "0.00"}g {L("collected","مجموع")}</p>
          </div>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Dust by Section bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              {L("Dust by Department (g)","الغبار حسب القسم (g)")}
            </CardTitle>
            <CardDescription className="text-xs">{L("Total dust collected per production section","إجمالي الغبار المجمَّع لكل قسم")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySection.slice(0,8)} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={90} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Bar dataKey="dustG"     name={L("Collected","مجموع")}   fill="hsl(var(--chart-1))" radius={[0,4,4,0]} barSize={14} />
                  <Bar dataKey="recovered" name={L("Recovered","مُستردَّ")} fill="hsl(var(--chart-2))" radius={[0,4,4,0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dust type breakdown pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              {L("Dust Type Breakdown","تصنيف الغبار")}
            </CardTitle>
            <CardDescription className="text-xs">{L("Distribution by dust source","التوزيع حسب مصدر الغبار")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {byType.length > 0 ? (
              <div className="flex items-center gap-4 h-full" dir="ltr">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byType} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                        {byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                        formatter={(v: any) => [`${Number(v).toFixed(3)}g`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {byType.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-muted-foreground truncate max-w-[110px]">{t.name}</span>
                      <span className="font-bold ms-auto">{t.value.toFixed(2)}g</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                {L("No dust data for selected range","لا توجد بيانات غبار للنطاق المحدد")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Weekly Trend ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            {L("Weekly Dust Trend","الاتجاه الأسبوعي للغبار")}
          </CardTitle>
          <CardDescription className="text-xs">{L("Collected vs recovered dust per week (g)","الغبار المجمَّع مقابل المُستردَّ أسبوعيًا (g)")}</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          <div className="w-full h-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyTrend} margin={{ left: 10, right: 20, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                <Bar dataKey="collected" name={L("Collected (g)","مجموع (g)")} fill="hsl(var(--chart-1))" radius={[3,3,0,0]} barSize={20} />
                <Line type="monotone" dataKey="recovered" name={L("Recovered (g)","مُستردَّ (g)")} stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── By Worker Table ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            {L("Dust by Worker","الغبار حسب العامل")}
          </CardTitle>
          <CardDescription className="text-xs">{L("Top contributors by dust generation","أعلى المساهمين في توليد الغبار")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="ps-4 text-xs">{L("Worker","العامل")}</TableHead>
                <TableHead className="text-end text-xs">{L("Operations","العمليات")}</TableHead>
                <TableHead className="text-end text-xs">{L("Collected (g)","مجموع (g)")}</TableHead>
                <TableHead className="text-end text-xs">{L("Recovered (g)","مُستردَّ (g)")}</TableHead>
                <TableHead className="text-end text-xs">{L("Unrecovered (g)","غير مُستردَّ (g)")}</TableHead>
                <TableHead className="pe-4 text-xs">{L("Recovery Rate","معدل الاسترداد")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byWorker.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground text-sm">{L("No data","لا توجد بيانات")}</TableCell></TableRow>
              ) : byWorker.map((w, i) => (
                <TableRow key={i}>
                  <TableCell className="ps-4 font-medium text-sm">{w.name}</TableCell>
                  <TableCell className="text-end text-sm">{w.records}</TableCell>
                  <TableCell className="text-end font-mono text-sm text-amber-600 dark:text-amber-400">{w.dustG.toFixed(3)}g</TableCell>
                  <TableCell className="text-end font-mono text-sm text-green-600 dark:text-green-400">{w.recovered.toFixed(3)}g</TableCell>
                  <TableCell className="text-end font-mono text-sm text-red-600 dark:text-red-400">{w.lostG.toFixed(3)}g</TableCell>
                  <TableCell className="pe-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${w.rate}%`, backgroundColor: w.rate >= 75 ? "hsl(var(--chart-2))" : w.rate >= 50 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))" }} />
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${w.rate >= 75 ? "text-green-600 dark:text-green-400" : w.rate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{w.rate}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Section Detail Table ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Factory className="w-4 h-4 text-amber-500" />
            {L("Department Dust Summary","ملخص الغبار حسب القسم")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="ps-4 text-xs">{L("Department","القسم")}</TableHead>
                <TableHead className="text-end text-xs">{L("Records","السجلات")}</TableHead>
                <TableHead className="text-end text-xs">{L("Collected (g)","مجموع (g)")}</TableHead>
                <TableHead className="text-end text-xs">{L("Recovered (g)","مُستردَّ (g)")}</TableHead>
                <TableHead className="text-end text-xs">{L("Net Loss (g)","الفقد الصافي (g)")}</TableHead>
                <TableHead className="pe-4 text-xs">{L("Recovery","الاسترداد")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySection.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground text-sm">{L("No data","لا توجد بيانات")}</TableCell></TableRow>
              ) : bySection.map((s, i) => (
                <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                  <TableCell className="ps-4 font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-end text-sm">{s.records}</TableCell>
                  <TableCell className="text-end font-mono text-sm text-amber-600 dark:text-amber-400">{s.dustG.toFixed(3)}g</TableCell>
                  <TableCell className="text-end font-mono text-sm text-green-600 dark:text-green-400">{s.recovered.toFixed(3)}g</TableCell>
                  <TableCell className="text-end font-mono text-sm text-red-600 dark:text-red-400">{s.lostG.toFixed(3)}g</TableCell>
                  <TableCell className="pe-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.rate}%`, backgroundColor: s.rate >= 75 ? "hsl(var(--chart-2))" : s.rate >= 50 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))" }} />
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${s.rate >= 75 ? "border-green-500/50 text-green-600 dark:text-green-400" : s.rate >= 50 ? "border-yellow-500/50 text-yellow-600 dark:text-yellow-400" : "border-red-500/50 text-red-600 dark:text-red-400"}`}>{s.rate}%</Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


// ─── COMPARISONS TAB ──────────────────────────────────────────────────────────
function ComparisonsTab() {
  const { sections, workers, machines, movements, orders } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const L = (en: string, ar: string) => isRTL ? ar : en;

  // ── Mode: "entity-vs-entity" (A vs B, single period) or "self-over-time" (one entity, two periods) ──
  const [mode, setMode] = useState<"entity-vs-entity" | "self-over-time">("entity-vs-entity");

  // Shared
  const [entityType, setEntityType] = useState<"departments" | "workers" | "machines" | "orders" | "factory">("departments");

  // A vs B mode
  const [dateFrom, setDateFrom]   = useState("2026-03-01");
  const [dateTo,   setDateTo]     = useState("2026-04-30");
  const [entityA,  setEntityA]    = useState("s4");
  const [entityB,  setEntityB]    = useState("s5");

  // Self over time mode
  const [selfEntity,   setSelfEntity]   = useState("s4");
  const [period1From,  setPeriod1From]  = useState("2026-01-01");
  const [period1To,    setPeriod1To]    = useState("2026-02-28");
  const [period2From,  setPeriod2From]  = useState("2026-03-01");
  const [period2To,    setPeriod2To]    = useState("2026-04-30");

  const entityOptions = React.useMemo(() => {
    if (entityType === "departments") return (sections as any[]).map(s => ({ id: s.id, label: s.name, code: s.code }));
    if (entityType === "workers")     return (workers  as any[]).map(w => ({ id: w.id, label: w.name, code: w.code }));
    if (entityType === "machines")    return (machines as any[]).map(m => ({ id: m.id, label: m.name, code: m.serialCode }));
    if (entityType === "orders")      return (orders   as any[]).map(o => ({ id: o.id, label: o.orderCode, code: o.itemName }));
    return [{ id: "factory", label: L("Whole Factory","المصنع بأكمله"), code: "ALL" }];
  }, [entityType, sections, workers, machines, orders]);

  React.useEffect(() => {
    if (entityType === "factory") {
      setEntityA("factory"); setEntityB("factory"); setSelfEntity("factory");
    } else if (entityOptions.length >= 2) {
      setEntityA(entityOptions[0].id); setEntityB(entityOptions[1].id); setSelfEntity(entityOptions[0].id);
    } else if (entityOptions.length === 1) {
      setEntityA(entityOptions[0].id); setSelfEntity(entityOptions[0].id);
    }
  }, [entityType]);

  // ── Metric computation ──────────────────────────────────────────────────────
  const computeMetrics = React.useCallback((id: string, from: number, to: number) => {
    let relMovs = (movements as any[]).filter((m: any) => {
      const ts = new Date(m.timestamp).getTime(); return ts >= from && ts <= to;
    });
    if (entityType === "departments") relMovs = relMovs.filter((m: any) => m.toSectionId === id || m.fromSectionId === id);
    else if (entityType === "workers") relMovs = relMovs.filter((m: any) => m.workerId === id);
    else if (entityType === "machines") {
      const wids = (workers as any[]).filter((w: any) => w.machineId === id).map((w: any) => w.id);
      relMovs = relMovs.filter((m: any) => wids.includes(m.workerId));
    } else if (entityType === "orders") {
      relMovs = relMovs.filter((m: any) => m.orderId === id);
    }
    // factory: all movements in range (no filter)
    const orderIds = [...new Set(relMovs.map((m: any) => m.orderId))];
    const relOrds  = entityType === "orders"
      ? (orders as any[]).filter((o: any) => o.id === id)
      : (orders as any[]).filter((o: any) => orderIds.includes(o.id));
    const lossG    = relMovs.reduce((a: number, m: any) => a + m.lossGrams, 0);
    const weightIn = relMovs.reduce((a: number, m: any) => a + m.weightBefore, 0);
    const lossPct  = weightIn > 0 ? (lossG / weightIn) * 100 : 0;
    const qty      = relOrds.reduce((a: number, o: any) => a + o.qty, 0);
    const hours    = relMovs.length * 4.5;
    const weeks: { week: string; lossG: number; qty: number }[] = [];
    for (let w = 0; w < 8; w++) {
      const wFrom = from + w * 7 * 86400000;
      const wTo   = wFrom + 7 * 86400000;
      if (wFrom > to) break;
      const wMovs = relMovs.filter((m: any) => { const ts = new Date(m.timestamp).getTime(); return ts >= wFrom && ts < wTo; });
      const wOids = [...new Set(wMovs.map((m: any) => m.orderId))];
      const wOrds = (orders as any[]).filter((o: any) => wOids.includes(o.id));
      weeks.push({ week: `W${w+1}`, lossG: parseFloat(wMovs.reduce((a: number, m: any) => a + m.lossGrams, 0).toFixed(2)), qty: wOrds.reduce((a: number, o: any) => a + o.qty, 0) });
    }
    return { orders: orderIds.length, moves: relMovs.length, lossG: parseFloat(lossG.toFixed(2)), lossPct: parseFloat(lossPct.toFixed(2)), qty, hours: parseFloat(hours.toFixed(1)), weeks };
  }, [entityType, movements, orders, workers]);

  // A vs B metrics
  const fromMs = new Date(dateFrom).getTime();
  const toMs   = new Date(dateTo).getTime() + 86400000;
  const mA = React.useMemo(() => entityA ? computeMetrics(entityA, fromMs, toMs) : null, [entityA, computeMetrics, fromMs, toMs]);
  const mB = React.useMemo(() => entityB ? computeMetrics(entityB, fromMs, toMs) : null, [entityB, computeMetrics, fromMs, toMs]);

  // Self over time metrics
  const p1From = new Date(period1From).getTime();
  const p1To   = new Date(period1To).getTime() + 86400000;
  const p2From = new Date(period2From).getTime();
  const p2To   = new Date(period2To).getTime() + 86400000;
  const mP1 = React.useMemo(() => selfEntity ? computeMetrics(selfEntity, p1From, p1To) : null, [selfEntity, computeMetrics, p1From, p1To]);
  const mP2 = React.useMemo(() => selfEntity ? computeMetrics(selfEntity, p2From, p2To) : null, [selfEntity, computeMetrics, p2From, p2To]);

  const nameA   = entityOptions.find(e => e.id === entityA)?.label   ?? "A";
  const nameB   = entityOptions.find(e => e.id === entityB)?.label   ?? "B";
  const nameSelf = entityOptions.find(e => e.id === selfEntity)?.label ?? L("Entity","الكيان");

  const colorA = "hsl(var(--chart-1))";
  const colorB = "hsl(var(--chart-2))";

  // Comparison data for current mode
  const leftMetrics  = mode === "entity-vs-entity" ? mA  : mP1;
  const rightMetrics = mode === "entity-vs-entity" ? mB  : mP2;
  const leftName     = mode === "entity-vs-entity" ? nameA   : `${nameSelf} — ${period1From} → ${period1To}`;
  const rightName    = mode === "entity-vs-entity" ? nameB   : `${nameSelf} — ${period2From} → ${period2To}`;
  const shortLeftName  = mode === "entity-vs-entity" ? nameA   : L("Period 1","الفترة 1");
  const shortRightName = mode === "entity-vs-entity" ? nameB   : L("Period 2","الفترة 2");

  const barCompare = [
    { metric: L("Orders","الطلبات"),  a: leftMetrics?.orders  ?? 0, b: rightMetrics?.orders  ?? 0 },
    { metric: L("Moves","الحركات"),   a: leftMetrics?.moves   ?? 0, b: rightMetrics?.moves   ?? 0 },
    { metric: L("Loss g","فقد g"),    a: leftMetrics?.lossG   ?? 0, b: rightMetrics?.lossG   ?? 0 },
    { metric: L("Qty pcs","الكمية"),  a: leftMetrics?.qty     ?? 0, b: rightMetrics?.qty     ?? 0 },
    { metric: L("Hours","الساعات"),   a: leftMetrics?.hours   ?? 0, b: rightMetrics?.hours   ?? 0 },
  ];

  const maxWks    = Math.max((leftMetrics?.weeks ?? []).length, (rightMetrics?.weeks ?? []).length, 1);
  const trendData = Array.from({ length: maxWks }, (_, i) => ({
    week: `W${i+1}`,
    [`${shortLeftName} Loss`]:  leftMetrics?.weeks[i]?.lossG  ?? 0,
    [`${shortRightName} Loss`]: rightMetrics?.weeks[i]?.lossG ?? 0,
    [`${shortLeftName} Qty`]:   leftMetrics?.weeks[i]?.qty    ?? 0,
    [`${shortRightName} Qty`]:  rightMetrics?.weeks[i]?.qty   ?? 0,
  }));

  return (
    <div className="space-y-6">

      {/* ── Mode Selector ───────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => setMode("entity-vs-entity")}
          className={[
            "rounded-xl border p-4 text-start transition-all hover:shadow-md",
            mode === "entity-vs-entity"
              ? "border-indigo-500/60 bg-indigo-500/10 ring-2 ring-indigo-500/30"
              : "border-border bg-card hover:border-indigo-500/30",
          ].join(" ")}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-2 rounded-lg ${mode === "entity-vs-entity" ? "bg-indigo-500/20 text-indigo-500" : "bg-muted text-muted-foreground"}`}>
              <GitCompare className="w-4 h-4" />
            </div>
            <span className={`font-semibold text-sm ${mode === "entity-vs-entity" ? "text-indigo-500" : ""}`}>{L("Entity A vs Entity B","الكيان أ مقابل الكيان ب")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{L("Compare two different entities (departments, workers, machines, orders, or the whole factory) side-by-side over the same time period.","قارن كيانين مختلفين — أقسام، عمال، آلات، طلبات، أو المصنع بأكمله — جنبًا إلى جنب خلال نفس الفترة.")}</p>
        </button>
        <button
          onClick={() => setMode("self-over-time")}
          className={[
            "rounded-xl border p-4 text-start transition-all hover:shadow-md",
            mode === "self-over-time"
              ? "border-violet-500/60 bg-violet-500/10 ring-2 ring-violet-500/30"
              : "border-border bg-card hover:border-violet-500/30",
          ].join(" ")}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-2 rounded-lg ${mode === "self-over-time" ? "bg-violet-500/20 text-violet-500" : "bg-muted text-muted-foreground"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <span className={`font-semibold text-sm ${mode === "self-over-time" ? "text-violet-500" : ""}`}>{L("Same Entity — Two Periods","نفس الكيان — فترتان")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{L("Compare one entity (a worker, department, order, or the factory) against itself across two different time periods to measure progress or decline.","قارن كيانًا واحدًا — عامل، قسم، طلب، أو المصنع — بنفسه عبر فترتين زمنيتين مختلفتين لقياس التطور أو التراجع.")}</p>
        </button>
      </div>

      {/* ── Configuration Card ──────────────────────────────────────────── */}
      <Card className={mode === "entity-vs-entity" ? "border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent" : "border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {mode === "entity-vs-entity"
              ? <><GitCompare className="w-5 h-5 text-indigo-500" />{L("Comparison Setup","إعداد المقارنة")}</>
              : <><Clock className="w-5 h-5 text-violet-500" />{L("Self-Comparison Setup","إعداد المقارنة الذاتية")}</>
            }
          </CardTitle>
          <CardDescription>
            {mode === "entity-vs-entity"
              ? L("Select a time period, entity type, and two entities to compare side-by-side.", "اختر فترة زمنية، نوع الكيان، وكيانين للمقارنة جنبًا إلى جنب.")
              : L("Select an entity and two different time periods to compare it against itself.", "اختر كيانًا وفترتين زمنيتين مختلفتين لمقارنته بنفسه.")
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Entity Type (shared) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("Compare By","مقارنة حسب")}</label>
            <div className="flex flex-wrap gap-2">
              {([
                { v: "departments", en: "Departments", ar: "الأقسام",     icon: Building2 },
                { v: "workers",     en: "Workers",     ar: "العمال",       icon: Users     },
                { v: "machines",    en: "Machines",    ar: "الآلات",       icon: Cpu       },
                { v: "orders",      en: "Orders",      ar: "الطلبات",      icon: ShoppingCart },
                { v: "factory",     en: "Factory",     ar: "المصنع",       icon: Factory   },
              ] as { v: string; en: string; ar: string; icon: React.ElementType }[]).map(({ v, en, ar, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setEntityType(v as any)}
                  className={[
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    entityType === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="w-3.5 h-3.5" />{isRTL ? ar : en}
                </button>
              ))}
            </div>
          </div>

          {mode === "entity-vs-entity" ? (
            /* A vs B layout */
            <div className="space-y-4">
              {/* Period */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("From Date","من تاريخ")}</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("To Date","إلى تاريخ")}</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("Period","الفترة")}</label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 text-xs font-mono text-muted-foreground gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{dateFrom} → {dateTo}</span>
                  </div>
                </div>
              </div>
              {/* Entities */}
              {entityType !== "factory" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: colorA }}>{L("Entity A","الكيان أ")}</label>
                    <Select value={entityA} onValueChange={setEntityA}>
                      <SelectTrigger className="h-9 bg-background"><SelectValue placeholder={L("Select A","اختر أ")} /></SelectTrigger>
                      <SelectContent>
                        {entityOptions.filter(e => e.id !== entityB).map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            <span className="flex items-center gap-2">{e.label}<span className="text-muted-foreground font-mono text-[10px]">{e.code}</span></span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: colorB }}>{L("Entity B","الكيان ب")}</label>
                    <Select value={entityB} onValueChange={setEntityB}>
                      <SelectTrigger className="h-9 bg-background"><SelectValue placeholder={L("Select B","اختر ب")} /></SelectTrigger>
                      <SelectContent>
                        {entityOptions.filter(e => e.id !== entityA).map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            <span className="flex items-center gap-2">{e.label}<span className="text-muted-foreground font-mono text-[10px]">{e.code}</span></span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {entityType === "factory" && (
                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Factory className="w-4 h-4 shrink-0" />
                  {L("Comparing the whole factory against another period — switch to 'Same Entity — Two Periods' mode for a factory self-comparison, or choose a different entity type for A vs B.",
                     "تقارن المصنع بأكمله — انتقل إلى وضع 'نفس الكيان — فترتان' لمقارنة المصنع بنفسه، أو اختر نوع كيان آخر.")}
                </div>
              )}
            </div>
          ) : (
            /* Self over time layout */
            <div className="space-y-4">
              {/* Entity selector */}
              {entityType !== "factory" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("Select Entity","اختر الكيان")}</label>
                  <Select value={selfEntity} onValueChange={setSelfEntity}>
                    <SelectTrigger className="h-9 bg-background max-w-xs"><SelectValue placeholder={L("Select…","اختر…")} /></SelectTrigger>
                    <SelectContent>
                      {entityOptions.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="flex items-center gap-2">{e.label}<span className="text-muted-foreground font-mono text-[10px]">{e.code}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {entityType === "factory" && (
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-3 text-sm flex items-center gap-2 text-violet-700 dark:text-violet-300">
                  <Factory className="w-4 h-4 shrink-0" />
                  {L("Comparing the whole factory across two different time periods.","مقارنة المصنع بأكمله عبر فترتين زمنيتين مختلفتين.")}
                </div>
              )}
              {/* Two periods */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3" style={{ borderColor: colorA + "50" }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: colorA }}>{L("Period 1 (Reference)","الفترة 1 (المرجعية)")}</p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-semibold">{L("From","من")}</label>
                      <input type="date" value={period1From} onChange={e => setPeriod1From(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-semibold">{L("To","إلى")}</label>
                      <input type="date" value={period1To} onChange={e => setPeriod1To(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="h-8 flex items-center px-2.5 rounded-md border bg-muted/30 text-xs font-mono text-muted-foreground gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />{period1From} → {period1To}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3" style={{ borderColor: colorB + "50" }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: colorB }}>{L("Period 2 (Comparison)","الفترة 2 (المقارنة)")}</p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-semibold">{L("From","من")}</label>
                      <input type="date" value={period2From} onChange={e => setPeriod2From(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-semibold">{L("To","إلى")}</label>
                      <input type="date" value={period2To} onChange={e => setPeriod2To(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="h-8 flex items-center px-2.5 rounded-md border bg-muted/30 text-xs font-mono text-muted-foreground gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />{period2From} → {period2To}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Metric Summary Cards ────────────────────────────────────────── */}
      {(leftMetrics && rightMetrics) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: L("Total Orders","إجمالي الطلبات"),  a: leftMetrics.orders,  b: rightMetrics.orders,  fmt: (v: number) => `${v}`,               better: "higher" as const },
            { label: L("Total Moves","إجمالي الحركات"),   a: leftMetrics.moves,   b: rightMetrics.moves,   fmt: (v: number) => `${v}`,               better: "higher" as const },
            { label: L("Gold Loss g","الفقد g"),          a: leftMetrics.lossG,   b: rightMetrics.lossG,   fmt: (v: number) => `${v.toFixed(2)}g`,   better: "lower"  as const },
            { label: L("Loss Rate","نسبة الفقد"),         a: leftMetrics.lossPct, b: rightMetrics.lossPct, fmt: (v: number) => `${v.toFixed(2)}%`,   better: "lower"  as const },
            { label: L("Qty Processed","الكمية"),         a: leftMetrics.qty,     b: rightMetrics.qty,     fmt: (v: number) => `${v} pcs`,           better: "higher" as const },
          ].map(({ label, a, b, fmt, better }) => {
            const aWins = better === "higher" ? a >= b : a <= b;
            const diff  = a - b;
            return (
              <div key={label} className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 rounded-lg p-2 text-center border" style={{ background: `${colorA}18`, borderColor: `${colorA}40` }}>
                    <p className="text-[9px] font-bold uppercase mb-0.5 truncate" style={{ color: colorA }}>{shortLeftName}</p>
                    <p className={`text-lg font-bold font-mono ${aWins ? "text-foreground" : "text-muted-foreground"}`}>{fmt(a)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                    <span>vs</span>
                    {diff !== 0 && <span className={`font-bold ${diff > 0 ? (better === "lower" ? "text-red-500" : "text-green-600") : (better === "lower" ? "text-green-600" : "text-red-500")}`}>{diff > 0 ? "+" : ""}{fmt(diff)}</span>}
                  </div>
                  <div className="flex-1 rounded-lg p-2 text-center border" style={{ background: `${colorB}18`, borderColor: `${colorB}40` }}>
                    <p className="text-[9px] font-bold uppercase mb-0.5 truncate" style={{ color: colorB }}>{shortRightName}</p>
                    <p className={`text-lg font-bold font-mono ${!aWins ? "text-foreground" : "text-muted-foreground"}`}>{fmt(b)}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Badge variant="outline" className="text-[9px] px-1.5" style={{ borderColor: aWins ? colorA : colorB, color: aWins ? colorA : colorB }}>
                    ★ {aWins ? shortLeftName : shortRightName}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Context label (self-over-time) ───────────────────────────────── */}
      {mode === "self-over-time" && entityType !== "factory" && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="text-violet-700 dark:text-violet-300 font-medium">
            {L(`Comparing "${nameSelf}" across two periods:`, `مقارنة "${nameSelf}" عبر فترتين:`)}
          </span>
          <span className="text-muted-foreground text-xs">
            <span style={{ color: colorA }} className="font-bold">{period1From} → {period1To}</span>
            {" "}{L("vs","مقابل")}{" "}
            <span style={{ color: colorB }} className="font-bold">{period2From} → {period2To}</span>
          </span>
        </div>
      )}

      {/* ── Side-by-Side Bar Chart ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{L("Side-by-Side Comparison","مقارنة المقاييس جنبًا إلى جنب")}</CardTitle>
          <CardDescription className="text-xs">
            <span style={{ color: colorA, fontWeight: 600 }}>{shortLeftName}</span>{" "}{L("vs","مقابل")}{" "}
            <span style={{ color: colorB, fontWeight: 600 }}>{shortRightName}</span>
            {mode === "entity-vs-entity" && <> — {dateFrom} {L("to","إلى")} {dateTo}</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="w-full h-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barCompare} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="a" name={shortLeftName}  fill={colorA} radius={[4,4,0,0]} barSize={28} />
                <Bar dataKey="b" name={shortRightName} fill={colorB} radius={[4,4,0,0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Weekly Trend Charts ─────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{L("Weekly Loss Trend","اتجاه الفقد الأسبوعي")}</CardTitle>
            <CardDescription className="text-xs">{L("Gold loss (g) per week","فقد الذهب أسبوعيًا (g)")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Line type="monotone" dataKey={`${shortLeftName} Loss`}  stroke={colorA} strokeWidth={2.5} dot={{ r: 4, fill: colorA }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey={`${shortRightName} Loss`} stroke={colorB} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: colorB }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{L("Weekly Qty Trend","اتجاه الكمية الأسبوعي")}</CardTitle>
            <CardDescription className="text-xs">{L("Pieces processed per week","القطع المعالجة أسبوعيًا")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Bar dataKey={`${shortLeftName} Qty`}  name={shortLeftName}  fill={colorA} radius={[3,3,0,0]} barSize={18} />
                  <Bar dataKey={`${shortRightName} Qty`} name={shortRightName} fill={colorB} radius={[3,3,0,0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Detailed Comparison Table ────────────────────────────────────── */}
      {(leftMetrics && rightMetrics) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{L("Detailed Metric Comparison","مقارنة المقاييس التفصيلية")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="ps-4 w-48 text-xs">{L("Metric","المقياس")}</TableHead>
                  <TableHead className="text-center text-xs font-bold" style={{ color: colorA }}>{shortLeftName}</TableHead>
                  <TableHead className="text-center text-xs font-bold" style={{ color: colorB }}>{shortRightName}</TableHead>
                  <TableHead className="text-center text-xs">{L("Δ Diff","الفرق")}</TableHead>
                  <TableHead className="pe-4 text-xs">{L("Better","الأفضل")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { label: L("Total Orders","إجمالي الطلبات"),           a: leftMetrics.orders,  b: rightMetrics.orders,  fmt: (v: number) => `${v}`,              better: "higher" as const },
                  { label: L("Total Movements","إجمالي الحركات"),        a: leftMetrics.moves,   b: rightMetrics.moves,   fmt: (v: number) => `${v}`,              better: "higher" as const },
                  { label: L("Gold Loss (g)","الفقد (g)"),              a: leftMetrics.lossG,   b: rightMetrics.lossG,   fmt: (v: number) => `${v.toFixed(2)}g`, better: "lower"  as const },
                  { label: L("Loss Rate (%)","نسبة الفقد (%)"),         a: leftMetrics.lossPct, b: rightMetrics.lossPct, fmt: (v: number) => `${v.toFixed(2)}%`, better: "lower"  as const },
                  { label: L("Qty Processed (pcs)","الكمية المعالجة"),  a: leftMetrics.qty,     b: rightMetrics.qty,     fmt: (v: number) => `${v} pcs`,         better: "higher" as const },
                  { label: L("Hours Worked","ساعات العمل"),              a: leftMetrics.hours,   b: rightMetrics.hours,   fmt: (v: number) => `${v.toFixed(1)}h`, better: "lower"  as const },
                ].map(({ label, a, b, fmt, better }) => {
                  const aWins = better === "higher" ? a >= b : a <= b;
                  const diff  = a - b;
                  return (
                    <TableRow key={label}>
                      <TableCell className="ps-4 text-xs font-medium">{label}</TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold" style={{ color: aWins ? colorA : undefined }}>{fmt(a)}</TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold" style={{ color: !aWins ? colorB : undefined }}>{fmt(b)}</TableCell>
                      <TableCell className={`text-center font-mono text-xs ${diff === 0 ? "text-muted-foreground" : diff > 0 ? (better === "lower" ? "text-red-500" : "text-green-600") : (better === "lower" ? "text-green-600" : "text-red-500")}`}>
                        {diff > 0 ? "+" : ""}{fmt(diff)}
                      </TableCell>
                      <TableCell className="pe-4">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: aWins ? colorA : colorB, color: aWins ? colorA : colorB }}>
                          ★ {aWins ? shortLeftName : shortRightName}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ─── MAIN ANALYTICS PAGE ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { unreadAlertsCount } = useMockState();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState(() => analyticsNav.currentTab());
  const tabsRef = useRef<HTMLDivElement>(null);

  // Sync with sidebar tab changes
  useEffect(() => {
    return analyticsNav.subscribe(tab => {
      setActiveTab(tab);
      requestAnimationFrame(() =>
        tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    });
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    analyticsNav.emit(tab); // keep sidebar in sync
  };

  const TABS = [
    { value: "overview",    labelEn: "Overview",      labelAr: "نظرة عامة",    icon: BarChart3,      desc: "Full factory statistics & worker performance" },
    { value: "orders",      labelEn: "Orders",        labelAr: "الطلبات",      icon: ShoppingCart,   desc: "Search, filter & manage all customer orders" },
    { value: "departments", labelEn: "Departments",   labelAr: "الأقسام",      icon: Building2,      desc: "Efficiency and workload by department" },
    { value: "workers",     labelEn: "Workers",       labelAr: "العمال",       icon: Users,          desc: "Worker performance ranked by loss rate" },
    { value: "movements",   labelEn: "Movements",     labelAr: "الحركات",      icon: ArrowRightLeft, desc: "Track material flow between sections" },
    { value: "alerts",      labelEn: "Alerts",        labelAr: "التنبيهات",    icon: BellRing,       desc: "Production alerts and notifications" },
    { value: "dust",        labelEn: "Dust",          labelAr: "الغبار",       icon: Wind,           desc: "Dust collection and recovery analysis" },
    { value: "comparisons", labelEn: "Comparisons",   labelAr: "المقارنات",    icon: GitCompare,     desc: "Period-over-period & self-comparison analytics" },
  ];

  const accentColors: Record<string, string> = {
    overview:    "from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60",
    orders:      "from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/60",
    departments: "from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60",
    workers:     "from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/60",
    movements:   "from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-500/60",
    alerts:      "from-destructive/20 to-destructive/5 border-destructive/30 hover:border-destructive/60",
    dust:        "from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-500/60",
    comparisons: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/60",
  };
  const iconColors: Record<string, string> = {
    overview:    "text-primary bg-primary/10",
    orders:      "text-blue-500 bg-blue-500/10",
    departments: "text-purple-500 bg-purple-500/10",
    workers:     "text-green-500 bg-green-500/10",
    movements:   "text-orange-500 bg-orange-500/10",
    alerts:      "text-destructive bg-destructive/10",
    dust:        "text-amber-500 bg-amber-500/10",
    comparisons: "text-indigo-500 bg-indigo-500/10",
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("analytics.title")}
        </h1>

      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div ref={tabsRef}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="border-b border-border overflow-x-auto">
            <TabsList className="h-auto bg-transparent p-0 gap-0 min-w-max rounded-none">
              {TABS.map(tab => {
                const Icon  = tab.icon;
                const label = isRTL ? tab.labelAr : tab.labelEn;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={[
                      "relative flex items-center gap-1.5 px-4 py-3 rounded-none border-b-2 transition-colors",
                      "text-sm font-medium whitespace-nowrap",
                      "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground",
                      "hover:text-foreground hover:bg-muted/40 focus-visible:ring-0 focus-visible:ring-offset-0",
                    ].join(" ")}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                    {tab.value === "alerts" && unreadAlertsCount > 0 && (
                      <Badge className="ms-0.5 h-4 min-w-[1rem] px-1 text-[10px] bg-destructive text-destructive-foreground flex items-center justify-center">
                        {unreadAlertsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="pt-6">
            <TabsContent value="overview"    className="mt-0 focus-visible:outline-none"><OverviewTab /></TabsContent>
            <TabsContent value="orders"      className="mt-0 focus-visible:outline-none"><OrdersTabContent /></TabsContent>
            <TabsContent value="departments" className="mt-0 focus-visible:outline-none"><DepartmentsTab /></TabsContent>
            <TabsContent value="workers"     className="mt-0 focus-visible:outline-none"><WorkersTab /></TabsContent>
            <TabsContent value="movements"   className="mt-0 focus-visible:outline-none"><MovementsPage /></TabsContent>
            <TabsContent value="alerts"      className="mt-0 focus-visible:outline-none"><AlertsPage /></TabsContent>
            <TabsContent value="dust"        className="mt-0 focus-visible:outline-none"><DustTab /></TabsContent>
            <TabsContent value="comparisons" className="mt-0 focus-visible:outline-none"><ComparisonsTab /></TabsContent>
          </div>
        </Tabs>
      </div>

      {/* ══ SUB-SECTION NAVIGATION CARDS ════════════════════════════════════ */}
      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-4">Quick Navigation</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TABS.map(tab => {
            const Icon     = tab.icon;
            const label    = isRTL ? tab.labelAr : tab.labelEn;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={[
                  "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-start transition-all",
                  "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                  accentColors[tab.value],
                  isActive ? "ring-2 ring-primary/50 shadow-md" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${iconColors[tab.value]}`}><Icon className="w-4 h-4" /></div>
                  {tab.value === "alerts" && unreadAlertsCount > 0 && (
                    <Badge className="text-[10px] h-4 px-1 bg-destructive text-destructive-foreground">{unreadAlertsCount}</Badge>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{tab.desc}</p>
                <ChevronRight className="absolute bottom-3 end-3 w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
