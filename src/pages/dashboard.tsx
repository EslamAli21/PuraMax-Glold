import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, TrendingDown, Clock, Activity, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { currentRole } = useAuth();
  const { orders, movements, alerts } = useMockState();
  const { t } = useTranslation();

  if (currentRole === "Owner" || currentRole === "Production Manager") {
    const activeOrders = orders.filter(o => o.status === "in-production" || o.status === "approved").length;
    const goldInProduction = orders.filter(o => o.status === "in-production").reduce((acc, o) => acc + o.totalWeightGrams, 0);

    const chartData = Array.from({ length: 14 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        loss: Math.random() * 2 + 1,
      };
    });

    const avgLoss = (chartData.reduce((acc, curr) => acc + curr.loss, 0) / chartData.length).toFixed(2);

    const orderStatusData = [
      { name: t("analytics.pending"), count: orders.filter(o => o.status === 'pending').length, fill: 'hsl(var(--chart-1))' },
      { name: t("analytics.approved"), count: orders.filter(o => o.status === 'approved').length, fill: 'hsl(var(--chart-2))' },
      { name: t("analytics.production"), count: orders.filter(o => o.status === 'in-production').length, fill: 'hsl(var(--chart-3))' },
      { name: t("analytics.done"), count: orders.filter(o => o.status === 'completed').length, fill: 'hsl(var(--chart-4))' },
    ];

    const unreadAlerts = alerts.filter(a => !a.isRead && !a.isDismissed).slice(0, 5);
    const recentMovements = movements.slice(0, 8);

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.activeOrders")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders}</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.activeOrdersSub")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.goldInProduction")}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goldInProduction.toLocaleString()}g</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.goldInProductionSub")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.avgLoss")}</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgLoss}%</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.avgLossSub")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.onTimeDelivery")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.onTimeDeliverySub")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("dashboard.ordersByStatus")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("dashboard.avgDailyLoss")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="loss" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{t("dashboard.recentMovements")}</CardTitle>
              <Link href="/movements">
                <Button variant="ghost" size="sm">{t("dashboard.viewAll")}</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.time")}</TableHead>
                    <TableHead>{t("dashboard.qrCode")}</TableHead>
                    <TableHead>{t("dashboard.operation")}</TableHead>
                    <TableHead>{t("dashboard.path")}</TableHead>
                    <TableHead className="text-end">{t("dashboard.loss")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMovements.map((movement) => {
                    const time = new Date(movement.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="text-muted-foreground text-xs">{time}</TableCell>
                        <TableCell className="font-mono text-xs">{movement.qrCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[10px]">{movement.operationType}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {movement.fromSectionId} → {movement.toSectionId}
                        </TableCell>
                        <TableCell className="text-end text-xs">
                          <span className={movement.lossPercent > 5 ? "text-destructive font-bold" : movement.lossPercent > 2 ? "text-yellow-600 font-medium" : "text-green-600"}>
                            {movement.lossPercent}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{t("dashboard.activeAlerts")}</CardTitle>
              <Link href="/alerts">
                <Button variant="ghost" size="sm">{t("dashboard.viewAll")}</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {unreadAlerts.length > 0 ? unreadAlerts.map(alert => (
                <div key={alert.id} className="flex flex-col gap-1 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-destructive' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <span className="text-xs font-semibold uppercase">{alert.type.replace("-", " ")}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <span className="text-sm">{alert.message}</span>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noActiveAlerts")}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentRole === "Designer") {
    const assignedOrders = orders.filter(o => o.status === "pending" || o.status === "approved");
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.designerTitle")}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.myAssignments")}</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <TableCell>
                      <Badge variant="outline">{o.status}</Badge>
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

  if (currentRole === "Scale Operator") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.scaleTitle")}</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.todayOperations")}</CardTitle>
            </CardHeader>
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

  if (currentRole === "Worker" || currentRole === "Tree Responsible" || currentRole === "3D Printer") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl border-primary/20">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-primary/20">
              <QrCode className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("dashboard.scanToStart")}</h2>
            <p className="text-muted-foreground mb-8">{t("dashboard.scanDescription")}</p>
            <Button size="lg" className="w-full h-16 text-lg font-bold">
              <QrCode className="w-6 h-6 me-2" />
              {t("dashboard.scanQrCode")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.departmentStats")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">{t("dashboard.ordersProcessing")}</span>
                <span className="font-bold">{orders.filter(o => o.status === "in-production").length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">{t("dashboard.todayMovements")}</span>
                <span className="font-bold">{movements.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("dashboard.alerts")}</span>
                <span className="font-bold text-destructive">{alerts.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
