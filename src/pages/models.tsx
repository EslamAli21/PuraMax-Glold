// ============================================================
// صفحة الموديلات — إدارة موديلات المنتجات ومراحل إنتاجها
// تم تطوير هذه الصفحة لتشمل: شريط الفلاتر المحسّن، حقول إنشاء موديل جديدة،
// وبطاقة موديل مُعاد تصميمها لعرض جميع بيانات الموديل
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { useMockState } from "@/lib/mock-state";
import { Model, ModelPart, ProductionStage } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Layers, Settings2, Trash2, ArrowRight,
  Upload, Gem, ImageIcon, X, Filter, Palette, FlaskConical,
  ChevronRight, Copy, Eye, EyeOff, FileText,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// ── صور افتراضية لكل فئة من فئات الموديلات ──────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  rings:     "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=450&fit=crop&q=80",
  pendants:  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=450&fit=crop&q=80",
  bracelets: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=450&fit=crop&q=80",
  earrings:  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=450&fit=crop&q=80",
  chains:    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=450&fit=crop&q=80",
  other:     "https://images.unsplash.com/photo-1629796736279-9f1c0c9acf27?w=600&h=450&fit=crop&q=80",
};

// ── خيارات الألوان المتاحة في النظام — يمكن إضافة ألوان جديدة هنا ──
const COLOUR_OPTIONS = [
  "Yellow",
  "White",
  "Rose",
  "Green",
  "Black",
  "Silver",
  "Two-Tone",
];

// ── نوع مسودة القطعة (جزء من الموديل) ───────────────────────────────
type StageDraft = {
  sectionId: string;
  approxLossPercent: number;
  materialId?: string;
  estimatedTimeMinutes?: number;
  mergeWithPartIndices?: number[];
};

type PartDraft = {
  name: string;
  imageUrl?: string;
  approxWeight?: number;
  approxPureGoldWeight?: number;
  colour?: string;
  stages: StageDraft[];
};

