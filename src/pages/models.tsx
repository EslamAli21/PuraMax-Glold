// ============================================================
// صفحة الموديلات — إدارة موديلات المنتجات ومراحل إنتاجها
// تم تطوير هذه الصفحة لتشمل: شريط الفلاتر المحسّن، حقول إنشاء موديل جديدة،
// وبطاقة موديل مُعاد تصميمها لعرض جميع بيانات الموديل
// ============================================================
import React, { useState, useRef } from "react";
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
  ChevronRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
type PartDraft = {
  name: string;
  imageUrl?: string;
  stages: { sectionId: string; approxLossPercent: number }[];
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
}: {
  stages: { sectionId: string; approxLossPercent: number }[];
  onChange: (s: { sectionId: string; approxLossPercent: number }[]) => void;
  sections: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => (
        <div key={idx} className="flex items-end gap-2 bg-muted/40 p-2.5 rounded-md border">
          {/* رقم المرحلة */}
          <div className="w-6 shrink-0 pb-1 font-mono font-bold text-muted-foreground text-xs">{idx + 1}.</div>
          <div className="flex-1 space-y-1">
            {/* اختيار القسم */}
            <Label className="text-[10px] text-muted-foreground">{t("models.section")}</Label>
            <Select value={stage.sectionId} onValueChange={v => { const s = [...stages]; s[idx].sectionId = v; onChange(s); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-24 space-y-1">
            {/* نسبة الخسارة التقديرية بالنسبة المئوية */}
            <Label className="text-[10px] text-muted-foreground">{t("models.lossPercent")}</Label>
            <Input type="number" min="0" max="100" step="0.1"
              className="h-8 text-xs text-center"
              value={stage.approxLossPercent}
              onChange={e => { const s = [...stages]; s[idx].approxLossPercent = Number(e.target.value); onChange(s); }}
            />
          </div>
          {/* زر حذف المرحلة */}
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/80"
            onClick={() => onChange(stages.filter((_, i) => i !== idx))}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      {/* زر إضافة مرحلة جديدة */}
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
  const { models, sections, materials, addModel } = useMockState();
  const { toast } = useToast();
  const { t } = useTranslation();

  // ── حالة الحوارات ────────────────────────────────────────────────────
  const [isNewOpen, setIsNewOpen]           = useState(false);
  const [viewRouteModel, setViewRouteModel] = useState<Model | null>(null);
  const [editModel, setEditModel]           = useState<Model | null>(null);

  // ── حالات فلاتر البحث والتصفية ─────────────────────────────────────
  // نص البحث الحر — يبحث في الكود، الاسم، العيار، والمادة
  const [search,          setSearch]          = useState("");
  // فلتر الفئة — يصفي حسب نوع المنتج (خواتم، أساور...)
  const [filterCategory,  setFilterCategory]  = useState<string>("all");
  // فلتر العيار — يصفي حسب قيراط الذهب
  const [filterKarat,     setFilterKarat]     = useState<string>("all");
  // فلتر الألوان — يصفي حسب لون الموديل (يدعم اختيار أكثر من لون)
  const [filterColours,   setFilterColours]   = useState<string[]>([]);
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
  // حقل جديد: هل الموديل عينة sample أم موديل model للإنتاج؟
  const [isSample,         setIsSample]         = useState(false);
  // حقل جديد: المواد المرتبطة بالموديل (غير مواد الذهب)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [notes,            setNotes]            = useState("");
  const [modelImageUrl,    setModelImageUrl]    = useState<string | undefined>();
  const [partsCount,       setPartsCount]       = useState(1);
  const [parts,            setParts]            = useState<PartDraft[]>([
    { name: "", imageUrl: undefined, stages: [] },
  ]);
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
      while (next.length < count) next.push({ name: "", imageUrl: undefined, stages: [] });
      return next.slice(0, count);
    });
  };
  const updatePart = (idx: number, updates: Partial<PartDraft>) =>
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));

  const syncEditParts = (count: number) => {
    setEditPartsCount(count);
    setEditParts(prev => {
      const next = [...prev];
      while (next.length < count) next.push({ name: "", imageUrl: undefined, stages: [] });
      return next.slice(0, count);
    });
  };
  const updateEditPart = (idx: number, updates: Partial<PartDraft>) =>
    setEditParts(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));

  // ── استخراج الألوان المتاحة في النظام من المواد + قائمة COLOUR_OPTIONS ──
  // الألوان المستخرجة من المواد الموجودة في النظام (غير الذهبية)
  const systemColours = Array.from(
    new Set([
      ...COLOUR_OPTIONS,
      ...materials.map(m => m.color).filter(Boolean),
    ])
  );

  // المواد غير الذهبية فقط — تُعرض في الفلتر وفي بطاقة الموديل
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
    const colourMatch = filterColours.length === 0 || filterColours.includes(m.colour ?? "");

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
    setPartsCount(1); setParts([{ name: "", imageUrl: undefined, stages: [] }]);
    setModelStages([]);
  };

  // ── حفظ موديل جديد ──────────────────────────────────────────────────
  const handleSave = () => {
    if (!name) return;
    const builtParts: ModelPart[] = parts.map((p, i) => ({
      id: `part-${i}-${Date.now()}`,
      name: p.name || `Part ${i + 1}`,
      image: p.imageUrl,
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
    setEditStages(model.stages.map(s => ({ sectionId: s.sectionId, approxLossPercent: s.approxLossPercent })));
    const existingParts = model.parts || [];
    setEditPartsCount(existingParts.length);
    setEditParts(existingParts.map(p => ({
      name: p.name, imageUrl: p.image,
      stages: p.stages.map(s => ({ sectionId: s.sectionId, approxLossPercent: s.approxLossPercent })),
    })));
  };

  const handleEditSave = () => {
    toast({ title: t("models.modelUpdated"), description: editName });
    setEditModel(null);
  };

  // ── وجود أي فلتر نشط — لعرض زر مسح الفلاتر ─────────────────────
  const hasActiveFilters =
    search !== "" || filterCategory !== "all" || filterKarat !== "all" ||
    filterColours.length > 0 || filterMaterial !== "all";

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

                {/* لون الموديل — حقل جديد: يُختار من الألوان المتاحة في النظام */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-violet-500" />
                    Colour
                  </Label>
                  <Select value={colour} onValueChange={setColour}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {systemColours.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
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

              {/* ── قسم: المواد المرتبطة بالموديل (غير الذهب) — حقل جديد ── */}
              {nonGoldMaterials.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
                  <Label className="text-sm font-semibold">Materials (non-gold)</Label>
                  <p className="text-[10px] text-muted-foreground">
                    اختر المواد غير الذهبية المستخدمة في هذا الموديل
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {nonGoldMaterials.map(mat => (
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
                          "text-xs px-3 py-1.5 rounded-lg border transition-all",
                          selectedMaterials.includes(mat.id)
                            ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                            : "bg-background text-foreground border-border hover:border-primary/40"
                        )}
                      >
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
                    onClick={() => syncParts(Math.max(0, partsCount - 1))}>
                    <span className="text-base font-bold">−</span>
                  </Button>
                  <Input type="number" min="0" max="20" className="text-center font-bold text-base"
                    value={partsCount}
                    onChange={e => syncParts(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} />
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                    onClick={() => syncParts(partsCount + 1)}>
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
                  <RouteStages stages={modelStages} onChange={setModelStages} sections={sections} />
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
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t("models.partRoute")}</Label>
                        <RouteStages
                          stages={part.stages}
                          onChange={s => updatePart(idx, { stages: s })}
                          sections={sections}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ملاحظات ── */}
              <div className="space-y-2">
                <Label>{t("models.notes") || "Notes"}</Label>
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
      <div className="rounded-xl bg-[#2b3d5c] border border-[#3d5278] p-4 shadow-lg">
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

        {/* ── فلتر الألوان — متعدد الاختيار — يعرض الألوان المتاحة في النظام ── */}
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
            Choose Colour:
            <span className="text-[9px] font-normal text-white/40 ms-2 normal-case">
              Multiple selection allowed
            </span>
          </p>
          <ColourMultiSelect
            selected={filterColours}
            onChange={setFilterColours}
            options={systemColours}
          />
        </div>

        {/* ── إحصائيات الفلترة + زر مسح الفلاتر ── */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-white/50">
            Showing <span className="text-white font-bold">{filtered.length}</span> of {models.length} models
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch(""); setFilterCategory("all"); setFilterKarat("all");
                setFilterColours([]); setFilterMaterial("all");
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

          return (
            <Card key={model.id}
              className="overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-row h-[200px]">

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

                    {/* KARAT — عيار الذهب */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Karat
                      </p>
                      <p className="text-[10px] font-bold text-yellow-600 leading-tight">
                        {model.karat}K
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

                    {/* APPROXIMATE GOLD WEIGHT — وزن الذهب الخالص التقريبي */}
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        Approx. Gold Weight
                      </p>
                      <p className="text-[10px] font-semibold leading-tight font-mono text-yellow-600">
                        {model.approxPureGoldWeightGrams != null
                          ? `~${model.approxPureGoldWeightGrams}g`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── شريط الأزرار في أسفل البطاقة ── */}
                <div className="border-t border-border/40 flex divide-x divide-border/40 shrink-0">
                  <button
                    type="button"
                    className="flex-1 py-2 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => setViewRouteModel(model)}
                  >
                    {t("models.viewRoute")}
                  </button>
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
                setFilterColours([]); setFilterMaterial("all");
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

                  {/* لون الموديل */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-violet-500" />
                      Colour
                    </Label>
                    <Select value={editColour} onValueChange={setEditColour}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {systemColours.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
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

                {/* المواد غير الذهبية المرتبطة */}
                {nonGoldMaterials.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
                    <Label className="text-sm font-semibold">Materials (non-gold)</Label>
                    <div className="flex flex-wrap gap-2">
                      {nonGoldMaterials.map(mat => (
                        <button key={mat.id} type="button"
                          onClick={() =>
                            setEditSelectedMaterials(prev =>
                              prev.includes(mat.id)
                                ? prev.filter(x => x !== mat.id)
                                : [...prev, mat.id]
                            )
                          }
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-lg border transition-all",
                            editSelectedMaterials.includes(mat.id)
                              ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                              : "bg-background text-foreground border-border hover:border-primary/40"
                          )}>
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
                      onClick={() => syncEditParts(Math.max(0, editPartsCount - 1))}>
                      <span className="text-base font-bold">−</span>
                    </Button>
                    <Input type="number" min="0" max="20" className="text-center font-bold"
                      value={editPartsCount}
                      onChange={e => syncEditParts(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} />
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => syncEditParts(editPartsCount + 1)}>
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
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("models.partRoute")}</Label>
                          <RouteStages
                            stages={part.stages}
                            onChange={s => updateEditPart(idx, { stages: s })}
                            sections={sections}
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
                    <RouteStages stages={editStages} onChange={setEditStages} sections={sections} />
                  </div>
                )}

                <Button className="w-full" onClick={handleEditSave}>{t("models.saveModel")}</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
