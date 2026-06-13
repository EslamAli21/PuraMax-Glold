// ============================================================
// صفحة لوحة التحكم — dashboard.tsx
//
// الميزات الجديدة (وضع التعديل):
//  - سحب البطاقات وإفلاتها لإعادة الترتيب (HTML5 drag-and-drop)
//  - تغيير لون كل بطاقة من لوحة ألوان صغيرة
//  - حفظ الترتيب والألوان في localStorage عبر EditModeContext
// ============================================================
import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMockState } from "@/lib/mock-state";
import { MOCK_CUSTOMERS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Package, TrendingDown, Clock, Activity, QrCode, Users, Layers,
  Gem, UserCircle, Building2, BarChart3, GripVertical, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useEditMode } from "@/contexts/EditModeContext";
import { cn } from "@/lib/utils";

// ─── لوحة الألوان المتاحة لتخصيص البطاقات في وضع التعديل ───────────────────
const CARD_COLORS = [
  { label: "افتراضي",  value: ""        },
  { label: "أزرق",    value: "#3b82f6" },
  { label: "أخضر",    value: "#22c55e" },
  { label: "برتقالي", value: "#f97316" },
  { label: "أحمر",    value: "#ef4444" },
  { label: "بنفسجي",  value: "#a855f7" },
  { label: "وردي",    value: "#ec4899" },
  { label: "سماوي",   value: "#06b6d4" },
  { label: "ذهبي",    value: "#eab308" },
];

// ═══════════════════════════════════════════════════════════════════════════
// مكوّن البطاقة القابلة للسحب — يُستخدم في وضع التعديل فقط
// يُضيف: مقبض السحب (GripVertical) + نقاط اختيار الألوان فوق كل بطاقة
// ═══════════════════════════════════════════════════════════════════════════
interface DraggableCardProps {
  id:             string;
  isEditMode:     boolean;
  color?:         string;
  onColorChange?: (color: string) => void;
  children:       React.ReactNode;
  onDragStart:    (e: React.DragEvent, id: string) => void;
  onDragOver:     (e: React.DragEvent, id: string) => void;
  onDrop:         (e: React.DragEvent, id: string) => void;
  dragOver?:      boolean;
  className?:     string;
}

