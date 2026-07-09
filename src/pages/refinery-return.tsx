// ============================================================
// صفحة إرجاع التكرير — إدارة دفعات إرسال الذهب للتكرير واستعادته
// ============================================================
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Repeat2, Plus, Download, TrendingDown, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// ── نوع بيانات دفعة إرجاع التكرير ──
interface RefineryBatch {
  id: string;                         // معرّف الدفعة
  sentDate: string;                   // تاريخ الإرسال إلى المكرر
  returnDate: string | null;          // تاريخ الاستعادة (null = لم تُستعَد بعد)
  refineryName: string;               // اسم شركة التكرير
  sentWeightGrams: number;            // الوزن المُرسَل بالغرام
  returnedWeightGrams: number | null; // الوزن المُستعَد (null = لم يُستعَد)
  purityPercent: number | null;       // نسبة النقاء بعد التكرير (null = غير معروف)
  lossPercent: number | null;         // نسبة الفقد خلال التكرير (null = غير معروف)
  status: "in-transit" | "processing" | "returned"; // حالة الدفعة
  notes: string;                      // ملاحظات إضافية
}

// ── بيانات تجريبية للاختبار — تُستبدل ببيانات API حقيقية في الإنتاج ──
const MOCK_BATCHES: RefineryBatch[] = [
  { id: "RR-001", sentDate: "2025-05-10", returnDate: "2025-05-20", refineryName: "Dubai Gold Refinery", sentWeightGrams: 48.75, returnedWeightGrams: 44.20, purityPercent: 99.5, lossPercent: 9.33, status: "returned", notes: "" },
  { id: "RR-002", sentDate: "2025-05-18", returnDate: null, refineryName: "Al Etihad Refinery", sentWeightGrams: 22.92, returnedWeightGrams: null, purityPercent: null, lossPercent: null, status: "processing", notes: "" },
  { id: "RR-003", sentDate: "2025-04-25", returnDate: "2025-05-05", refineryName: "Dubai Gold Refinery", sentWeightGrams: 63.40, returnedWeightGrams: 58.10, purityPercent: 99.2, lossPercent: 8.36, status: "returned", notes: "" },
  { id: "RR-004", sentDate: "2025-05-24", returnDate: null, refineryName: "Dubai Gold Refinery", sentWeightGrams: 3.50, returnedWeightGrams: null, purityPercent: null, lossPercent: null, status: "in-transit", notes: "" },
];

const REFINERIES = ["Dubai Gold Refinery", "Al Etihad Refinery", "Sharjah Metal Works", "Abu Dhabi Smelters"];

type BatchStatus = RefineryBatch["status"];