// ════════════════════════════════════════════════════════════════════════
// مكوّن رفع الصورة — يسمح برفع صورة أو تغييرها أو حذفها
// ════════════════════════════════════════════════════════════════════════
function ImageUploadBox({
  imageUrl,
  onImageChange,
  label,
  compact,
}: {
  imageUrl?: string;
  onImageChange: (url: string | undefined) => void;
  label: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // عند اختيار ملف: تحويله إلى رابط مؤقت وعرضه
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onImageChange(URL.createObjectURL(f));
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div
        className={`relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 transition-colors ${compact ? "h-24" : "h-36"}`}
        onClick={() => ref.current?.click()}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
            {/* طبقة شفافة تظهر عند تحريك الماوس فوق الصورة */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-medium">Change</span>
            </div>
            {/* زر حذف الصورة */}
            <button
              type="button"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => { e.stopPropagation(); onImageChange(undefined); }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </>
        ) : (
          // حالة: لا توجد صورة — عرض أيقونة الرفع
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className={compact ? "w-5 h-5" : "w-8 h-8"} />
            <span className="text-xs">{compact ? "Upload" : "Click to upload image"}</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// مكوّن مراحل الإنتاج — يسمح بتحديد الأقسام ونسبة الخسارة التقديرية
// ════════════════════════════════════════════════════════════════════════
function RouteStages({
  stages,
  onChange,
  sections,
  materials,
  totalParts,
  partIndex,
}: {
  stages: StageDraft[];
  onChange: (s: StageDraft[]) => void;
  sections: { id: string; name: string }[];
  materials?: import("@/lib/mock-data").Material[];
  totalParts?: number;
  partIndex?: number;
}) {
  const { t } = useTranslation();
  const otherPartIndices =
    totalParts !== undefined && partIndex !== undefined
      ? Array.from({ length: totalParts }, (_, i) => i).filter(i => i !== partIndex)
      : [];

  const updStage = (idx: number, patch: Partial<StageDraft>) => {
    const s = stages.map((st, i) => i === idx ? { ...st, ...patch } : st);
    onChange(s);
  };

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => (
        <div key={idx} className="space-y-2 bg-muted/40 p-2.5 rounded-md border">

          {/* ── صف 1: رقم + قسم + خسارة + حذف ── */}
          <div className="flex items-end gap-2">
            <div className="w-6 shrink-0 pb-1 font-mono font-bold text-muted-foreground text-xs">{idx + 1}.</div>
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] text-muted-foreground">{t("models.section")}</Label>
              <Select value={stage.sectionId} onValueChange={v => updStage(idx, { sectionId: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1">
              <Label className="text-[10px] text-muted-foreground">{t("models.lossPercent")}</Label>
              <Input type="number" min="0" max="100" step="0.1" className="h-8 text-xs text-center"
                value={stage.approxLossPercent}
                onChange={e => updStage(idx, { approxLossPercent: Number(e.target.value) })}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/80"
              onClick={() => onChange(stages.filter((_, i) => i !== idx))}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* ── صف 2: مادة + وقت تقديري (اختياري) ── */}
          {materials !== undefined && (
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/40">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Add Material</Label>
                <Select
                  value={stage.materialId ?? "__na__"}
                  onValueChange={v => updStage(idx, { materialId: v === "__na__" ? undefined : v })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__na__">NA</SelectItem>
                    {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Time (min)</Label>
                <Input type="number" min="0" step="5" placeholder="NA" className="h-7 text-xs"
                  value={stage.estimatedTimeMinutes ?? ""}
                  onChange={e => updStage(idx, { estimatedTimeMinutes: e.target.value !== "" ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          )}

          {/* ── صف 3: دمج مع قطع أخرى (فقط عند وجود أكثر من قطعة) ── */}
          {otherPartIndices.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-border/40">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Merge at this stage</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground/60">With:</span>
                {otherPartIndices.map(pIdx => {
                  const isMerged = (stage.mergeWithPartIndices ?? []).includes(pIdx);
                  return (
                    <button key={pIdx} type="button"
                      onClick={() => {
                        const cur = stage.mergeWithPartIndices ?? [];
                        updStage(idx, {
                          mergeWithPartIndices: isMerged
                            ? cur.filter(x => x !== pIdx)
                            : [...cur, pIdx],
                        });
                      }}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded border font-medium transition-colors",
                        isMerged
                          ? "bg-orange-500/20 border-orange-400/50 text-orange-600"
                          : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      )}>
                      Part {pIdx + 1}
                    </button>
                  );
                })}
                {(stage.mergeWithPartIndices ?? []).length > 0 && (
                  <span className="text-[10px] text-orange-500 font-semibold ms-1">
                    ← Part {[partIndex! + 1, ...(stage.mergeWithPartIndices ?? []).map(i => i + 1)].sort().join(" & ")}
                  </span>
                )}
                {(stage.mergeWithPartIndices ?? []).length === 0 && (
                  <span className="text-[10px] text-muted-foreground/40 italic">NA</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8 border-dashed"
        onClick={() => onChange([...stages, { sectionId: sections[0]?.id || "", approxLossPercent: 0 }])}>
        <Plus className="w-3 h-3 me-1.5" /> {t("models.addStage")}
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// شريط الألوان المتعدد الاختيار — يسمح باختيار أكثر من لون كفلتر
// ════════════════════════════════════════════════════════════════════════
function ColourMultiSelect({
  selected,
  onChange,
  options,
}: {
  selected: string[];
  onChange: (c: string[]) => void;
  options: string[];
}) {
  // عند النقر على لون: إضافته أو إزالته من قائمة الألوان المحددة
  const toggle = (c: string) =>
    selected.includes(c) ? onChange(selected.filter(x => x !== c)) : onChange([...selected, c]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => toggle(c)}
          className={cn(
            "text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all",
            selected.includes(c)
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-foreground border-border hover:border-primary/50"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية — إدارة الموديلات
// ════════════════════════════════════════════════════════════════════════
export default function ModelsPage() {
  // استخراج البيانات والدوال من حالة المحاكاة المركزية
  const { models, sections, materials, addModel, updateModel, deleteModel } = useMockState();
  const { toast } = useToast();
  const { t } = useTranslation();

  // ── حالة حوار تأكيد الحذف — يحمل ID الموديل المراد حذفه (null = مغلق) ──
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ── حالة انتظار فتح نموذج تعديل النسخة المكررة بعد إنشائها ──
  const [pendingDuplicate, setPendingDuplicate] = useState(false);

  // ── معرّفات البطاقات التي أُخفي فيها حقل "وزن الذهب التقريبي" ──
  const [hiddenGoldWeightIds, setHiddenGoldWeightIds] = useState<Set<string>>(new Set());

  // ── حالة الحوارات ────────────────────────────────────────────────────
  const [isNewOpen, setIsNewOpen]           = useState(false);
  const [viewRouteModel, setViewRouteModel] = useState<Model | null>(null);
  const [editModel, setEditModel]           = useState<Model | null>(null);
  // حوار عرض ملاحظات الموديل — يُفتح بالضغط على زر الملاحظة في البطاقة
  const [noteModel, setNoteModel]           = useState<Model | null>(null);

  // ── حالات فلاتر البحث والتصفية ─────────────────────────────────────
  // نص البحث الحر — يبحث في الكود، الاسم، العيار، والمادة
  const [search,          setSearch]          = useState("");
  // فلتر الفئة — يصفي حسب نوع المنتج (خواتم، أساور...)
  const [filterCategory,  setFilterCategory]  = useState<string>("all");
  // فلتر العيار — يصفي حسب قيراط الذهب
  const [filterKarat,     setFilterKarat]     = useState<string>("all");
  // ── فلتر اللون — يختار لوناً واحداً من القائمة المنسدلة ("all" = بدون فلتر) ──
  const [filterColour,    setFilterColour]    = useState<string>("all");
  // فلتر المادة — يصفي الموديلات التي تحتوي على مادة معينة
  const [filterMaterial,  setFilterMaterial]  = useState<string>("all");

  // ── حالات نموذج إنشاء موديل جديد ──────────────────────────────────
  const [name,             setName]             = useState("");
  const [category,         setCategory]         = useState<any>("rings");
  const [karat,            setKarat]            = useState("18");
  const [weight,           setWeight]           = useState("5");
  // حقل جديد: وزن الذهب الخالص التقريبي بالغرام
  const [pureGoldWeight,   setPureGoldWeight]   = useState("3");
  // حقل جديد: لون الموديل — يُختار من الألوان المتاحة في النظام
  const [colour,           setColour]           = useState<string>("Yellow");

  // ── حالة الألوان المخصصة التي يضيفها المستخدم — محفوظة في localStorage ────
  // تُهيَّأ بقراءة الألوان المحفوظة مسبقاً من localStorage عند تحميل المكوّن
  const [customColours, setCustomColours] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("puramax_custom_colours") || "[]"); }
    catch { return []; }
  });
  // ── حالة فتح/إغلاق حوار إضافة لون جديد ─────────────────────────────────────
  const [newColourDialogOpen, setNewColourDialogOpen] = useState(false);
  // ── اسم اللون الجديد الذي يكتبه المستخدم في الحوار ──────────────────────────
  const [newColourName, setNewColourName] = useState("");
  // ── كود لون HEX المختار من عجلة الألوان أو الإدخال اليدوي ──────────────────
  const [newColourHex, setNewColourHex] = useState("#FFD700");
  // حقل جديد: هل الموديل عينة sample أم موديل model للإنتاج؟
  const [isSample,         setIsSample]         = useState(false);
  // حقل جديد: المواد المرتبطة بالموديل (غير مواد الذهب)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [notes,            setNotes]            = useState("");
  const [modelImageUrl,    setModelImageUrl]    = useState<string | undefined>();
  const [partsCount,       setPartsCount]       = useState(0);
  const [parts,            setParts]            = useState<PartDraft[]>([]);
  // مسار الإنتاج عند عدد القطع = 0 (الموديل قطعة واحدة كاملة)
  const [modelStages,      setModelStages]      = useState<{ sectionId: string; approxLossPercent: number }[]>([]);

  // ── حالات نموذج تعديل موديل موجود ──────────────────────────────────
  const [editName,             setEditName]             = useState("");
  const [editCategory,         setEditCategory]         = useState<any>("rings");
  const [editKarat,            setEditKarat]            = useState("18");
  const [editWeight,           setEditWeight]           = useState("5");
  const [editPureGoldWeight,   setEditPureGoldWeight]   = useState("3");
  const [editColour,           setEditColour]           = useState("Yellow");
  const [editIsSample,         setEditIsSample]         = useState(false);
  const [editSelectedMaterials, setEditSelectedMaterials] = useState<string[]>([]);
  const [editNotes,            setEditNotes]            = useState("");
  const [editModelImageUrl,    setEditModelImageUrl]    = useState<string | undefined>();
  const [editPartsCount,       setEditPartsCount]       = useState(1);
  const [editParts,            setEditParts]            = useState<PartDraft[]>([]);
  const [editStages,           setEditStages]           = useState<{ sectionId: string; approxLossPercent: number }[]>([]);

  // ── دوال مزامنة القطع ────────────────────────────────────────────────
  const syncParts = (count: number) => {
    setPartsCount(count);
    setParts(prev => {
      const next = [...prev];
      while (next.length < count) next.push({ name: "", imageUrl: undefined, approxWeight: undefined, approxPureGoldWeight: undefined, colour: undefined, stages: [] });
      return next.slice(0, count);
    });
  };
  const updatePart = (idx: number, updates: Partial<PartDraft>) =>
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));

  const syncEditParts = (count: number) => {
    setEditPartsCount(count);
    setEditParts(prev => {
      const next = [...prev];
      while (next.length < count) next.push({ name: "", imageUrl: undefined, approxWeight: undefined, approxPureGoldWeight: undefined, colour: undefined, stages: [] });
      return next.slice(0, count);
    });
  };
  const updateEditPart = (idx: number, updates: Partial<PartDraft>) =>
    setEditParts(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));

  // ── قائمة جميع الألوان المتاحة: الثابتة + المخصصة من المستخدم + من المواد ──
  // تُدمج ثلاثة مصادر: الألوان الثابتة، الألوان التي أضافها المستخدم،
  // والألوان المستخرجة من حقل color في المواد المسجّلة بالنظام
  const systemColours = Array.from(
    new Set([
      ...COLOUR_OPTIONS,
      ...customColours,
      ...materials.map(m => m.color).filter(Boolean),
    ])
  );

  // ── المواد غير الذهبية — تُستخدم فقط في عرض البطاقة الخارجي ────────────────
  // تُصفى المواد الذهبية من عرض بطاقة الموديل (للاختصار بصرياً)
  // لكن في نافذة الإنشاء/التعديل تُعرض جميع المواد بما فيها الذهبية
  const nonGoldMaterials = materials.filter(m => !m.isGold);

  // ── منطق التصفية الشاملة ────────────────────────────────────────────
  // يجمع جميع الفلاتر: البحث النصي + الفئة + العيار + اللون + المادة
  const filtered = models.filter(m => {
    // البحث النصي في الكود، الاسم، العيار (كنص)، وأسماء المواد
    const matNames = (m.materialIds ?? [])
      .map(id => materials.find(mat => mat.id === id)?.name ?? "")
      .join(" ")
      .toLowerCase();
    const q = search.toLowerCase();
    const textMatch = !q ||
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      String(m.karat).includes(q) ||
      matNames.includes(q);

    // فلتر الفئة
    const catMatch = filterCategory === "all" || m.category === filterCategory;

    // فلتر العيار
    const karatMatch = filterKarat === "all" || String(m.karat) === filterKarat;

    // فلتر الألوان (multi-select) — يمر الموديل إذا كان لونه ضمن الألوان المحددة
    // ── مطابقة اللون: "all" يعني بدون فلتر، وإلا يتحقق من تطابق لون الموديل ──
    const colourMatch = filterColour === "all" || (m.colour ?? "") === filterColour;

    // فلتر المادة — يمر الموديل إذا كانت المادة المحددة ضمن موادها
    const matMatch = filterMaterial === "all" ||
      (m.materialIds ?? []).includes(filterMaterial);

    return textMatch && catMatch && karatMatch && colourMatch && matMatch;
  });

  // ── إعادة تعيين نموذج الإنشاء إلى القيم الافتراضية ──────────────
  const resetCreate = () => {
    setName(""); setCategory("rings"); setKarat("18"); setWeight("5");
    setPureGoldWeight("3"); setColour("Yellow"); setIsSample(false);
    setSelectedMaterials([]); setNotes(""); setModelImageUrl(undefined);
    setPartsCount(0); setParts([]);
    setModelStages([]);
  };

  // ── حفظ موديل جديد ──────────────────────────────────────────────────
  const handleSave = () => {
    if (!name) return;
    const builtParts: ModelPart[] = parts.map((p, i) => ({
      id: `part-${i}-${Date.now()}`,
      name: p.name || `Part ${i + 1}`,
      image: p.imageUrl,
      approxWeight: p.approxWeight,
      approxPureGoldWeight: p.approxPureGoldWeight,
      colour: p.colour,
      stages: p.stages.map((s, si) => ({ ...s, order: si + 1 })),
    }));
    // عند partsCount=0 نستخدم مسار الموديل الكامل، وإلا نأخذ مسار أول قطعة
    const defaultStages = partsCount === 0
      ? modelStages.map((s, si) => ({ ...s, order: si + 1 }))
      : builtParts.length > 0 ? builtParts[0].stages : [];

    addModel({
      name,
      category,
      karat: Number(karat),
      approxWeightGrams: Number(weight),
      approxPureGoldWeightGrams: Number(pureGoldWeight),
      colour,
      isSample,
      materialIds: selectedMaterials,
      stages: defaultStages,
      notes,
      image: modelImageUrl || CATEGORY_IMAGES[category],
      parts: builtParts.length > 0 ? builtParts : undefined,
    });
    setIsNewOpen(false);
    resetCreate();
    toast({ title: t("models.saveModel"), description: `${name} added successfully.` });
  };

  // ── فتح نموذج التعديل وملء حقوله ببيانات الموديل الموجود ─────────
  const openEdit = (model: Model) => {
    setEditModel(model);
    setEditName(model.name);
    setEditCategory(model.category);
    setEditKarat(String(model.karat));
    setEditWeight(String(model.approxWeightGrams));
    setEditPureGoldWeight(String(model.approxPureGoldWeightGrams ?? ""));
    setEditColour(model.colour ?? "Yellow");
    setEditIsSample(model.isSample ?? false);
    setEditSelectedMaterials(model.materialIds ?? []);
    setEditNotes(model.notes);
    setEditModelImageUrl(model.image);
    setEditStages(model.stages.map(s => ({
      sectionId: s.sectionId,
      approxLossPercent: s.approxLossPercent,
      materialId: s.materialId,
      estimatedTimeMinutes: s.estimatedTimeMinutes,
      mergeWithPartIndices: s.mergeWithPartIndices,
    })));
    const existingParts = model.parts || [];
    setEditPartsCount(existingParts.length);
    setEditParts(existingParts.map(p => ({
      name: p.name, imageUrl: p.image,
      approxWeight: p.approxWeight,
      approxPureGoldWeight: p.approxPureGoldWeight,
      colour: p.colour,
      stages: p.stages.map(s => ({
        sectionId: s.sectionId,
        approxLossPercent: s.approxLossPercent,
        materialId: s.materialId,
        estimatedTimeMinutes: s.estimatedTimeMinutes,
        mergeWithPartIndices: s.mergeWithPartIndices,
      })),
    })));
  };

  const handleEditSave = () => {
    if (!editModel) return;
    const builtParts: ModelPart[] = editParts.map((p, i) => ({
      id: `${editModel.code}-${String(i + 1).padStart(2, "0")}`,
      name: p.name || `Part ${i + 1}`,
      image: p.imageUrl,
      approxWeight: p.approxWeight,
      approxPureGoldWeight: p.approxPureGoldWeight,
      colour: p.colour,
      stages: p.stages.map((s, si) => ({ ...s, order: si + 1 })),
    }));
    const savedStages = editPartsCount === 0
      ? editStages.map((s, si) => ({ ...s, order: si + 1 }))
      : builtParts.length > 0 ? builtParts[0].stages : [];
    updateModel(editModel.id, {
      name: editName,
      category: editCategory,
      karat: Number(editKarat),
      approxWeightGrams: Number(editWeight),
      approxPureGoldWeightGrams: editPureGoldWeight !== "" ? Number(editPureGoldWeight) : undefined,
      colour: editColour,
      isSample: editIsSample,
      materialIds: editSelectedMaterials,
      stages: savedStages,
      notes: editNotes,
      image: editModelImageUrl,
      parts: builtParts.length > 0 ? builtParts : undefined,
    });
    toast({ title: t("models.modelUpdated"), description: editName });
    setEditModel(null);
  };

  // ── useEffect: يفتح نموذج التعديل فور إضافة نسخة مكررة إلى القائمة ──
  useEffect(() => {
    if (pendingDuplicate && models.length > 0) {
      const newest = models[models.length - 1];
      openEdit(newest);
      setPendingDuplicate(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, pendingDuplicate]);

  // ── نسخ موديل موجود وفتح نموذج التعديل للنسخة الجديدة فور إنشائها ──
  const handleDuplicate = (model: Model) => {
    const { id: _id, code: _code, ...rest } = model as Model & { id: string; code: string };
    addModel({ ...rest, name: `${model.name} (Copy)` });
    setPendingDuplicate(true);
    toast({ title: "Model duplicated", description: "Opening editor for the copy…" });
  };

  // ── حفظ لون جديد في قائمة الألوان وتطبيقه على الحقل المفتوح حالياً ─────────
  // يُضاف اللون الجديد إلى customColours ويُحفَظ في localStorage للاستخدام المستقبلي
  const handleSaveNewColour = () => {
    if (!newColourName.trim()) return;
    const trimmed = newColourName.trim();
    // منع إضافة لون مكرر
    if (!systemColours.includes(trimmed)) {
      const updated = [...customColours, trimmed];
      setCustomColours(updated);
      // حفظ الألوان المخصصة في localStorage لتبقى بعد إعادة التحميل
      localStorage.setItem("puramax_custom_colours", JSON.stringify(updated));
    }
    // تطبيق اللون الجديد تلقائياً على حقل اللون في نموذج الإنشاء والتعديل
    setColour(trimmed);
    setEditColour(trimmed);
    // إعادة تهيئة حقول الحوار وإغلاقه
    setNewColourName("");
    setNewColourHex("#FFD700");
    setNewColourDialogOpen(false);
  };

  // ── وجود أي فلتر نشط — لعرض زر مسح الفلاتر ─────────────────────
  const hasActiveFilters =
    search !== "" || filterCategory !== "all" || filterKarat !== "all" ||
    filterColour !== "all" || filterMaterial !== "all";

  // ── وزن وذهب الموديلات المصفّاة فقط — يتحدّث مع تغيّر الفلاتر ──
  const filteredTotalWeight    = filtered.reduce((s, m) => s + (m.approxWeightGrams        ?? 0), 0);
  const filteredTotalGoldWeight = filtered.reduce((s, m) => s + (m.approxPureGoldWeightGrams ?? 0), 0);

  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════════════════════════
          ── رأس الصفحة: عنوان + زر إضافة موديل جديد
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("models.title")}</h1>

        {/* ── حوار إنشاء موديل جديد ── */}
        <Dialog open={isNewOpen} onOpenChange={o => { setIsNewOpen(o); if (!o) resetCreate(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 me-2" /> {t("models.newModel")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("models.createModel")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">

              {/* ── قسم: البيانات الأساسية للموديل ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* اسم الموديل */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("models.modelName")}</Label>
                  <Input value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Classic Gold Ring" />
                </div>

                {/* فئة الموديل */}
                <div className="space-y-2">
                  <Label>{t("models.category")}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rings">{t("models.rings")}</SelectItem>
                      <SelectItem value="pendants">{t("models.pendants")}</SelectItem>
                      <SelectItem value="bracelets">{t("models.bracelets")}</SelectItem>
                      <SelectItem value="earrings">{t("models.earrings")}</SelectItem>
                      <SelectItem value="chains">{t("models.chains")}</SelectItem>
                      <SelectItem value="other">{t("models.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* عيار الذهب */}
                <div className="space-y-2">
                  <Label>{t("models.karat")}</Label>
                  <Select value={karat} onValueChange={setKarat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18">18K</SelectItem>
                      <SelectItem value="21">21K</SelectItem>
                      <SelectItem value="22">22K</SelectItem>
                      <SelectItem value="24">24K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* الوزن التقريبي الإجمالي */}
                <div className="space-y-2">
                  <Label>{t("models.approxWeight")} (g)</Label>
                  <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>

                {/* وزن الذهب الخالص التقريبي — حقل جديد */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-yellow-500" />
                    Approx. Pure Gold Weight (g)
                  </Label>
                  <Input type="number" value={pureGoldWeight}
                    onChange={e => setPureGoldWeight(e.target.value)}
                    placeholder="e.g. 3.5" />
                </div>

                {/* لون الموديل — حقل جديد: يُختار من الألوان المتاحة في النظام
                    أو يُضاف لون جديد بالنقر على "New Colour (+)" في نهاية القائمة */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-violet-500" />
                    Colour
                  </Label>
                  {/* عند اختيار "__new_colour__" يُفتح حوار إضافة لون جديد بدلاً من التعيين */}
                  <Select value={colour} onValueChange={v => {
                    if (v === "__new_colour__") { setNewColourDialogOpen(true); }
                    else { setColour(v); }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {/* الألوان المتاحة في النظام (ثابتة + مخصصة) */}
                      {systemColours.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      {/* زر إضافة لون جديد — يفصله خط عن بقية الألوان */}
                      <SelectItem
                        value="__new_colour__"
                        className="text-primary font-bold border-t mt-1 pt-1"
                      >
                        ＋ New Colour (+)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* نوع الموديل: عينة sample أم موديل model — حقل جديد */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
                    Type
                  </Label>
                  <div className="flex rounded-lg border overflow-hidden h-10">
                    <button
                      type="button"
                      onClick={() => setIsSample(false)}
                      className={cn(
                        "flex-1 text-xs font-semibold transition-colors",
                        !isSample
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      MODEL
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSample(true)}
                      className={cn(
                        "flex-1 text-xs font-semibold transition-colors border-s",
                        isSample
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      SAMPLE
                    </button>
                  </div>
                </div>
              </div>

              {/* ── قسم: المواد المرتبطة بالموديل — يعرض جميع المواد بما فيها الذهبية ──
                  البطاقة الخارجية ستعرض المواد غير الذهبية فقط، لكن هنا يمكن ربط
                  أي مادة بالموديل بما فيها مواد الذهب */}
              {materials.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
                  <Label className="text-sm font-semibold">Materials</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Select materials used in this model (includes gold and non-gold)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* عرض جميع المواد — المواد الذهبية تحمل شارة ذهبية تمييزية */}
                    {materials.map(mat => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() =>
                          setSelectedMaterials(prev =>
                            prev.includes(mat.id)
                              ? prev.filter(x => x !== mat.id)
                              : [...prev, mat.id]
                          )
                        }
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5",
                          selectedMaterials.includes(mat.id)
                            ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                            : "bg-background text-foreground border-border hover:border-primary/40"
                        )}
                      >
                        {/* مؤشر لوني للمواد الذهبية */}
                        {mat.isGold && (
                          <span className="text-yellow-500 text-[10px]">⭐</span>
                        )}
                        {mat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── صورة الموديل ── */}
              <ImageUploadBox
                imageUrl={modelImageUrl}
                onImageChange={setModelImageUrl}
                label={t("models.modelImage")}
              />

              {/* ── عدد القطع ── */}
              <div className="space-y-2">
                <Label>{t("models.partsCount")}</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                    onClick={() => syncParts(partsCount === 2 ? 0 : Math.max(0, partsCount - 1))}>
                    <span className="text-base font-bold">−</span>
                  </Button>
                  <Input type="number" min="0" max="20" className="text-center font-bold text-base"
                    value={partsCount}
                    onChange={e => {
                      let v = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                      if (v === 1) v = 0;
                      syncParts(v);
                    }} />
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                    onClick={() => syncParts(partsCount === 0 ? 2 : partsCount + 1)}>
                    <span className="text-base font-bold">+</span>
                  </Button>
                </div>
              </div>

              {/* ── مسار الإنتاج: عند partsCount=0 الموديل قطعة واحدة كاملة ── */}
              {partsCount === 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">{t("models.modelRoute")}</Label>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {t("models.zeroParts")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("models.modelRouteDesc")}</p>
                  <RouteStages stages={modelStages} onChange={setModelStages} sections={sections} materials={materials} />
                </div>
              )}

              {/* ── قطع الموديل — كل قطعة لها صورة ومسار إنتاج مستقل ── */}
              {partsCount > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <Label className="text-sm font-semibold">{t("models.partsSection")}</Label>
                  {parts.map((part, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                          Part {String(idx + 1).padStart(2, "0")}
                        </span>
                        <Input
                          placeholder={`${t("models.partName")} ${idx + 1}`}
                          value={part.name}
                          onChange={e => updatePart(idx, { name: e.target.value })}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                      <ImageUploadBox
                        imageUrl={part.imageUrl}
                        onImageChange={url => updatePart(idx, { imageUrl: url })}
                        label={t("models.partImage")}
                        compact
                      />
                      {/* حقول القطعة الجديدة: الوزن، وزن الذهب الخالص، اللون */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Approx. Weight (g)</Label>
                          <Input
                            type="number" min="0" step="0.1" placeholder="e.g. 2.5"
                            className="h-8 text-xs"
                            value={part.approxWeight ?? ""}
                            onChange={e => updatePart(idx, { approxWeight: e.target.value !== "" ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Approx. Pure Gold (g)</Label>
                          <Input
                            type="number" min="0" step="0.1" placeholder="e.g. 1.8"
                            className="h-8 text-xs"
                            value={part.approxPureGoldWeight ?? ""}
                            onChange={e => updatePart(idx, { approxPureGoldWeight: e.target.value !== "" ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Color</Label>
                          <Select
                            value={part.colour ?? ""}
                            onValueChange={v => updatePart(idx, { colour: v })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {systemColours.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t("models.partRoute")}</Label>
                        <RouteStages
                          stages={part.stages}
                          onChange={s => updatePart(idx, { stages: s })}
                          sections={sections}
                          materials={materials}
                          totalParts={partsCount}
                          partIndex={idx}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ملاحظات الموديل (حقل نصي اختياري) ── */}
              <div className="space-y-2">
                <Label>{t("models.notes")}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..." rows={2} className="text-sm resize-none" />
              </div>

              <Button className="w-full mt-2" onClick={handleSave} disabled={!name}>
                {t("models.saveModel")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ── شريط الفلاتر والبحث — يطابق تصميم HEADER-MODELS.png
          يحتوي على: بحث نصي + فئة + عيار + ألوان (متعدد) + مادة
      ════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#2b3d5c] dark:bg-[#2c1a03] border border-[#3d5278] dark:border-[#7a5510] p-4 shadow-lg">
        <div className="flex flex-wrap gap-3 items-start">

          {/* ── حقل البحث النصي — يبحث في الكود، الاسم، العيار، المادة ── */}
          <div className="flex-1 min-w-[200px] space-y-1">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Search Bar:
            </p>
            <p className="text-[9px] text-white/50 -mt-0.5">By Code, Name, Karat, Material</p>
            <div className="relative mt-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <Input
                placeholder="Search..."
                className="ps-9 h-9 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ── فلتر الفئة — يعرض الفئات المتاحة في النظام ── */}
          <div className="min-w-[140px] space-y-1">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Choose Category:
            </p>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 mt-1 text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="rings">Rings</SelectItem>
                <SelectItem value="pendants">Pendants</SelectItem>
                <SelectItem value="bracelets">Bracelets</SelectItem>
                <SelectItem value="earrings">Earrings</SelectItem>
                <SelectItem value="chains">Chains</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── فلتر العيار — يعرض عيارات الذهب المتاحة ── */}
          <div className="min-w-[120px] space-y-1">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Choose Karat:
            </p>
            <Select value={filterKarat} onValueChange={setFilterKarat}>
              <SelectTrigger className="h-9 mt-1 text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Karats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Karats</SelectItem>
                <SelectItem value="18">18K</SelectItem>
                <SelectItem value="21">21K</SelectItem>
                <SelectItem value="22">22K</SelectItem>
                <SelectItem value="24">24K</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── فلتر اللون — قائمة منسدلة مطابقة لبقية الفلاتر ── */}
          <div className="min-w-[140px] space-y-1">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Choose Colour:
            </p>
            <Select value={filterColour} onValueChange={setFilterColour}>
              <SelectTrigger className="h-9 mt-1 text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Colours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colours</SelectItem>
                {systemColours.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── فلتر المادة — يعرض المواد المتاحة في النظام ── */}
          <div className="min-w-[140px] space-y-1">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Choose Material:
            </p>
            <Select value={filterMaterial} onValueChange={setFilterMaterial}>
              <SelectTrigger className="h-9 mt-1 text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Materials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {materials.map(mat => (
                  <SelectItem key={mat.id} value={mat.id}>{mat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── إحصائيات الفلترة + وزن الموديلات المصفّاة + زر مسح الفلاتر ── */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[10px] text-white/50">
              Showing <span className="text-white font-bold">{filtered.length}</span> of {models.length} models
            </p>
            {filtered.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                <Gem className="w-3 h-3 text-yellow-400/80 shrink-0" />
                <span className="text-[10px] text-white/70 whitespace-nowrap">
                  Weight:&nbsp;<span className="text-white font-bold">~{filteredTotalWeight.toFixed(1)}g</span>
                </span>
                {filteredTotalGoldWeight > 0 && (
                  <>
                    <span className="text-white/30 text-[10px]">·</span>
                    <span className="text-[10px] text-yellow-400 font-semibold whitespace-nowrap">
                      Gold:&nbsp;~{filteredTotalGoldWeight.toFixed(1)}g
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch(""); setFilterCategory("all"); setFilterKarat("all");
                setFilterColour("all"); setFilterMaterial("all");
              }}
              className="text-[10px] text-white/60 hover:text-white underline transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ── شبكة بطاقات الموديلات — يطابق تصميم MODEL-CARD.png
          التصميم: صورة على اليسار، بيانات على اليمين في عمودين
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filtered.map(model => {
          // صورة الموديل — تُستخدم الصورة الافتراضية عند عدم وجود صورة مخصصة
          const imgSrc = model.image || CATEGORY_IMAGES[model.category] || CATEGORY_IMAGES.other;

          // المواد غير الذهبية المرتبطة بهذا الموديل
          const linkedNonGoldMats = (model.materialIds ?? [])
            .map(id => materials.find(m => m.id === id))
            .filter((m): m is NonNullable<typeof m> => !!m && !m.isGold);

          // بطاقة الموديل — الارتفاع تلقائي بحد أدنى 200px لضمان ظهور جميع الحقول
          return (
            // حاوية relative لإتاحة تحديد موقع زر الحذف خارج البطاقة وفوقها
            <div key={model.id} className="relative group/card">

              {/* ── أزرار التحكم: نسخ + حذف — تظهر فوق البطاقة عند التمرير ── */}
              <div className="absolute -top-2.5 end-2 z-10
                              flex items-center gap-1
                              opacity-0 group-hover/card:opacity-100
                              transition-all duration-200 scale-90 group-hover/card:scale-100">
                {/* زر نسخ الموديل */}
                <button
                  type="button"
                  onClick={() => handleDuplicate(model)}
                  className="flex items-center gap-1
                             bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                             text-white rounded-full
                             px-2 py-1 text-[10px] font-semibold
                             shadow-lg shadow-blue-900/40
                             border border-blue-500/50 transition-colors"
                  title="Duplicate model"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {/* زر حذف الموديل */}
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(model.id)}
                  className="flex items-center gap-1
                             bg-red-600 hover:bg-red-700 active:bg-red-800
                             text-white rounded-full
                             px-2 py-1 text-[10px] font-semibold
                             shadow-lg shadow-red-900/40
                             border border-red-500/50 transition-colors"
                  title="Delete model"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

            <Card
              className="overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-row min-h-[200px]">

              {/* ── الجانب الأيسر: صورة الموديل (~42% عرض البطاقة) ── */}
              <div className="relative shrink-0 overflow-hidden bg-muted/30"
                style={{ width: "42%" }}>
                <img
                  src={imgSrc}
                  alt={model.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {/* تدرج لوني خفيف في الأسفل لسهولة القراءة */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* شارة عيار الذهب — تظهر في أعلى يمين الصورة */}
                <div className="absolute top-2 end-2">
                  <Badge className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 font-bold border-0 shadow text-[10px]">
                    {model.karat}K
                  </Badge>
                </div>
                {/* شارة عدد القطع — تظهر في أسفل يسار الصورة عند وجود قطع */}
                {model.parts && model.parts.length > 0 && (
                  <div className="absolute bottom-2 start-2">
                    <Badge variant="secondary"
                      className="text-[9px] bg-black/60 backdrop-blur-sm text-white border-white/20">
                      {model.parts.length} {t("models.parts")}
                    </Badge>
                  </div>
                )}
              </div>

              {/* ── الجانب الأيمن: بيانات الموديل (~58% عرض البطاقة) ── */}
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">

                {/* ── صف البيانات الرئيسية: عمودان ── */}
                <div className="flex-1 grid grid-cols-2 divide-x divide-border/40 min-h-0">

                  {/* ── العمود الأيسر: CATEGORY / NAME / CODE / MATERIALS ── */}
                  <div className="p-3 space-y-2 overflow-hidden">

                    {/* CATEGORY */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Category
                      </p>
                      <p className="text-[10px] font-semibold capitalize text-foreground leading-tight">
                        {t(`models.${model.category}`) || model.category}
                      </p>
                    </div>

                    {/* NAME */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Name
                      </p>
                      <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-1">
                        {model.name}
                      </p>
                    </div>

                    {/* CODE */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Code
                      </p>
                      <p className="font-mono text-[10px] font-bold text-primary leading-tight">
                        {model.code}
                      </p>
                    </div>

                    {/* MATERIALS — يعرض المواد غير الذهبية فقط */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Materials
                      </p>
                      {linkedNonGoldMats.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {linkedNonGoldMats.map(mat => (
                            <span key={mat.id}
                              className="text-[8px] px-1.5 py-0.5 bg-muted rounded border border-border/50 font-medium text-foreground">
                              {mat.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-muted-foreground/60 italic">—</p>
                      )}
                    </div>
                  </div>

                  {/* ── العمود الأيمن: SAMPLE/MODEL + COLOUR + KARAT + WEIGHTS ── */}
                  <div className="p-3 space-y-2 overflow-hidden">

                    {/* SAMPLE OR MODEL — شارة نوع الموديل */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Sample / Model
                      </p>
                      <Badge variant="outline"
                        className={cn(
                          "text-[9px] font-bold mt-0.5",
                          model.isSample
                            ? "border-blue-500/50 text-blue-600 bg-blue-500/10"
                            : "border-green-500/50 text-green-600 bg-green-500/10"
                        )}>
                        {model.isSample ? "SAMPLE" : "MODEL"}
                      </Badge>
                    </div>

                    {/* COLOUR — لون الموديل */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Colour
                      </p>
                      <p className="text-[10px] font-semibold leading-tight">
                        {model.colour ?? "—"}
                      </p>
                    </div>

                    {/* APPROXIMATE WEIGHT — الوزن التقريبي الإجمالي */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Approx. Weight
                      </p>
                      <p className="text-[10px] font-semibold leading-tight font-mono">
                        ~{model.approxWeightGrams}g
                      </p>
                    </div>

                    {/* APPROXIMATE GOLD WEIGHT — قابل للإخفاء/الظهور بزر العين ── */}
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                          Approx. Gold Weight
                        </p>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setHiddenGoldWeightIds(prev => {
                              const next = new Set(prev);
                              if (next.has(model.id)) next.delete(model.id);
                              else next.add(model.id);
                              return next;
                            });
                          }}
                          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                          title={hiddenGoldWeightIds.has(model.id) ? "Show gold weight" : "Hide gold weight"}
                        >
                          {hiddenGoldWeightIds.has(model.id)
                            ? <EyeOff className="w-2.5 h-2.5" />
                            : <Eye    className="w-2.5 h-2.5" />
                          }
                        </button>
                      </div>
                      {hiddenGoldWeightIds.has(model.id) ? (
                        <p className="text-[9px] text-muted-foreground/35 italic select-none">hidden</p>
                      ) : (
                        <p className="text-[10px] font-semibold leading-tight font-mono text-yellow-600">
                          {model.approxPureGoldWeightGrams != null
                            ? `~${model.approxPureGoldWeightGrams}g`
                            : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── شريط الأزرار في أسفل البطاقة ── */}
                <div className="border-t border-border/40 flex divide-x divide-border/40 shrink-0">
                  {/* زر عرض مسار الإنتاج */}
                  <button
                    type="button"
                    className="flex-1 py-2 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => setViewRouteModel(model)}
                  >
                    {t("models.viewRoute")}
                  </button>
                  {/* زر الملاحظة — يظهر فقط عند وجود ملاحظة، بلون ذهبي مميّز */}
                  {model.notes?.trim() && (
                    <button
                      type="button"
                      className="flex-1 py-2 text-[10px] font-semibold flex items-center justify-center gap-1
                                 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10
                                 transition-all duration-200"
                      onClick={() => setNoteModel(model)}
                      title={t("models.noteButton")}
                    >
                      <FileText className="w-3 h-3" />
                      {t("models.noteButton")}
                    </button>
                  )}
                  {/* زر تعديل بيانات الموديل */}
                  <button
                    type="button"
                    className="flex-1 py-2 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => openEdit(model)}
                  >
                    {t("models.edit")}
                  </button>
                </div>
              </CardContent>
            </Card>
            </div>
          );
        })}
      </div>

      {/* ── رسالة فارغة عند عدم وجود نتائج ── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Gem className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No models found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="mt-3 text-xs"
              onClick={() => {
                setSearch(""); setFilterCategory("all"); setFilterKarat("all");
                setFilterColour("all"); setFilterMaterial("all");
              }}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ── لوحة عرض مسار الإنتاج — تفاصيل مراحل الإنتاج للموديل
      ════════════════════════════════════════════════════════════════ */}
      <Sheet open={!!viewRouteModel} onOpenChange={o => !o && setViewRouteModel(null)}>
        <SheetContent className="sm:max-w-[520px] overflow-y-auto p-0">
          {viewRouteModel && (
            <div className="flex flex-col h-full">
              {/* صورة الموديل في رأس اللوحة الجانبية */}
              <div className="relative w-full h-48 overflow-hidden bg-muted/30 shrink-0">
                <img
                  src={viewRouteModel.image || CATEGORY_IMAGES[viewRouteModel.category] || CATEGORY_IMAGES.other}
                  alt={viewRouteModel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-bold text-xl text-white leading-tight">{viewRouteModel.name}</p>
                      <p className="font-mono text-xs text-white/70 mt-0.5">{viewRouteModel.code}</p>
                    </div>
                    <Badge className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 font-bold border-0 shadow">
                      {viewRouteModel.karat}K
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-sm text-muted-foreground font-normal">
                    {t("models.routeTitle")}
                  </SheetTitle>
                </SheetHeader>

                {/* ملخص بيانات الموديل */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("models.category")}</p>
                    <p className="font-semibold capitalize text-xs">{viewRouteModel.category}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("models.approxWeight")}</p>
                    <p className="font-semibold text-xs">~{viewRouteModel.approxWeightGrams}g</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Colour</p>
                    <p className="font-semibold text-xs">{viewRouteModel.colour ?? "—"}</p>
                  </div>
                </div>

                {/* مسار الإنتاج — حسب القطع أو الموديل الكامل */}
                {viewRouteModel.parts && viewRouteModel.parts.length > 0 ? (
                  <Tabs defaultValue={viewRouteModel.parts[0].id}>
                    <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-lg">
                      {viewRouteModel.parts.map((part, i) => (
                        <TabsTrigger key={part.id} value={part.id} className="text-xs rounded-md">
                          {part.name || `Part ${i + 1}`}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {viewRouteModel.parts.map((part) => (
                      <TabsContent key={part.id} value={part.id} className="mt-3 space-y-3">
                        {part.image && (
                          <div className="w-full h-32 overflow-hidden rounded-lg bg-muted/20">
                            <img src={part.image} alt={part.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="space-y-2">
                          {part.stages.slice().sort((a, b) => a.order - b.order).map((stage, idx, arr) => {
                            const section = sections.find(s => s.id === stage.sectionId);
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                                    {idx + 1}
                                  </div>
                                  {idx < arr.length - 1 && <div className="w-0.5 h-4 bg-border" />}
                                </div>
                                <div className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                                  <div>
                                    <p className="font-medium text-sm">{section?.name || stage.sectionId}</p>
                                    <p className="text-xs text-muted-foreground">{section?.code}</p>
                                  </div>
                                  {stage.approxLossPercent > 0 && (
                                    <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500/30">
                                      ~{stage.approxLossPercent}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* عرض تسلسل مسار الإنتاج كخط أفقي */}
                        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Flow</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            {part.stages.slice().sort((a, b) => a.order - b.order).map((stage, i, arr) => {
                              const section = sections.find(s => s.id === stage.sectionId);
                              return (
                                <React.Fragment key={i}>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-background rounded border font-medium">
                                    {section?.name || "?"}
                                  </span>
                                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  // حالة: الموديل قطعة واحدة — عرض مسار الإنتاج مباشرة
                  <div>
                    <p className="text-sm font-semibold mb-3">{t("models.productionRouting")}</p>
                    <div className="space-y-2">
                      {viewRouteModel.stages.slice().sort((a, b) => a.order - b.order).map((stage, idx, arr) => {
                        const section = sections.find(s => s.id === stage.sectionId);
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </div>
                              {idx < arr.length - 1 && <div className="w-0.5 h-4 bg-border" />}
                            </div>
                            <div className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                              <div>
                                <p className="font-medium text-sm">{section?.name || stage.sectionId}</p>
                                <p className="text-xs text-muted-foreground">{section?.code}</p>
                              </div>
                              {stage.approxLossPercent > 0 && (
                                <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500/30">
                                  ~{stage.approxLossPercent}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* تسلسل المسار الأفقي */}
                    <div className="mt-3 bg-muted/30 rounded-lg p-2.5 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Flow</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {viewRouteModel.stages.slice().sort((a, b) => a.order - b.order).map((stage, i, arr) => {
                          const section = sections.find(s => s.id === stage.sectionId);
                          return (
                            <React.Fragment key={i}>
                              <span className="text-[10px] px-2 py-0.5 bg-background rounded border font-medium">
                                {section?.name || "?"}
                              </span>
                              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ════════════════════════════════════════════════════════════════
          ── لوحة تعديل الموديل — تملأ حقولها ببيانات الموديل الحالي
      ════════════════════════════════════════════════════════════════ */}
      <Sheet open={!!editModel} onOpenChange={o => !o && setEditModel(null)}>
        <SheetContent className="sm:max-w-[560px] overflow-y-auto">
          {editModel && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{t("models.editModel")}</SheetTitle>
                <p className="font-mono text-xs text-muted-foreground">{editModel.code}</p>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* اسم الموديل */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("models.modelName")}</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>

                  {/* فئة الموديل */}
                  <div className="space-y-2">
                    <Label>{t("models.category")}</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rings">{t("models.rings")}</SelectItem>
                        <SelectItem value="pendants">{t("models.pendants")}</SelectItem>
                        <SelectItem value="bracelets">{t("models.bracelets")}</SelectItem>
                        <SelectItem value="earrings">{t("models.earrings")}</SelectItem>
                        <SelectItem value="chains">{t("models.chains")}</SelectItem>
                        <SelectItem value="other">{t("models.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* عيار الذهب */}
                  <div className="space-y-2">
                    <Label>{t("models.karat")}</Label>
                    <Select value={editKarat} onValueChange={setEditKarat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18">18K</SelectItem>
                        <SelectItem value="21">21K</SelectItem>
                        <SelectItem value="22">22K</SelectItem>
                        <SelectItem value="24">24K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* الوزن التقريبي الإجمالي */}
                  <div className="space-y-2">
                    <Label>{t("models.approxWeight")} (g)</Label>
                    <Input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} />
                  </div>

                  {/* وزن الذهب الخالص التقريبي */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Gem className="w-3.5 h-3.5 text-yellow-500" />
                      Approx. Pure Gold Weight (g)
                    </Label>
                    <Input type="number" value={editPureGoldWeight}
                      onChange={e => setEditPureGoldWeight(e.target.value)} />
                  </div>

                  {/* لون الموديل — مع إمكانية إضافة لون جديد عبر "New Colour (+)" */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-violet-500" />
                      Colour
                    </Label>
                    {/* عند اختيار "__new_colour__" يُفتح حوار إضافة لون جديد */}
                    <Select value={editColour} onValueChange={v => {
                      if (v === "__new_colour__") { setNewColourDialogOpen(true); }
                      else { setEditColour(v); }
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {/* الألوان المتاحة في النظام */}
                        {systemColours.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                        {/* زر إضافة لون جديد في نهاية القائمة */}
                        <SelectItem
                          value="__new_colour__"
                          className="text-primary font-bold border-t mt-1 pt-1"
                        >
                          ＋ New Colour (+)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* نوع الموديل: عينة أم موديل */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
                      Type
                    </Label>
                    <div className="flex rounded-lg border overflow-hidden h-10">
                      <button type="button"
                        onClick={() => setEditIsSample(false)}
                        className={cn(
                          "flex-1 text-xs font-semibold transition-colors",
                          !editIsSample
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted/50"
                        )}>
                        MODEL
                      </button>
                      <button type="button"
                        onClick={() => setEditIsSample(true)}
                        className={cn(
                          "flex-1 text-xs font-semibold transition-colors border-s",
                          editIsSample
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted/50"
                        )}>
                        SAMPLE
                      </button>
                    </div>
                  </div>
                </div>

                {/* المواد المرتبطة بالموديل — تشمل جميع المواد (ذهبية وغير ذهبية)
                    البطاقة الخارجية تعرض المواد غير الذهبية فقط للاختصار البصري */}
                {materials.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
                    <Label className="text-sm font-semibold">Materials</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Select materials used in this model (includes gold and non-gold)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {/* عرض جميع المواد مع تمييز الذهبية بنجمة صفراء */}
                      {materials.map(mat => (
                        <button key={mat.id} type="button"
                          onClick={() =>
                            setEditSelectedMaterials(prev =>
                              prev.includes(mat.id)
                                ? prev.filter(x => x !== mat.id)
                                : [...prev, mat.id]
                            )
                          }
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5",
                            editSelectedMaterials.includes(mat.id)
                              ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                              : "bg-background text-foreground border-border hover:border-primary/40"
                          )}>
                          {/* مؤشر لوني للمواد الذهبية */}
                          {mat.isGold && (
                            <span className="text-yellow-500 text-[10px]">⭐</span>
                          )}
                          {mat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* صورة الموديل */}
                <ImageUploadBox
                  imageUrl={editModelImageUrl}
                  onImageChange={setEditModelImageUrl}
                  label={t("models.modelImage")}
                />

                {/* عدد القطع */}
                <div className="space-y-2">
                  <Label>{t("models.partsCount")}</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => syncEditParts(editPartsCount === 2 ? 0 : Math.max(0, editPartsCount - 1))}>
                      <span className="text-base font-bold">−</span>
                    </Button>
                    <Input type="number" min="0" max="20" className="text-center font-bold"
                      value={editPartsCount}
                      onChange={e => {
                        let v = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                        if (v === 1) v = 0;
                        syncEditParts(v);
                      }} />
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => syncEditParts(editPartsCount === 0 ? 2 : editPartsCount + 1)}>
                      <span className="text-base font-bold">+</span>
                    </Button>
                  </div>
                </div>

                {/* قطع الموديل في نموذج التعديل */}
                {editPartsCount > 0 && (
                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-sm font-semibold">{t("models.partsSection")}</Label>
                    {editParts.map((part, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                            {editModel.code}-{String(idx + 1).padStart(2, "0")}
                          </span>
                          <Input
                            placeholder={`${t("models.partName")} ${idx + 1}`}
                            value={part.name}
                            onChange={e => updateEditPart(idx, { name: e.target.value })}
                            className="flex-1 h-8 text-sm"
                          />
                        </div>
                        <ImageUploadBox
                          imageUrl={part.imageUrl}
                          onImageChange={url => updateEditPart(idx, { imageUrl: url })}
                          label={t("models.partImage")}
                          compact
                        />
                        {/* حقول القطعة الجديدة: الوزن، وزن الذهب الخالص، اللون */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Approx. Weight (g)</Label>
                            <Input
                              type="number" min="0" step="0.1" placeholder="e.g. 2.5"
                              className="h-8 text-xs"
                              value={part.approxWeight ?? ""}
                              onChange={e => updateEditPart(idx, { approxWeight: e.target.value !== "" ? Number(e.target.value) : undefined })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Approx. Pure Gold (g)</Label>
                            <Input
                              type="number" min="0" step="0.1" placeholder="e.g. 1.8"
                              className="h-8 text-xs"
                              value={part.approxPureGoldWeight ?? ""}
                              onChange={e => updateEditPart(idx, { approxPureGoldWeight: e.target.value !== "" ? Number(e.target.value) : undefined })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Color</Label>
                            <Select
                              value={part.colour ?? ""}
                              onValueChange={v => updateEditPart(idx, { colour: v })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {systemColours.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("models.partRoute")}</Label>
                          <RouteStages
                            stages={part.stages}
                            onChange={s => updateEditPart(idx, { stages: s })}
                            sections={sections}
                            materials={materials}
                            totalParts={editPartsCount}
                            partIndex={idx}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* مسار الإنتاج الفردي عند عدم وجود قطع */}
                {editPartsCount === 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">{t("models.productionRouting")}</Label>
                    </div>
                    <RouteStages stages={editStages} onChange={setEditStages} sections={sections} materials={materials} />
                  </div>
                )}

                {/* ── ملاحظات الموديل في نموذج التعديل ── */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    {t("models.notes")}
                  </Label>
                  <Textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                <Button className="w-full" onClick={handleEditSave}>{t("models.saveModel")}</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ════════════════════════════════════════════════════════════════
          ── حوار إضافة لون جديد إلى قائمة ألوان النظام ──
          يُفتح عند اختيار "New Colour (+)" من قائمة الألوان المنسدلة
          يُتيح للمستخدم تحديد:
            • اسم اللون (نصي)
            • درجة اللون من عجلة الألوان (color picker) أو كود HEX يدوي
          عند الحفظ: يُضاف اللون إلى قائمة الألوان ويُحفَظ في localStorage
      ════════════════════════════════════════════════════════════════ */}
      <Dialog open={newColourDialogOpen} onOpenChange={setNewColourDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-500" />
              Add New Colour
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">

            {/* ── حقل اسم اللون الجديد ── */}
            <div className="space-y-2">
              <Label>Colour Name</Label>
              <Input
                value={newColourName}
                onChange={e => setNewColourName(e.target.value)}
                placeholder="e.g. Champagne, Platinum, Bronze..."
                autoFocus
              />
            </div>

            {/* ── منتقي اللون: عجلة الألوان + حقل كود HEX اليدوي ── */}
            <div className="space-y-2">
              <Label>Colour Shade</Label>
              <div className="flex items-center gap-3">
                {/* عجلة الألوان من المتصفح — تُحدّث كود HEX تلقائياً */}
                <input
                  type="color"
                  value={newColourHex}
                  onChange={e => setNewColourHex(e.target.value)}
                  className="h-10 w-16 rounded-md border cursor-pointer p-0.5 bg-background"
                  title="Pick colour from wheel"
                />
                {/* حقل كود HEX اليدوي — يُحدّث عجلة الألوان عند الكتابة */}
                <Input
                  value={newColourHex}
                  onChange={e => setNewColourHex(e.target.value)}
                  placeholder="#FFD700"
                  className="font-mono text-sm flex-1"
                />
              </div>
              {/* معاينة مباشرة للون المختار */}
              <div
                className="w-full h-10 rounded-lg border border-border/60 transition-colors"
                style={{ backgroundColor: newColourHex }}
                title="Colour preview"
              />
            </div>

            {/* ── أزرار الحفظ والإلغاء ── */}
            <div className="flex gap-2 justify-end pt-1">
              {/* إلغاء وإغلاق الحوار دون حفظ */}
              <Button
                variant="outline"
                onClick={() => { setNewColourDialogOpen(false); setNewColourName(""); }}
              >
                Cancel
              </Button>
              {/* حفظ اللون في النظام وتطبيقه تلقائياً */}
              <Button
                onClick={handleSaveNewColour}
                disabled={!newColourName.trim()}
              >
                Save Colour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          ── حوار عرض ملاحظة الموديل — يُفتح عند النقر على زر "ملاحظة" في البطاقة
          يعرض نص الملاحظة بتصميم احترافي مع اسم الموديل وكوده
      ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!noteModel} onOpenChange={open => !open && setNoteModel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            {/* عنوان الحوار: أيقونة + اسم القسم */}
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <FileText className="w-4 h-4" />
              {t("models.noteDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          {noteModel && (
            <div className="space-y-4 py-1">
              {/* معلومات الموديل: الاسم والكود */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Gem className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{noteModel.name}</p>
                  <p className="text-[10px] font-mono text-primary/70">{noteModel.code}</p>
                </div>
              </div>
              {/* نص الملاحظة — محاط بإطار مميّز بلون ذهبي */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {noteModel.notes}
                </p>
              </div>
              {/* زر إغلاق الحوار */}
              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNoteModel(null)}
                  className="text-xs"
                >
                  <X className="w-3 h-3 me-1.5" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          ── حوار تأكيد حذف الموديل — يظهر عند النقر على زر السلة الحمراء
      ════════════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={open => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* عنوان تحذيري مع أيقونة سلة */}
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Model
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this model? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* زر الإلغاء — يغلق الحوار بدون حذف */}
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* زر التأكيد — يحذف الموديل ويعرض إشعار نجاح */}
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (deleteTargetId) {
                  deleteModel(deleteTargetId);
                  setDeleteTargetId(null);
                  toast({ title: "Model deleted", description: "The model has been removed successfully." });
                }
              }}
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