function DraggableCard({
  id, isEditMode, color, onColorChange,
  children, onDragStart, onDragOver, onDrop, dragOver, className,
}: DraggableCardProps) {
  // تحديد نمط الحدود والخلفية بناءً على اللون المخصص
  const borderStyle = color
    ? { borderColor: color, borderWidth: "2px", borderStyle: "solid" as const }
    : {};
  const bgStyle = color
    ? { backgroundColor: `${color}12` }
    : {};

  return (
    <div
      draggable={isEditMode}
      onDragStart={e => isEditMode && onDragStart(e, id)}
      onDragOver={e  => isEditMode && onDragOver(e, id)}
      onDrop={e      => isEditMode && onDrop(e, id)}
      className={cn(
        "relative transition-all duration-150",
        isEditMode && "cursor-grab active:cursor-grabbing select-none",
        dragOver   && "scale-[1.02] ring-2 ring-primary/50 z-10",
        className,
      )}
    >
      {/* شريط التحكم في وضع التعديل: مقبض السحب ونقاط الألوان */}
      {isEditMode && (
        <div className="absolute top-1 start-1 z-20 flex items-center gap-1.5 bg-background/90 border border-border rounded-md px-2 py-1 shadow-sm backdrop-blur-sm">
          {/* أيقونة مقبض السحب */}
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {/* نقاط اختيار الألوان */}
          <div className="flex items-center gap-0.5">
            {CARD_COLORS.map(c => (
              <button
                key={c.value || "default"}
                title={c.label}
                onClick={e => { e.stopPropagation(); onColorChange?.(c.value); }}
                className={cn(
                  "w-3 h-3 rounded-full border transition-transform hover:scale-125 focus:outline-none",
                  !c.value && "bg-muted border-border",
                  color === c.value && "scale-125 ring-1 ring-offset-1 ring-foreground",
                )}
                style={c.value ? { backgroundColor: c.value, borderColor: c.value } : {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* محتوى البطاقة — مُغلَّف بحاوية تأخذ اللون المخصص */}
      <div style={{ ...borderStyle, ...bgStyle, borderRadius: "0.75rem", overflow: "hidden", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// هوك إدارة السحب والإفلات (Drag-and-Drop) لإعادة ترتيب العناصر
// ═══════════════════════════════════════════════════════════════════════════
function useDragSort(items: string[], onReorder: (newOrder: string[]) => void) {
  // معرف العنصر المسحوب حالياً
  const draggingId = useRef<string | null>(null);
  // معرف العنصر الذي يحوم فوقه المستخدم
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => {
    draggingId.current = id;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault(); // ضروري للسماح بالإفلات
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((_e: React.DragEvent, targetId: string) => {
    if (!draggingId.current || draggingId.current === targetId) return;
    // إعادة ترتيب القائمة: نقل العنصر المسحوب إلى موضع الهدف
    const newOrder = [...items];
    const fromIdx  = newOrder.indexOf(draggingId.current);
    const toIdx    = newOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggingId.current);
    onReorder(newOrder);
    draggingId.current = null;
    setDragOverId(null);
  }, [items, onReorder]);

  const handleDragEnd = useCallback(() => {
    draggingId.current = null;
    setDragOverId(null);
  }, []);

  return { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverId };
}

// ═══════════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية — لوحة التحكم
// ═══════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { currentRole }  = useAuth();
  const { orders, movements, alerts, sections, workers } = useMockState();
  const { t }            = useTranslation();
  const {
    isEditMode,
    dashboardCardOrder, setDashboardCardOrder,
    dashboardCardColors, setDashboardCardColor,
    hiddenSections, toggleSection,
    sectionOrder,   setSectionOrder,
  } = useEditMode();

  // ══════════════════════════════════════════════════════════════════════════
  // لوحة المالك أو مدير الإنتاج
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRole === "Owner" || currentRole === "Production Manager") {
    // ─── ثوابت أقسام لوحة التحكم — كل قسم له معرّف فريد يُستخدم للإخفاء والترتيب ───
    const DEFAULT_SECTION_ORDER = [
      "sec-kpi", "sec-factory", "sec-charts",
      "sec-sectionload", "sec-movements", "sec-workers", "sec-customers",
    ];
    const SECTION_LABELS: Record<string, string> = {
      "sec-kpi":         t("dashboard.secKpi")         || "بطاقات KPI",
      "sec-factory":     t("dashboard.secFactory")     || "نظرة عامة على المصنع",
      "sec-charts":      t("dashboard.secCharts")      || "الرسوم البيانية",
      "sec-sectionload": t("dashboard.secSectionLoad") || "حمل الأقسام",
      "sec-movements":   t("dashboard.secMovements")   || "التحركات والتنبيهات",
      "sec-workers":     t("dashboard.secWorkers")     || "أداء العمال",
      "sec-customers":   t("dashboard.secCustomers")   || "نشاط العملاء",
    };
    // دالة تحقق: هل هذا القسم مرئي (لم يُخفَ بعد)؟
    const isVisible = (id: string) => !hiddenSections.includes(id);
    // ─── حسابات إحصائية ──────────────────────────────────────────────────
    const activeOrders     = orders.filter(o => o.status === "in-production" || o.status === "approved").length;
    const goldInProduction = orders.filter(o => o.status === "in-production").reduce((a, o) => a + o.totalWeightGrams, 0);
    const activeWorkers    = workers.filter(w => w.status === "active").length;

    // بيانات مخطط الفقد اليومي لآخر 14 يوم
    const chartData = Array.from({ length: 14 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        loss: parseFloat((Math.random() * 2 + 1).toFixed(2)),
      };
    });
    const avgLoss = (chartData.reduce((a, c) => a + c.loss, 0) / chartData.length).toFixed(2);

    // بيانات مخطط الطلبات حسب الحالة
    const orderStatusData = [
      { name: t("analytics.pending"),    count: orders.filter(o => o.status === "pending").length,       fill: "hsl(var(--chart-1))" },
      { name: t("analytics.approved"),   count: orders.filter(o => o.status === "approved").length,      fill: "hsl(var(--chart-2))" },
      { name: t("analytics.production"), count: orders.filter(o => o.status === "in-production").length, fill: "hsl(var(--chart-3))" },
      { name: t("analytics.done"),       count: orders.filter(o => o.status === "completed").length,     fill: "hsl(var(--chart-4))" },
    ];

    const unreadAlerts    = alerts.filter(a => !a.isRead && !a.isDismissed).slice(0, 5);
    const recentMovements = movements.slice(0, 8);
    const workerStats     = workers.filter(w => w.status === "active").slice(0, 5).map(w => ({
      ...w,
      ops:     Math.floor(Math.random() * 40) + 10,
      avgLoss: (Math.random() * 3 + 0.5).toFixed(2),
      section: sections.find(s => s.id === w.sectionId)?.name || "—",
    }));
    const customerStats = MOCK_CUSTOMERS.map(c => ({
      ...c,
      orders:    Math.floor(Math.random() * 20) + 2,
      gold:      Math.floor(Math.random() * 5000) + 500,
      lastOrder: new Date(Date.now() - Math.random() * 30 * 24 * 3600000).toLocaleDateString(),
    }));
    const sectionLoad = sections.slice(0, 6).map(s => ({
      name: s.name,
      load: Math.floor(Math.random() * 80) + 10,
    }));

    // ─── ترتيب بطاقات KPI ───────────────────────────────────────────────
    const DEFAULT_KPI_ORDER = ["kpi-active","kpi-gold","kpi-loss","kpi-ontime"];

    // استخدام الترتيب المحفوظ أو الافتراضي
    const kpiOrder = dashboardCardOrder.filter(id => DEFAULT_KPI_ORDER.includes(id)).length === DEFAULT_KPI_ORDER.length
      ? dashboardCardOrder.filter(id => DEFAULT_KPI_ORDER.includes(id))
      : DEFAULT_KPI_ORDER;

    // محتوى كل بطاقة KPI
    const KPI_CARDS: Record<string, React.ReactNode> = {
      "kpi-active": (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.activeOrders")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.activeOrdersSub")}</p>
          </CardContent>
        </Card>
      ),
      "kpi-gold": (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.goldInProduction")}</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goldInProduction.toLocaleString()}g</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.goldInProductionSub")}</p>
          </CardContent>
        </Card>
      ),
      "kpi-loss": (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.avgLoss")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLoss}%</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.avgLossSub")}</p>
          </CardContent>
        </Card>
      ),
      "kpi-ontime": (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.onTimeDelivery")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.onTimeDeliverySub")}</p>
          </CardContent>
        </Card>
      ),
    };

    // ─── هوك السحب والإفلات لبطاقات KPI ─────────────────────────────────
    const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragOverId } =
      useDragSort(kpiOrder, (newOrder) => {
        // حفظ الترتيب الجديد مع الحفاظ على بطاقات الأقسام الأخرى
        const otherCards = dashboardCardOrder.filter(id => !DEFAULT_KPI_ORDER.includes(id));
        setDashboardCardOrder([...newOrder, ...otherCards]);
      });

    return (
      <div className="space-y-8" onDragEnd={handleDragEnd}>
        {/* ── عنوان الصفحة ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          {/* لوحة التحكم في الأقسام — تظهر في وضع التعديل فقط لإظهار/إخفاء الأقسام */}
          {isEditMode && (
            <div className="w-full mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                {t("dashboard.editModeTip") || "وضع التعديل — إظهار / إخفاء الأقسام"}
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SECTION_ORDER.map(secId => {
                  const visible = isVisible(secId);
                  return (
                    <button key={secId} onClick={() => toggleSection(secId)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                        visible
                          ? "bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400"
                          : "bg-muted border-border text-muted-foreground line-through"
                      )}>
                      {visible ? <Eye className="h-3 w-3 shrink-0"/> : <EyeOff className="h-3 w-3 shrink-0"/>}
                      {SECTION_LABELS[secId]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("dashboard.dragCardsTip") || "اسحب البطاقات الفردية لإعادة ترتيبها • انقر على نقطة ملونة لتغيير اللون"}
              </p>
            </div>
          )}
        </div>

        {/* ── قسم بطاقات KPI — يمكن إخفاؤه في وضع التعديل ── */}
        {isVisible("sec-kpi") && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiOrder.map(cardId => (
            <DraggableCard
              key={cardId}
              id={cardId}
              isEditMode={isEditMode}
              color={dashboardCardColors[cardId]}
              onColorChange={color => setDashboardCardColor(cardId, color)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dragOver={dragOverId === cardId}
              className={isEditMode ? "pt-7" : ""}
            >
              {KPI_CARDS[cardId]}
            </DraggableCard>
          ))}
        </div>}

        {/* ── قسم نظرة عامة على المصنع ── */}
        {isVisible("sec-factory") && <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t("dashboard.factoryStats") || "Factory At a Glance"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { id: "factory-workers",   icon: Users,      value: activeWorkers,                       label: t("dashboard.totalWorkers")   || "Active Workers"      },
              { id: "factory-customers", icon: UserCircle, value: MOCK_CUSTOMERS.length,               label: t("dashboard.totalCustomers") || "Total Customers"     },
              { id: "factory-sections",  icon: Layers,     value: sections.length,                     label: t("dashboard.totalSections")  || "Production Sections" },
              { id: "factory-gold",      icon: BarChart3,  value: `${(goldInProduction*1.4).toFixed(0)}g`, label: t("dashboard.goldInFactory") || "Gold in Factory"  },
            ].map(({ id, icon: Icon, value, label }) => (
              <DraggableCard
                key={id} id={id}
                isEditMode={isEditMode}
                color={dashboardCardColors[id]}
                onColorChange={color => setDashboardCardColor(id, color)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOver={dragOverId === id}
                className={isEditMode ? "pt-7" : ""}
              >
                <Card className="bg-primary/5 border-primary/20 h-full">
                  <CardContent className="pt-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              </DraggableCard>
            ))}
          </div>
        </div>}

        {/* ── قسم الرسوم البيانية ── */}
        {isVisible("sec-charts") && <div className="grid gap-4 md:grid-cols-2">
          <DraggableCard id="chart-orders" isEditMode={isEditMode} color={dashboardCardColors["chart-orders"]}
            onColorChange={c => setDashboardCardColor("chart-orders", c)}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            dragOver={dragOverId === "chart-orders"} className={isEditMode ? "pt-7" : ""}>
            <Card className="h-full">
              <CardHeader><CardTitle>{t("dashboard.ordersByStatus")}</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderStatusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="count" radius={[4,4,0,0]} fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </DraggableCard>

          <DraggableCard id="chart-loss" isEditMode={isEditMode} color={dashboardCardColors["chart-loss"]}
            onColorChange={c => setDashboardCardColor("chart-loss", c)}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            dragOver={dragOverId === "chart-loss"} className={isEditMode ? "pt-7" : ""}>
            <Card className="h-full">
              <CardHeader><CardTitle>{t("dashboard.avgDailyLoss")}</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="loss" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </DraggableCard>
        </div>}

        {/* ── قسم حمل الأقسام ── */}
        {isVisible("sec-sectionload") && <DraggableCard id="section-load" isEditMode={isEditMode} color={dashboardCardColors["section-load"]}
          onColorChange={c => setDashboardCardColor("section-load", c)}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
          dragOver={dragOverId === "section-load"} className={isEditMode ? "pt-7" : ""}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                {t("dashboard.sectionLoad") || "Section Load"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                {sectionLoad.map(s => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className={cn("font-bold", s.load > 80 ? "text-destructive" : s.load > 60 ? "text-yellow-600" : "text-green-600")}>
                        {s.load}%
                      </span>
                    </div>
                    <Progress value={s.load} className={cn("h-2", s.load > 80 ? "[&>div]:bg-destructive" : s.load > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </DraggableCard>}

        {/* ── قسم التحركات والتنبيهات ── */}
        {isVisible("sec-movements") && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DraggableCard id="table-movements" isEditMode={isEditMode} color={dashboardCardColors["table-movements"]}
            onColorChange={c => setDashboardCardColor("table-movements", c)}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            dragOver={dragOverId === "table-movements"} className={cn("col-span-1 lg:col-span-2", isEditMode && "pt-7")}>
            <Card className="h-full">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{t("dashboard.recentMovements")}</CardTitle>
                <Link href="/movements"><Button variant="ghost" size="sm">{t("dashboard.viewAll")}</Button></Link>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-4">{t("dashboard.time")}</TableHead>
                      <TableHead>{t("dashboard.qrCode")}</TableHead>
                      <TableHead>{t("dashboard.operation")}</TableHead>
                      <TableHead>{t("dashboard.path")}</TableHead>
                      <TableHead className="text-end">{t("dashboard.loss")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map(mov => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-muted-foreground text-xs ps-4">
                          {new Date(mov.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{mov.qrCode}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-[10px]">{mov.operationType}</Badge></TableCell>
                        <TableCell className="text-xs">{mov.fromSectionId} → {mov.toSectionId}</TableCell>
                        <TableCell className="text-end text-xs">
                          <span className={mov.lossPercent > 5 ? "text-destructive font-bold" : mov.lossPercent > 2 ? "text-yellow-600 font-medium" : "text-green-600"}>
                            {mov.lossPercent}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </DraggableCard>

          <DraggableCard id="card-alerts" isEditMode={isEditMode} color={dashboardCardColors["card-alerts"]}
            onColorChange={c => setDashboardCardColor("card-alerts", c)}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            dragOver={dragOverId === "card-alerts"} className={isEditMode ? "pt-7" : ""}>
            <Card className="h-full">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{t("dashboard.activeAlerts")}</CardTitle>
                <Link href="/alerts"><Button variant="ghost" size="sm">{t("dashboard.viewAll")}</Button></Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {unreadAlerts.length > 0 ? unreadAlerts.map(alert => (
                  <div key={alert.id} className="flex flex-col gap-1 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", alert.severity === "high" ? "bg-destructive" : alert.severity === "medium" ? "bg-yellow-500" : "bg-blue-500")} />
                        <span className="text-xs font-semibold uppercase">{alert.type.replace("-"," ")}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noActiveAlerts")}</div>
                )}
              </CardContent>
            </Card>
          </DraggableCard>
        </div>}

        {/* ── قسم أداء العمال ── */}
        {isVisible("sec-workers") && <DraggableCard id="table-workers" isEditMode={isEditMode} color={dashboardCardColors["table-workers"]}
          onColorChange={c => setDashboardCardColor("table-workers", c)}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
          dragOver={dragOverId === "table-workers"} className={isEditMode ? "pt-7" : ""}>
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {t("dashboard.topWorkers") || "Top Workers"}
              </CardTitle>
              <Link href="/master-data"><Button variant="ghost" size="sm">{t("dashboard.viewAll")}</Button></Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-4">{t("dashboard.workerName") || "Worker"}</TableHead>
                    <TableHead>{t("dashboard.workerSection") || "Section"}</TableHead>
                    <TableHead className="text-center">{t("dashboard.opsCount") || "Ops"}</TableHead>
                    <TableHead className="text-end">{t("dashboard.avgLossRate") || "Avg Loss"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workerStats.map((w, i) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 ps-1">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i+1}</div>
                          <span className="font-medium">{w.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{w.section}</TableCell>
                      <TableCell className="text-center font-mono font-bold">{w.ops}</TableCell>
                      <TableCell className="text-end">
                        <span className={cn("font-mono font-bold text-sm", Number(w.avgLoss) > 3 ? "text-destructive" : Number(w.avgLoss) > 2 ? "text-yellow-600" : "text-green-600")}>
                          {w.avgLoss}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </DraggableCard>}

        {/* ── قسم نشاط العملاء ── */}
        {isVisible("sec-customers") && <DraggableCard id="table-customers" isEditMode={isEditMode} color={dashboardCardColors["table-customers"]}
          onColorChange={c => setDashboardCardColor("table-customers", c)}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
          dragOver={dragOverId === "table-customers"} className={isEditMode ? "pt-7" : ""}>
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-primary" />
                {t("dashboard.customerActivity") || "Customer Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-4">{t("dashboard.customerName") || "Customer"}</TableHead>
                    <TableHead className="text-center">{t("dashboard.ordersCount") || "Orders"}</TableHead>
                    <TableHead className="text-center">{t("dashboard.goldVolume") || "Gold Volume"}</TableHead>
                    <TableHead>{t("dashboard.lastOrder") || "Last Order"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerStats.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="ps-1">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{c.orders}</TableCell>
                      <TableCell className="text-center font-mono font-bold">{c.gold.toLocaleString()}g</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.lastOrder}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </DraggableCard>}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // لوحة المصمم
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRole === "Designer") {
    const assignedOrders = orders.filter(o => o.status === "pending" || o.status === "approved");
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.designerTitle")}</h1>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.myAssignments")}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.order")}</TableHead>
                  <TableHead>{t("dashboard.modelItem")}</TableHead>
                  <TableHead>{t("dashboard.deliveryDate")}</TableHead>
                  <TableHead>{t("dashboard.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedOrders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.orderCode}</TableCell>
                    <TableCell>{o.itemName}</TableCell>
                    <TableCell>{new Date(o.deliveryDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // لوحة مشغّل الميزان
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRole === "Scale Operator") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.scaleTitle")}</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t("dashboard.todayOperations")}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{movements.length}</div>
              <p className="text-muted-foreground mt-2">{t("dashboard.operationsRecorded")}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <QrCode className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("dashboard.readyToScan")}</h3>
              <p className="text-muted-foreground mb-6">{t("dashboard.startNewOperation")}</p>
              <Link href="/scale">
                <Button size="lg" className="w-full max-w-xs font-semibold">{t("dashboard.openScaleWizard")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // لوحة العامل العادي (الافتراضية)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.workerTitle") || "My Work"}</h1>
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t("dashboard.readyToWork") || "Ready to Work"}</h3>
          <p className="text-muted-foreground mb-6">{t("dashboard.scanQrToStart") || "Scan a QR code to start"}</p>
          <Link href="/my-work">
            <Button size="lg" className="font-semibold">{t("dashboard.viewMyWork") || "View My Work"}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
