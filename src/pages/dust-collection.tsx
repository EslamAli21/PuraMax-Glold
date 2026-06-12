// ============================================================
// صفحة تجميع الغبار — تسجيل ومتابعة عمليات تجميع غبار الذهب
// ============================================================
import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Wind, Plus, Download, TrendingUp, Scale, Archive, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface DustEntry {
  id: string;
  date: string;
  sectionId: string;
  collectedBy: string;
  weightGrams: number;
  dustType: "floor-sweep" | "polishing" | "casting" | "filing" | "mixed";
  status: "pending-refinery" | "sent-to-refinery" | "returned";
  notes: string;
}

const MOCK_DUST: DustEntry[] = [
  { id: "DC-001", date: "2025-05-24 08:30", sectionId: "s4", collectedBy: "Faisal Noor", weightGrams: 12.45, dustType: "casting", status: "pending-refinery", notes: "" },
  { id: "DC-002", date: "2025-05-23 17:00", sectionId: "s5", collectedBy: "Zaid Mahmoud", weightGrams: 7.82, dustType: "polishing", status: "sent-to-refinery", notes: "" },
  { id: "DC-003", date: "2025-05-23 09:00", sectionId: "s6", collectedBy: "Tariq Ahmed", weightGrams: 4.10, dustType: "filing", status: "returned", notes: "" },
  { id: "DC-004", date: "2025-05-22 17:30", sectionId: "s4", collectedBy: "Faisal Noor", weightGrams: 15.30, dustType: "floor-sweep", status: "sent-to-refinery", notes: "" },
  { id: "DC-005", date: "2025-05-22 08:00", sectionId: "s3", collectedBy: "Hassan Saeed", weightGrams: 6.75, dustType: "mixed", status: "returned", notes: "" },
  { id: "DC-006", date: "2025-05-21 17:00", sectionId: "s5", collectedBy: "Zaid Mahmoud", weightGrams: 9.60, dustType: "polishing", status: "returned", notes: "" },
  { id: "DC-007", date: "2025-05-20 08:30", sectionId: "s4", collectedBy: "Faisal Noor", weightGrams: 11.25, dustType: "casting", status: "returned", notes: "" },
  { id: "DC-008", date: "2025-05-19 16:00", sectionId: "s6", collectedBy: "Tariq Ahmed", weightGrams: 3.50, dustType: "filing", status: "pending-refinery", notes: "" },
];

type DustStatus = DustEntry["status"];
type DustType = DustEntry["dustType"];

