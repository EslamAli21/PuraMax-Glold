// ============================================================
// صفحة التحليلات — تقارير وإحصاءات الإنتاج والخسائر
// ============================================================
import React from "react";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

// ── مكوّن tooltip مخصص للرسم الدائري ──────────────────────────────────────
// يستخدم Tailwind بدلاً من contentStyle حتى يعمل dark mode بشكل صحيح
// النص: رمادي في وضع الإضاءة — ذهبي في وضع الليل
function PieTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground dark:text-yellow-400">
        {name} : {value}
      </p>
    </div>
  );
}

// قائمة ألوان الرسم البياني الدائري
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function AnalyticsPage() {
  const { orders, workers, sections } = useMockState();
  const { t, i18n } = useTranslation();

  // تحديد ما إذا كانت اللغة الحالية عربية (RTL)
  const isRTL = i18n.language === "ar";

  // ─── بيانات الرسم الدائري — توزيع الطلبات حسب الحالة ─────────────────────
  const pieData = [
    { name: t("analytics.pending"),    value: orders.filter(o => o.status === 'pending').length    },
    { name: t("analytics.approved"),   value: orders.filter(o => o.status === 'approved').length   },
    { name: t("analytics.production"), value: orders.filter(o => o.status === 'in-production').length },
    { name: t("analytics.hold"),       value: orders.filter(o => o.status === 'on-hold').length    },
    { name: t("analytics.done"),       value: orders.filter(o => o.status === 'completed').length  },
  ].filter(d => d.value > 0);

  // ─── بيانات الفقد حسب القسم — مرتبة تنازلياً ─────────────────────────────
  const lossBySection = sections.map(s => ({
    name: s.name,
    loss: parseFloat((Math.random() * 4 + 1).toFixed(2)),
  })).sort((a, b) => b.loss - a.loss);

  // ─── أداء العمال ──────────────────────────────────────────────────────────
  const workerPerformance = workers.map(w => ({
    name:       w.name,
    section:    sections.find(s => s.id === w.sectionId)?.name || t("analytics.unknown"),
    operations: Math.floor(Math.random() * 100) + 20,
    loss:       (Math.random() * 3).toFixed(2),
    status:     Math.random() > 0.8 ? t("analytics.needsReview") : t("analytics.excellent"),
  })).sort((a, b) => Number(a.loss) - Number(b.loss));

  // ─── عرض محور Y والهامش الأيسر بناءً على اللغة ──────────────────────────
  // الإصلاح: في العربية نزيد العرض لأن الأسماء قد تكون أطول
  // المشكلة الأساسية: recharts لا يدعم RTL أصلاً،
  // الحل: إضافة dir="ltr" على الحاوية لإجبار المخطط على التخطيط LTR
  const yAxisWidth   = isRTL ? 130 : 100;
  const chartMarginL = isRTL ? 10  : 20;

  return (
    <div className="space-y-6">
      {/* ── رأس الصفحة ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("analytics.title")}
        </h1>
        <div className="flex gap-1 bg-muted p-1 rounded-md flex-wrap">
          <Button variant="ghost" size="sm" className="bg-background shadow-sm">{t("analytics.sevenDays")}</Button>
          <Button variant="ghost" size="sm">{t("analytics.thirtyDays")}</Button>
          <Button variant="ghost" size="sm">{t("analytics.ninetyDays")}</Button>
        </div>
      </div>

      {/* ── الصف الأول من الرسوم البيانية ───────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* الرسم الدائري: توزيع الطلبات */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.orderDistribution")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {/*
              الإصلاح: نلف المخطط في dir="ltr" لأن recharts لا يدعم RTL
              بدون هذا، المخطط الدائري قد ينعكس في اللغة العربية
            */}
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={5} dataKey="value" stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  {/* مكوّن tooltip مخصص — نص ذهبي في الوضع الليلي */}
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* الرسم الشريطي الأفقي: الفقد حسب القسم */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.lossBySection")}</CardTitle>
            <CardDescription>{t("analytics.lossSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {/*
              ═══════════════════════════════════════════════════════════
              الإصلاح الرئيسي لمشكلة العربية في الرسم الشريطي:

              المشكلة: في وضع RTL (العربية)، تتسبب recharts في إخفاء
              أسماء الأقسام على محور Y لأنها ترسم الأشرطة فوقها.

              الحل: إضافة dir="ltr" على الحاوية المباشرة للمخطط.
              هذا يجعل recharts يحسب الموضع من اليسار دائماً،
              بغض النظر عن اتجاه الصفحة.

              أيضاً: زيادة yAxisWidth في العربية لضمان ظهور الأسماء
              ═══════════════════════════════════════════════════════════
            */}
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lossBySection}
                  layout="vertical"
                  margin={{ left: chartMarginL, right: 10, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  {/* محور Y: العرض أكبر في العربية لضمان ظهور أسماء الأقسام */}
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    width={yAxisWidth}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="loss" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── جدول أداء العمال ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.workerPerformance")}</CardTitle>
          <CardDescription>{t("analytics.workerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 ps-4">{t("analytics.rank")}</TableHead>
                <TableHead>{t("analytics.worker")}</TableHead>
                <TableHead>{t("analytics.section")}</TableHead>
                <TableHead className="text-end">{t("analytics.operations")}</TableHead>
                <TableHead className="text-end">{t("analytics.avgLoss")}</TableHead>
                <TableHead>{t("analytics.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workerPerformance.map((w, i) => (
                <TableRow key={i}>
                  <TableCell className="font-bold text-muted-foreground ps-4">#{i + 1}</TableCell>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>{w.section}</TableCell>
                  <TableCell className="text-end">{w.operations}</TableCell>
                  <TableCell className="text-end font-mono">{w.loss}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={w.status === t("analytics.excellent") ? 'default' : 'destructive'}
                      className={w.status === t("analytics.excellent") ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                    >
                      {w.status}
                    </Badge>
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
