import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, Search, XCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AlertsPage() {
  const { alerts, orders, sections, markAlertRead, dismissAlert } = useMockState();
  const [filter, setFilter] = useState("all");
  const { t } = useTranslation();

  const filteredAlerts = alerts.filter(a => {
    if (a.isDismissed) return false;
    if (filter === "unread") return !a.isRead;
    if (filter === "high" || filter === "medium" || filter === "low") return a.severity === filter;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("alerts.title")}</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">{t("alerts.totalActive")}</p>
            <p className="text-3xl font-bold mt-2">{alerts.filter(a => !a.isDismissed).length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-primary">{t("alerts.unread")}</p>
            <p className="text-3xl font-bold mt-2 text-primary">{alerts.filter(a => !a.isRead && !a.isDismissed).length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-destructive">{t("alerts.highPriority")}</p>
            <p className="text-3xl font-bold mt-2 text-destructive">{alerts.filter(a => a.severity === 'high' && !a.isDismissed).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">{t("alerts.todayAlerts")}</p>
            <p className="text-3xl font-bold mt-2">{alerts.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">{t("alerts.allActive")}</TabsTrigger>
            <TabsTrigger value="unread">{t("alerts.unread")}</TabsTrigger>
            <TabsTrigger value="high">{t("alerts.highPriority")}</TabsTrigger>
            <TabsTrigger value="medium">{t("alerts.medium")}</TabsTrigger>
            <TabsTrigger value="low">{t("alerts.low")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
              <p>{t("alerts.noAlerts")}</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => {
            const order = orders.find(o => o.id === alert.orderId);
            const section = sections.find(s => s.id === alert.sectionId);

            return (
              <Card key={alert.id} className={`overflow-hidden transition-all ${!alert.isRead ? 'border-primary/50 shadow-md' : 'opacity-80'}`}>
                <div className="flex">
                  <div className={`w-2 shrink-0 ${
                    alert.severity === 'high' ? 'bg-destructive' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 p-5 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        {alert.type === 'high-loss' ? <AlertTriangle className="w-5 h-5 text-destructive" /> :
                         alert.type === 'delay' ? <Clock className="w-5 h-5 text-yellow-500" /> :
                         <Search className="w-5 h-5 text-blue-500" />}
                        <span className="font-semibold uppercase tracking-wider text-sm">{alert.type.replace("-", " ")}</span>
                        {!alert.isRead && <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">{t("alerts.new")}</Badge>}
                      </div>
                      <p className="text-base font-medium">{alert.message}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded">{order?.orderCode}</span>
                        <span>•</span>
                        <span>{section?.name}</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      {!alert.isRead && (
                        <Button variant="outline" size="sm" onClick={() => markAlertRead(alert.id)}>
                          {t("alerts.markRead")}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => dismissAlert(alert.id)}>
                        <XCircle className="w-4 h-4 me-2" />
                        {t("alerts.dismiss")}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