export default function DustCollectionPage() {
  const { sections, workers } = useMockState();
  const { toast } = useToast();
  const { t } = useTranslation();

  const dustTypeLabel = (type: DustType): string => ({
    "floor-sweep": t("dustCollection.type_floor"),
    "polishing":   t("dustCollection.type_polishing"),
    "casting":     t("dustCollection.type_casting"),
    "filing":      t("dustCollection.type_filing"),
    "mixed":       t("dustCollection.type_mixed"),
  }[type]);

  const statusConfig = (status: DustStatus) => ({
    "pending-refinery": { label: t("dustCollection.status_pending"), cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
    "sent-to-refinery": { label: t("dustCollection.status_sent"),    cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
    "returned":         { label: t("dustCollection.status_returned"), cls: "bg-green-500/15 text-green-600 border-green-500/30" },
  }[status]);

  // تهيئة القائمة: نقرأ أولاً أي غبار محول من صفحة الميزان عبر localStorage
  const [entries, setEntries] = useState<DustEntry[]>(() => {
    try {
      const fromScale = JSON.parse(localStorage.getItem("puramax_scale_dust") || "[]") as DustEntry[];
      if (fromScale.length > 0) {
        localStorage.removeItem("puramax_scale_dust");
        // ندمج مدخلات الميزان مع البيانات الأولية مع تجنب التكرار
        const existingIds = new Set(MOCK_DUST.map(d => d.id));
        const newFromScale = fromScale.filter(d => !existingIds.has(d.id));
        return [...newFromScale, ...MOCK_DUST];
      }
    } catch (_) {}
    return MOCK_DUST;
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ sectionId: "", collectedBy: "", weightGrams: "", dustType: "mixed" as DustType, notes: "" });

  const filtered = entries.filter(e => {
    const sec = sections.find(s => s.id === e.sectionId);
    const matchSearch = e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.collectedBy.toLowerCase().includes(search.toLowerCase()) ||
      (sec?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchSection = filterSection === "all" || e.sectionId === filterSection;
    return matchSearch && matchStatus && matchSection;
  });

  const totalCollected = entries.reduce((s, e) => s + e.weightGrams, 0);
  const totalPending   = entries.filter(e => e.status === "pending-refinery").reduce((s, e) => s + e.weightGrams, 0);
  const totalSent      = entries.filter(e => e.status === "sent-to-refinery").reduce((s, e) => s + e.weightGrams, 0);
  const totalReturned  = entries.filter(e => e.status === "returned").reduce((s, e) => s + e.weightGrams, 0);

  const handleAdd = () => {
    if (!form.sectionId || !form.collectedBy || !form.weightGrams) {
      toast({ title: t("dustCollection.missingFields"), description: t("dustCollection.missingFieldsDesc"), variant: "destructive" });
      return;
    }
    const newEntry: DustEntry = {
      id: `DC-${String(entries.length + 1).padStart(3, "0")}`,
      date: new Date().toLocaleString("en-GB", { hour12: false }).replace(",", ""),
      sectionId: form.sectionId,
      collectedBy: form.collectedBy,
      weightGrams: parseFloat(form.weightGrams),
      dustType: form.dustType,
      status: "pending-refinery",
      notes: form.notes,
    };
    setEntries(prev => [newEntry, ...prev]);
    setForm({ sectionId: "", collectedBy: "", weightGrams: "", dustType: "mixed", notes: "" });
    setShowDialog(false);
    toast({ title: t("dustCollection.entryAdded"), description: `${newEntry.weightGrams}g — ${sections.find(s => s.id === form.sectionId)?.name}` });
  };

  const handleSendToRefinery = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "sent-to-refinery" } : e));
    toast({ title: t("dustCollection.sentToRefineryTitle"), description: `${id} ${t("dustCollection.markedSent")}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wind className="w-8 h-8 text-primary" />
            {t("dustCollection.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("dustCollection.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: t("dustCollection.exportTitle"), description: t("dustCollection.exportSoon") })}>
            <Download className="w-4 h-4 me-2" /> {t("dustCollection.exportCsv")}
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 me-2" /> {t("dustCollection.logDust")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("dustCollection.totalCollected"),  value: `${totalCollected.toFixed(2)}g`, icon: Archive, color: "text-foreground" },
          { label: t("dustCollection.pendingRefinery"), value: `${totalPending.toFixed(2)}g`,   icon: Scale,   color: "text-yellow-500" },
          { label: t("dustCollection.sentToRefinery"),  value: `${totalSent.toFixed(2)}g`,      icon: Send,    color: "text-blue-500" },
          { label: t("dustCollection.returnedPure"),    value: `${totalReturned.toFixed(2)}g`,  icon: TrendingUp, color: "text-green-500" },
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
            <Input
              placeholder={t("dustCollection.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dustCollection.allStatuses")}</SelectItem>
                <SelectItem value="pending-refinery">{t("dustCollection.status_pending")}</SelectItem>
                <SelectItem value="sent-to-refinery">{t("dustCollection.status_sent")}</SelectItem>
                <SelectItem value="returned">{t("dustCollection.status_returned")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dustCollection.allSections")}</SelectItem>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("dustCollection.collectionEntries")}</CardTitle>
          <CardDescription>{filtered.length} {t("dustCollection.entriesFound")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dustCollection.entryId")}</TableHead>
                  <TableHead>{t("dustCollection.dateTime")}</TableHead>
                  <TableHead>{t("dustCollection.section")}</TableHead>
                  <TableHead>{t("dustCollection.collectedBy")}</TableHead>
                  <TableHead>{t("dustCollection.dustType")}</TableHead>
                  <TableHead className="text-right">{t("dustCollection.weight")}</TableHead>
                  <TableHead>{t("dustCollection.status")}</TableHead>
                  <TableHead>{t("dustCollection.notes")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      {t("dustCollection.noEntries")}
                    </TableCell>
                  </TableRow>
                ) : filtered.map(entry => {
                  const sec = sections.find(s => s.id === entry.sectionId);
                  const st = statusConfig(entry.status);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs font-semibold">{entry.id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{sec?.name || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entry.collectedBy}</TableCell>
                      <TableCell className="text-xs">{dustTypeLabel(entry.dustType)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{entry.weightGrams.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{entry.notes || "—"}</TableCell>
                      <TableCell>
                        {entry.status === "pending-refinery" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => handleSendToRefinery(entry.id)}>
                            <Send className="w-3 h-3 me-1" /> {t("dustCollection.send")}
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

      {/* Section Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dustCollection.collectionBySection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sections.map(sec => {
              const secEntries = entries.filter(e => e.sectionId === sec.id);
              const total = secEntries.reduce((s, e) => s + e.weightGrams, 0);
              if (total === 0) return null;
              return (
                <div key={sec.id} className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">{sec.name}</p>
                  <p className="text-lg font-bold text-primary">{total.toFixed(2)}g</p>
                  <p className="text-xs text-muted-foreground">{secEntries.length} {t("dustCollection.entries")}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dustCollection.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("dustCollection.sectionLabel")}</Label>
              <Select value={form.sectionId} onValueChange={v => setForm(f => ({ ...f, sectionId: v }))}>
                <SelectTrigger><SelectValue placeholder={t("dustCollection.selectSection")} /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dustCollection.collectedByLabel")}</Label>
              <Select value={form.collectedBy} onValueChange={v => setForm(f => ({ ...f, collectedBy: v }))}>
                <SelectTrigger><SelectValue placeholder={t("dustCollection.selectWorker")} /></SelectTrigger>
                <SelectContent>
                  {workers.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("dustCollection.weightLabel")}</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.weightGrams}
                  onChange={e => setForm(f => ({ ...f, weightGrams: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("dustCollection.dustTypeLabel")}</Label>
                <Select value={form.dustType} onValueChange={v => setForm(f => ({ ...f, dustType: v as DustType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["floor-sweep","polishing","casting","filing","mixed"] as DustType[]).map(k => (
                      <SelectItem key={k} value={k}>{dustTypeLabel(k)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dustCollection.notesLabel")}</Label>
              <Textarea placeholder={t("dustCollection.optionalNotes")} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("dustCollection.cancel")}</Button>
            <Button onClick={handleAdd}>{t("dustCollection.addEntry")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
