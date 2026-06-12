// ============================================================
// سجل التغييرات — عرض جميع التعديلات التي أُجريت على البيانات
// ============================================================
import React, { useState } from "react";
  import { useMockState } from "@/lib/mock-state";
  import { useTranslation } from "react-i18next";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { FileText, AlertTriangle, Activity, Shield, Download, Search, X } from "lucide-react";
  import { AuditLog } from "@/lib/mock-data";

  const severityConfig = {
    critical: { label: "Critical", cls: "bg-destructive/15 text-destructive border-destructive/30", icon: "🔴" },
    warning:  { label: "Warning",  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: "🟡" },
    info:     { label: "Info",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: "🔵" },
  };

  const entityConfig: Record<string, string> = {
    Order: "bg-primary/15 text-primary",
    Movement: "bg-green-500/15 text-green-400",
    Box: "bg-purple-500/15 text-purple-400",
    Tree: "bg-emerald-500/15 text-emerald-400",
    Worker: "bg-orange-500/15 text-orange-400",
    QC: "bg-cyan-500/15 text-cyan-400",
  };

  export default function AuditLogPage() {
    const { t } = useTranslation();
    const { auditLogs } = useMockState();
    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const filtered = auditLogs.filter(log => {
      const matchSearch = !search || [log.entityCode, log.relatedRef, log.editedBy, log.changedField, log.reason]
        .some(v => v.toLowerCase().includes(search.toLowerCase()));
      const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
      const matchEntity = entityFilter === "all" || log.entityType === entityFilter;
      return matchSearch && matchSeverity && matchEntity;
    });

    const counts = {
      total: auditLogs.length,
      weight: auditLogs.filter(l => l.changedField.toLowerCase().includes("weight") || l.changedField.toLowerCase().includes("loss")).length,
      movements: auditLogs.filter(l => l.entityType === "Movement").length,
      critical: auditLogs.filter(l => l.severity === "critical").length,
    };

    const kpiCards = [
      { label: t("auditLog.changesToday"), value: counts.total, icon: FileText, color: "text-primary" },
      { label: t("auditLog.weightRelated"), value: counts.weight, icon: Activity, color: "text-yellow-400" },
      { label: t("auditLog.movementUpdates"), value: counts.movements, icon: Activity, color: "text-green-400" },
      { label: t("auditLog.criticalChanges"), value: counts.critical, icon: Shield, color: "text-destructive" },
    ];

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auditLog.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auditLog.subtitle")}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((card) => (
            <Card key={card.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  </div>
                  <card.icon className={`h-7 w-7 ${card.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          {/* Main table */}
          <div className="flex-1 min-w-0">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                  <CardTitle className="text-sm">{t("auditLog.allChanges")}</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Download className="h-3.5 w-3.5" /> {t("auditLog.exportLog")}
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder={t("auditLog.search")} value={search} onChange={e => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs" />
                    {search && <button onClick={() => setSearch("")} className="absolute right-2 top-2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                  </div>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder={t("auditLog.severity")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">🔴 Critical</SelectItem>
                      <SelectItem value="warning">🟡 Warning</SelectItem>
                      <SelectItem value="info">🔵 Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder={t("auditLog.entityType")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entities</SelectItem>
                      {["Order","Movement","Box","Tree","Worker","QC"].map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-xs">Change ID</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">{t("auditLog.relatedRef")}</TableHead>
                        <TableHead className="text-xs">{t("auditLog.entityType")}</TableHead>
                        <TableHead className="text-xs">{t("auditLog.entityCode")}</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">{t("auditLog.changedField")}</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">{t("auditLog.oldValue")}</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">{t("auditLog.newValue")}</TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">{t("auditLog.editedBy")}</TableHead>
                        <TableHead className="text-xs">{t("auditLog.severity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 && (
                        <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No changes found</TableCell></TableRow>
                      )}
                      {filtered.map(log => {
                        const sev = severityConfig[log.severity];
                        const isSelected = selectedLog?.id === log.id;
                        return (
                          <TableRow key={log.id}
                            className={`cursor-pointer border-border/50 text-xs ${isSelected ? "bg-primary/10" : "hover:bg-muted/30"}`}
                            onClick={() => setSelectedLog(log)}>
                            <TableCell className="font-mono text-[10px] text-muted-foreground">{log.id}</TableCell>
                            <TableCell className="font-mono text-[10px] hidden md:table-cell">{log.relatedRef}</TableCell>
                            <TableCell>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${entityConfig[log.entityType] || "bg-muted text-muted-foreground"}`}>
                                {log.entityType}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[10px]">{log.entityCode}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs">{log.changedField}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="line-through text-muted-foreground text-[10px]">{log.oldValue}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-primary font-medium text-[10px]">{log.newValue}</span>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-xs">{log.editedBy}</TableCell>
                            <TableCell>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sev.cls}`}>{sev.icon} {sev.label}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground border-t border-border/50">
                  <span>Showing {filtered.length} of {auditLogs.length} changes</span>
                  <span className="italic">Every modification is stored automatically for review and traceability.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Selected Change Details */}
          <div className="w-full xl:w-80 shrink-0">
            <Card className="border-border/50 xl:sticky xl:top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("auditLog.selectedDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedLog ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{t("auditLog.noSelection")}</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {[
                      ["Change ID", selectedLog.id],
                      ["Related Ref", selectedLog.relatedRef],
                      ["Entity Type", selectedLog.entityType],
                      ["Entity Code", selectedLog.entityCode],
                      ["Changed Field", selectedLog.changedField],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium text-end max-w-[60%] truncate">{v}</span>
                      </div>
                    ))}
                    <div className="border-t border-border/50 pt-2">
                      <p className="text-muted-foreground mb-1">{t("auditLog.oldValue")}</p>
                      <p className="line-through text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">{selectedLog.oldValue}</p>
                      <p className="text-muted-foreground mt-2 mb-1">{t("auditLog.newValue")}</p>
                      <p className="text-primary font-medium font-mono bg-primary/10 px-2 py-1 rounded">{selectedLog.newValue}</p>
                    </div>
                    <div className="border-t border-border/50 pt-2">
                      <p className="text-muted-foreground mb-1">{t("auditLog.changeNote")}</p>
                      <p className="bg-muted/50 px-2 py-1.5 rounded text-xs">{selectedLog.reason}</p>
                    </div>
                    <div className="border-t border-border/50 pt-2 space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auditLog.editedBy")}</span><span className="font-medium">{selectedLog.editedBy}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auditLog.editedAt")}</span><span>{new Date(selectedLog.editedAt).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("auditLog.approvedBy")}</span><span className="font-medium">{selectedLog.approvedBy}</span></div>
                    </div>
                    <div className="pt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${severityConfig[selectedLog.severity].cls}`}>
                        {severityConfig[selectedLog.severity].icon} {severityConfig[selectedLog.severity].label}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  