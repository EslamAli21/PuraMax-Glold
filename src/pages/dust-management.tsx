// ============================================================
  // صفحة إدارة الغبار — DUST MANAGEMENT
  // مترجمة بالكامل | نقل العناصر بين التبويبات | إشعارات لمدير الإنتاج
  // ============================================================
  import React, { useState, useCallback } from "react";
  import { useMockState } from "@/lib/mock-state";
  import { useTranslation } from "react-i18next";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Textarea } from "@/components/ui/textarea";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
  import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
  import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
  } from "@/components/ui/dropdown-menu";
  import {
    Wind, Plus, Pencil, Trash2, Bell, QrCode, Scale,
    ScanLine, Flame, CheckCircle2, Info, ArrowRightLeft,
  } from "lucide-react";
  import { useToast } from "@/hooks/use-toast";

  // ─── Utility ─────────────────────────────────────────────────────────────────
  const nowStr = () =>
    new Date().toLocaleString("en-GB", { hour12: false }).replace(",", "").trim();
  const genId  = (prefix: string, n: number) =>
    `${prefix}-${String(n).padStart(3, "0")}`;
  const autoQR = (prefix: string) =>
    `${prefix}-${Date.now().toString(36).toUpperCase()}`;

  // ─── Types ───────────────────────────────────────────────────────────────────
  interface CollectRow {
    id: string; number: number; selected: boolean;
    sectionOrTable: string; lastCollectedDate: string;
    initialWeight: string; broughtBy: string;
    qrCodeAuto: string; assignDateTime: string;
    notes: string; saved: boolean;
  }
  interface DustWeightRow {
    id: string; number: number; selected: boolean;
    scanOrCode: string; takeWeight: string; broughtBy: string;
    qrCodeAuto: string; assignDateTime: string;
    notes: string; saved: boolean;
  }
  interface MeltRow {
    id: string; number: number; selected: boolean;
    scanOrCode: string; meltedIn: "factory" | "refinery" | "";
    takeWeight: string; keratProduced: string; broughtBy: string;
    qrCodeAuto: string; assignDateTime: string; weightDate: string;
    notes: string; printApproved: boolean; saved: boolean;
  }

  // ─── Initial data ─────────────────────────────────────────────────────────────
  const INIT_COLLECT: CollectRow[] = [
    { id:"CR-001", number:1, selected:false, sectionOrTable:"Casting Section",   lastCollectedDate:"2025-05-24 08:30", initialWeight:"12.45", broughtBy:"Faisal Noor",  qrCodeAuto:"CR-20250524-001", assignDateTime:"2025-05-24 09:00", notes:"",                 saved:true  },
    { id:"CR-002", number:2, selected:false, sectionOrTable:"Polishing Section", lastCollectedDate:"2025-05-23 17:00", initialWeight:"7.82",  broughtBy:"Zaid Mahmoud", qrCodeAuto:"CR-20250523-002", assignDateTime:"2025-05-23 17:30", notes:"Mixed with filing", saved:true  },
    { id:"CR-003", number:3, selected:false, sectionOrTable:"Filing / Bench",    lastCollectedDate:"2025-05-23 09:00", initialWeight:"4.10",  broughtBy:"Tariq Ahmed",  qrCodeAuto:"CR-20250523-003", assignDateTime:"2025-05-23 09:30", notes:"",                 saved:true  },
  ];
  const INIT_DUST: DustWeightRow[] = [
    { id:"DW-001", number:1, selected:false, scanOrCode:"CR-001", takeWeight:"11.90", broughtBy:"Faisal Noor",  qrCodeAuto:"DW-20250524-001", assignDateTime:"2025-05-24 09:15", notes:"", saved:true },
    { id:"DW-002", number:2, selected:false, scanOrCode:"CR-002", takeWeight:"7.50",  broughtBy:"Zaid Mahmoud", qrCodeAuto:"DW-20250523-002", assignDateTime:"2025-05-23 17:45", notes:"", saved:true },
  ];
  const INIT_MELT: MeltRow[] = [
    { id:"WM-001", number:1, selected:false, scanOrCode:"DW-001", meltedIn:"factory",  takeWeight:"11.20", keratProduced:"18K", broughtBy:"Faisal Noor",  qrCodeAuto:"WM-20250524-001", assignDateTime:"2025-05-24 11:00", weightDate:"2025-05-24", notes:"",          printApproved:true,  saved:true  },
    { id:"WM-002", number:2, selected:false, scanOrCode:"DW-002", meltedIn:"refinery", takeWeight:"",      keratProduced:"",    broughtBy:"Zaid Mahmoud", qrCodeAuto:"WM-20250523-002", assignDateTime:"2025-05-23 19:00", weightDate:"",           notes:"Sent to Al Etihad", printApproved:false, saved:false },
  ];

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════════
  export default function DustManagementPage() {
    const { sections }   = useMockState();
    const { toast }      = useToast();
    const { t, i18n }    = useTranslation();
    const isRTL          = i18n.language === 'ar';
    const d              = (k: string) => t(`dustManagement.${k}`);

    const [activeTab, setActiveTab] = useState("collect");
    const [collectRows,   setCollectRows]   = useState<CollectRow[]>(INIT_COLLECT);
    const [dustRows,      setDustRows]      = useState<DustWeightRow[]>(INIT_DUST);
    const [meltRows,      setMeltRows]      = useState<MeltRow[]>(INIT_MELT);

    // Dialog state
    const [addCollectOpen,  setAddCollectOpen]  = useState(false);
    const [addDustOpen,     setAddDustOpen]     = useState(false);
    const [addMeltOpen,     setAddMeltOpen]     = useState(false);
    const [editTarget,      setEditTarget]      = useState<{ table:"collect"|"dust"|"melt"; row:CollectRow|DustWeightRow|MeltRow }|null>(null);

    // ─── PM Notification ───────────────────────────────────────────────────────
    const notify = useCallback((action: string, section: string, detail: string) => {
      const colors: Record<string,string> = {
        [d("notify_pmTitle")+"ADDED"]:  "text-green-400 border-green-500/40",
        [d("notify_pmTitle")+"EDITED"]: "text-blue-400 border-blue-500/40",
        [d("notify_pmTitle")+"DELETED"]:"text-red-400 border-red-500/40",
      };
      const cls = action.includes("DELETE") ? "text-red-400 border-red-500/40"
                : action.includes("EDIT") || action.includes("تعديل") ? "text-blue-400 border-blue-500/40"
                : action.includes("SAVE") || action.includes("حفظ") ? "text-amber-400 border-amber-500/40"
                : "text-green-400 border-green-500/40";
      toast({
        title: (`🔔 ${d("notify_pmTitle")}`) as any,
        description: (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-bold border rounded px-1.5 py-0.5 ${cls}`}>{action}</span>
              <span className="text-muted-foreground font-medium">{section}</span>
            </div>
            <p className="text-foreground/90">{detail}</p>
            <p className="text-[10px] text-muted-foreground">{nowStr()}</p>
          </div>
        ) as any,
        duration: 5000,
      });
    }, [toast, t]);

    const sectionOpts = sections.length > 0
      ? sections.map(s => s.name)
      : ["Casting Section","Polishing Section","Filing / Bench","Design Section","3D Print","Tree Build","Scale Room"];

    // ══════════════════════════════════════════════════════════════════
    // MOVE BETWEEN TABS
    // ══════════════════════════════════════════════════════════════════

    const moveCollectToDust = (row: CollectRow) => {
      const n: DustWeightRow = {
        id: genId("DW", dustRows.length + 1), number: dustRows.length + 1, selected: false,
        scanOrCode: row.qrCodeAuto || row.id,
        takeWeight: row.initialWeight,
        broughtBy: row.broughtBy,
        qrCodeAuto: autoQR("DW"),
        assignDateTime: "—",
        notes: row.notes,
        saved: false,
      };
      setCollectRows(p => p.filter(r => r.id !== row.id).map((r,i) => ({...r, number:i+1})));
      setDustRows(p => [...p, n]);
      setActiveTab("dust");
      notify(d("notify_pmTitle"), d("tab2"), `${d("moveSuccess")}: ${row.id} → ${n.id}`);
      toast({ title: `✅ ${d("moveSuccess")}`, description: `${row.id} → ${d("tab2")}`, duration: 3000 });
    };

    const moveCollectToMelt = (row: CollectRow) => {
      const n: MeltRow = {
        id: genId("WM", meltRows.length + 1), number: meltRows.length + 1, selected: false,
        scanOrCode: row.qrCodeAuto || row.id,
        meltedIn: "", takeWeight: row.initialWeight, keratProduced: "",
        broughtBy: row.broughtBy, qrCodeAuto: autoQR("WM"),
        assignDateTime: nowStr(), weightDate: "", notes: row.notes,
        printApproved: false, saved: false,
      };
      setCollectRows(p => p.filter(r => r.id !== row.id).map((r,i) => ({...r, number:i+1})));
      setMeltRows(p => [...p, n]);
      setActiveTab("melt");
      notify(d("notify_pmTitle"), d("tab3"), `${d("moveSuccess")}: ${row.id} → ${n.id}`);
      toast({ title: `✅ ${d("moveSuccess")}`, description: `${row.id} → ${d("tab3")}`, duration: 3000 });
    };

    const moveDustToCollect = (row: DustWeightRow) => {
      const n: CollectRow = {
        id: genId("CR", collectRows.length + 1), number: collectRows.length + 1, selected: false,
        sectionOrTable: sectionOpts[0],
        lastCollectedDate: row.assignDateTime !== "—" ? row.assignDateTime : nowStr(),
        initialWeight: row.takeWeight,
        broughtBy: row.broughtBy, qrCodeAuto: autoQR("CR"),
        assignDateTime: "—", notes: row.notes, saved: false,
      };
      setDustRows(p => p.filter(r => r.id !== row.id).map((r,i) => ({...r, number:i+1})));
      setCollectRows(p => [...p, n]);
      setActiveTab("collect");
      notify(d("notify_pmTitle"), d("tab1"), `${d("moveSuccess")}: ${row.id} → ${n.id}`);
      toast({ title: `✅ ${d("moveSuccess")}`, description: `${row.id} → ${d("tab1")}`, duration: 3000 });
    };

    const moveDustToMelt = (row: DustWeightRow) => {
      const n: MeltRow = {
        id: genId("WM", meltRows.length + 1), number: meltRows.length + 1, selected: false,
        scanOrCode: row.qrCodeAuto || row.id,
        meltedIn: "", takeWeight: row.takeWeight, keratProduced: "",
        broughtBy: row.broughtBy, qrCodeAuto: autoQR("WM"),
        assignDateTime: nowStr(), weightDate: "", notes: row.notes,
        printApproved: false, saved: false,
      };
      setDustRows(p => p.filter(r => r.id !== row.id).map((r,i) => ({...r, number:i+1})));
      setMeltRows(p => [...p, n]);
      setActiveTab("melt");
      notify(d("notify_pmTitle"), d("tab3"), `${d("moveSuccess")}: ${row.id} → ${n.id}`);
      toast({ title: `✅ ${d("moveSuccess")}`, description: `${row.id} → ${d("tab3")}`, duration: 3000 });
    };

    const moveMeltToCollect = (row: MeltRow) => {
      const n: CollectRow = {
        id: genId("CR", collectRows.length + 1), number: collectRows.length + 1, selected: false,
        sectionOrTable: sectionOpts[0],
        lastCollectedDate: row.weightDate || row.assignDateTime,
        initialWeight: row.takeWeight,
        broughtBy: row.broughtBy, qrCodeAuto: autoQR("CR"),
        assignDateTime: "—", notes: row.notes, saved: false,
      };
      setMeltRows(p => p.filter(r => r.id !== row.id).map((r,i) => ({...r, number:i+1})));
      setCollectRows(p => [...p, n]);
      setActiveTab("collect");
      notify(d("notify_pmTitle"), d("tab1"), `${d("moveSuccess")}: ${row.id} → ${n.id}`);
      toast({ title: `✅ ${d("moveSuccess")}`, description: `${row.id} → ${d("tab1")}`, duration: 3000 });
    };

    const moveMeltToDust = (row: MeltRow) => {
      const n: DustWeightRow = {
        id: genId("DW", dustRows.length + 1), number: dustRows.length + 1, selected: false,
        scanOrCode: row.qrCodeAuto || row.id,
        takeWeight: row.takeWeight,
        broughtBy: row.broughtBy, qrCodeAuto: autoQR("DW"),
        assignDateTime: row.assignDateTime, notes: row.notes, saved: false,
      };
      setMeltRows(p => p.filter(r => r.id !== row.id).map((r,i) => ({...r, number:i+1})));
      setDustRows(p => [...p, n]);
      setActiveTab("dust");
      notify(d("notify_pmTitle"), d("tab2"), `${d("moveSuccess")}: ${row.id} → ${n.id}`);
      toast({ title: `✅ ${d("moveSuccess")}`, description: `${row.id} → ${d("tab2")}`, duration: 3000 });
    };

    // ══════════════════════════════════════════════════════════════════
    // TAB 1 — COLLECT RETURN TIME
    // ══════════════════════════════════════════════════════════════════
    const [cForm, setCForm] = useState({ sectionOrTable:"", initialWeight:"", broughtBy:"", notes:"" });

    const handleAddCollect = () => {
      if (!cForm.sectionOrTable) { toast({ title: d("sectionRequired"), variant:"destructive" }); return; }
      const n: CollectRow = {
        id: genId("CR", collectRows.length + 1), number: collectRows.length + 1, selected: false,
        sectionOrTable: cForm.sectionOrTable,
        lastCollectedDate: collectRows.filter(r=>r.sectionOrTable===cForm.sectionOrTable).sort((a,b)=>b.assignDateTime.localeCompare(a.assignDateTime))[0]?.assignDateTime || "—",
        initialWeight: cForm.initialWeight, broughtBy: cForm.broughtBy,
        qrCodeAuto: autoQR("CR"), assignDateTime: "—", notes: cForm.notes, saved: false,
      };
      setCollectRows(p => [...p, n]);
      setAddCollectOpen(false);
      setCForm({ sectionOrTable:"", initialWeight:"", broughtBy:"", notes:"" });
      notify(d("tab1"), d("tab1"), `${n.id} — ${n.sectionOrTable}`);
    };

    const handleSaveCollectRow = (id: string) => {
      const row = collectRows.find(r => r.id === id)!;
      setCollectRows(p => p.map(r => r.id === id ? {...r, assignDateTime:nowStr(), saved:true} : r));
      notify(d("tab1"), d("tab1"), `${id} — ${row.sectionOrTable}`);
      toast({ title:`✅ ${d("saved")}`, description:`${id}`, duration:3000 });
    };

    const handleDeleteSelectedCollect = () => {
      const sel = collectRows.filter(r=>r.selected);
      if (!sel.length) { toast({ title: d("nothingSelected"), variant:"destructive" }); return; }
      setCollectRows(p => p.filter(r=>!r.selected).map((r,i)=>({...r,number:i+1})));
      notify(d("tab1"), d("tab1"), `${sel.map(r=>r.id).join(", ")}`);
    };

    const handleEditSelectedCollect = () => {
      const sel = collectRows.filter(r=>r.selected);
      if (!sel.length) { toast({ title: d("nothingSelected"), variant:"destructive" }); return; }
      setEditTarget({ table:"collect", row:sel[0] });
    };

    // ══════════════════════════════════════════════════════════════════
    // TAB 2 — DUST WEIGHT
    // ══════════════════════════════════════════════════════════════════
    const [dForm, setDForm] = useState({ scanOrCode:"", takeWeight:"", broughtBy:"", notes:"" });

    const handleAddDust = () => {
      if (!dForm.scanOrCode) { toast({ title: d("scanRequired"), variant:"destructive" }); return; }
      const n: DustWeightRow = {
        id: genId("DW", dustRows.length + 1), number: dustRows.length + 1, selected: false,
        scanOrCode: dForm.scanOrCode, takeWeight: dForm.takeWeight, broughtBy: dForm.broughtBy,
        qrCodeAuto: autoQR("DW"), assignDateTime: "—", notes: dForm.notes, saved: false,
      };
      setDustRows(p => [...p, n]);
      setAddDustOpen(false);
      setDForm({ scanOrCode:"", takeWeight:"", broughtBy:"", notes:"" });
      notify(d("tab2"), d("tab2"), `${n.id} — ${n.scanOrCode}`);
    };

    const handleSaveDustRow = (id: string) => {
      setDustRows(p => p.map(r => r.id === id ? {...r, assignDateTime:nowStr(), saved:true} : r));
      notify(d("tab2"), d("tab2"), id);
      toast({ title:`✅ ${d("saved")}`, description:id, duration:3000 });
    };

    const handleDeleteSelectedDust = () => {
      const sel = dustRows.filter(r=>r.selected);
      if (!sel.length) { toast({ title: d("nothingSelected"), variant:"destructive" }); return; }
      setDustRows(p => p.filter(r=>!r.selected).map((r,i)=>({...r,number:i+1})));
      notify(d("tab2"), d("tab2"), sel.map(r=>r.id).join(", "));
    };

    const handleEditSelectedDust = () => {
      const sel = dustRows.filter(r=>r.selected);
      if (!sel.length) { toast({ title: d("nothingSelected"), variant:"destructive" }); return; }
      setEditTarget({ table:"dust", row:sel[0] });
    };

    // ══════════════════════════════════════════════════════════════════
    // TAB 3 — WEIGHT AFTER MELT
    // ══════════════════════════════════════════════════════════════════
    const [mForm, setMForm] = useState({ scanOrCode:"", meltedIn:"" as ""| "factory"|"refinery", takeWeight:"", keratProduced:"", broughtBy:"", notes:"", weightDate:"" });

    const handleAddMelt = () => {
      if (!mForm.scanOrCode) { toast({ title: d("scanRequired"), variant:"destructive" }); return; }
      const n: MeltRow = {
        id: genId("WM", meltRows.length + 1), number: meltRows.length + 1, selected: false,
        scanOrCode: mForm.scanOrCode, meltedIn: mForm.meltedIn as MeltRow["meltedIn"],
        takeWeight: mForm.takeWeight, keratProduced: mForm.keratProduced,
        broughtBy: mForm.broughtBy, qrCodeAuto: autoQR("WM"),
        assignDateTime: nowStr(), weightDate: mForm.weightDate, notes: mForm.notes,
        printApproved: false, saved: false,
      };
      setMeltRows(p => [...p, n]);
      setAddMeltOpen(false);
      setMForm({ scanOrCode:"", meltedIn:"", takeWeight:"", keratProduced:"", broughtBy:"", notes:"", weightDate:"" });
      notify(d("tab3"), d("tab3"), `${n.id} — ${n.scanOrCode}`);
    };

    const canPrintMelt = (row: MeltRow) => !!row.takeWeight && !!row.keratProduced;

    const handleSaveMeltRow = (id: string) => {
      const row = meltRows.find(r => r.id === id)!;
      if (!canPrintMelt(row)) { toast({ title: d("saveFirst"), variant:"destructive" }); return; }
      setMeltRows(p => p.map(r => r.id === id ? {...r, saved:true} : r));
      notify(d("tab3"), d("tab3"), id);
      toast({ title:`✅ ${d("saved")}`, description:id, duration:3000 });
    };

    const handleTogglePrintMelt = (id: string) => {
      const row = meltRows.find(r => r.id === id)!;
      if (!row.printApproved && !canPrintMelt(row)) { toast({ title: d("printEnterFirst"), variant:"destructive" }); return; }
      const next = !row.printApproved;
      setMeltRows(p => p.map(r => r.id === id ? {...r, printApproved:next} : r));
      notify(d("tab3"), d("tab3"), `${id}: ${next ? d("yes") : d("no")}`);
    };

    const handleDeleteSelectedMelt = () => {
      const sel = meltRows.filter(r=>r.selected);
      if (!sel.length) { toast({ title: d("nothingSelected"), variant:"destructive" }); return; }
      setMeltRows(p => p.filter(r=>!r.selected).map((r,i)=>({...r,number:i+1})));
      notify(d("tab3"), d("tab3"), sel.map(r=>r.id).join(", "));
    };

    const handleEditSelectedMelt = () => {
      const sel = meltRows.filter(r=>r.selected);
      if (!sel.length) { toast({ title: d("nothingSelected"), variant:"destructive" }); return; }
      setEditTarget({ table:"melt", row:sel[0] });
    };

    // ══════════════════════════════════════════════════════════════════
    // EDIT DIALOG
    // ══════════════════════════════════════════════════════════════════
    const handleSaveEdit = () => {
      if (!editTarget) return;
      const { table, row } = editTarget;
      if (table === "collect") {
        const r = row as CollectRow;
        setCollectRows(p => p.map(x => x.id === r.id ? {...r, saved:false} : x));
        notify(d("tab1"), d("tab1"), r.id);
      } else if (table === "dust") {
        const r = row as DustWeightRow;
        setDustRows(p => p.map(x => x.id === r.id ? {...r, saved:false} : x));
        notify(d("tab2"), d("tab2"), r.id);
      } else {
        const r = row as MeltRow;
        setMeltRows(p => p.map(x => x.id === r.id ? {...r, saved:false} : x));
        notify(d("tab3"), d("tab3"), r.id);
      }
      setEditTarget(null);
    };

    // ─── Move button component (reusable) ────────────────────────────────────
    function MoveBtn({ onTab1, onTab2, onTab3, current }: { onTab1?:()=>void; onTab2?:()=>void; onTab3?:()=>void; current:string }) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline"
              className="h-6 text-[10px] px-2 w-full border-purple-500/40 text-purple-400 hover:bg-purple-500/10 flex items-center gap-1">
              <ArrowRightLeft className="w-2.5 h-2.5" />
              {d("moveTo")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            {onTab1 && current!=="collect" && (
              <DropdownMenuItem onClick={onTab1} className="text-amber-400 text-xs cursor-pointer">
                <Wind className="w-3 h-3 me-2" /> {d("moveToTab1")}
              </DropdownMenuItem>
            )}
            {onTab2 && current!=="dust" && (
              <DropdownMenuItem onClick={onTab2} className="text-blue-400 text-xs cursor-pointer">
                <Scale className="w-3 h-3 me-2" /> {d("moveToTab2")}
              </DropdownMenuItem>
            )}
            {onTab3 && current!=="melt" && (
              <DropdownMenuItem onClick={onTab3} className="text-green-400 text-xs cursor-pointer">
                <Flame className="w-3 h-3 me-2" /> {d("moveToTab3")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // ══════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════
    return (
      <div className="space-y-4 pb-10">

        {/* ── Page Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wind className="w-7 h-7 text-primary" />
              {d("title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{d("subtitle")}</p>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 flex items-center gap-1 px-3 py-1.5 self-start mt-1">
            <Bell className="w-3 h-3" />
            <span className="text-[11px]">{d("notifiesPM")}</span>
          </Badge>
        </div>

        {/* ── Manager note ──────────────────────────────────── */}
        <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-md px-4 py-2">
          <span className="text-red-400 text-xs">⚠</span>
          <p className="text-xs text-red-400 font-medium">
            الى تعدل او وتصميم بين عند المدير — {d("managerNote")}
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Step-numbered tabs — reversed in RTL so workflow reads right→left in Arabic */}
          <TabsList className={isRTL ? "bg-muted/40 border border-border/50 h-auto p-1 gap-1 flex flex-wrap flex-row-reverse" : "bg-muted/40 border border-border/50 h-auto p-1 gap-1 flex flex-wrap flex-row"}>

            {/* STEP 1 — COLLECT RETURN TIME */}
            <TabsTrigger value="collect" className="flex items-center gap-1.5 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/40 data-[state=active]:border text-xs px-3 py-1.5 rounded">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/25 border border-amber-500/50 text-amber-400 text-[9px] font-bold shrink-0">1</span>
              <Wind className="w-3.5 h-3.5" />
              {d("tab1")}
            </TabsTrigger>

            <span className="self-center text-muted-foreground/40 text-[10px] font-bold select-none">{isRTL ? "←" : "→"}</span>

            {/* STEP 2 — DUST WEIGHT */}
            <TabsTrigger value="dust" className="flex items-center gap-1.5 data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/40 data-[state=active]:border text-xs px-3 py-1.5 rounded">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/25 border border-blue-500/50 text-blue-400 text-[9px] font-bold shrink-0">2</span>
              <Scale className="w-3.5 h-3.5" />
              {d("tab2")}
            </TabsTrigger>

            <span className="self-center text-muted-foreground/40 text-[10px] font-bold select-none">{isRTL ? "←" : "→"}</span>

            {/* STEP 3 — WEIGHT AFTER MELT */}
            <TabsTrigger value="melt" className="flex items-center gap-1.5 data-[state=active]:bg-green-500/15 data-[state=active]:text-green-400 data-[state=active]:border-green-500/40 data-[state=active]:border text-xs px-3 py-1.5 rounded">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/25 border border-green-500/50 text-green-400 text-[9px] font-bold shrink-0">3</span>
              <Flame className="w-3.5 h-3.5" />
              {d("tab3")}
            </TabsTrigger>

          </TabsList>

          {/* ══════════════════════════════════════════════════
               TAB 1 — COLLECT RETURN TIME
              ══════════════════════════════════════════════════ */}
          <TabsContent value="collect" className="mt-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-blue-500/40 text-blue-400 hover:bg-blue-500/10" onClick={handleEditSelectedCollect}>
                  <Pencil className="w-3 h-3 me-1" /> {d("editSelected")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={handleDeleteSelectedCollect}>
                  <Trash2 className="w-3 h-3 me-1" /> {d("deleteSelected")}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded px-2 py-1 cursor-help">
                      <Scale className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-primary">{d("smartScale")}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-center text-xs">{d("smartScaleTooltip")}</TooltipContent>
                </Tooltip>
                <Button size="sm" className="h-7 text-[11px] bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25" onClick={() => setAddCollectOpen(true)}>
                  <Plus className="w-3 h-3 me-1" /> {d("addItem")}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-500/10">
                      <th colSpan={11} className="border border-amber-500/30 px-4 py-2.5 text-center font-bold text-sm uppercase tracking-widest text-amber-400">
                        {d("tab1")}
                      </th>
                    </tr>
                    <tr className="bg-muted/30 text-muted-foreground text-[10px]">
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[70px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{d("col_selectAll")}</span>
                          <Checkbox checked={collectRows.length>0&&collectRows.every(r=>r.selected)} onCheckedChange={v=>setCollectRows(p=>p.map(r=>({...r,selected:!!v})))} />
                        </div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[40px]">{d("col_no")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[180px]">
                        <div>{d("col_sections")}</div><div className="text-[10px] opacity-60">{d("col_sectionsNote")}</div>
                        <div className="text-[10px] text-blue-400 mt-0.5">{d("col_sectionsHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[140px]">
                        <div>{d("col_lastDate")}</div><div className="text-[10px] opacity-60">{d("col_lastDateNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[120px]">
                        <div>{d("col_initWeight")}</div><div className="text-[10px] opacity-60">{d("col_initWeightNote")}</div>
                        <div className="text-[10px] text-amber-400 mt-0.5">{d("col_initWeightHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[130px]">
                        <div>{d("col_broughtBy")}</div><div className="text-[10px] opacity-60">{d("col_broughtByNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[160px]">
                        <div>{d("col_qrCode")}</div><div className="text-[10px] text-amber-400 mt-0.5">{d("col_qrCodeHint")}</div>
                        <div className="text-[10px] opacity-60">{d("col_qrCodeNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[150px]">
                        <div>{d("col_assignDate")}</div><div className="text-[10px] text-green-400 mt-0.5">{d("col_assignDateHint")}</div>
                        <div className="text-[10px] text-amber-400">{d("col_assignDateNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[120px]">
                        <div>{d("col_notes")}</div><div className="text-[10px] opacity-60">{d("col_notesNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[100px]">{d("col_savePrint")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[110px]">{d("moveTo")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectRows.map(row => (
                      <tr key={row.id} className={`border-b border-border/20 transition-colors ${row.selected?"bg-amber-500/5":"hover:bg-muted/10"}`}>
                        <td className="border border-border/20 px-3 py-3 text-center">
                          <Checkbox checked={row.selected} onCheckedChange={v=>setCollectRows(p=>p.map(r=>r.id===row.id?{...r,selected:!!v}:r))} />
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-center font-mono text-muted-foreground">{row.number}</td>
                        <td className="border border-border/20 px-3 py-3">
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">{row.sectionOrTable}</Badge>
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-muted-foreground text-[11px] whitespace-nowrap">{row.lastCollectedDate}</td>
                        <td className="border border-border/20 px-3 py-3 text-center font-mono text-amber-400 text-[11px]">
                          {row.initialWeight ? `${row.initialWeight}g` : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-xs">{row.broughtBy || <span className="text-muted-foreground/40">—</span>}</td>
                        <td className="border border-border/20 px-3 py-3">
                          <div className="flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground">{row.qrCodeAuto}</span>
                          </div>
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-[11px] whitespace-nowrap">
                          {row.assignDateTime!=="—" ? <span className="text-green-400">{row.assignDateTime}</span>
                            : <span className="text-muted-foreground/40 italic">{d("autoOnSave")}</span>}
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-[11px] text-muted-foreground max-w-[140px]">
                          <span className="truncate block">{row.notes || <span className="opacity-40">—</span>}</span>
                        </td>
                        <td className="border border-border/20 px-3 py-3">
                          <Button size="sm" variant={row.saved?"outline":"default"}
                            className={`h-6 text-[10px] px-2 w-full ${row.saved?"border-green-500/30 text-green-400 hover:bg-green-500/5":"border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"}`}
                            onClick={() => handleSaveCollectRow(row.id)}>
                            {row.saved ? <><CheckCircle2 className="w-2.5 h-2.5 me-1"/>{d("saved")}</> : d("col_savePrint")}
                          </Button>
                        </td>
                        <td className="border border-border/20 px-3 py-3">
                          <MoveBtn current="collect"
                            onTab2={() => moveCollectToDust(row)}
                            onTab3={() => moveCollectToMelt(row)} />
                        </td>
                      </tr>
                    ))}
                    {collectRows.length===0 && (
                      <tr><td colSpan={11} className="text-center py-8 text-muted-foreground text-xs">{d("noRecords")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════
               TAB 2 — DUST WEIGHT
              ══════════════════════════════════════════════════ */}
          <TabsContent value="dust" className="mt-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-blue-500/40 text-blue-400 hover:bg-blue-500/10" onClick={handleEditSelectedDust}>
                  <Pencil className="w-3 h-3 me-1" /> {d("editSelected")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={handleDeleteSelectedDust}>
                  <Trash2 className="w-3 h-3 me-1" /> {d("deleteSelected")}
                </Button>
              </div>
              <Button size="sm" className="h-7 text-[11px] bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25" onClick={() => setAddDustOpen(true)}>
                <Plus className="w-3 h-3 me-1" /> {d("addItem")}
              </Button>
            </div>

            <div className="rounded-lg border border-blue-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-500/10">
                      <th colSpan={10} className="border border-blue-500/30 px-4 py-2.5 text-center font-bold text-sm uppercase tracking-widest text-blue-400">
                        {d("tab2")}
                      </th>
                    </tr>
                    <tr className="bg-muted/30 text-muted-foreground text-[10px]">
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[70px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{d("col_selectAll")}</span>
                          <Checkbox checked={dustRows.length>0&&dustRows.every(r=>r.selected)} onCheckedChange={v=>setDustRows(p=>p.map(r=>({...r,selected:!!v})))} />
                        </div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[40px]">{d("col_no")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[180px]">
                        <div>{d("col_scan")}</div><div className="text-[10px] opacity-60">{d("col_scanNote")}</div>
                        <div className="text-[10px] text-blue-400 mt-0.5">{d("col_scanHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[140px]">
                        <div>{d("col_takeWeight")}</div><div className="text-[10px] text-blue-400 mt-0.5">{d("col_takeWeightHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[130px]">
                        <div>{d("col_broughtBy")}</div><div className="text-[10px] opacity-60">{d("col_broughtByNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[160px]">
                        <div>{d("col_qrCode")}</div><div className="text-[10px] text-blue-400 mt-0.5">{d("col_qrCodeHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[150px]">
                        <div>{d("col_assignDate")}</div><div className="text-[10px] text-green-400 mt-0.5">{d("col_assignDateHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[130px]">
                        <div>{d("col_assignedNotes")}</div><div className="text-[10px] opacity-60">{d("col_assignedNotesNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[100px]">{d("col_savePrint")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[110px]">{d("moveTo")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dustRows.map(row => (
                      <tr key={row.id} className={`border-b border-border/20 transition-colors ${row.selected?"bg-blue-500/5":"hover:bg-muted/10"}`}>
                        <td className="border border-border/20 px-3 py-3 text-center">
                          <Checkbox checked={row.selected} onCheckedChange={v=>setDustRows(p=>p.map(r=>r.id===row.id?{...r,selected:!!v}:r))} />
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-center font-mono text-muted-foreground">{row.number}</td>
                        <td className="border border-border/20 px-3 py-3">
                          <div className="flex items-center gap-1">
                            <ScanLine className="w-3 h-3 text-blue-400/60 shrink-0" />
                            <span className="font-mono text-[11px]">{row.scanOrCode}</span>
                          </div>
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-center font-bold font-mono text-blue-400 text-sm">
                          {row.takeWeight ? `${row.takeWeight}g` : <span className="text-muted-foreground/40 text-[10px]">—</span>}
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-xs">{row.broughtBy || <span className="text-muted-foreground/40">—</span>}</td>
                        <td className="border border-border/20 px-3 py-3">
                          <div className="flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground">{row.qrCodeAuto}</span>
                          </div>
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-[11px] whitespace-nowrap">
                          {row.assignDateTime!=="—" ? <span className="text-green-400">{row.assignDateTime}</span>
                            : <span className="text-muted-foreground/40 italic">{d("autoOnSave")}</span>}
                        </td>
                        <td className="border border-border/20 px-3 py-3 text-[11px] text-muted-foreground max-w-[130px]">
                          <span className="truncate block">{row.notes || <span className="opacity-40">—</span>}</span>
                        </td>
                        <td className="border border-border/20 px-3 py-3">
                          <Button size="sm" variant={row.saved?"outline":"default"}
                            className={`h-6 text-[10px] px-2 w-full ${row.saved?"border-green-500/30 text-green-400 hover:bg-green-500/5":"border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"}`}
                            onClick={() => handleSaveDustRow(row.id)}>
                            {row.saved ? <><CheckCircle2 className="w-2.5 h-2.5 me-1"/>{d("saved")}</> : d("col_savePrint")}
                          </Button>
                        </td>
                        <td className="border border-border/20 px-3 py-3">
                          <MoveBtn current="dust"
                            onTab1={() => moveDustToCollect(row)}
                            onTab3={() => moveDustToMelt(row)} />
                        </td>
                      </tr>
                    ))}
                    {dustRows.length===0 && (
                      <tr><td colSpan={10} className="text-center py-8 text-muted-foreground text-xs">{d("noRecords")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════
               TAB 3 — WEIGHT AFTER MELT
              ══════════════════════════════════════════════════ */}
          <TabsContent value="melt" className="mt-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-blue-500/40 text-blue-400 hover:bg-blue-500/10" onClick={handleEditSelectedMelt}>
                  <Pencil className="w-3 h-3 me-1" /> {d("editSelected")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={handleDeleteSelectedMelt}>
                  <Trash2 className="w-3 h-3 me-1" /> {d("deleteSelected")}
                </Button>
              </div>
              <Button size="sm" className="h-7 text-[11px] bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25" onClick={() => setAddMeltOpen(true)}>
                <Plus className="w-3 h-3 me-1" /> {d("addItem")}
              </Button>
            </div>

            <div className="rounded-lg border border-green-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-green-500/10">
                      <th colSpan={13} className="border border-green-500/30 px-4 py-2.5 text-center font-bold text-sm uppercase tracking-widest text-green-400">
                        {d("tab3")}
                      </th>
                    </tr>
                    <tr className="bg-muted/30 text-muted-foreground text-[10px]">
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[70px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{d("col_selectAll")}</span>
                          <Checkbox checked={meltRows.length>0&&meltRows.every(r=>r.selected)} onCheckedChange={v=>setMeltRows(p=>p.map(r=>({...r,selected:!!v})))} />
                        </div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[40px]">{d("col_no")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[150px]">
                        <div>{d("col_scanMelt")}</div><div className="text-[10px] opacity-60">{d("col_scanMeltNote")}</div>
                        <div className="text-[10px] text-green-400 mt-0.5">{d("col_scanMeltHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[120px]">
                        <div>{d("col_meltedIn")}</div><div className="text-[10px] text-amber-400 mt-0.5">{d("col_meltedInHint")}</div>
                        <div className="text-[10px] opacity-50">{d("col_meltedInNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[130px]">
                        <div>{d("col_takeWeightMelt")}</div><div className="text-[10px] opacity-50">{d("col_takeWeightMeltNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[100px]">{d("col_kerat")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[120px]">
                        <div>{d("col_broughtBy")}</div><div className="text-[10px] opacity-60">{d("col_broughtByNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[160px]">
                        <div>{d("col_qrCode")}</div><div className="text-[10px] text-green-400 mt-0.5">{d("col_qrCodeHint")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[140px]">
                        <div>{d("col_assignDate")}</div><div className="text-[10px] text-green-400 mt-0.5">{d("col_assignDateHint")}</div>
                        <div className="text-[10px] text-amber-400">{d("col_assignDateNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[100px]">
                        <div>{d("col_weightDate")}</div><div className="text-[10px] opacity-60">{d("col_weightDateNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[110px]">
                        <div>{d("col_assignedNotes")}</div><div className="text-[10px] opacity-60">{d("col_assignedNotesNote")}</div>
                      </th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[100px]">{d("col_savePrint")}</th>
                      <th className="border border-border/40 px-3 py-3 text-center min-w-[80px]">
                        <div>{d("col_printYN")}</div><div className="text-[10px] text-green-400 mt-0.5">{d("col_printYNHint")}</div>
                        <div className="text-[10px] opacity-60">{d("col_printYNNote")}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {meltRows.map(row => {
                      const ready = canPrintMelt(row);
                      return (
                        <tr key={row.id} className={`border-b border-border/20 transition-colors ${row.selected?"bg-green-500/5":"hover:bg-muted/10"}`}>
                          <td className="border border-border/20 px-3 py-3 text-center">
                            <Checkbox checked={row.selected} onCheckedChange={v=>setMeltRows(p=>p.map(r=>r.id===row.id?{...r,selected:!!v}:r))} />
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-center font-mono text-muted-foreground">{row.number}</td>
                          <td className="border border-border/20 px-3 py-3">
                            <div className="flex items-center gap-1">
                              <ScanLine className="w-3 h-3 text-green-400/60 shrink-0" />
                              <span className="font-mono text-[11px]">{row.scanOrCode}</span>
                            </div>
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-center">
                            {row.meltedIn
                              ? <Badge variant="outline" className={`text-[10px] ${row.meltedIn==="factory"?"border-amber-500/40 text-amber-400":"border-blue-500/40 text-blue-400"}`}>
                                  {row.meltedIn==="factory" ? d("factory") : d("refinery")}
                                </Badge>
                              : <span className="text-muted-foreground/40 text-[10px]">—</span>}
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-center">
                            {row.takeWeight
                              ? <span className="font-bold font-mono text-green-400 text-sm">{row.takeWeight}g</span>
                              : <span className="text-muted-foreground/40 italic text-[10px]">{d("pending")}</span>}
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-center">
                            {row.keratProduced
                              ? <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">{row.keratProduced}</Badge>
                              : <span className="text-muted-foreground/40 italic text-[10px]">{d("pending")}</span>}
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-xs">{row.broughtBy || <span className="text-muted-foreground/40">—</span>}</td>
                          <td className="border border-border/20 px-3 py-3">
                            <div className="flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              <span className="font-mono text-[10px] text-muted-foreground">{row.qrCodeAuto}</span>
                            </div>
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-[11px] whitespace-nowrap">
                            <span className="text-green-400">{row.assignDateTime}</span>
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-[11px]">
                            {row.weightDate ? <span className="text-amber-400">{row.weightDate}</span>
                              : <span className="text-muted-foreground/40 italic">{d("col_weightDateNote")}</span>}
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-[11px] text-muted-foreground max-w-[120px]">
                            <span className="truncate block">{row.notes || <span className="opacity-40">—</span>}</span>
                          </td>
                          <td className="border border-border/20 px-3 py-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button size="sm" variant={row.saved?"outline":"default"} disabled={!ready}
                                    className={`h-6 text-[10px] px-2 w-full ${row.saved?"border-green-500/30 text-green-400":ready?"border-green-500/50 text-green-400 bg-green-500/10 hover:bg-green-500/20":"opacity-40 cursor-not-allowed"}`}
                                    onClick={() => handleSaveMeltRow(row.id)}>
                                    {row.saved ? <><CheckCircle2 className="w-2.5 h-2.5 me-1"/>{d("saved")}</> : d("col_savePrint")}
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!ready && <TooltipContent className="text-xs max-w-[180px]">{d("saveFirst")}</TooltipContent>}
                            </Tooltip>
                          </td>
                          <td className="border border-border/20 px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => handleTogglePrintMelt(row.id)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${row.printApproved?"border-green-500/60 text-green-400 bg-green-500/10 hover:bg-green-500/20":ready?"border-red-500/50 text-red-400 bg-red-500/5 hover:bg-red-500/10":"border-border/30 text-muted-foreground/30 cursor-not-allowed"}`}>
                                  {row.printApproved ? d("yes") : d("no")}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[200px]">
                                {ready ? (row.printApproved ? d("printRevoke") : d("printApprove")) : d("printEnterFirst")}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })}
                    {meltRows.length===0 && (
                      <tr><td colSpan={13} className="text-center py-8 text-muted-foreground text-xs">{d("noRecords")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* ── Move buttons row for melt ── */}
            {meltRows.some(r=>r.selected) && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="text-[11px] border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => { const sel=meltRows.filter(r=>r.selected); sel.forEach(r=>moveMeltToCollect(r)); }}>
                  <ArrowRightLeft className="w-3 h-3 me-1"/> {d("moveToTab1")}
                </Button>
                <Button size="sm" variant="outline" className="text-[11px] border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                  onClick={() => { const sel=meltRows.filter(r=>r.selected); sel.forEach(r=>moveMeltToDust(r)); }}>
                  <ArrowRightLeft className="w-3 h-3 me-1"/> {d("moveToTab2")}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ══════════════════════════════════════════════════════
             ADD DIALOGS
           ══════════════════════════════════════════════════════ */}

        {/* Add Collect Return Time */}
        <Dialog open={addCollectOpen} onOpenChange={setAddCollectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400"><Wind className="w-4 h-4"/>{d("add_title_collect")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_section")} <span className="text-red-400">*</span></label>
                <Select value={cForm.sectionOrTable} onValueChange={v=>setCForm(p=>({...p,sectionOrTable:v}))}>
                  <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                  <SelectContent>{sectionOpts.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[10px] text-blue-400 mt-0.5">{d("add_multiSection")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_initWeight")}</label>
                  <Input type="number" step="0.001" placeholder="0.000" value={cForm.initialWeight} onChange={e=>setCForm(p=>({...p,initialWeight:e.target.value}))}/>
                  <p className="text-[10px] text-amber-400/70 mt-0.5">{d("add_initWeightHint")}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_broughtBy")}</label>
                  <Input placeholder={d("add_broughtByPlaceholder")} value={cForm.broughtBy} onChange={e=>setCForm(p=>({...p,broughtBy:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_notes")}</label>
                <Textarea rows={2} placeholder={d("add_notesPlaceholder")} value={cForm.notes} onChange={e=>setCForm(p=>({...p,notes:e.target.value}))}/>
              </div>
              <p className="text-[10px] text-muted-foreground">{d("add_autoNote")}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={()=>setAddCollectOpen(false)}>{d("add_cancel")}</Button>
              <Button size="sm" onClick={handleAddCollect} disabled={!cForm.sectionOrTable} className="bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25"><Plus className="w-3 h-3 me-1"/>{d("add_addItem")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Dust Weight */}
        <Dialog open={addDustOpen} onOpenChange={setAddDustOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400"><Scale className="w-4 h-4"/>{d("add_title_dust")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_scanCode")} <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <Input placeholder={d("add_scanPlaceholder")} value={dForm.scanOrCode} onChange={e=>setDForm(p=>({...p,scanOrCode:e.target.value}))} className="flex-1"/>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={()=>toast({title:d("scanner"),description:d("scannerDesc"),duration:3000})}><ScanLine className="w-4 h-4"/></Button>
                </div>
                <p className="text-[10px] text-blue-400 mt-0.5">{d("add_multiScan")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_takeWeight")}</label>
                  <Input type="number" step="0.001" placeholder="0.000" value={dForm.takeWeight} onChange={e=>setDForm(p=>({...p,takeWeight:e.target.value}))}/>
                  <p className="text-[10px] text-blue-400/70 mt-0.5">{d("add_takeWeightHint")}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_broughtBy")}</label>
                  <Input placeholder={d("add_broughtByPlaceholder")} value={dForm.broughtBy} onChange={e=>setDForm(p=>({...p,broughtBy:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_notes")}</label>
                <Textarea rows={2} placeholder={d("add_notesPlaceholder")} value={dForm.notes} onChange={e=>setDForm(p=>({...p,notes:e.target.value}))}/>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={()=>setAddDustOpen(false)}>{d("add_cancel")}</Button>
              <Button size="sm" onClick={handleAddDust} disabled={!dForm.scanOrCode} className="bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25"><Plus className="w-3 h-3 me-1"/>{d("add_addItem")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Weight after Melt */}
        <Dialog open={addMeltOpen} onOpenChange={setAddMeltOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-400"><Flame className="w-4 h-4"/>{d("add_title_melt")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_scanMelt")} <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <Input placeholder={d("add_scanMeltPlaceholder")} value={mForm.scanOrCode} onChange={e=>setMForm(p=>({...p,scanOrCode:e.target.value}))} className="flex-1"/>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={()=>toast({title:d("scanner"),description:d("scannerDesc"),duration:3000})}><ScanLine className="w-4 h-4"/></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_meltedIn")}</label>
                  <Select value={mForm.meltedIn} onValueChange={v=>setMForm(p=>({...p,meltedIn:v as any}))}>
                    <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factory">{d("factory")}</SelectItem>
                      <SelectItem value="refinery">{d("refinery")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] opacity-60 mt-0.5">{d("add_meltedInNote")}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_takeWeight")}</label>
                  <Input type="number" step="0.001" placeholder="0.000" value={mForm.takeWeight} onChange={e=>setMForm(p=>({...p,takeWeight:e.target.value}))}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_kerat")}</label>
                  <Select value={mForm.keratProduced} onValueChange={v=>setMForm(p=>({...p,keratProduced:v}))}>
                    <SelectTrigger><SelectValue placeholder="Select karat..."/></SelectTrigger>
                    <SelectContent>{["10K","14K","18K","21K","22K","24K","999"].map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_weightDate")}</label>
                  <Input type="date" value={mForm.weightDate} onChange={e=>setMForm(p=>({...p,weightDate:e.target.value}))}/>
                  <p className="text-[10px] text-amber-400/70 mt-0.5">{d("add_weightDateHint")}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_broughtBy")}</label>
                <Input placeholder={d("add_broughtByPlaceholder")} value={mForm.broughtBy} onChange={e=>setMForm(p=>({...p,broughtBy:e.target.value}))}/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_notes")}</label>
                <Textarea rows={2} placeholder={d("add_notesPlaceholder")} value={mForm.notes} onChange={e=>setMForm(p=>({...p,notes:e.target.value}))}/>
              </div>
              <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded p-2">
                <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5"/>
                <p className="text-[10px] text-muted-foreground">{d("add_meltInfo")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={()=>setAddMeltOpen(false)}>{d("add_cancel")}</Button>
              <Button size="sm" onClick={handleAddMelt} disabled={!mForm.scanOrCode} className="bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25"><Plus className="w-3 h-3 me-1"/>{d("add_addItem")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editTarget} onOpenChange={open=>!open&&setEditTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400"><Pencil className="w-4 h-4"/>
                {d("edit_title")} — {editTarget?.table==="collect"?d("tab1"):editTarget?.table==="dust"?d("tab2"):d("tab3")}
              </DialogTitle>
            </DialogHeader>
            {editTarget?.table==="collect" && (() => {
              const r = editTarget.row as CollectRow;
              return (
                <div className="space-y-3 py-1">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_section")}</label>
                    <Select value={r.sectionOrTable} onValueChange={v=>setEditTarget(p=>p?{...p,row:{...r,sectionOrTable:v}}:null)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{sectionOpts.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_initWeight")}</label>
                      <Input type="number" step="0.001" value={r.initialWeight} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,initialWeight:e.target.value}}:null)}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_broughtBy")}</label>
                      <Input value={r.broughtBy} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,broughtBy:e.target.value}}:null)}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_notes")}</label>
                    <Textarea rows={2} value={r.notes} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,notes:e.target.value}}:null)}/>
                  </div>
                </div>
              );
            })()}
            {editTarget?.table==="dust" && (() => {
              const r = editTarget.row as DustWeightRow;
              return (
                <div className="space-y-3 py-1">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{d("col_scan")}</label>
                    <Input value={r.scanOrCode} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,scanOrCode:e.target.value}}:null)}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_takeWeight")}</label>
                      <Input type="number" step="0.001" value={r.takeWeight} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,takeWeight:e.target.value}}:null)}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_broughtBy")}</label>
                      <Input value={r.broughtBy} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,broughtBy:e.target.value}}:null)}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_notes")}</label>
                    <Textarea rows={2} value={r.notes} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,notes:e.target.value}}:null)}/>
                  </div>
                </div>
              );
            })()}
            {editTarget?.table==="melt" && (() => {
              const r = editTarget.row as MeltRow;
              return (
                <div className="space-y-3 py-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("col_scanMelt")}</label>
                      <Input value={r.scanOrCode} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,scanOrCode:e.target.value}}:null)}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_meltedIn")}</label>
                      <Select value={r.meltedIn} onValueChange={v=>setEditTarget(p=>p?{...p,row:{...r,meltedIn:v as any}}:null)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="factory">{d("factory")}</SelectItem>
                          <SelectItem value="refinery">{d("refinery")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_takeWeight")}</label>
                      <Input type="number" step="0.001" value={r.takeWeight} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,takeWeight:e.target.value}}:null)}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_kerat")}</label>
                      <Select value={r.keratProduced} onValueChange={v=>setEditTarget(p=>p?{...p,row:{...r,keratProduced:v}}:null)}>
                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                        <SelectContent>{["10K","14K","18K","21K","22K","24K","999"].map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_weightDate")}</label>
                      <Input type="date" value={r.weightDate} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,weightDate:e.target.value}}:null)}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_broughtBy")}</label>
                      <Input value={r.broughtBy} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,broughtBy:e.target.value}}:null)}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{d("add_notes")}</label>
                    <Textarea rows={2} value={r.notes} onChange={e=>setEditTarget(p=>p?{...p,row:{...r,notes:e.target.value}}:null)}/>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={()=>setEditTarget(null)}>{d("add_cancel")}</Button>
              <Button size="sm" onClick={handleSaveEdit} className="bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25"><CheckCircle2 className="w-3 h-3 me-1"/>{d("edit_save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }
  