import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const OP_COLORS: Record<string, string> = {
  "normal": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-transparent",
  "split": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-transparent",
  "merge": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-transparent",
  "tree-build": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-transparent",
  "rework": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-transparent",
  "scrap": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-transparent",
  "return": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-transparent",
  "direct-melt": "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border-transparent",
};

export default function MovementsPage() {
  const { movements, sections, workers, orders } = useMockState();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = movements.filter(m =>
    m.qrCode.toLowerCase().includes(search.toLowerCase()) ||
    orders.find(o => o.id === m.orderId)?.orderCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("movements.title")}</h1>
        <Button variant="outline" onClick={() => toast({title: t("movements.exportCsv"), description: t("movements.exportSoon")})}>
          <Download className="w-4 h-4 me-2" />
          {t("movements.exportCsv")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("movements.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("movements.allOperations")}</SelectItem>
                <SelectItem value="normal">{t("movements.normal")}</SelectItem>
                <SelectItem value="split">{t("movements.split")}</SelectItem>
                <SelectItem value="tree-build">{t("movements.treeBuild")}</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("movements.allSections")}</SelectItem>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>{t("movements.time")}</TableHead>
              <TableHead>{t("movements.qrOrder")}</TableHead>
              <TableHead>{t("movements.opType")}</TableHead>
              <TableHead>{t("movements.route")}</TableHead>
              <TableHead>{t("movements.worker")}</TableHead>
              <TableHead className="text-end">{t("movements.before")}</TableHead>
              <TableHead className="text-end">{t("movements.after")}</TableHead>
              <TableHead className="text-end">{t("movements.lossG")}</TableHead>
              <TableHead className="text-end">{t("movements.lossPercent")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(m => {
              const fromSec = sections.find(s => s.id === m.fromSectionId)?.name;
              const toSec = sections.find(s => s.id === m.toSectionId)?.name;
              const workerName = workers.find(w => w.id === m.workerId)?.name;
              const orderCode = orders.find(o => o.id === m.orderId)?.orderCode;
              const isExpanded = expandedId === m.id;

              return (
                <React.Fragment key={m.id}>
                  <TableRow className="cursor-pointer group" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                    <TableCell>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-medium">{m.qrCode}</span>
                        <span className="text-[10px] text-muted-foreground">{orderCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${OP_COLORS[m.operationType]} uppercase text-[10px] tracking-wider`} variant="outline">
                        {m.operationType.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground">{fromSec}</span>
                      <ArrowRight className="inline w-3 h-3 mx-1 text-border" />
                      <span className="font-medium">{toSec}</span>
                    </TableCell>
                    <TableCell className="text-sm">{workerName}</TableCell>
                    <TableCell className="text-end font-mono text-sm">{m.weightBefore}g</TableCell>
                    <TableCell className="text-end font-mono text-sm font-medium">{m.weightAfter}g</TableCell>
                    <TableCell className="text-end font-mono text-sm">{m.lossGrams}g</TableCell>
                    <TableCell className="text-end font-mono text-sm">
                      <span className={m.lossPercent > 5 ? "text-destructive font-bold" : m.lossPercent > 2 ? "text-yellow-600 font-medium" : "text-green-600"}>
                        {m.lossPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={10} className="p-0 border-b">
                        <div className="p-6 grid grid-cols-3 gap-6 shadow-inner">
                          <div className="col-span-2 space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              {t("movements.operationDetails")}
                              <Badge variant="secondary" className="font-mono">{m.id}</Badge>
                            </h4>
                            <div className="flex items-center gap-4 text-sm bg-background border rounded-md p-3 w-max">
                              <span className="font-medium px-2 py-1 bg-muted rounded">{fromSec}</span>
                              <div className="w-16 h-px bg-primary relative">
                                <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded">{toSec}</span>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t("movements.notes")}</p>
                              <p className="text-sm bg-background border p-3 rounded-md min-h-[60px]">{m.notes || t("movements.noNotes")}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-semibold">{t("movements.metadata")}</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between border-b pb-1">
                                <span className="text-muted-foreground">{t("movements.recordedBy")}</span>
                                <span className="font-medium">{workerName}</span>
                              </div>
                              <div className="flex justify-between border-b pb-1">
                                <span className="text-muted-foreground">{t("movements.orderId")}</span>
                                <span className="font-mono">{orderCode}</span>
                              </div>
                              <div className="flex justify-between border-b pb-1">
                                <span className="text-muted-foreground">{t("movements.sysTimestamp")}</span>
                                <span className="font-mono text-xs">{m.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
        <div className="p-4 border-t text-sm text-muted-foreground flex justify-between items-center">
          <span>{t("movements.showing")} 1-{filtered.length} / {filtered.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>{t("movements.previous")}</Button>
            <Button variant="outline" size="sm" disabled>{t("movements.next")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
