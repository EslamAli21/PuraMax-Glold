// ============================================================
// صفحة التحليلات — 9 تبويبات + ربط الشريط الجانبي + تحسين تبويب الطلبات
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

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, trend }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; accent?: string; trend?: "up" | "down" | "neutral";
}) {
  const accentMap: Record<string, string> = {
    gold:    "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    red:     "from-red-500/20 to-red-500/5 border-red-500/30",
    green:   "from-green-500/20 to-green-500/5 border-green-500/30",
    blue:    "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    purple:  "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    orange:  "from-orange-500/20 to-orange-500/5 border-orange-500/30",
    default: "from-muted/50 to-muted/10 border-border",
  };
  const iconMap: Record<string, string> = {
    gold: "text-yellow-500", red: "text-red-500", green: "text-green-500",
    blue: "text-blue-500",   purple: "text-purple-500", orange: "text-orange-500",
    default: "text-muted-foreground",
  };
  const a = accent || "default";
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${accentMap[a]} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg bg-background/60 ${iconMap[a]}`}><Icon className="w-5 h-5" /></div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
            : trend === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
            : "bg-muted text-muted-foreground"}`}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── OrderMetricCard ──────────────────────────────────────────────────────────
function OrderMetricCard({ icon: Icon, label, value, delta, deltaUp, accent }: {
  icon: React.ElementType; label: string; value: number;
  delta: number; deltaUp: boolean; accent: string;
}) {
  const gradMap: Record<string, string> = {
    blue:   "from-blue-500/15 to-blue-500/5 border-blue-500/25",
    red:    "from-red-500/15 to-red-500/5 border-red-500/25",
    orange: "from-orange-500/15 to-orange-500/5 border-orange-500/25",
    green:  "from-green-500/15 to-green-500/5 border-green-500/25",
  };
  const iconMap: Record<string, string> = {
    blue:   "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    red:    "bg-red-500/10 text-red-600 dark:text-red-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    green:  "bg-green-500/10 text-green-600 dark:text-green-400",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${gradMap[accent] || "from-muted/50 to-muted/10 border-border"} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${iconMap[accent] || "bg-muted text-muted-foreground"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${
          deltaUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          {deltaUp ? "▲" : "▼"} {delta}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">vs last 7 days</p>
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

// ─── ORDERS TAB CONTENT ───────────────────────────────────────────────────────
// ─── Mini QR visual ──────────────────────────────────────────────────────────
function MiniQR({ value, onClick }: { value: string; onClick?: () => void }) {
  const hash = value.split("").reduce((acc, c) => (Math.imul(acc, 31) + c.charCodeAt(0)) >>> 0, 0);
  const cells = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7), col = i % 7;
    if (row < 2 && (col < 2 || col > 4)) return true;
    if (row === 2 && (col === 0 || col === 6)) return true;
    return ((hash >>> (i % 32)) & 1) === 1;
  });
  return (
    <button
      onClick={onClick}
      title={`QR: ${value}`}
      className="group relative inline-flex p-0.5 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 hover:scale-[2.2] hover:shadow-2xl hover:z-50 transition-all duration-200 cursor-pointer"
    >
      <div className="grid grid-cols-7 gap-[1.5px] w-8 h-8">
        {cells.map((dark, i) => (
          <div key={i} className={`rounded-[0.5px] ${dark ? "bg-gray-900 dark:bg-white" : "bg-transparent"}`} />
        ))}
      </div>
    </button>
  );
}

// helpers
function fmtDT(ds: string) {
  try {
    const d = new Date(ds);
    return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
      time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch { return { date: ds, time: "" }; }
}
function fmtDur(minutes: number) {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}
function timeAgo(ds: string) {
  try {
    const diff = (Date.now() - new Date(ds).getTime()) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch { return "—"; }
}
const STATUS_PROGRESS: Record<string, number> = {
  pending: 10, approved: 25, "in-production": 60, "on-hold": 40, completed: 100, cancelled: 0,
};

function OrdersTabContent() {
  const { orders, customers, models, sections, workers, machines, stamps, movements } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [searchQ, setSearchQ]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo,   setDateTo]   = useState("2026-07-31");
  const [qrPopup, setQrPopup]           = useState<{ code: string; orderCode: string } | null>(null);
  const [modelImgPopup, setModelImgPopup] = useState<{ src: string; name: string } | null>(null);
  const [partImgPopup,  setPartImgPopup]  = useState<{ src: string; name: string } | null>(null);
  const [expandedOrderId, setExpandedOrderId]   = useState<string | null>(null);
  const [expandedModelKey, setExpandedModelKey] = useState<string | null>(null);

  const now = new Date();

  // Summary stats
  const inProduction  = orders.filter(o => o.status === "in-production").length;
  const delayed       = orders.filter(o =>
    (o.status === "in-production" || o.status === "on-hold") && new Date(o.deliveryDate) < now
  ).length;
  const onHold        = orders.filter(o => o.status === "on-hold").length;
  const nearCompletion = orders.filter(o => {
    if (o.status !== "in-production") return false;
    const diff = (new Date(o.deliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  // Filtered order list
  const filteredOrders = orders.filter(o => {
    const oDate = new Date(o.createdAt).getTime();
    const from  = new Date(dateFrom).getTime();
    const to    = new Date(dateTo).getTime() + 86400000;
    if (oDate < from || oDate > to) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    // Apply section filter: check if the order's last movement went to this section
    if (sectionFilter !== "all") {
      const orderMovs = movements
        .filter(m => m.orderId === o.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

  return (
    <div className="space-y-5">

      {/* ── Search + Filter Row ────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by order code, QR, tree code, box code, worker, machine, client, or model..."
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

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date range picker */}
          <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 h-9 text-muted-foreground hover:border-ring transition-colors">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <input
              type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setExpandedOrderId(null); setExpandedModelKey(null); }}
              className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer"
            />
            <span className="text-muted-foreground/60 text-xs mx-0.5">–</span>
            <input
              type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setExpandedOrderId(null); setExpandedModelKey(null); }}
              className="bg-transparent text-xs font-mono border-none outline-none text-foreground w-[120px] cursor-pointer"
            />
          </div>

          {/* Batch */}
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] bg-background h-9 text-sm">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="b1">Batch 1</SelectItem>
              <SelectItem value="b2">Batch 2</SelectItem>
              <SelectItem value="b3">Batch 3</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-background h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in-production">In Production</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Section */}
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[150px] bg-background h-9 text-sm">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Routes */}
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] bg-background h-9 text-sm">
              <SelectValue placeholder="All Routes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {(searchQ || statusFilter !== "all" || sectionFilter !== "all") && (
            <Button variant="ghost" size="sm" className="text-xs h-9"
              onClick={() => { setSearchQ(""); setStatusFilter("all"); setSectionFilter("all"); }}>
              <X className="w-3.5 h-3.5 me-1" /> Clear
            </Button>
          )}

          <span className="ms-auto text-xs text-muted-foreground">{filteredOrders.length} of {orders.length} orders</span>
        </div>
      </div>

      {/* ── Summary Metric Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OrderMetricCard icon={Package}    label="Orders In Production"   value={inProduction}   delta={12} deltaUp={true}  accent="blue"   />
        <OrderMetricCard icon={AlertTriangle} label="Delayed Orders"     value={delayed}        delta={3}  deltaUp={false} accent="red"    />
        <OrderMetricCard icon={Clock}      label="On Hold Orders"         value={onHold}         delta={1}  deltaUp={true}  accent="orange" />
        <OrderMetricCard icon={TrendingUp} label="Orders Near Completion" value={nearCompletion} delta={5}  deltaUp={true}  accent="green"  />
      </div>

      {/* ── ORDER IN GENERAL TABLE ────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        {/* Table title header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600 dark:bg-blue-700">
          <span className="text-white font-bold text-sm tracking-wide uppercase">Order in General</span>
          <div className="flex items-center gap-2">
            {(searchQ || statusFilter !== "all") && (
              <Badge className="text-[10px] bg-white/20 text-white border-white/30">Filtered: {filteredOrders.length}</Badge>
            )}
            <span className="text-blue-100 text-xs">Active Orders ({filteredOrders.length})</span>
          </div>
        </div>

        {/* Horizontally scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[1800px]">
            <thead>
              <tr className="bg-blue-600 dark:bg-blue-800 border-b border-blue-700 dark:border-blue-700">
                {(isRTL ? [
                  "التاريخ\nوالوقت",
                  "رمز الطلب",
                  "رمز\nالعميل",
                  "الموديلات",
                  "الكمية",
                  "التقدم",
                  "نسبة فقد\nالذهب",
                  "وزن فقد\nالذهب",
                  "24K ذهب\nخالص %",
                  "وقت\nالعمل",
                  "وقت\nالانتظار",
                  "آخر\nحركة",
                  "المرحلة\nالحالية",
                  "الوزن النهائي\nللذهب",
                  "الوزن النهائي\nللمادة",
                  "الوزن\nالإجمالي",
                  "رمز QR\nالحركة",
                ] : [
                  "Order Date\n& Time",
                  "Order Code",
                  "Customer\nCode",
                  "Models",
                  "Qty",
                  "Progress",
                  "Gross Gold\nLoss %",
                  "Gross Gold\nLoss Weight",
                  "24K Pure\nGold %",
                  "Working\nTime",
                  "Waiting\nTime",
                  "Last\nMovement",
                  "Current\nStages",
                  "Final Gold\nWeight",
                  "Final Material\nWeight",
                  "Final Total\nWeight",
                  "Movement\nQR",
                ]).map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2.5 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line border-e border-blue-500/40 dark:border-blue-700/60 last:border-e-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-muted-foreground">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No orders match your search</p>
                    <p className="text-[10px] mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, rowIdx) => {
                  const customer    = customers.find(c => c.id === order.clientId);
                  const stamp       = stamps.find(s => s.id === order.stampId);
                  const orderMovs   = movements.filter(m => m.orderId === order.id)
                                       .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  const lastMov     = orderMovs[0];
                  const totalLossG  = orderMovs.reduce((a, m) => a + m.lossGrams, 0);
                  const totalLossPct = orderMovs.length
                    ? orderMovs.reduce((a, m) => a + m.lossPercent, 0) / orderMovs.length
                    : 0;
                  const finalGoldW  = lastMov ? lastMov.weightAfter : order.totalWeightGrams;
                  const pureGoldPct = stamp ? stamp.goldPercent : 75;
                  const pureGoldG   = (finalGoldW * pureGoldPct) / 100;
                  const pureGold24k = stamp ? (pureGoldPct / 100 * 24) : 18;
                  const materialW   = Math.max(0, order.totalWeightGrams - finalGoldW);
                  const totalFinalW = finalGoldW + materialW;
                  const workMins    = orderMovs.length * 150; // ~2.5h per movement
                  const createdMs   = new Date(order.createdAt).getTime();
                  const nowMs       = Date.now();
                  const totalMins   = Math.max(0, Math.floor((nowMs - createdMs) / 60000));
                  const waitMins    = Math.max(0, totalMins - workMins);
                  const progress    = STATUS_PROGRESS[order.status] ?? 10;
                  const isDelayed   = new Date(order.deliveryDate) < now && order.status !== "completed" && order.status !== "cancelled";
                  const createdFmt  = fmtDT(order.createdAt);
                  const lastMovFmt  = lastMov ? timeAgo(lastMov.timestamp) : "—";
                  const currentSection = lastMov
                    ? sections.find(s => s.id === lastMov.toSectionId)?.name ?? "—"
                    : "—";
                  const qrCode = lastMov?.qrCode ?? order.orderCode;
                  const isEven = rowIdx % 2 === 0;

                  const isOrderExpanded = expandedOrderId === order.id;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => { setExpandedOrderId(isOrderExpanded ? null : order.id); setExpandedModelKey(null); }}
                      className={`border-b last:border-b-0 border-blue-100 dark:border-blue-900/50 transition-colors cursor-pointer ${isOrderExpanded ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-400/30" : isEven ? "bg-white dark:bg-card hover:bg-blue-50/60 dark:hover:bg-blue-900/15" : "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/25"}`}
                    >
                      {/* 1. Order Date & Time */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[110px]">
                        <span className="block font-medium">{createdFmt.date}</span>
                        <span className="block text-muted-foreground text-[10px]">{createdFmt.time}</span>
                      </td>

                      {/* 2. Order Code */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[100px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <ChevronRight className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isOrderExpanded ? "rotate-90 text-blue-500 dark:text-blue-400" : "text-muted-foreground/30"}`} />
                            <span className="font-bold font-mono text-primary">{order.orderCode}</span>
                          </div>
                          {isDelayed && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 w-fit">Overdue</Badge>
                          )}
                          {order.isNewModel && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 w-fit border-purple-400 text-purple-600 dark:text-purple-400">New</Badge>
                          )}
                        </div>
                      </td>

                      {/* 3. Customer Code */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[100px]">
                        <span className="font-mono font-semibold">{customer?.code ?? "—"}</span>
                        <span className="block text-muted-foreground text-[10px] truncate max-w-[90px]">{customer?.name ?? ""}</span>
                      </td>

                      {/* 4. Models */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[60px] text-center">
                        <span className="font-bold">{order.modelId ? 1 : 0}</span>
                      </td>

                      {/* 5. Qty */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[60px] text-center">
                        <span className="font-bold text-base">{order.qty}</span>
                        <span className="block text-muted-foreground text-[10px]">pcs</span>
                      </td>

                      {/* 6. Progress */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[140px]">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getStatusBadgeClass(order.status)}`}>
                            {order.status.replace(/-/g, " ")}
                          </Badge>
                          <span className={`text-[10px] font-bold ${progress === 100 ? "text-emerald-600" : progress < 30 ? "text-amber-600" : "text-blue-600"}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : order.status === "in-production" ? "bg-blue-500" : order.status === "on-hold" ? "bg-orange-500" : "bg-muted-foreground/40"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {order.status === "completed" && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {fmtDT(order.deliveryDate).date}
                          </span>
                        )}
                      </td>

                      {/* 7. Gross Gold Loss % */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className={`font-bold text-sm ${totalLossPct > 3 ? "text-red-600 dark:text-red-400" : totalLossPct > 1.5 ? "text-amber-600" : "text-green-600 dark:text-green-400"}`}>
                          {totalLossPct > 0 ? totalLossPct.toFixed(2) + "%" : "—"}
                        </span>
                      </td>

                      {/* 8. Gross Gold Loss Weight */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className={`font-bold text-sm ${totalLossG > 5 ? "text-red-600 dark:text-red-400" : totalLossG > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {totalLossG > 0 ? totalLossG.toFixed(2) + "g" : "—"}
                        </span>
                      </td>

                      {/* 9. 24k Pure Gold % */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {pureGold24k.toFixed(1)}K
                        </span>
                        <span className="block text-muted-foreground text-[10px]">{pureGoldPct}% pure</span>
                      </td>

                      {/* 10. Working Time */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className="font-semibold">{fmtDur(workMins)}</span>
                        <span className="block text-muted-foreground text-[10px]">{orderMovs.length} ops</span>
                      </td>

                      {/* 11. Waiting Time */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className={`font-semibold ${waitMins > 2880 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                          {fmtDur(waitMins)}
                        </span>
                      </td>

                      {/* 12. Last Movement */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[100px]">
                        {lastMov ? (
                          <>
                            <span className="font-semibold text-[10px]">{lastMovFmt}</span>
                            <span className="block text-muted-foreground text-[9px] truncate max-w-[90px]">
                              {lastMov.operationType?.replace(/-/g, " ")}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">No moves yet</span>
                        )}
                      </td>

                      {/* 13. Current Stages */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[110px]">
                        {currentSection !== "—" ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary w-fit">
                              {currentSection}
                            </span>
                            {lastMov && sections.find(s => s.id === lastMov.fromSectionId) && (
                              <span className="text-[9px] text-muted-foreground">
                                from {sections.find(s => s.id === lastMov.fromSectionId)?.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* 14. Final Gold Weight */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className="font-bold text-amber-700 dark:text-amber-400">{finalGoldW.toFixed(1)}g</span>
                        <span className="block text-muted-foreground text-[10px]">{stamp?.name ?? "—"}</span>
                      </td>

                      {/* 15. Final Material Weight */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[90px] text-center">
                        <span className="font-semibold">{materialW > 0 ? materialW.toFixed(1) + "g" : "—"}</span>
                      </td>

                      {/* 16. Final Total Weight */}
                      <td className="px-3 py-2.5 border-e border-border/50 min-w-[80px] text-center">
                        <span className="font-bold">{totalFinalW.toFixed(1)}g</span>
                      </td>

                      {/* 17. Movement QR */}
                      <td className="px-3 py-2.5 min-w-[80px] text-center">
                        <div className="flex flex-col items-center gap-1">
                          <MiniQR
                            value={qrCode}
                            onClick={() => setQrPopup({ code: qrCode, orderCode: order.orderCode })}
                          />
                          <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[70px]">{qrCode}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      {/* Orders table footer */}
      <div className="px-4 py-2 border-t bg-muted/20 flex items-center text-xs text-muted-foreground gap-2">
        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
        {expandedOrderId
          ? <span>Showing models for <span className="font-semibold text-foreground">{filteredOrders.find(o => o.id === expandedOrderId)?.orderCode}</span> — click again to collapse</span>
          : <span>Click any order row to drill down into its models, parts, and road map</span>
        }
      </div>
      </div>

      {/* ── MODELS TABLE (shown when order is expanded) ───────────────────── */}
      {expandedOrderId && (() => {
        // Show model only for the selected order
        const modelRows = filteredOrders
          .filter(o => o.id === expandedOrderId && o.modelId)
          .map((order, modelIdx) => {
            const model      = models.find(m => m.id === order.modelId);
            const stamp      = stamps.find(s => s.id === order.stampId);
            const orderMovs  = movements
              .filter(m => m.orderId === order.id)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const lastMov    = orderMovs[0];
            const totalLossG = orderMovs.reduce((a, m) => a + m.lossGrams, 0);
            const totalLossPct = orderMovs.length
              ? orderMovs.reduce((a, m) => a + m.lossPercent, 0) / orderMovs.length : 0;
            const finalGoldW   = lastMov ? lastMov.weightAfter : order.totalWeightGrams;
            const pureGoldPct  = stamp ? stamp.goldPercent : 75;
            const materialW    = Math.max(0, order.totalWeightGrams - finalGoldW);
            const totalFinalW  = finalGoldW + materialW;
            const progress     = STATUS_PROGRESS[order.status] ?? 10;
            const currentSection = lastMov
              ? sections.find(s => s.id === lastMov.toSectionId)?.name ?? "—" : "—";
            const lastWorker = lastMov
              ? workers.find(w => w.id === lastMov.workerId)?.name ?? "—" : "—";
            const lastMachine = lastMov
              ? machines.find(m => m.id === workers.find(w => w.id === lastMov.workerId)?.machineId)?.name ?? "" : "";
            const qrCode = lastMov?.qrCode ?? order.orderCode;
            const isEven = modelIdx % 2 === 0;
            return { order, model, stamp, lastMov, totalLossG, totalLossPct, finalGoldW, pureGoldPct, materialW, totalFinalW, progress, currentSection, lastWorker, lastMachine, qrCode, isEven, modelIdx };
          });

        if (modelRows.length === 0) return null;

        const colsEn = [
          "Model\nNO", "Model\nPic", "Model Code\n/ Name", "Stamp /\nKarat",
          "Size", "Color", "Model\nQty", "Parts",
          "Current\nStage", "Current Machine\n/ Worker",
          "Gross Gold\nLoss %", "Gross Gold\nLoss Weight", "24K Pure\nGold Loss",
          "Last\nMovement", "Progress",
          "Final Gold\nWeight", "Final Material\nWeight", "Final Total\nWeight",
          "Movement\nQR",
        ];
        const colsAr = [
          "رقم\nالموديل", "صورة\nالموديل", "كود / اسم\nالموديل", "الطابع /\nالعيار",
          "المقاس", "اللون", "كمية\nالموديل", "الأجزاء",
          "المرحلة\nالحالية", "الماكينة /\nالعامل الحالي",
          "نسبة فقد\nالذهب", "وزن فقد\nالذهب", "فقد الذهب\nالخالص 24K",
          "آخر\nحركة", "التقدم",
          "الوزن النهائي\nللذهب", "الوزن النهائي\nللمادة", "الوزن\nالإجمالي",
          "رمز QR\nالحركة",
        ];
        const cols = isRTL ? colsAr : colsEn;

        return (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-xs border-b border-border/50">
              <button onClick={() => { setExpandedOrderId(null); setExpandedModelKey(null); }} className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Package className="w-3 h-3" />
                <span>{isRTL ? "الطلبات" : "Orders"}</span>
              </button>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <span className="font-semibold text-foreground">{filteredOrders.find(o => o.id === expandedOrderId)?.orderCode}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-muted-foreground">{isRTL ? "الموديلات" : "Models"}</span>
            </div>
            {/* Table title */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-600 dark:bg-emerald-800">
              <span className="text-white font-bold text-sm tracking-wide uppercase">
                {isRTL ? "الموديلات" : "Models"}
              </span>
              <span className="text-emerald-100 text-xs">
                {modelRows.length > 0 ? (isRTL ? `${modelRows.length} موديل — انقر للاطلاع على الأجزاء` : `${modelRows.length} model — click to view parts`) : (isRTL ? "لا يوجد موديل" : "No model")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[2200px]">
                <thead>
                  <tr className="bg-emerald-600 dark:bg-emerald-800 border-b border-emerald-700 dark:border-emerald-700">
                    {cols.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2.5 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line border-e border-emerald-500/40 dark:border-emerald-700/60 last:border-e-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelRows.map(({ order, model, stamp, lastMov, totalLossG, totalLossPct, finalGoldW, pureGoldPct, materialW, totalFinalW, progress, currentSection, lastWorker, lastMachine, qrCode, isEven, modelIdx }) => (
                    <tr
                      key={`${order.id}-model`}
                      onClick={() => { const k = `${order.id}-${order.modelId}`; setExpandedModelKey(expandedModelKey === k ? null : k); }}
                      className={`border-b last:border-b-0 border-emerald-100 dark:border-emerald-900/50 transition-colors cursor-pointer ${expandedModelKey === `${order.id}-${order.modelId}` ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-400/30" : isEven ? "bg-white dark:bg-card hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20" : "bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20"}`}
                    >
                      {/* 1. Model NO */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[60px] text-center">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{modelIdx + 1}</span>
                      </td>

                      {/* 2. Model Pic */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[70px] text-center">
                        {model?.image ? (
                          <button
                            onClick={() => setModelImgPopup({ src: model.image!, name: model.name })}
                            className="group relative inline-block"
                            title={isRTL ? "انقر للتكبير" : "Click to enlarge"}
                          >
                            <img
                              src={model.image}
                              alt={model?.name}
                              className="w-10 h-10 object-cover rounded-lg border border-border group-hover:ring-2 group-hover:ring-emerald-500 transition-all cursor-zoom-in"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* 3. Model Code / Name */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[140px]">
                        <div className="flex items-center gap-1">
                          <ChevronRight className={`w-3 h-3 shrink-0 transition-transform duration-200 ${expandedModelKey === `${order.id}-${order.modelId}` ? "rotate-90 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30"}`} />
                          <span className="font-bold font-mono text-primary text-[11px]">{model?.code ?? "—"}</span>
                        </div>
                        <span className="block text-muted-foreground text-[10px] truncate max-w-[130px] ps-4">{model?.name ?? (isRTL ? "موديل مخصص" : "Custom")}</span>
                      </td>

                      {/* 4. Stamp / Karat */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                        <span className="font-bold text-amber-700 dark:text-amber-400">{stamp?.karat ?? "—"}K</span>
                        <span className="block text-muted-foreground text-[10px]">{stamp?.purity ?? ""}</span>
                      </td>

                      {/* 5. Size */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px]">
                        <span className="text-[10px] font-mono">{order.sizes || "—"}</span>
                      </td>

                      {/* 6. Color */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px]">
                        {model?.colour ? (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              model.colour.toLowerCase() === "yellow" ? "bg-yellow-400" :
                              model.colour.toLowerCase() === "white"  ? "bg-gray-200 border border-gray-300" :
                              model.colour.toLowerCase() === "rose"   ? "bg-rose-400" :
                              "bg-muted-foreground/40"
                            }`} />
                            <span className="text-[10px]">{model.colour}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* 7. Model Qty */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[70px] text-center">
                        <span className="font-bold text-base">{order.qty}</span>
                        <span className="block text-muted-foreground text-[10px]">{isRTL ? "قطعة" : "pcs"}</span>
                      </td>

                      {/* 8. Parts */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[60px] text-center">
                        <span className="font-bold">{model?.parts?.length ?? 0}</span>
                      </td>

                      {/* 9. Current Stage */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[110px]">
                        {currentSection !== "—" ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 w-fit block">
                            {currentSection}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* 10. Current Machine / Worker */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[140px]">
                        {lastMov ? (
                          <>
                            <span className="block font-medium text-[10px]">{lastWorker}</span>
                            {lastMachine && (
                              <span className="block text-muted-foreground text-[9px]">{lastMachine}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* 11. Gross Gold Loss % */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                        <span className={`font-bold text-sm ${totalLossPct > 3 ? "text-red-600 dark:text-red-400" : totalLossPct > 1.5 ? "text-amber-600" : totalLossPct > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {totalLossPct > 0 ? totalLossPct.toFixed(2) + "%" : "—"}
                        </span>
                      </td>

                      {/* 12. Gross Gold Loss Weight */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                        <span className={`font-bold text-sm ${totalLossG > 5 ? "text-red-600 dark:text-red-400" : totalLossG > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {totalLossG > 0 ? totalLossG.toFixed(2) + "g" : "—"}
                        </span>
                      </td>

                      {/* 13. 24K Pure Gold Loss */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {totalLossG > 0 ? ((totalLossG * pureGoldPct) / 100).toFixed(2) + "g" : "—"}
                        </span>
                        <span className="block text-muted-foreground text-[10px]">{pureGoldPct}% {isRTL ? "نقاء" : "pure"}</span>
                      </td>

                      {/* 14. Last Movement */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[100px]">
                        {lastMov ? (
                          <>
                            <span className="font-semibold text-[10px]">{timeAgo(lastMov.timestamp)}</span>
                            <span className="block text-muted-foreground text-[9px] truncate max-w-[90px]">
                              {lastMov.operationType?.replace(/-/g, " ")}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* 15. Progress */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[140px]">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getStatusBadgeClass(order.status)}`}>
                            {order.status.replace(/-/g, " ")}
                          </Badge>
                          <span className={`text-[10px] font-bold ${progress === 100 ? "text-emerald-600" : progress < 30 ? "text-amber-600" : "text-blue-600"}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : order.status === "in-production" ? "bg-blue-500" : order.status === "on-hold" ? "bg-orange-500" : "bg-muted-foreground/40"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>

                      {/* 16. Final Gold Weight */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                        <span className="font-bold text-amber-700 dark:text-amber-400">{finalGoldW.toFixed(1)}g</span>
                        <span className="block text-muted-foreground text-[10px]">{stamp?.name ?? "—"}</span>
                      </td>

                      {/* 17. Final Material Weight */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                        <span className="font-semibold">{materialW > 0 ? materialW.toFixed(1) + "g" : "—"}</span>
                      </td>

                      {/* 18. Final Total Weight */}
                      <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                        <span className="font-bold">{totalFinalW.toFixed(1)}g</span>
                      </td>

                      {/* 19. Movement QR */}
                      <td className="px-3 py-2.5 min-w-[80px] text-center">
                        <div className="flex flex-col items-center gap-1">
                          <MiniQR
                            value={qrCode}
                            onClick={() => setQrPopup({ code: qrCode, orderCode: order.orderCode })}
                          />
                          <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[70px]">{qrCode}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── PARTS TABLE (shown when model is expanded) ─────────────────────── */}
      {expandedModelKey && (() => {
        // Show parts only for the selected order's model
        const partRows: {
          order: typeof filteredOrders[0];
          model: ReturnType<typeof models.find>;
          part: NonNullable<NonNullable<ReturnType<typeof models.find>>["parts"]>[0];
          stamp: ReturnType<typeof stamps.find>;
          partIdx: number;
          lastMov: typeof movements[0] | undefined;
          partLossG: number;
          partLossPct: number;
          pureGoldPct: number;
          partProgress: number;
          currentSection: string;
          lastWorker: string;
          lastMachine: string;
          partCode: string;
          qrCode: string;
        }[] = [];

        for (const order of filteredOrders.filter(o => o.id === expandedOrderId)) {
          const model = models.find(m => m.id === order.modelId);
          if (!model?.parts?.length) continue;

          const stamp      = stamps.find(s => s.id === order.stampId);
          const orderMovs  = movements
            .filter(m => m.orderId === order.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const lastMov    = orderMovs[0];
          const totalOrderLossG   = orderMovs.reduce((a, m) => a + m.lossGrams, 0);
          const totalOrderLossPct = orderMovs.length
            ? orderMovs.reduce((a, m) => a + m.lossPercent, 0) / orderMovs.length : 0;
          const pureGoldPct = stamp ? stamp.goldPercent : 75;
          const totalModelW = model.parts.reduce((a, p) => a + (p.approxWeight ?? 0), 0) || model.approxWeightGrams;

          const currentSection = lastMov ? sections.find(s => s.id === lastMov.toSectionId)?.name ?? "—" : "—";
          const lastWorker     = lastMov ? workers.find(w => w.id === lastMov.workerId)?.name ?? "—" : "—";
          const lastMachine    = lastMov
            ? machines.find(m => m.id === workers.find(w => w.id === lastMov.workerId)?.machineId)?.name ?? "" : "";

          model.parts.forEach((part, partIdx) => {
            const weightRatio  = totalModelW > 0 ? (part.approxWeight ?? 0) / totalModelW : 1 / model.parts!.length;
            const partLossG    = totalOrderLossG * weightRatio;
            const partLossPct  = totalOrderLossPct * weightRatio;
            const lastSectionId = lastMov?.toSectionId;
            const stageFoundIdx = lastSectionId
              ? part.stages.findIndex(s => s.sectionId === lastSectionId) : -1;
            const partProgress = stageFoundIdx >= 0 && part.stages.length > 0
              ? Math.min(100, Math.round(((stageFoundIdx + 1) / part.stages.length) * 100))
              : STATUS_PROGRESS[order.status] ?? 0;
            const partCode = `${model.code}-P${partIdx + 1}`;
            const qrCode   = lastMov?.qrCode ?? `${order.orderCode}-P${partIdx + 1}`;

            partRows.push({
              order, model, part, stamp, partIdx, lastMov,
              partLossG, partLossPct, pureGoldPct, partProgress,
              currentSection, lastWorker, lastMachine, partCode, qrCode,
            });
          });
        }

        if (partRows.length === 0) return null;

        const colsEn = [
          "Part\nNO", "Part\nPic", "Part\nCode", "Stamp /\nKarat",
          "Piece Part\nQty", "Order Part\nQty",
          "Current\nStage", "Current Machine\n/ Worker",
          "Gross Gold\nLoss %", "Gross Gold\nLoss Weight", "24K Pure\nGold Loss %",
          "Last\nMovement", "Progress\n%", "Movement\nQR",
        ];
        const colsAr = [
          "رقم\nالجزء", "صورة\nالجزء", "كود\nالجزء", "الطابع /\nالعيار",
          "كمية\nالقطعة", "كمية\nالطلب",
          "المرحلة\nالحالية", "الماكينة /\nالعامل",
          "نسبة فقد\nالذهب", "وزن فقد\nالذهب", "فقد الذهب\nالخالص 24K",
          "آخر\nحركة", "نسبة\nالتقدم", "رمز QR\nالحركة",
        ];
        const cols = isRTL ? colsAr : colsEn;

        return (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            {/* Parts breadcrumb */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-xs border-b border-border/50">
              <button onClick={() => { setExpandedOrderId(null); setExpandedModelKey(null); }} className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Package className="w-3 h-3" />
                <span>{isRTL ? "الطلبات" : "Orders"}</span>
              </button>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <button onClick={() => setExpandedModelKey(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                {filteredOrders.find(o => o.id === expandedOrderId)?.orderCode}
              </button>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <span className="font-semibold text-foreground">{partRows[0]?.model?.name ?? (isRTL ? "الموديل" : "Model")}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-muted-foreground">{isRTL ? "الأجزاء" : "Parts"}</span>
            </div>
            {/* Table title */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-violet-600 dark:bg-violet-800">
              <span className="text-white font-bold text-sm tracking-wide uppercase">
                {isRTL ? "الأجزاء" : "Parts"}
              </span>
              <span className="text-violet-100 text-xs">
                {isRTL ? `${partRows.length} جزء` : `${partRows.length} part${partRows.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1800px]">
                <thead>
                  <tr className="bg-violet-600 dark:bg-violet-800 border-b border-violet-700 dark:border-violet-700">
                    {cols.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2.5 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line border-e border-violet-500/40 dark:border-violet-700/60 last:border-e-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partRows.map(({ order, model, part, stamp, partIdx, lastMov, partLossG, partLossPct, pureGoldPct, partProgress, currentSection, lastWorker, lastMachine, partCode, qrCode }, rowIdx) => {
                    const isEven = rowIdx % 2 === 0;
                    return (
                      <tr
                        key={`${order.id}-${part.id}`}
                        className={`border-b last:border-b-0 border-violet-100 dark:border-violet-900/50 hover:bg-violet-100/60 dark:hover:bg-violet-900/20 transition-colors ${isEven ? "bg-white dark:bg-card" : "bg-violet-50/50 dark:bg-violet-950/15"}`}
                      >
                        {/* 1. Part NO */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[55px] text-center">
                          <span className="font-bold text-violet-700 dark:text-violet-400">{partIdx + 1}</span>
                        </td>

                        {/* 2. Part Pic */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[70px] text-center">
                          {part.image ? (
                            <button
                              onClick={() => setPartImgPopup({ src: part.image!, name: part.name })}
                              className="group relative inline-block"
                              title={isRTL ? "انقر للتكبير" : "Click to enlarge"}
                            >
                              <img
                                src={part.image}
                                alt={part.name}
                                className="w-10 h-10 object-cover rounded-lg border border-border group-hover:ring-2 group-hover:ring-violet-500 transition-all cursor-zoom-in"
                              />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </td>

                        {/* 3. Part Code */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[120px]">
                          <span className="block font-bold font-mono text-primary text-[11px]">{partCode}</span>
                          <span className="block text-muted-foreground text-[10px] truncate max-w-[110px]">{part.name}</span>
                        </td>

                        {/* 4. Stamp / Karat */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                          <span className="font-bold text-amber-700 dark:text-amber-400">{stamp?.karat ?? "—"}K</span>
                          <span className="block text-muted-foreground text-[10px]">{stamp?.purity ?? ""}</span>
                        </td>

                        {/* 5. Piece Part Qty */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                          <span className="font-bold">{part.approxWeight != null ? part.approxWeight.toFixed(1) + "g" : "—"}</span>
                          <span className="block text-muted-foreground text-[10px]">{isRTL ? "للقطعة" : "per pc"}</span>
                        </td>

                        {/* 6. Order Part Qty */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                          <span className="font-bold text-base">{order.qty}</span>
                          <span className="block text-muted-foreground text-[10px]">{isRTL ? "قطعة" : "pcs"}</span>
                        </td>

                        {/* 7. Current Stage */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[110px]">
                          {currentSection !== "—" ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 block w-fit">
                              {currentSection}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* 8. Current Machine / Worker */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[130px]">
                          {lastMov ? (
                            <>
                              <span className="block font-medium text-[10px]">{lastWorker}</span>
                              {lastMachine && <span className="block text-muted-foreground text-[9px]">{lastMachine}</span>}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* 9. Gross Gold Loss % */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                          <span className={`font-bold text-sm ${partLossPct > 3 ? "text-red-600 dark:text-red-400" : partLossPct > 1.5 ? "text-amber-600" : partLossPct > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                            {partLossPct > 0 ? partLossPct.toFixed(2) + "%" : "—"}
                          </span>
                        </td>

                        {/* 10. Gross Gold Loss Weight */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[80px] text-center">
                          <span className={`font-bold text-sm ${partLossG > 2 ? "text-red-600 dark:text-red-400" : partLossG > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {partLossG > 0 ? partLossG.toFixed(2) + "g" : "—"}
                          </span>
                        </td>

                        {/* 11. 24K Pure Gold Loss % */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[90px] text-center">
                          {(() => {
                            const pureGoldLossG = (partLossG * pureGoldPct) / 100;
                            const partW = part.approxWeight ?? 0;
                            const pureGoldLossPct = partW > 0
                              ? (pureGoldLossG / ((partW * pureGoldPct) / 100)) * 100
                              : partLossPct;
                            return partLossG > 0 ? (
                              <>
                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                  {pureGoldLossPct.toFixed(2)}%
                                </span>
                                <span className="block text-muted-foreground text-[10px]">
                                  {pureGoldLossG.toFixed(2)}g {isRTL ? "نقاء" : "pure"}
                                </span>
                              </>
                            ) : <span className="text-muted-foreground">—</span>;
                          })()}
                        </td>

                        {/* 12. Last Movement */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[95px]">
                          {lastMov ? (
                            <>
                              <span className="font-semibold text-[10px]">{timeAgo(lastMov.timestamp)}</span>
                              <span className="block text-muted-foreground text-[9px] truncate max-w-[85px]">
                                {lastMov.operationType?.replace(/-/g, " ")}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* 13. Progress % */}
                        <td className="px-3 py-2.5 border-e border-border/40 min-w-[130px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">
                              {isRTL ? `${partIdx + 1} / ${model!.parts!.length}` : `${partIdx + 1} of ${model!.parts!.length}`}
                            </span>
                            <span className={`text-[10px] font-bold ${partProgress === 100 ? "text-emerald-600" : partProgress < 30 ? "text-amber-600" : "text-violet-600 dark:text-violet-400"}`}>
                              {partProgress}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${partProgress === 100 ? "bg-emerald-500" : "bg-violet-500"}`}
                              style={{ width: `${partProgress}%` }}
                            />
                          </div>
                        </td>

                        {/* 14. Movement QR */}
                        <td className="px-3 py-2.5 min-w-[80px] text-center">
                          <div className="flex flex-col items-center gap-1">
                            <MiniQR
                              value={qrCode}
                              onClick={() => setQrPopup({ code: qrCode, orderCode: order.orderCode })}
                            />
                            <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[70px]">{qrCode}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── ROAD MAP TABLE (shown when model is expanded) ──────────────────── */}
      {expandedModelKey && (() => {
        // Build road map only for the selected order
        type RoadRow = {
          order: typeof filteredOrders[0];
          model: NonNullable<ReturnType<typeof models["find"]>>;
          partsToShow: { id?: string; name: string; image?: string; stages: typeof models[0]["stages"]; colour?: string; approxWeight?: number }[];
          gridSectionIds: string[];
          mergeSections: Set<string>;
          orderIdx: number;
        };
        const roadRows: RoadRow[] = [];

        filteredOrders.filter(o => o.id === expandedOrderId).forEach((order, orderIdx) => {
          const model = models.find(m => m.id === order.modelId);
          if (!model) return;
          const allParts = model.parts ?? [];

          // Build the unified section grid: all unique sections across all parts,
          // sorted by the global section order
          const sectionIdSet = new Set<string>();
          (allParts.length > 0 ? allParts : [{ stages: model.stages }]).forEach(p =>
            p.stages.forEach(s => sectionIdSet.add(s.sectionId))
          );
          const gridSectionIds = [...sectionIdSet].sort((a, b) => {
            const sa = sections.find(s => s.id === a)?.order ?? 99;
            const sb = sections.find(s => s.id === b)?.order ?? 99;
            return sa - sb;
          });

          // Find merge sections (visited by 2+ parts)
          const sectionPartVisitors = new Map<string, Set<number>>();
          allParts.forEach((part, pIdx) => {
            part.stages.forEach(stage => {
              const set = sectionPartVisitors.get(stage.sectionId) ?? new Set();
              set.add(pIdx);
              sectionPartVisitors.set(stage.sectionId, set);
            });
          });
          const mergeSections = new Set(
            [...sectionPartVisitors.entries()]
              .filter(([, set]) => set.size > 1)
              .map(([id]) => id)
          );

          const partsToShow: RoadRow["partsToShow"] = allParts.length > 0
            ? allParts.map(p => ({ id: p.id, name: p.name, image: p.image, stages: p.stages, colour: p.colour, approxWeight: p.approxWeight }))
            : [{ id: model.code, name: model.name, image: model.image, stages: model.stages, colour: model.colour, approxWeight: model.approxWeightGrams }];

          roadRows.push({ order, model, partsToShow, gridSectionIds, mergeSections, orderIdx });
        });

        if (roadRows.length === 0) return null;

        const CELL_W = 106; // px per section column
        const LABEL_W = 86; // px for part label

        return (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            {/* Road map breadcrumb */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-xs border-b border-border/50">
              <button onClick={() => { setExpandedOrderId(null); setExpandedModelKey(null); }} className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Package className="w-3 h-3" />
                <span>{isRTL ? "الطلبات" : "Orders"}</span>
              </button>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <button onClick={() => setExpandedModelKey(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                {filteredOrders.find(o => o.id === expandedOrderId)?.orderCode}
              </button>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-muted-foreground">{isRTL ? "الموديلات" : "Models"}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <span className="font-semibold text-foreground">{isRTL ? "خريطة الطريق" : "Road Map"}</span>
            </div>
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-600 dark:bg-amber-800">
              <span className="text-white font-bold text-sm tracking-wide uppercase">
                {isRTL ? "خريطة الطريق" : "Road Map"}
              </span>
              <span className="text-amber-100 text-xs">
                {isRTL ? `${roadRows.length} موديل` : `${roadRows.length} model${roadRows.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Outer table: fixed left columns + road-map column */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: "900px" }}>
                <thead>
                  <tr className="bg-amber-600 dark:bg-amber-800 border-b border-amber-700">
                    {(isRTL
                      ? ["رقم الموديل", "عدد\nالأجزاء", "الكمية", "صورة\nالموديل", "خريطة الطريق"]
                      : ["Model\nNO", "Parts\nNO", "Parts\nQty", "Model\nPic", "Road Map"]
                    ).map((h, i) => (
                      <th
                        key={i}
                        className={`px-3 py-2.5 text-start text-[10px] font-bold text-white uppercase whitespace-pre-line ${i < 4 ? "border-e border-amber-500/40" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roadRows.map(({ order, model, partsToShow, gridSectionIds, mergeSections, orderIdx }) => {
                    const isEven = orderIdx % 2 === 0;

                    return (
                      <tr
                        key={order.id}
                        className={`border-b last:border-b-0 border-amber-100 dark:border-amber-900/50 ${isEven ? "bg-white dark:bg-card" : "bg-amber-50/40 dark:bg-amber-950/10"}`}
                      >
                        {/* Model NO */}
                        <td className="px-3 py-4 border-e border-border/40 align-top text-center" style={{ width: 56 }}>
                          <span className="font-bold text-amber-700 dark:text-amber-400">{orderIdx + 1}</span>
                          <div className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">{model.code}</div>
                        </td>

                        {/* Parts NO */}
                        <td className="px-3 py-4 border-e border-border/40 align-top text-center" style={{ width: 62 }}>
                          <span className="font-bold text-base">{partsToShow.length}</span>
                        </td>

                        {/* Parts Qty */}
                        <td className="px-3 py-4 border-e border-border/40 align-top text-center" style={{ width: 62 }}>
                          <span className="font-bold text-base">{order.qty}</span>
                          <span className="block text-muted-foreground text-[10px]">{isRTL ? "قطعة" : "pcs"}</span>
                        </td>

                        {/* Model Image */}
                        <td className="px-3 py-4 border-e border-border/40 align-top text-center" style={{ width: 72 }}>
                          {model.image ? (
                            <button
                              onClick={() => setModelImgPopup({ src: model.image!, name: model.name })}
                              className="group inline-block"
                              title={isRTL ? "انقر للتكبير" : "Click to enlarge"}
                            >
                              <img
                                src={model.image}
                                alt={model.name}
                                className="w-12 h-12 object-cover rounded-lg border border-border group-hover:ring-2 group-hover:ring-amber-500 transition-all cursor-zoom-in"
                              />
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="mt-1 text-[9px] text-muted-foreground font-medium truncate max-w-[56px] mx-auto">{model.name}</div>
                        </td>

                        {/* Road Map cell — contains the flex-grid visualization */}
                        <td className="px-4 py-3 align-top">
                          <div style={{ overflowX: "auto" }}>
                            <div style={{ minWidth: LABEL_W + gridSectionIds.length * CELL_W, direction: isRTL ? "rtl" : "ltr" }}>
                              {partsToShow.map((part, partIdx) => {
                                const stageMap = new Map(part.stages.map(s => [s.sectionId, s]));
                                const activeIdxs = gridSectionIds
                                  .map((sid, i) => (stageMap.has(sid) ? i : -1))
                                  .filter(i => i >= 0);
                                const firstActiveIdx = activeIdxs[0] ?? -1;
                                const lastActiveIdx  = activeIdxs[activeIdxs.length - 1] ?? -1;

                                const nextPartStageMap = partIdx < partsToShow.length - 1
                                  ? new Map(partsToShow[partIdx + 1].stages.map(s => [s.sectionId, s]))
                                  : null;

                                const hasMergeWithNext = nextPartStageMap
                                  ? gridSectionIds.some(sid => mergeSections.has(sid) && stageMap.has(sid) && nextPartStageMap.has(sid))
                                  : false;

                                return (
                                  <div key={part.id ?? partIdx}>
                                    {/* Part row */}
                                    <div style={{ display: "flex", alignItems: "center", minHeight: 52 }}>
                                      {/* Part label */}
                                      <div style={{ width: LABEL_W, flexShrink: 0, [isRTL ? "paddingLeft" : "paddingRight"]: 6 }}>
                                        <div
                                          className="text-center rounded border px-1 py-0.5"
                                          style={{
                                            fontSize: 8, fontFamily: "monospace", fontWeight: 700,
                                            background: "rgb(245 208 254 / 0.5)",
                                            borderColor: "rgb(192 132 252)",
                                            color: "rgb(107 33 168)",
                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                          }}
                                        >
                                          {String(part.id ?? `P${partIdx + 1}`).toUpperCase()}
                                        </div>
                                        <div className="text-center mt-0.5 truncate" style={{ fontSize: 7, color: "#6b7280" }}>
                                          {part.name}
                                        </div>
                                      </div>

                                      {/* Stage cells */}
                                      {gridSectionIds.map((sectionId, colIdx) => {
                                        const stage      = stageMap.get(sectionId);
                                        const section    = sections.find(s => s.id === sectionId);
                                        const isMerge    = mergeSections.has(sectionId);
                                        const isActive   = !!stage;
                                        const isLastCell = colIdx === lastActiveIdx;
                                        const isPassthrough =
                                          !isActive && colIdx > firstActiveIdx && colIdx < lastActiveIdx;

                                        return (
                                          <div
                                            key={sectionId}
                                            style={{ width: CELL_W, flexShrink: 0, display: "flex", alignItems: "center" }}
                                          >
                                            {isActive ? (
                                              <>
                                                {/* Stage badge */}
                                                <div
                                                  className="flex flex-col items-center text-center rounded-md"
                                                  style={{
                                                    width: 74, padding: "4px 5px", flexShrink: 0,
                                                    border: `1.5px solid ${isMerge ? "#22c55e" : "#93c5fd"}`,
                                                    background: isMerge
                                                      ? "rgba(34,197,94,0.12)"
                                                      : "rgba(147,197,253,0.15)",
                                                  }}
                                                >
                                                  <span style={{
                                                    fontSize: 9, fontWeight: 700,
                                                    color: isMerge ? "#15803d" : "#1d4ed8",
                                                  }}>
                                                    {section?.name?.toUpperCase() ?? sectionId}
                                                  </span>
                                                  <span style={{ fontSize: 7, color: "#6b7280", marginTop: 1 }}>
                                                    {stage.approxLossPercent}% loss
                                                  </span>
                                                  {isMerge && (
                                                    <span style={{ fontSize: 7, color: "#15803d", fontWeight: 700, marginTop: 1 }}>
                                                      ⟷ {isRTL ? "دمج" : "MERGE"}
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Arrow to next stage */}
                                                {!isLastCell && (
                                                  <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 2px" }}>
                                                    {!isRTL && <div style={{ flex: 1, height: 1, background: "#94a3b8" }} />}
                                                    <span style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1 }}>{isRTL ? "‹" : "›"}</span>
                                                    {isRTL && <div style={{ flex: 1, height: 1, background: "#94a3b8" }} />}
                                                  </div>
                                                )}
                                              </>
                                            ) : isPassthrough ? (
                                              /* Dashed passthrough line */
                                              <div style={{
                                                width: "100%", height: 1,
                                                borderTop: "1.5px dashed rgba(148,163,184,0.35)",
                                              }} />
                                            ) : (
                                              /* Empty gap */
                                              <div style={{ width: "100%" }} />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Merge connector row between this part and the next */}
                                    {hasMergeWithNext && nextPartStageMap && (
                                      <div style={{ display: "flex", alignItems: "center", height: 14 }}>
                                        <div style={{ width: LABEL_W, flexShrink: 0 }} />
                                        {gridSectionIds.map(sectionId => {
                                          const thisVisits = stageMap.has(sectionId);
                                          const nextVisits = nextPartStageMap.has(sectionId);
                                          const showLine   = mergeSections.has(sectionId) && thisVisits && nextVisits;
                                          return (
                                            <div
                                              key={sectionId}
                                              style={{
                                                width: CELL_W, flexShrink: 0,
                                                display: "flex", justifyContent: "center", alignItems: "center",
                                              }}
                                            >
                                              {showLine && (
                                                <div style={{
                                                  width: 2, height: 14,
                                                  background: "linear-gradient(to bottom, #22c55e, #16a34a)",
                                                  borderRadius: 1,
                                                }} />
                                              )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* QR Popup */}
      {qrPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setQrPopup(null)}
        >
          <div
            className="bg-card rounded-2xl border shadow-2xl p-6 max-w-xs w-full mx-4 flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <p className="font-bold text-sm">{isRTL ? "رمز QR الحركة" : "Movement QR"}</p>
              <button onClick={() => setQrPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <MiniQR value={qrPopup.code} />
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">{isRTL ? "الطلب" : "Order"}</p>
              <p className="font-bold font-mono">{qrPopup.orderCode}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{qrPopup.code}</p>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {isRTL
                ? "امسح هذا الرمز لتتبع الحركة الحالية لهذا الطلب في المصنع"
                : "Scan this QR to track the current movement of this order in the factory"}
            </p>
          </div>
        </div>
      )}

      {/* Model Image Popup */}
      {modelImgPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModelImgPopup(null)}
        >
          <div
            className="bg-card rounded-2xl border shadow-2xl p-4 max-w-lg w-full mx-4 flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <p className="font-bold text-sm">{modelImgPopup.name}</p>
              <button onClick={() => setModelImgPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={modelImgPopup.src}
              alt={modelImgPopup.name}
              className="w-full max-h-80 object-contain rounded-xl border border-border"
            />
          </div>
        </div>
      )}

      {/* Part Image Popup */}
      {partImgPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPartImgPopup(null)}
        >
          <div
            className="bg-card rounded-2xl border shadow-2xl p-4 max-w-lg w-full mx-4 flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <p className="font-bold text-sm">
                {isRTL ? `صورة الجزء — ${partImgPopup.name}` : `Part — ${partImgPopup.name}`}
              </p>
              <button onClick={() => setPartImgPopup(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={partImgPopup.src}
              alt={partImgPopup.name}
              className="w-full max-h-80 object-contain rounded-xl border border-border"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { orders, movements, sections, workers, machines, stamps, alerts } = useMockState();

  const totalOrders      = orders.length;
  const activeOrders     = orders.filter(o => o.status === "in-production").length;
  const totalGoldWeightG = orders.reduce((acc, o) => acc + o.totalWeightGrams, 0);
  const totalLossG       = movements.reduce((acc, m) => acc + m.lossGrams, 0);
  const totalWeightProc  = movements.filter(m => m.weightBefore > 0).reduce((acc, m) => acc + m.weightBefore, 0);
  const totalLossPct     = totalWeightProc > 0 ? (totalLossG / totalWeightProc) * 100 : 0;
  const activeAlerts     = alerts.filter(a => !a.isDismissed).length;
  const dustLoss         = totalLossG * 0.08 || 2.4;
  const totalWorkingHours = movements.length * 4.2;

  const sectionStats = sections.map(s => {
    const sMovs   = movements.filter(m => m.toSectionId === s.id);
    const sLossG  = sMovs.reduce((a, m) => a + m.lossGrams, 0);
    const sWgtIn  = sMovs.reduce((a, m) => a + m.weightBefore, 0);
    const sPct    = sWgtIn > 0 ? (sLossG / sWgtIn) * 100 : Math.random() * 3 + 0.5;
    const sOrders = Math.max(1, Math.floor(orders.length * 0.4));
    const sWeight = sMovs.reduce((a, m) => a + m.weightAfter, 0) || totalGoldWeightG / sections.length;
    const sTime   = Math.floor(sMovs.length * 4.5 + 2);
    return { section: s, stats: { orders: sOrders, weight: sWeight, lossG: sLossG, lossPercent: parseFloat(sPct.toFixed(2)), movements: sMovs.length, time: sTime } };
  });

  const topSection  = [...sectionStats].sort((a, b) => b.stats.movements - a.stats.movements)[0];
  const totalMoves  = Math.max(movements.length, 1);

  const karatGroups = stamps.map(st => {
    const kOrders = orders.filter(o => o.stampId === st.id);
    const kWeight = kOrders.reduce((a, o) => a + o.totalWeightGrams, 0);
    const kMoves  = movements.filter(m => kOrders.some(o => o.id === m.orderId));
    const kLossG  = kMoves.reduce((a, m) => a + m.lossGrams, 0);
    return { stamp: st, orders: kOrders.length, weight: kWeight, lossG: kLossG };
  }).filter(k => k.orders > 0);

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
    { name: "Pending",   value: orders.filter(o => o.status === "pending").length },
    { name: "Approved",  value: orders.filter(o => o.status === "approved").length },
    { name: "In Prod.",  value: orders.filter(o => o.status === "in-production").length },
    { name: "On Hold",   value: orders.filter(o => o.status === "on-hold").length },
    { name: "Completed", value: orders.filter(o => o.status === "completed").length },
  ].filter(d => d.value > 0);

  const deptWorkload = sectionStats.map(ss => ({
    name: ss.section.name, moves: ss.stats.movements,
    pct:  Math.round((ss.stats.movements / totalMoves) * 100),
  })).sort((a, b) => b.moves - a.moves);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Factory className="w-5 h-5 text-primary" />Factory Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Package}       label="Total Orders"    value={totalOrders}                     sub={`${activeOrders} in production`}  accent="blue"   trend="up" />
          <StatCard icon={Scale}         label="Gold in Factory" value={`${totalGoldWeightG.toFixed(0)}g`} sub="Across all orders"                accent="gold" />
          <StatCard icon={TrendingDown}  label="Total Loss"      value={`${totalLossG.toFixed(1)}g`}      sub={`${totalLossPct.toFixed(2)}% rate`} accent="red"  trend="down" />
          <StatCard icon={Clock}         label="Working Hours"   value={`${totalWorkingHours.toFixed(0)}h`} sub="Factory total"                   accent="purple" />
          <StatCard icon={Wind}          label="Dust Return"     value={`${dustLoss.toFixed(1)}g`}          sub="Total dust loss"                 accent="orange" />
          <StatCard icon={AlertTriangle} label="Active Alerts"   value={activeAlerts}                    sub={`${alerts.filter(a=>a.severity==="high"&&!a.isDismissed).length} high priority`} accent={activeAlerts > 2 ? "red" : "green"} />
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

// ─── LOST & WEIGHT TAB ────────────────────────────────────────────────────────
function LostWeightTab() {
  const { sections, movements } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const lossData = sections.map(s => ({
    name: s.name,
    loss: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
  })).sort((a, b) => b.loss - a.loss);

  const trendData = [
    { day: "Mon", loss: 1.8 }, { day: "Tue", loss: 2.1 }, { day: "Wed", loss: 1.5 },
    { day: "Thu", loss: 2.6 }, { day: "Fri", loss: 1.9 }, { day: "Sat", loss: 2.4 }, { day: "Sun", loss: 1.7 },
  ];

  const totalLoss = movements.reduce((acc, m) => acc + m.lossGrams, 0).toFixed(1);
  const avgLoss   = (lossData.reduce((a, b) => a + b.loss, 0) / (lossData.length || 1)).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={TrendingDown} label="Total Loss This Month" value={`${totalLoss}g`} accent="red" />
        <StatCard icon={AlertTriangle} label="Highest Loss Section" value={lossData[0]?.name || "—"} sub={`${lossData[0]?.loss}%`} accent="orange" />
        <StatCard icon={Activity} label="Avg Loss Rate" value={`${avgLoss}%`} accent="purple" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Loss % by Section</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossData} layout="vertical" margin={{ left: isRTL ? 10 : 20, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={isRTL ? 130 : 100} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="loss" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={18} name="Loss %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Weekly Loss Trend</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="loss" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} name="Loss %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
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

// ─── MACHINES TAB ─────────────────────────────────────────────────────────────
function MachinesTab() {
  const machines = [
    { id: "M001", name: "CNC Mill #1",      section: "Casting",       status: "Online",  uptime: 97.4, jobs: 312 },
    { id: "M002", name: "3D Printer A",     section: "3D Print",      status: "Online",  uptime: 94.1, jobs: 280 },
    { id: "M003", name: "3D Printer B",     section: "3D Print",      status: "Offline", uptime: 81.3, jobs: 180 },
    { id: "M004", name: "Polisher #1",      section: "Finishing",     status: "Online",  uptime: 99.0, jobs: 415 },
    { id: "M005", name: "Laser Cutter",     section: "Design",        status: "Online",  uptime: 92.7, jobs: 225 },
    { id: "M006", name: "Wax Injector #1",  section: "Tree",          status: "Maint.",  uptime: 78.5, jobs: 190 },
    { id: "M007", name: "Stone Setter Pro", section: "Stone Setting", status: "Online",  uptime: 95.6, jobs: 340 },
  ];
  const barData = machines.map(m => ({ name: m.name.split(" ")[0], uptime: m.uptime }));
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Cpu} label="Total Machines" value={machines.length} accent="blue" />
        <StatCard icon={Zap} label="Online" value={machines.filter(m => m.status === "Online").length} accent="green" />
        <StatCard icon={Wrench} label="Offline / Maintenance" value={machines.filter(m => m.status !== "Online").length} accent="orange" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Machine Uptime (%)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="uptime" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} barSize={26} name="Uptime %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Machine Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">Machine</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-end">Jobs</TableHead>
                  <TableHead className="text-end">Uptime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="ps-4"><div className="flex flex-col"><span className="font-medium">{m.name}</span><span className="text-[10px] text-muted-foreground font-mono">{m.id}</span></div></TableCell>
                    <TableCell className="text-sm">{m.section}</TableCell>
                    <TableCell className="text-end">{m.jobs}</TableCell>
                    <TableCell className="text-end font-mono text-sm">{m.uptime}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={m.status === "Online" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200" : m.status === "Maint." ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}>{m.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── COMPARISONS TAB ──────────────────────────────────────────────────────────
function ComparisonsTab() {
  const { sections, workers, machines, movements, orders } = useMockState();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const L = (en: string, ar: string) => isRTL ? ar : en;

  const [dateFrom, setDateFrom]     = useState("2026-03-01");
  const [dateTo, setDateTo]         = useState("2026-04-30");
  const [entityType, setEntityType] = useState<"departments" | "workers" | "machines">("departments");
  const [entityA, setEntityA]       = useState("s4");
  const [entityB, setEntityB]       = useState("s5");

  const entityOptions = React.useMemo(() => {
    if (entityType === "departments") return (sections as any[]).map(s => ({ id: s.id, label: s.name, code: s.code }));
    if (entityType === "workers")     return (workers  as any[]).map(w => ({ id: w.id, label: w.name, code: w.code }));
    return (machines as any[]).map(m => ({ id: m.id, label: m.name, code: m.serialCode }));
  }, [entityType, sections, workers, machines]);

  React.useEffect(() => {
    if (entityOptions.length >= 2) { setEntityA(entityOptions[0].id); setEntityB(entityOptions[1].id); }
  }, [entityType]);

  const computeMetrics = React.useCallback((id: string) => {
    const from = new Date(dateFrom).getTime();
    const to   = new Date(dateTo).getTime() + 86400000;
    let relMovs = (movements as any[]).filter((m: any) => { const ts = new Date(m.timestamp).getTime(); return ts >= from && ts <= to; });
    if (entityType === "departments") relMovs = relMovs.filter((m: any) => m.toSectionId === id || m.fromSectionId === id);
    if (entityType === "workers")     relMovs = relMovs.filter((m: any) => m.workerId === id);
    if (entityType === "machines") {
      const wids = (workers as any[]).filter((w: any) => w.machineId === id).map((w: any) => w.id);
      relMovs = relMovs.filter((m: any) => wids.includes(m.workerId));
    }
    const orderIds = [...new Set(relMovs.map((m: any) => m.orderId))];
    const relOrds  = (orders as any[]).filter((o: any) => orderIds.includes(o.id));
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
      weeks.push({ week: `W${w + 1}`, lossG: parseFloat(wMovs.reduce((a: number, m: any) => a + m.lossGrams, 0).toFixed(2)), qty: wOrds.reduce((a: number, o: any) => a + o.qty, 0) });
    }
    return { orders: orderIds.length, moves: relMovs.length, lossG: parseFloat(lossG.toFixed(2)), lossPct: parseFloat(lossPct.toFixed(2)), qty, hours: parseFloat(hours.toFixed(1)), weeks };
  }, [dateFrom, dateTo, entityType, movements, orders, workers]);

  const nameA = entityOptions.find(e => e.id === entityA)?.label ?? "A";
  const nameB = entityOptions.find(e => e.id === entityB)?.label ?? "B";
  const mA = React.useMemo(() => entityA ? computeMetrics(entityA) : null, [entityA, computeMetrics]);
  const mB = React.useMemo(() => entityB ? computeMetrics(entityB) : null, [entityB, computeMetrics]);

  const colorA = "hsl(var(--chart-1))";
  const colorB = "hsl(var(--chart-2))";

  const barCompare = [
    { metric: L("Orders","الطلبات"),   a: mA?.orders ?? 0, b: mB?.orders ?? 0 },
    { metric: L("Moves","الحركات"),    a: mA?.moves  ?? 0, b: mB?.moves  ?? 0 },
    { metric: L("Loss g","فقد g"),     a: mA?.lossG  ?? 0, b: mB?.lossG  ?? 0 },
    { metric: L("Qty pcs","الكمية"),   a: mA?.qty    ?? 0, b: mB?.qty    ?? 0 },
    { metric: L("Hours","الساعات"),    a: mA?.hours  ?? 0, b: mB?.hours  ?? 0 },
  ];

  const maxWks = Math.max((mA?.weeks ?? []).length, (mB?.weeks ?? []).length, 1);
  const trendData = Array.from({ length: maxWks }, (_, i) => ({
    week: `W${i + 1}`,
    [`${nameA} Loss`]: mA?.weeks[i]?.lossG ?? 0,
    [`${nameB} Loss`]: mB?.weeks[i]?.lossG ?? 0,
    [`${nameA} Qty`]:  mA?.weeks[i]?.qty   ?? 0,
    [`${nameB} Qty`]:  mB?.weeks[i]?.qty   ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* ── Configuration card ──────────────────────────────────────────── */}
      <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-500" />
            {L("Comparison Setup","إعداد المقارنة")}
          </CardTitle>
          <CardDescription>
            {L("Select a period, entity type, and two entities to compare side-by-side.",
               "اختر فترة زمنية، نوع الكيان، وكيانين للمقارنة جنبًا إلى جنب.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("Compare By","مقارنة حسب")}</label>
              <Select value={entityType} onValueChange={v => setEntityType(v as any)}>
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="departments"><span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{L("Departments","الأقسام")}</span></SelectItem>
                  <SelectItem value="workers"><span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{L("Workers","العمال")}</span></SelectItem>
                  <SelectItem value="machines"><span className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5" />{L("Machines","الآلات")}</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{L("Period","الفترة")}</label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 text-xs font-mono text-muted-foreground gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{dateFrom} → {dateTo}</span>
              </div>
            </div>
          </div>
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
        </CardContent>
      </Card>

      {/* ── Metric summary cards ─────────────────────────────────────────── */}
      {(mA && mB) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: L("Total Orders","إجمالي الطلبات"),    a: mA.orders,  b: mB.orders,  fmt: (v: number) => `${v}`,                better: "higher" as const },
            { label: L("Total Moves","إجمالي الحركات"),     a: mA.moves,   b: mB.moves,   fmt: (v: number) => `${v}`,                better: "higher" as const },
            { label: L("Gold Loss g","الفقد g"),            a: mA.lossG,   b: mB.lossG,   fmt: (v: number) => `${v.toFixed(2)}g`,   better: "lower"  as const },
            { label: L("Loss Rate","نسبة الفقد"),           a: mA.lossPct, b: mB.lossPct, fmt: (v: number) => `${v.toFixed(2)}%`,   better: "lower"  as const },
            { label: L("Qty Processed","الكمية"),           a: mA.qty,     b: mB.qty,     fmt: (v: number) => `${v} pcs`,           better: "higher" as const },
          ].map(({ label, a, b, fmt, better }) => {
            const aWins = better === "higher" ? a >= b : a <= b;
            const diff  = a - b;
            return (
              <div key={label} className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 rounded-lg p-2 text-center border" style={{ background: `${colorA}18`, borderColor: `${colorA}40` }}>
                    <p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: colorA }}>{nameA}</p>
                    <p className={`text-lg font-bold font-mono ${aWins ? "text-foreground" : "text-muted-foreground"}`}>{fmt(a)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                    <span>vs</span>
                    {diff !== 0 && <span className={`font-bold ${diff > 0 ? (better === "lower" ? "text-red-500" : "text-green-600") : (better === "lower" ? "text-green-600" : "text-red-500")}`}>{diff > 0 ? "+" : ""}{fmt(diff)}</span>}
                  </div>
                  <div className="flex-1 rounded-lg p-2 text-center border" style={{ background: `${colorB}18`, borderColor: `${colorB}40` }}>
                    <p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: colorB }}>{nameB}</p>
                    <p className={`text-lg font-bold font-mono ${!aWins ? "text-foreground" : "text-muted-foreground"}`}>{fmt(b)}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Badge variant="outline" className="text-[9px] px-1.5" style={{ borderColor: aWins ? colorA : colorB, color: aWins ? colorA : colorB }}>
                    ★ {aWins ? nameA : nameB}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Side-by-side bar chart ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{L("Side-by-Side Comparison","مقارنة المقاييس جنبًا إلى جنب")}</CardTitle>
          <CardDescription className="text-xs">
            <span style={{ color: colorA, fontWeight: 600 }}>{nameA}</span>{" "}{L("vs","مقابل")}{" "}
            <span style={{ color: colorB, fontWeight: 600 }}>{nameB}</span>{" — "}{dateFrom} {L("to","إلى")} {dateTo}
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
                <Bar dataKey="a" name={nameA} fill={colorA} radius={[4,4,0,0]} barSize={28} />
                <Bar dataKey="b" name={nameB} fill={colorB} radius={[4,4,0,0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Weekly trend charts ──────────────────────────────────────────── */}
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
                  <Line type="monotone" dataKey={`${nameA} Loss`} stroke={colorA} strokeWidth={2.5} dot={{ r: 4, fill: colorA }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey={`${nameB} Loss`} stroke={colorB} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: colorB }} activeDot={{ r: 5 }} />
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
                  <Bar dataKey={`${nameA} Qty`} name={nameA} fill={colorA} radius={[3,3,0,0]} barSize={18} />
                  <Bar dataKey={`${nameB} Qty`} name={nameB} fill={colorB} radius={[3,3,0,0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Detailed comparison table ─────────────────────────────────────── */}
      {(mA && mB) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{L("Detailed Metric Comparison","مقارنة المقاييس التفصيلية")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="ps-4 w-48 text-xs">{L("Metric","المقياس")}</TableHead>
                  <TableHead className="text-center text-xs font-bold" style={{ color: colorA }}>{nameA}</TableHead>
                  <TableHead className="text-center text-xs font-bold" style={{ color: colorB }}>{nameB}</TableHead>
                  <TableHead className="text-center text-xs">{L("Δ Diff","الفرق")}</TableHead>
                  <TableHead className="pe-4 text-xs">{L("Winner","الأفضل")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { label: L("Total Orders","إجمالي الطلبات"),         a: mA.orders,  b: mB.orders,  fmt: (v: number) => `${v}`,               better: "higher" as const },
                  { label: L("Total Movements","إجمالي الحركات"),      a: mA.moves,   b: mB.moves,   fmt: (v: number) => `${v}`,               better: "higher" as const },
                  { label: L("Gold Loss (g)","الفقد (g)"),             a: mA.lossG,   b: mB.lossG,   fmt: (v: number) => `${v.toFixed(2)}g`,  better: "lower"  as const },
                  { label: L("Loss Rate (%)","نسبة الفقد (%)"),        a: mA.lossPct, b: mB.lossPct, fmt: (v: number) => `${v.toFixed(2)}%`,  better: "lower"  as const },
                  { label: L("Qty Processed (pcs)","الكمية المعالجة"), a: mA.qty,     b: mB.qty,     fmt: (v: number) => `${v} pcs`,          better: "higher" as const },
                  { label: L("Hours Worked","ساعات العمل"),            a: mA.hours,   b: mB.hours,   fmt: (v: number) => `${v.toFixed(1)}h`,  better: "lower"  as const },
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
                          ★ {aWins ? nameA : nameB}
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
    { value: "lost-weight", labelEn: "Lost & Weight", labelAr: "الفقد والوزن", icon: TrendingDown,   desc: "Gold loss rates and weight analysis" },
    { value: "departments", labelEn: "Departments",   labelAr: "الأقسام",      icon: Building2,      desc: "Efficiency and workload by department" },
    { value: "workers",     labelEn: "Workers",       labelAr: "العمال",       icon: Users,          desc: "Worker performance ranked by loss rate" },
    { value: "machines",    labelEn: "Machines",      labelAr: "الآلات",       icon: Cpu,            desc: "Machine uptime and status monitoring" },
    { value: "movements",   labelEn: "Movements",     labelAr: "الحركات",      icon: ArrowRightLeft, desc: "Track material flow between sections" },
    { value: "alerts",      labelEn: "Alerts",        labelAr: "التنبيهات",    icon: BellRing,       desc: "Production alerts and notifications" },
    { value: "comparisons", labelEn: "Comparisons",   labelAr: "المقارنات",    icon: GitCompare,     desc: "Period-over-period performance comparison" },
  ];

  const accentColors: Record<string, string> = {
    overview:    "from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60",
    orders:      "from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/60",
    "lost-weight":"from-red-500/20 to-red-500/5 border-red-500/30 hover:border-red-500/60",
    departments: "from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60",
    workers:     "from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/60",
    machines:    "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/60",
    movements:   "from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-500/60",
    alerts:      "from-destructive/20 to-destructive/5 border-destructive/30 hover:border-destructive/60",
    comparisons: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/60",
  };
  const iconColors: Record<string, string> = {
    overview:    "text-primary bg-primary/10",
    orders:      "text-blue-500 bg-blue-500/10",
    "lost-weight":"text-red-500 bg-red-500/10",
    departments: "text-purple-500 bg-purple-500/10",
    workers:     "text-green-500 bg-green-500/10",
    machines:    "text-cyan-500 bg-cyan-500/10",
    movements:   "text-orange-500 bg-orange-500/10",
    alerts:      "text-destructive bg-destructive/10",
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
            <TabsContent value="lost-weight" className="mt-0 focus-visible:outline-none"><LostWeightTab /></TabsContent>
            <TabsContent value="departments" className="mt-0 focus-visible:outline-none"><DepartmentsTab /></TabsContent>
            <TabsContent value="workers"     className="mt-0 focus-visible:outline-none"><WorkersTab /></TabsContent>
            <TabsContent value="machines"    className="mt-0 focus-visible:outline-none"><MachinesTab /></TabsContent>
            <TabsContent value="movements"   className="mt-0 focus-visible:outline-none"><MovementsPage /></TabsContent>
            <TabsContent value="alerts"      className="mt-0 focus-visible:outline-none"><AlertsPage /></TabsContent>
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
