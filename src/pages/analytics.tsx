import React from "react";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AnalyticsPage() {
  const { orders, workers, sections } = useMockState();
  const { t } = useTranslation();

  const pieData = [
    { name: t("analytics.pending"), value: orders.filter(o => o.status === 'pending').length },
    { name: t("analytics.approved"), value: orders.filter(o => o.status === 'approved').length },
    { name: t("analytics.production"), value: orders.filter(o => o.status === 'in-production').length },
    { name: t("analytics.hold"), value: orders.filter(o => o.status === 'on-hold').length },
    { name: t("analytics.done"), value: orders.filter(o => o.status === 'completed').length },
  ].filter(d => d.value > 0);

  const lossBySection = sections.map(s => ({
    name: s.name,
    loss: Math.random() * 4 + 1
  })).sort((a,b) => b.loss - a.loss);

  const workerPerformance = workers.map(w => ({
    name: w.name,
    section: sections.find(s=>s.id === w.sectionId)?.name || t("analytics.unknown"),
    operations: Math.floor(Math.random() * 100) + 20,
    loss: (Math.random() * 3).toFixed(2),
    status: Math.random() > 0.8 ? t("analytics.needsReview") : t("analytics.excellent")
  })).sort((a,b) => Number(a.loss) - Number(b.loss));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("analytics.title")}</h1>
        <div className="flex gap-1 bg-muted p-1 rounded-md">
          <Button variant="ghost" size="sm" className="bg-background shadow-sm">{t("analytics.sevenDays")}</Button>
          <Button variant="ghost" size="sm">{t("analytics.thirtyDays")}</Button>
          <Button variant="ghost" size="sm">{t("analytics.ninetyDays")}</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.orderDistribution")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.lossBySection")}</CardTitle>
            <CardDescription>{t("analytics.lossSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossBySection} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="loss" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.workerPerformance")}</CardTitle>
          <CardDescription>{t("analytics.workerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("analytics.rank")}</TableHead>
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
                  <TableCell className="font-bold text-muted-foreground">#{i + 1}</TableCell>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>{w.section}</TableCell>
                  <TableCell className="text-end">{w.operations}</TableCell>
                  <TableCell className="text-end font-mono">{w.loss}%</TableCell>
                  <TableCell>
                    <Badge variant={w.status === t("analytics.excellent") ? 'default' : 'destructive'} className={w.status === t("analytics.excellent") ? 'bg-green-100 text-green-800' : ''}>
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