export default function RefineryReturnPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const statusConfig = (status: BatchStatus) => ({
    "in-transit": { label: t("refineryReturn.inTransit"),  cls: "bg-orange-500/15 text-orange-500 border-orange-500/30", icon: Clock },
    "processing": { label: t("refineryReturn.processing"), cls: "bg-blue-500/15 text-blue-500 border-blue-500/30",   icon: Clock },
    "returned":   { label: t("refineryReturn.returned"),   cls: "bg-green-500/15 text-green-600 border-green-500/30", icon: CheckCircle2 },
  }[status]);

  const [batches, setBatches] = useState<RefineryBatch[]>(MOCK_BATCHES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState<string | null>(null);
  const [returnWeight, setReturnWeight] = useState("");
  const [returnPurity, setReturnPurity] = useState("99.5");
  const [form, setForm] = useState({ refineryName: REFINERIES[0], sentWeightGrams: "", notes: "" });

  const filtered = batches.filter(b => {
    const matchSearch = b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.refineryName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSent     = batches.reduce((s, b) => s + b.sentWeightGrams, 0);
  const totalReturned = batches.filter(b => b.returnedWeightGrams).reduce((s, b) => s + (b.returnedWeightGrams || 0), 0);
  const avgLoss       = batches.filter(b => b.lossPercent !== null).reduce((s, b, _, a) => s + (b.lossPercent || 0) / a.length, 0);
  const inProgress    = batches.filter(b => b.status !== "returned").length;

  const handleAddBatch = () => {
    if (!form.sentWeightGrams || parseFloat(form.sentWeightGrams) <= 0) {
      toast({ title: t("refineryReturn.invalidWeight"), description: t("refineryReturn.invalidWeightDesc"), variant: "destructive" });
      return;
    }
    const newBatch: RefineryBatch = {
      id: `RR-${String(batches.length + 1).padStart(3, "0")}`,
      sentDate: new Date().toISOString().slice(0, 10),
      returnDate: null,
      refineryName: form.refineryName,
      sentWeightGrams: parseFloat(form.sentWeightGrams),
      returnedWeightGrams: null,
      purityPercent: null,
      lossPercent: null,
      status: "in-transit",
      notes: form.notes,
    };
    setBatches(prev => [newBatch, ...prev]);
    setForm({ refineryName: REFINERIES[0], sentWeightGrams: "", notes: "" });
    setShowDialog(false);
    toast({ title: t("refineryReturn.batchCreated"), description: `${newBatch.id} → ${newBatch.refineryName}` });
  };

  const handleReturn = (id: string) => {
    const rw = parseFloat(returnWeight);
    const batch = batches.find(b => b.id === id);
    if (!batch || !rw || rw <= 0) {
      toast({ title: t("refineryReturn.invalidWeight"), description: t("refineryReturn.invalidReturnWeight"), variant: "destructive" });
      return;
    }
    const lossPercent = ((batch.sentWeightGrams - rw) / batch.sentWeightGrams) * 100;
    setBatches(prev => prev.map(b => b.id === id ? {
      ...b, status: "returned",
      returnDate: new Date().toISOString().slice(0, 10),
      returnedWeightGrams: rw,
      purityPercent: parseFloat(returnPurity),
      lossPercent: parseFloat(lossPercent.toFixed(2)),
    } : b));
    setShowReturnDialog(null);
    setReturnWeight("");
    toast({ title: t("refineryReturn.returnRecorded"), description: `${rw}g — ${t("refineryReturn.lossResult")} ${lossPercent.toFixed(2)}%` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat2 className="w-8 h-8 text-primary" />
            {t("refineryReturn.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("refineryReturn.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: t("refineryReturn.exportTitle"), description: t("refineryReturn.exportSoon") })}>
            <Download className="w-4 h-4 me-2" /> {t("refineryReturn.exportCsv")}
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 me-2" /> {t("refineryReturn.newBatch")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("refineryReturn.totalSent"),     value: `${totalSent.toFixed(2)}g`,     icon: TrendingDown,  color: "text-foreground" },
          { label: t("refineryReturn.totalReturned"), value: `${totalReturned.toFixed(2)}g`, icon: CheckCircle2,  color: "text-green-500" },
          { label: t("refineryReturn.avgLoss"),       value: `${avgLoss.toFixed(2)}%`,       icon: TrendingDown,  color: "text-red-500" },
          { label: t("refineryReturn.inProgress"),    value: `${inProgress} ${inProgress !== 1 ? t("refineryReturn.batches") : t("refineryReturn.batch")}`, icon: Clock, color: "text-blue-500" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input placeholder={t("refineryReturn.searchPlaceholder")}
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("refineryReturn.allStatuses")}</SelectItem>
                <SelectItem value="in-transit">{t("refineryReturn.inTransit")}</SelectItem>
                <SelectItem value="processing">{t("refineryReturn.processing")}</SelectItem>
                <SelectItem value="returned">{t("refineryReturn.returned")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("refineryReturn.refineryBatches")}</CardTitle>
          <CardDescription>{filtered.length} {t("refineryReturn.batchesFound")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("refineryReturn.batchId")}</TableHead>
                  <TableHead>{t("refineryReturn.refinery")}</TableHead>
                  <TableHead>{t("refineryReturn.sentDate")}</TableHead>
                  <TableHead>{t("refineryReturn.returnDate")}</TableHead>
                  <TableHead className="text-right">{t("refineryReturn.sentG")}</TableHead>
                  <TableHead className="text-right">{t("refineryReturn.returnedG")}</TableHead>
                  <TableHead className="text-right">{t("refineryReturn.purity")}</TableHead>
                  <TableHead className="text-right">{t("refineryReturn.lossPercent")}</TableHead>
                  <TableHead>{t("refineryReturn.status")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      {t("refineryReturn.noBatches")}
                    </TableCell>
                  </TableRow>
                ) : filtered.map(batch => {
                  const st = statusConfig(batch.status);
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs font-semibold">{batch.id}</TableCell>
                      <TableCell className="text-sm">{batch.refineryName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{batch.sentDate}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{batch.returnDate || "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{batch.sentWeightGrams.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-green-600">
                        {batch.returnedWeightGrams !== null ? batch.returnedWeightGrams.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {batch.purityPercent !== null ? `${batch.purityPercent}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {batch.lossPercent !== null ? (
                          <span className={`text-sm font-semibold ${batch.lossPercent > 10 ? "text-destructive" : "text-yellow-500"}`}>
                            {batch.lossPercent.toFixed(2)}%
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${st.cls}`}>
                          <StatusIcon className="w-3 h-3 me-1 inline" />{st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {batch.status !== "returned" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => { setShowReturnDialog(batch.id); setReturnWeight(""); }}>
                            {t("refineryReturn.recordReturn")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary by refinery */}
      <div className="grid md:grid-cols-2 gap-4">
        {REFINERIES.filter(r => batches.some(b => b.refineryName === r && b.lossPercent !== null)).map(refinery => {
          const rb = batches.filter(b => b.refineryName === refinery && b.lossPercent !== null);
          const avgL = rb.reduce((s, b) => s + (b.lossPercent || 0), 0) / rb.length;
          const totalR = rb.reduce((s, b) => s + (b.returnedWeightGrams || 0), 0);
          return (
            <Card key={refinery}>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">{refinery}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">{t("refineryReturn.statBatches")}</p>
                    <p className="text-lg font-bold">{rb.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">{t("refineryReturn.goldRecovered")}</p>
                    <p className="text-lg font-bold text-green-500">{totalR.toFixed(1)}g</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">{t("refineryReturn.avgLoss")}</p>
                    <p className={`text-lg font-bold ${avgL > 10 ? "text-destructive" : "text-yellow-500"}`}>{avgL.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Batch Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("refineryReturn.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("refineryReturn.refineryLabel")}</Label>
              <Select value={form.refineryName} onValueChange={v => setForm(f => ({ ...f, refineryName: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFINERIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("refineryReturn.sentWeightLabel")}</Label>
              <Input type="number" step="0.01" placeholder="0.00"
                value={form.sentWeightGrams} onChange={e => setForm(f => ({ ...f, sentWeightGrams: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("refineryReturn.notesLabel")}</Label>
              <Input placeholder={t("refineryReturn.optionalNotes")}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("refineryReturn.cancel")}</Button>
            <Button onClick={handleAddBatch}>{t("refineryReturn.createBatch")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Return Dialog */}
      <Dialog open={!!showReturnDialog} onOpenChange={() => setShowReturnDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("refineryReturn.returnDialogTitle")} — {showReturnDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("refineryReturn.returnWeightLabel")}</Label>
              <Input type="number" step="0.01" placeholder="0.00"
                value={returnWeight} onChange={e => setReturnWeight(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("refineryReturn.purityLabel")}</Label>
              <Input type="number" step="0.1" placeholder="99.5"
                value={returnPurity} onChange={e => setReturnPurity(e.target.value)} />
            </div>
            {showReturnDialog && returnWeight && (
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <p className="text-muted-foreground">{t("refineryReturn.estimatedLoss")}</p>
                <p className="font-bold text-destructive">
                  {(((batches.find(b => b.id === showReturnDialog)?.sentWeightGrams || 0) - parseFloat(returnWeight || "0")) /
                    (batches.find(b => b.id === showReturnDialog)?.sentWeightGrams || 1) * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(null)}>{t("refineryReturn.cancel")}</Button>
            <Button onClick={() => showReturnDialog && handleReturn(showReturnDialog)}>{t("refineryReturn.recordReturnBtn")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
