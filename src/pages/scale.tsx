// ============================================================
// صفحة الميزان — Scale Page
// تحتوي هذه الصفحة على ثلاث تبويبات رئيسية:
//   1. شجرة القوالب (Tree Tab) — إدارة أشجار الذهب
//   2. الصهر المباشر (Direct Melt) — أوامر الصهر
//   3. قياس الوزن (Weight Tab) — قياس وتسجيل الأوزان
//
// التعديل الجديد في تبويب الشجرة:
//   - عند نقل عنصر من قائمة الانتظار إلى الشجرة، يظهر حوار
//     يسمح باختيار كمية جزئية بدلاً من نقل الكمية الكاملة دفعةً واحدة
// ============================================================
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  QrCode, ScanLine, TreePine, Plus, Trash2, Printer, Save,
  CheckCircle2, Clock, Package, User, Shuffle, X, Layers,
  Weight, FlameKindling, ChevronRight, AlertCircle, FileText,
  Gem, Box, Scissors,
} from "lucide-react";
import { cn, generateCode } from "@/lib/utils";

// ─── أنواع البيانات المستخدمة في هذه الصفحة ─────────────────────────────────

// عنصر في الشجرة النشطة
interface TreeItem { code: string; model: string; karat: string; qty: number; weight: number; gems: number; image?: string; }

// عنصر في قائمة الانتظار
interface WaitingItem { code: string; model: string; karat: string; qty: number; weight: number; image?: string; }

// بيانات شجرة واحدة
interface Tree { id: string; code: string; modelCode: string; karat: string; holders: number; items: TreeItem[]; notes: string; savedDraft?: string; savedFinal?: string; }

// بيانات أمر صهر
interface MeltOrderItem {
  id: number; customerCode: string; orderCode: string; modelCode: string;
  modelPic: string; partCode: string; kerat: string; size: string; qty: number; notes: string; roadMap: string;
}

// بيانات مادة خام مضافة
interface MaterialItem {
  id: number; pic: string; materialCode: string; addedTo: string;
  addedInSection: string; qty: number; unitWeight: number; totalWeight: number; goldNonGold: string;
}

// بيانات عنصر وزن
interface WeightItem {
  id: number; selected: boolean; customerCode: string; modelCode: string;
  modelPic: string; partCode: string; kerat: string; size: string; qty: number; notes: string; roadMap: string;
}

// ─── خريطة صور الموديلات مأخوذة من قسم الموديلات الرئيسية ─────────────────────
const MODEL_IMAGES: Record<string, string> = {
  "RNG-1012": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop&q=80",
  "PEN-2045": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop&q=80",
  "BGL-3108": "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&h=200&fit=crop&q=80",
  "EER-4022": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop&q=80",
  "CHN-5023": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop&q=80",
  // صور افتراضية للموديلات غير الموجودة في القاموس
  "RNG-6044": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop&q=80",
  "PEN-7011": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop&q=80",
};

// ─── البيانات الأولية لقائمة الانتظار ────────────────────────────────────────
const INITIAL_WAITING: WaitingItem[] = [
  { code: "EER-4022", model: "Drop Earrings",   karat: "18K", qty: 20, weight: 104.0, image: MODEL_IMAGES["EER-4022"] },
  { code: "CHN-5023", model: "Rope Chain 18K",  karat: "18K", qty: 12, weight: 168.0, image: MODEL_IMAGES["CHN-5023"] },
  { code: "RNG-6044", model: "Signet Ring",     karat: "21K", qty: 15, weight: 67.5,  image: MODEL_IMAGES["RNG-6044"] },
  { code: "PEN-7011", model: "Star Pendant",    karat: "18K", qty: 10, weight: 48.0,  image: MODEL_IMAGES["PEN-7011"] },
];

// ─── البيانات الأولية للأشجار ─────────────────────────────────────────────────
const INITIAL_TREES: Tree[] = [{
  id: "tree-001", code: "TR 123", modelCode: "TREE-18K-24H", karat: "18K", holders: 40, notes: "",
  items: [
    { code: "RNG-1012", model: "Classic Gold Ring", karat: "18K", qty: 16, weight: 72.0,  gems: 0, image: MODEL_IMAGES["RNG-1012"] },
    { code: "PEN-2045", model: "Leaf Pendant",      karat: "18K", qty: 14, weight: 95.2,  gems: 0, image: MODEL_IMAGES["PEN-2045"] },
    { code: "BGL-3108", model: "Twist Bangle",      karat: "22K", qty: 8,  weight: 176.0, gems: 0, image: MODEL_IMAGES["BGL-3108"] },
  ],
}];

// ─── البيانات الأولية لأوامر الصهر ───────────────────────────────────────────
const INITIAL_MELT_ITEMS: MeltOrderItem[] = [
  { id: 1, customerCode: "CST-001", orderCode: "ORD-503", modelCode: "RNG-1012", modelPic: MODEL_IMAGES["RNG-1012"], partCode: "PT-001", kerat: "18K", size: "7",   qty: 3, notes: "", roadMap: "Section A → Casting" },
  { id: 2, customerCode: "CST-002", orderCode: "ORD-504", modelCode: "PEN-2045", modelPic: MODEL_IMAGES["PEN-2045"], partCode: "PT-002", kerat: "21K", size: "N/A", qty: 3, notes: "", roadMap: "Section B → Casting" },
  { id: 3, customerCode: "CST-003", orderCode: "ORD-505", modelCode: "BGL-3108", modelPic: MODEL_IMAGES["BGL-3108"], partCode: "PT-003", kerat: "22K", size: "M",   qty: 3, notes: "", roadMap: "Section A → Casting" },
];

// ─── البيانات الأولية لعناصر الوزن ───────────────────────────────────────────
const INITIAL_WEIGHT_ITEMS: WeightItem[] = [
  { id: 1, selected: false, customerCode: "CST-001", modelCode: "RNG-1012", modelPic: MODEL_IMAGES["RNG-1012"], partCode: "PT-001", kerat: "18K", size: "7",   qty: 5, notes: "", roadMap: "Section A" },
  { id: 2, selected: false, customerCode: "CST-002", modelCode: "PEN-2045", modelPic: MODEL_IMAGES["PEN-2045"], partCode: "PT-002", kerat: "21K", size: "N/A", qty: 3, notes: "", roadMap: "Section B" },
  { id: 3, selected: false, customerCode: "CST-003", modelCode: "BGL-3108", modelPic: MODEL_IMAGES["BGL-3108"], partCode: "PT-003", kerat: "22K", size: "M",   qty: 8, notes: "", roadMap: "Section A" },
];

// ─── مكوّن شريط المسح (Scan Bar) المشترك بين التبويبات ──────────────────────
function ScanBar({ workerInput, setWorkerInput, itemInput, setItemInput, onScanItem }: {
  workerInput: string; setWorkerInput: (v: string) => void;
  itemInput: string;   setItemInput:  (v: string) => void;
  onScanItem: () => void;
}) {
  const { t } = useTranslation();
  return (
    // شبكة تحتوي على ثلاث بطاقات: المشغّل، القسم/الآلة، ومسح الكود
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* بطاقة بيانات المشغّل */}
      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-2">
          <User className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("scale.workerQrScan")}</p>
            <p className="text-xs font-semibold truncate">{workerInput}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 border-green-500/40 text-green-600">WK-5521</Badge>
        </CardContent>
      </Card>
      {/* بطاقة القسم أو الآلة */}
      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("scale.deptOrMachine")}</p>
            <p className="text-xs font-semibold">ORD-503 / CT-12 / RNG-1012</p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        </CardContent>
      </Card>
      {/* بطاقة مسح كود العنصر */}
      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("scale.scanItemQr")}</p>
            <Input
              value={itemInput}
              onChange={e => setItemInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onScanItem(); }}
              placeholder={t("scale.scanOrType")}
              className="h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onScanItem}>
            <ScanLine className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── زر الإجراء المساعد ──────────────────────────────────────────────────────
function ActionBtn({ label, variant = "outline", icon: Icon, onClick, disabled }: {
  label: string; variant?: "outline"|"default"|"destructive"|"ghost";
  icon?: React.ElementType; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <Button size="sm" variant={variant} className="gap-1.5 text-xs h-8" onClick={onClick} disabled={disabled}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

// ─── بطاقة حساب الفقد المشتركة بين التبويبات ─────────────────────────────────
function LossCalcCard({ lastTotal, currentTotal }: { lastTotal: number; currentTotal: number }) {
  const { t } = useTranslation();
  // حساب إجمالي الفقد = الوزن السابق - الوزن الحالي
  const totalLoss = Math.max(0, lastTotal - currentTotal);
  // حساب وزن الذهب (75% من الوزن الكلي لعيار 18K)
  const lastGold    = +(lastTotal    * 0.75).toFixed(2);
  const currentGold = +(currentTotal * 0.75).toFixed(2);
  const goldLoss    = +(lastGold - currentGold).toFixed(2);

  // صفوف جدول حساب الفقد
  const rows = [
    { label: t("scale.lastTotalWeight"),    value: lastTotal    ? `${lastTotal} g`    : "" },
    { label: t("scale.currentTotalWeight"), value: currentTotal ? `${currentTotal} g` : "" },
    { label: t("scale.totalLoss"),          value: totalLoss    ? `${totalLoss} g`    : "" },
    { label: t("scale.lastGoldTotal"),      value: lastGold     ? `${lastGold} g`     : "" },
    { label: t("scale.currentGoldTotal"),   value: currentGold  ? `${currentGold} g`  : "" },
    { label: t("scale.currentGoldLoss"),    value: goldLoss     ? `${goldLoss} g`     : "" },
    { label: t("scale.notes"),              value: ""                                       },
  ];

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm">{t("scale.lossCalc")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-xs">
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-t border-border/40">
                <td className="px-4 py-2 text-muted-foreground w-1/2">{r.label}</td>
                <td className="px-4 py-2 font-medium">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// تبويب الشجرة — TAB 1: TREE
// يتضمن قائمة الانتظار والشجرة النشطة مع دعم نقل الكميات الجزئية
// ═══════════════════════════════════════════════════════════════════════════════
function TreeTab() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // ─── حالة الأشجار وقائمة الانتظار ───────────────────────────────────────
  const [trees, setTrees]               = useState<Tree[]>(INITIAL_TREES);
  const [activeTreeId, setActiveTreeId] = useState("tree-001");
  const [waitingItems, setWaitingItems] = useState<WaitingItem[]>(INITIAL_WAITING);

  // ─── حالة مربعات الحوار ──────────────────────────────────────────────────
  const [isNewTreeOpen, setIsNewTreeOpen]       = useState(false);
  const [clearConfirmId, setClearConfirmId]     = useState<string|null>(null);
  const [dragOverTree, setDragOverTree]         = useState(false);
  const [removeWaitingOpen, setRemoveWaitingOpen] = useState(false);
  const [removeWaitingCode, setRemoveWaitingCode] = useState<string|null>(null);

  // ─── حالة مربع حوار إدراج الأحجار الكريمة ────────────────────────────────
  const [insertGemsOpen, setInsertGemsOpen] = useState(false);
  const [gemType,   setGemType]   = useState("");
  const [gemQty,    setGemQty]    = useState("");
  const [gemWeight, setGemWeight] = useState("");

  // ─── حالة مربع حوار أخذ الوزن ────────────────────────────────────────────
  const [takeWeightOpen, setTakeWeightOpen] = useState(false);
  const [takeWeightVal,  setTakeWeightVal]  = useState("");

  // ─── حالة مؤقتات الحفظ لكل شجرة ─────────────────────────────────────────
  const [draftSavedTimes, setDraftSavedTimes] = useState<Record<string,string>>({});
  const [savedTimes,      setSavedTimes]      = useState<Record<string,string>>({});
  // ─── حالة حوار قائمة المسودات ──────────────────────────────────────────
  const [draftListOpen,   setDraftListOpen]   = useState(false);

  // ─── حالة نموذج إنشاء شجرة جديدة ────────────────────────────────────────
  const [newCode,     setNewCode]     = useState("");
  const [newModelCode, setNewModel]   = useState("");
  const [newKarat,    setNewKarat]    = useState("18K");
  const [newHolders,  setNewHolders]  = useState("40");

  // ─── حالة مربع حوار اختيار الكمية الجزئية (التعديل الجديد) ───────────────
  // هذا هو القلب الجديد: بدلاً من نقل الكمية الكاملة فوراً،
  // يُظهر النظام مربع حوار يطلب من المستخدم تحديد كمية جزئية
  const [partialPlaceOpen,   setPartialPlaceOpen]   = useState(false);
  const [partialPlaceItem,   setPartialPlaceItem]   = useState<WaitingItem|null>(null);
  const [partialQtyInput,    setPartialQtyInput]    = useState(""); // القيمة المُدخلة في حقل الكمية

  // ─── مرجع لتتبع العنصر المسحوب في عملية السحب والإفلات ──────────────────
  const dragRef = useRef<WaitingItem|null>(null);

  // الشجرة النشطة حالياً
  const activeTree = trees.find(t => t.id === activeTreeId) || null;

  // إجمالي العناصر والوزن في الشجرة النشطة
  const totalItems  = activeTree ? activeTree.items.reduce((s,i) => s+i.qty, 0)    : 0;
  const grossWeight = activeTree ? activeTree.items.reduce((s,i) => s+i.weight, 0) : 0;
  // معامل الضرب الثابت لحساب كمية الذهب اللازمة للصهر
  const multiplyBy  = 16;

  // دالة تنسيق الوقت للعرض
  const fmt = (d: string) => new Date(d).toLocaleString();

  // ─── دالة إنشاء شجرة جديدة ───────────────────────────────────────────────
  // دالة إنشاء شجرة جديدة — الكود يُولَّد تلقائياً إذا ترك فارغاً
  const handleCreateTree = () => {
    // توليد كود تلقائي بالصيغة TR-YYYYMMDD-XXXX إذا لم يُدخل المستخدم كوداً
    const autoCode = newCode.trim() || generateCode("TR");
    const tr: Tree = {
      id:        `tree-${Date.now()}`,
      code:      autoCode,
      modelCode: newModelCode || generateCode("MDL"),
      karat:     newKarat,
      holders:   +newHolders || 40,
      items:     [],
      notes:     "",
    };
    setTrees(prev => [...prev, tr]);
    setActiveTreeId(tr.id);
    setIsNewTreeOpen(false);
    // إعادة تعيين حقول النموذج
    setNewCode(""); setNewModel(""); setNewKarat("18K"); setNewHolders("40");
    toast({ title: t("scale.treeCreated"), description: tr.code });
  };

  // ─── فتح مربع حوار الكمية الجزئية عند النقر على زر النقل ────────────────
  // هذه الدالة الجديدة تُفتح مربع الحوار بدلاً من نقل العنصر مباشرة
  const openPartialPlaceDialog = (item: WaitingItem) => {
    if (!activeTree) return;
    // تعيين العنصر المختار وإعادة تعيين حقل الكمية إلى الكمية الكاملة كافتراض
    setPartialPlaceItem(item);
    setPartialQtyInput(String(item.qty)); // القيمة الافتراضية = الكمية الكاملة
    setPartialPlaceOpen(true);
  };

  // ─── تأكيد نقل الكمية الجزئية أو الكاملة ────────────────────────────────
  // تُنفَّذ هذه الدالة عند الضغط على زر التأكيد في مربع الحوار
  const handleConfirmPartialPlace = () => {
    if (!partialPlaceItem || !activeTree) return;

    // تحليل الكمية المُدخلة والتحقق من صحتها
    const qty = parseInt(partialQtyInput, 10);
    if (isNaN(qty) || qty < 1 || qty > partialPlaceItem.qty) return;

    const item = partialPlaceItem;
    // حساب الوزن النسبي للكمية المنقولة
    const weightPerUnit = item.weight / item.qty;
    const movedWeight   = +(weightPerUnit * qty).toFixed(3);

    // تحديث الشجرة: إضافة العنصر بالكمية المحددة
    const existing = activeTree.items.find(i => i.code === item.code);
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? {
        ...tr,
        items: existing
          // إذا كان العنصر موجوداً في الشجرة: زيادة كميته ووزنه
          ? tr.items.map(i =>
              i.code === item.code
                ? { ...i, qty: i.qty + qty, weight: +(i.weight + movedWeight).toFixed(3) }
                : i
            )
          // إذا لم يكن موجوداً: إضافته كعنصر جديد
          : [...tr.items, { code: item.code, model: item.model, karat: item.karat, qty, weight: movedWeight, gems: 0, image: item.image }]
      } : tr
    ));

    // تحديث قائمة الانتظار:
    const remaining = item.qty - qty;
    if (remaining <= 0) {
      // إزالة العنصر من قائمة الانتظار إذا نُقلت كامل الكمية
      setWaitingItems(prev => prev.filter(w => w.code !== item.code));
    } else {
      // تحديث الكمية المتبقية في قائمة الانتظار
      setWaitingItems(prev => prev.map(w =>
        w.code === item.code
          ? { ...w, qty: remaining, weight: +(w.weight - movedWeight).toFixed(3) }
          : w
      ));
    }

    // إغلاق الحوار وإظهار إشعار النجاح
    setPartialPlaceOpen(false);
    setPartialPlaceItem(null);
    setPartialQtyInput("");
    toast({
      title:       t("scale.itemPlaced"),
      description: `${qty} × ${item.code} → ${activeTree.code}${remaining > 0 ? ` (${remaining} ${t("scale.qty")} remaining)` : ""}`,
    });
  };

  // ─── معالجة السحب والإفلات: فتح حوار الكمية الجزئية أيضاً ───────────────
  const handleDrop = () => {
    setDragOverTree(false);
    if (dragRef.current) {
      // فتح حوار الكمية الجزئية بدلاً من النقل الفوري عند الإفلات أيضاً
      openPartialPlaceDialog(dragRef.current);
      dragRef.current = null;
    }
  };

  // ─── إزالة عنصر من الشجرة وإعادته لقائمة الانتظار ────────────────────────
  const handleRemoveFromTree = (code: string) => {
    if (!activeTree) return;
    const removed = activeTree.items.find(i => i.code === code);
    if (!removed) return;
    // إزالة من الشجرة
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? { ...tr, items: tr.items.filter(i => i.code !== code) } : tr
    ));
    // إعادة إلى قائمة الانتظار
    setWaitingItems(prev => [
      { code: removed.code, model: removed.model, karat: removed.karat, qty: removed.qty, weight: removed.weight, image: removed.image },
      ...prev,
    ]);
  };

  // ─── حذف عنصر من قائمة الانتظار نهائياً ─────────────────────────────────
  const handleRemoveFromWaiting = () => {
    if (!removeWaitingCode) return;
    setWaitingItems(prev => prev.filter(w => w.code !== removeWaitingCode));
    setRemoveWaitingCode(null);
    setRemoveWaitingOpen(false);
    toast({ title: t("scale.itemRemoved") });
  };

  // ─── إضافة أحجار كريمة للشجرة ───────────────────────────────────────────
  const handleInsertGems = () => {
    if (!gemType.trim() || !activeTree) return;
    toast({ title: t("scale.gemAdded"), description: `${gemQty} × ${gemType} (${gemWeight}g)` });
    setGemType(""); setGemQty(""); setGemWeight("");
    setInsertGemsOpen(false);
  };

  // ─── أخذ وزن الشجرة ──────────────────────────────────────────────────────
  const handleTakeWeight = () => {
    if (!takeWeightVal) return;
    toast({ title: t("scale.weightUpdated"), description: `${takeWeightVal} g` });
    setTakeWeightVal("");
    setTakeWeightOpen(false);
  };

  // ─── حفظ مسودة الشجرة ────────────────────────────────────────────────────
  const handleSaveDraft = () => {
    const now = new Date().toISOString();
    setDraftSavedTimes(prev => ({ ...prev, [activeTreeId]: now }));
    toast({ title: t("scale.savedDraftToast"), description: t("scale.savedDraftDescToast") });
  };

  // ─── حفظ الشجرة نهائياً ──────────────────────────────────────────────────
  const handleSave = () => {
    const now = new Date().toISOString();
    setSavedTimes(prev => ({ ...prev, [activeTreeId]: now }));
    toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") });
  };

  // ─── حفظ الشجرة وطباعتها ─────────────────────────────────────────────────
  const handleSaveAndPrint = () => {
    const now = new Date().toISOString();
    setSavedTimes(prev => ({ ...prev, [activeTreeId]: now }));
    toast({ title: t("scale.savedAndPrintedToast") });
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* ── مخطط مسار نقل المواد إلى الشجرة — Data Flow Tree ─────────────── */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 overflow-x-auto">
        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <TreePine className="w-3.5 h-3.5" /> مسار نقل المواد إلى الشجرة — Data Transfer Tree Flow
        </p>
        <div className="flex items-start gap-0 text-[10px] min-w-[600px]">
          {/* عقدة قائمة الانتظار */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-2 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-center whitespace-nowrap">
              <Package className="w-3 h-3 mx-auto mb-0.5" />
              قائمة الانتظار<br/>
              <span className="font-mono font-normal text-[9px]">Item Waiting ({waitingItems.length})</span>
            </div>
            <div className="w-px h-4 bg-green-500/40" />
          </div>
          {/* سهم النقل الجزئي */}
          <div className="flex items-center mt-4 mx-1">
            <div className="w-8 h-px bg-green-500/60" />
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-green-500/60" />
          </div>
          {/* عقدة الشجرة النشطة */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-2 rounded-lg border-2 border-green-500/70 bg-green-500/15 text-green-700 dark:text-green-400 font-bold text-center whitespace-nowrap shadow-sm">
              <TreePine className="w-3 h-3 mx-auto mb-0.5" />
              الشجرة النشطة<br/>
              <span className="font-mono font-normal text-[9px]">{activeTree ? activeTree.code : "—"}</span>
            </div>
            {/* فروع عناصر الشجرة */}
            {activeTree && activeTree.items.length > 0 && (
              <div className="relative mt-1">
                <div className="w-px h-3 bg-green-500/40 mx-auto" />
                <div className="flex gap-2">
                  {activeTree.items.map((item) => (
                    <div key={item.code} className="flex flex-col items-center">
                      <div className="w-px h-2 bg-green-500/30" />
                      <div className="px-2 py-1 rounded border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300 text-[9px] whitespace-nowrap">
                        {item.code}<br/><span className="text-green-500">{item.qty} pcs · {item.weight}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* سهم الصهر */}
          <div className="flex items-center mt-4 mx-1">
            <div className="w-8 h-px bg-orange-500/60" />
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-orange-500/60" />
          </div>
          {/* عقدة الصهر */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-2 rounded-lg border-2 border-orange-500/60 bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold text-center whitespace-nowrap">
              <FlameKindling className="w-3 h-3 mx-auto mb-0.5" />
              قسم الصهر<br/>
              <span className="font-mono font-normal text-[9px]">Casting Section</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── أزرار التنقل بين الأشجار ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* زر لكل شجرة متاحة */}
          {trees.map(tr => (
            <button key={tr.id} onClick={() => setActiveTreeId(tr.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                tr.id === activeTreeId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}>
              <TreePine className="h-3.5 w-3.5" />
              {tr.code}
              {tr.items.length > 0 && (
                <span className="ml-1 text-[10px] px-1 rounded bg-background/20">
                  {tr.items.reduce((s,i) => s+i.qty, 0)}
                </span>
              )}
            </button>
          ))}
          {/* حوار إنشاء شجرة جديدة */}
          <Dialog open={isNewTreeOpen} onOpenChange={setIsNewTreeOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                <Plus className="h-3.5 w-3.5" /> {t("scale.newTree")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>{t("scale.createNewTree")}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">{t("scale.treeCode")} *</Label>
                  <Input placeholder="TR-001200" value={newCode} onChange={e => setNewCode(e.target.value)} className="font-mono text-sm"/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("scale.modelCode")}</Label>
                  <Input placeholder="TREE-18K-24H" value={newModelCode} onChange={e => setNewModel(e.target.value)} className="font-mono text-sm"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("scale.karat")}</Label>
                    <Select value={newKarat} onValueChange={setNewKarat}>
                      <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18K">18K</SelectItem>
                        <SelectItem value="21K">21K</SelectItem>
                        <SelectItem value="22K">22K</SelectItem>
                        <SelectItem value="24K">24K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("scale.holders")}</Label>
                    <Input type="number" value={newHolders} onChange={e => setNewHolders(e.target.value)} className="text-sm"/>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateTree}>{/* الكود يُولَّد تلقائياً إذا ترك فارغاً */}
                  <TreePine className="h-4 w-4 me-2"/> {t("scale.createTree")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* زر فتح قائمة جميع المسودات — يعرض عدد الأشجار ويفتح حوار القائمة */}
        <button
          onClick={() => setDraftListOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/40 bg-amber-500/5 text-amber-600 text-xs font-medium hover:bg-amber-500/10 transition-colors"
        >
          <FileText className="h-3 w-3"/>
          {trees.length === 1
            ? t("scale.youHaveDraftTree", { count: trees.length })
            : t("scale.youHaveDraftTrees", { count: trees.length })}
        </button>
      </div>

      {/* ── المنطقة الرئيسية: قائمة الانتظار (يسار) + الشجرة (يمين) ────────── */}
      <div className="grid xl:grid-cols-2 gap-4">

        {/* ── جانب يسار: قائمة الانتظار ───────────────────────────────────── */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wide">{t("scale.itemWaiting")}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {t("scale.totalItemsCount")} : {waitingItems.reduce((s,i) => s+i.qty, 0)}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] py-2">{t("scale.assignedToTreeDate")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.number")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.source")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.modelPic")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.modelCode")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.partPicCode")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.approxWeight")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.karat")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.size")}</TableHead>
                      <TableHead className="text-[10px] py-2">{t("scale.qty")}</TableHead>
                      {/* عمود زر النقل */}
                      <TableHead className="text-[10px] py-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* رسالة عند فراغ قائمة الانتظار */}
                    {waitingItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                          {t("scale.noItemsWaiting")}
                        </TableCell>
                      </TableRow>
                    )}
                    {/* صفوف عناصر قائمة الانتظار */}
                    {waitingItems.map((item, idx) => (
                      <TableRow
                        key={item.code}
                        draggable
                        // تعيين العنصر المسحوب عند بدء السحب
                        onDragStart={() => { dragRef.current = item; }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <TableCell className="text-xs py-2 text-muted-foreground">—</TableCell>
                        <TableCell className="text-xs py-2 font-mono">{idx+1}</TableCell>
                        <TableCell className="text-xs py-2">designer</TableCell>
                        {/* ── خلية صورة الموديل الفعلية من قسم الموديلات ── */}
                        <TableCell className="text-xs py-2">
                          {item.image ? (
                            <img src={item.image} alt={item.model} className="w-8 h-8 object-cover rounded border border-border/50" />
                          ) : (
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-[9px] text-muted-foreground">—</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs py-2 font-mono">{item.code}</TableCell>
                        <TableCell className="text-xs py-2">{item.model}</TableCell>
                        <TableCell className="text-xs py-2">{item.weight}g</TableCell>
                        <TableCell className="text-xs py-2">{item.karat}</TableCell>
                        <TableCell className="text-xs py-2">—</TableCell>
                        <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                        <TableCell className="text-xs py-2">
                          {/* زر النقل الجديد — يفتح حوار اختيار الكمية بدلاً من النقل الفوري */}
                          <Button
                            size="sm" variant="ghost"
                            className="h-6 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                            onClick={() => openPartialPlaceDialog(item)}
                            title="نقل إلى الشجرة — اختر الكمية"
                          >
                            <ChevronRight className="h-3 w-3"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* زر إزالة عنصر من قائمة الانتظار */}
          <div className="flex gap-2 flex-wrap">
            <ActionBtn
              label={`(−) ${t("scale.removeItem")}`}
              icon={X}
              variant="outline"
              disabled={waitingItems.length === 0}
              onClick={() => {
                if (waitingItems.length > 0) {
                  setRemoveWaitingCode(waitingItems[0].code);
                  setRemoveWaitingOpen(true);
                }
              }}
            />
          </div>

          {/* بطاقة حساب الذهب اللازم للصهر */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">{t("scale.neededMeltCalc")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-t border-border/40">
                    <td className="px-4 py-2 text-muted-foreground">{t("scale.totalWeightG")}</td>
                    <td className="px-4 py-2 font-medium">{grossWeight > 0 ? `${grossWeight.toFixed(1)} g` : t("scale.autoFromTakeWeigh")}</td>
                  </tr>
                  <tr className="border-t border-border/40">
                    <td className="px-4 py-2 text-muted-foreground">{t("scale.baseWeightG")}</td>
                    <td className="px-4 py-2 font-medium">{t("scale.takeSmartScale")}</td>
                  </tr>
                  <tr className="border-t border-border/40">
                    <td className="px-4 py-2 text-muted-foreground">{t("scale.totalGemsWeight")}</td>
                    <td className="px-4 py-2 font-medium">{t("scale.fromEnteringAuto")}</td>
                  </tr>
                  <tr className="border-t border-border/40">
                    <td className="px-4 py-2 text-muted-foreground">{t("scale.multiplyBy")}</td>
                    <td className="px-4 py-2 font-medium">{multiplyBy} ({t("scale.alwaysSame")})</td>
                  </tr>
                  <tr className="border-t border-border/40">
                    <td className="px-4 py-2 text-muted-foreground">{t("scale.neededGoldToMelt")}</td>
                    <td className="px-4 py-2 font-mono font-bold text-primary">~(total-base-gems)×{multiplyBy}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* ── جانب يمين: الشجرة النشطة ─────────────────────────────────────── */}
        <div
          className="space-y-3"
          // منطقة استقبال السحب والإفلات
          onDragOver={e => { e.preventDefault(); setDragOverTree(true); }}
          onDragLeave={() => setDragOverTree(false)}
          // عند الإفلات: فتح حوار الكمية الجزئية بدلاً من النقل الفوري
          onDrop={e => { e.preventDefault(); handleDrop(); }}
        >
          {activeTree ? (
            <>
              {/* جدول عناصر الشجرة النشطة */}
              <Card className={cn("transition-colors", dragOverTree && "border-primary/60 bg-primary/5")}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm">{t("scale.treeNumber")} 1 — CODE {activeTree.code}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead colSpan={6} className="text-[10px] py-2 border-r border-border/40">{t("scale.modelSpec")}</TableHead>
                          <TableHead colSpan={4} className="text-[10px] py-2">{t("scale.seeAddedGems")}</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-[10px] py-1.5">{t("scale.number")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.source")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.pic")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.itemNameCode")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.approxWeight")}</TableHead>
                          <TableHead className="text-[10px] py-1.5 border-r border-border/40">{t("scale.karat")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.size")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.addedGems")}</TableHead>
                          <TableHead className="text-[10px] py-1.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* رسالة عند فراغ الشجرة */}
                        {activeTree.items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                              {t("scale.dragItemsHere")}
                            </TableCell>
                          </TableRow>
                        )}
                        {/* صفوف عناصر الشجرة */}
                        {activeTree.items.map((item, idx) => (
                          <TableRow key={item.code} className="bg-green-500/8 hover:bg-green-500/12 border-l-2 border-l-green-500/40">
                            <TableCell className="text-xs py-2 font-mono">{idx+1}</TableCell>
                            <TableCell className="text-xs py-2">designer</TableCell>
                            <TableCell className="text-xs py-2">
                              <div className="w-7 h-7 bg-muted rounded text-[9px] flex items-center justify-center">pic</div>
                            </TableCell>
                            <TableCell className="text-xs py-2 font-mono">{item.code}</TableCell>
                            <TableCell className="text-xs py-2">{item.weight}g</TableCell>
                            <TableCell className="text-xs py-2 border-r border-border/40">{item.karat}</TableCell>
                            <TableCell className="text-xs py-2">—</TableCell>
                            <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {item.gems > 0 ? item.gems : "—"}
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              {/* زر حذف العنصر من الشجرة وإعادته لقائمة الانتظار */}
                              <Button
                                size="sm" variant="ghost"
                                className="h-6 px-2 text-destructive/70 hover:text-destructive"
                                onClick={() => handleRemoveFromTree(item.code)}
                              >
                                <Trash2 className="h-3 w-3"/>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* أزرار إجراءات الشجرة */}
              <div className="flex gap-2 flex-wrap">
                <ActionBtn label={`(+) ${t("scale.insertGems")}`}        icon={Gem}      onClick={() => setInsertGemsOpen(true)}/>
                <ActionBtn label={`(+) ${t("scale.insertAnotherTree")}`} icon={TreePine} onClick={() => setIsNewTreeOpen(true)}/>
                <ActionBtn label={`(+) ${t("scale.takeWeight")}`}        icon={Weight}   onClick={() => setTakeWeightOpen(true)}/>
              </div>

              {/* بطاقة مواصفات الشجرة */}
              <Card className="border-border/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t("scale.treeSpec")} 1
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.treeCodeQr")}</td><td className="px-4 py-2 font-mono font-bold">{activeTree.code}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.karat")}</td><td className="px-4 py-2">{activeTree.karat}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.qtyInTree")}</td><td className="px-4 py-2 font-bold">{totalItems}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.addedGemsQtyWeight")}</td><td className="px-4 py-2">—</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.treeTotalWeight")}</td><td className="px-4 py-2 font-bold">{grossWeight > 0 ? `${grossWeight.toFixed(1)}g` : "—"}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.savedDraftTime")}</td><td className="px-4 py-2 text-muted-foreground">{draftSavedTimes[activeTreeId] ? fmt(draftSavedTimes[activeTreeId]) : "—"}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.savedTime")}</td><td className="px-4 py-2 text-muted-foreground">{savedTimes[activeTreeId] ? fmt(savedTimes[activeTreeId]) : "—"}</td></tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          ) : (
            /* رسالة عند عدم وجود شجرة مختارة */
            <Card className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {t("scale.selectOrCreateTree")}
            </Card>
          )}
        </div>
      </div>

      {/* ── شريط أزرار الحفظ في أسفل الصفحة ───────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border/40">
        <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
          <span>{t("scale.saveNote")}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ActionBtn label={t("scale.saveDraft")}    icon={Save}         variant="outline" onClick={handleSaveDraft}/>
          <ActionBtn label={t("scale.save")}         icon={CheckCircle2} variant="default" onClick={handleSave}/>
          <ActionBtn label={t("scale.saveAndPrint")} icon={Printer}      variant="default" onClick={handleSaveAndPrint}/>
        </div>
      </div>

      {/* ─── حوار قائمة المسودات — يعرض كل الأشجار كقائمة قابلة للنقر ─── */}
      <Dialog open={draftListOpen} onOpenChange={setDraftListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600"/>
              {t("scale.draftListTitle") || "قائمة المسودات"}
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600">{trees.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          {/* قائمة الأشجار — كل شجرة صف قابل للنقر للانتقال إليها */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-1">
            {trees.map(tr => {
              const isActiveTree = tr.id === activeTreeId;
              const totalQty = tr.items.reduce((s,i) => s+i.qty, 0);
              const totalW   = tr.items.reduce((s,i) => s+i.weight, 0).toFixed(1);
              return (
                <button
                  key={tr.id}
                  onClick={() => { setActiveTreeId(tr.id); setDraftListOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border p-3 text-start transition-colors",
                    isActiveTree
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60"
                  )}
                >
                  {/* أيقونة الشجرة */}
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", isActiveTree ? "bg-primary/20" : "bg-muted")}>
                    <TreePine className={cn("w-4 h-4", isActiveTree ? "text-primary" : "text-muted-foreground")}/>
                  </div>
                  {/* تفاصيل الشجرة */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{tr.code}</p>
                      {isActiveTree && <Badge className="text-[9px] px-1.5 py-0 h-4">{t("scale.activeTree") || "النشطة"}</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{tr.modelCode} · {tr.karat}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{tr.items.length} {t("scale.models") || "موديلات"}</span>
                      <span className="text-[10px] text-muted-foreground">{totalQty} {t("scale.qty") || "قطعة"}</span>
                      <span className="text-[10px] text-muted-foreground">{totalW}g</span>
                    </div>
                    {/* أيقونات الموديلات كدوائر صغيرة تعرض أول حرفين من كود كل موديل */}
                    {tr.items.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {tr.items.slice(0, 5).map(item => (
                          <div key={item.code} title={item.code + " — " + item.model}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                            {item.code.slice(0,2)}
                          </div>
                        ))}
                        {tr.items.length > 5 && <span className="text-[10px] text-muted-foreground">+{tr.items.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  {/* وقت حفظ المسودة */}
                  <div className="text-end shrink-0">
                    {draftSavedTimes[tr.id]
                      ? <p className="text-[9px] text-muted-foreground">{fmt(draftSavedTimes[tr.id])}</p>
                      : <p className="text-[9px] text-muted-foreground italic">{t("scale.noDraft") || "لم تُحفَظ"}</p>
                    }
                  </div>
                </button>
              );
            })}
          </div>
          <Button variant="outline" className="w-full text-xs mt-1" onClick={() => setDraftListOpen(false)}>
            {t("common.close") || "إغلاق"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          مربع حوار اختيار الكمية الجزئية — الميزة الجديدة
          يظهر هذا الحوار عند النقر على زر النقل أو الإفلات في منطقة الشجرة
          يسمح للمستخدم بنقل كمية جزئية من عنصر في قائمة الانتظار إلى الشجرة
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={partialPlaceOpen} onOpenChange={open => { if (!open) { setPartialPlaceOpen(false); setPartialPlaceItem(null); setPartialQtyInput(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" />
              نقل إلى الشجرة — تحديد الكمية
            </DialogTitle>
          </DialogHeader>

          {partialPlaceItem && (
            <div className="space-y-4 pt-1">
              {/* معلومات العنصر المختار */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الموديل:</span>
                  <span className="font-mono font-bold">{partialPlaceItem.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الاسم:</span>
                  <span className="font-medium">{partialPlaceItem.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">العيار:</span>
                  <Badge variant="outline" className="text-[10px]">{partialPlaceItem.karat}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الكمية الإجمالية في الانتظار:</span>
                  <span className="font-bold text-primary">{partialPlaceItem.qty} قطعة</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الوزن التقريبي:</span>
                  <span className="font-medium">{partialPlaceItem.weight}g</span>
                </div>
                {/* الشجرة الهدف */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">الشجرة الهدف:</span>
                  <span className="flex items-center gap-1 font-medium text-green-600">
                    <TreePine className="w-3 h-3"/>
                    {activeTree?.code}
                  </span>
                </div>
              </div>

              {/* حقل إدخال الكمية المراد نقلها */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  الكمية المراد نقلها
                  <span className="text-muted-foreground font-normal mr-1">
                    (من 1 إلى {partialPlaceItem.qty})
                  </span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={partialPlaceItem.qty}
                  value={partialQtyInput}
                  onChange={e => setPartialQtyInput(e.target.value)}
                  // تأكيد عند الضغط على Enter
                  onKeyDown={e => { if (e.key === "Enter") handleConfirmPartialPlace(); }}
                  className="text-center text-lg font-bold h-12"
                  autoFocus
                />
                {/* أزرار التعيين السريع */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                    onClick={() => setPartialQtyInput("1")}
                  >
                    1 قطعة
                  </button>
                  <button
                    className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                    onClick={() => setPartialQtyInput(String(Math.floor(partialPlaceItem.qty / 2)))}
                  >
                    نصف ({Math.floor(partialPlaceItem.qty / 2)})
                  </button>
                  <button
                    className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                    onClick={() => setPartialQtyInput(String(partialPlaceItem.qty))}
                  >
                    الكل ({partialPlaceItem.qty})
                  </button>
                </div>
              </div>

              {/* معاينة حساب الوزن المنقول */}
              {partialQtyInput && parseInt(partialQtyInput) >= 1 && parseInt(partialQtyInput) <= partialPlaceItem.qty && (
                <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الكمية المنقولة:</span>
                    <span className="font-bold text-green-700 dark:text-green-400">{parseInt(partialQtyInput)} قطعة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الوزن المنقول:</span>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {+((partialPlaceItem.weight / partialPlaceItem.qty) * parseInt(partialQtyInput)).toFixed(3)}g
                    </span>
                  </div>
                  {parseInt(partialQtyInput) < partialPlaceItem.qty && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>المتبقي في الانتظار:</span>
                      <span>{partialPlaceItem.qty - parseInt(partialQtyInput)} قطعة</span>
                    </div>
                  )}
                </div>
              )}

              {/* أزرار التأكيد والإلغاء */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline" className="flex-1"
                  onClick={() => { setPartialPlaceOpen(false); setPartialPlaceItem(null); setPartialQtyInput(""); }}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleConfirmPartialPlace}
                  disabled={
                    !partialQtyInput ||
                    isNaN(parseInt(partialQtyInput)) ||
                    parseInt(partialQtyInput) < 1 ||
                    parseInt(partialQtyInput) > partialPlaceItem.qty
                  }
                >
                  <ChevronRight className="w-4 h-4"/>
                  نقل إلى الشجرة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── حوار تأكيد مسح الشجرة ─────────────────────────────────────────── */}
      <AlertDialog open={!!clearConfirmId} onOpenChange={() => setClearConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.clearTree")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scale.clearTreeDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const tr = trees.find(t => t.id === clearConfirmId);
              if (!tr) return;
              // إعادة عناصر الشجرة إلى قائمة الانتظار
              setWaitingItems(p => [...tr.items.map(i => ({ code:i.code, model:i.model, karat:i.karat, qty:i.qty, weight:i.weight })), ...p]);
              setTrees(p => p.map(t => t.id === clearConfirmId ? { ...t, items: [] } : t));
              setClearConfirmId(null);
            }}>{t("scale.clear")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── حوار تأكيد حذف عنصر من قائمة الانتظار ─────────────────────────── */}
      <AlertDialog open={removeWaitingOpen} onOpenChange={setRemoveWaitingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.removeItemTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("scale.removeItemDesc")}{removeWaitingCode ? ` (${removeWaitingCode})` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveWaitingCode(null)}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveFromWaiting}
            >
              {t("scale.confirmRemove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── حوار إضافة الأحجار الكريمة ──────────────────────────────────────── */}
      <Dialog open={insertGemsOpen} onOpenChange={setInsertGemsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t("scale.insertGemsTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.gemType")}</Label>
              <Input value={gemType} onChange={e => setGemType(e.target.value)} placeholder="Diamond, Ruby…"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.gemQty")}</Label>
                <Input type="number" value={gemQty} onChange={e => setGemQty(e.target.value)} placeholder="0"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.gemWeight")}</Label>
                <Input type="number" value={gemWeight} onChange={e => setGemWeight(e.target.value)} placeholder="0.00"/>
              </div>
            </div>
            <Button className="w-full" onClick={handleInsertGems} disabled={!gemType.trim()}>
              {t("scale.addedGems")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── حوار أخذ وزن الشجرة ─────────────────────────────────────────────── */}
      <Dialog open={takeWeightOpen} onOpenChange={setTakeWeightOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.takeWeight")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.newWeightG")}</Label>
              <Input type="number" value={takeWeightVal} onChange={e => setTakeWeightVal(e.target.value)} placeholder="0.00"/>
            </div>
            <Button className="w-full" onClick={handleTakeWeight} disabled={!takeWeightVal}>
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// تبويب الصهر المباشر — TAB 2: DIRECT MELT
// يعرض قائمة أوامر الصهر ويحسب الفاقد في الوزن
// ═══════════════════════════════════════════════════════════════════════════════
function DirectMeltTab() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [items, setItems]                             = useState<MeltOrderItem[]>(INITIAL_MELT_ITEMS);
  const [lastTotalWeight,    setLastTotalWeight]      = useState(320.5);
  const [currentTotalWeight, setCurrentTotalWeight]   = useState(315.2);
  const [lossNotes,          setLossNotes]            = useState("");
  const [measureWeightOpen,  setMeasureWeightOpen]    = useState(false);
  const [measureQtyOpen,     setMeasureQtyOpen]       = useState(false);
  const [newWeight,          setNewWeight]            = useState("");
  const [addQrOpen,          setAddQrOpen]            = useState(false);
  const [newQr,              setNewQr]                = useState("");
  const [returnDustOpen,     setReturnDustOpen]       = useState(false);
  const [returnPartsOpen,    setReturnPartsOpen]      = useState(false);
  const [confirmed,          setConfirmed]            = useState<boolean|null>(null);

  // مجموع الكميات في جميع أوامر الصهر
  const insertCurrentQty = items.reduce((s,i) => s+i.qty, 0);

  // ─── إضافة كود QR جديد ───────────────────────────────────────────────────
  const handleAddQr = () => {
    if (!newQr.trim()) return;
    toast({ title: t("scale.addQrTitle"), description: newQr });
    setNewQr(""); setAddQrOpen(false);
  };

  // ─── حفظ بيانات الصهر ────────────────────────────────────────────────────
  const handleSave = () => {
    setConfirmed(true);
    toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") });
  };

  // ─── طباعة تقرير الصهر ───────────────────────────────────────────────────
  const handlePrint = () => {
    toast({ title: t("scale.print") });
    setTimeout(() => window.print(), 300);
  };

  // ─── تأكيد الصهر ─────────────────────────────────────────────────────────
  const handleYes = () => {
    setConfirmed(true);
    toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") });
  };

  // ─── إلغاء الصهر ─────────────────────────────────────────────────────────
  const handleNo = () => {
    setConfirmed(false);
    toast({ title: t("common.cancel"), description: "—", variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      {/* وصف التبويب وزر إضافة QR */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{t("scale.meltDesc")}</p>
        <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => setAddQrOpen(true)}>
          <QrCode className="h-3.5 w-3.5"/> {t("scale.addAnotherQr")}
        </Button>
      </div>

      {/* جدول أوامر الصهر المطلوبة */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm uppercase tracking-wide">{t("scale.neededOrderModels")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={6} className="text-[10px] py-2 border-r border-border/40 text-center">{t("scale.itemsSpec")}</TableHead>
                  <TableHead colSpan={2} className="text-[10px] py-2 text-center">{t("scale.itemsRoadMap")}</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-[10px] py-1.5">{t("scale.number")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.customerCode")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.orderCode")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.modelCode")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.modelPic")}</TableHead>
                  <TableHead className="text-[10px] py-1.5 border-r border-border/40">{t("scale.partPicCode")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.karat")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.size")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.notes")}</TableHead>
                  <TableHead className="text-[10px] py-1.5">{t("scale.roadMap")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* صف ملخص الكمية الحالية */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-2">
                    {t("scale.insertCurrentQty")} = {insertCurrentQty}
                  </TableCell>
                </TableRow>
                {/* صفوف أوامر الصهر */}
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs py-2">{idx+1}</TableCell>
                    <TableCell className="text-xs py-2 font-mono">{item.customerCode}</TableCell>
                    <TableCell className="text-xs py-2 font-mono">{item.orderCode}</TableCell>
                    <TableCell className="text-xs py-2 font-mono">{item.modelCode}</TableCell>
                    <TableCell className="text-xs py-2"><div className="w-7 h-7 bg-muted rounded text-[9px] flex items-center justify-center">pic</div></TableCell>
                    <TableCell className="text-xs py-2 border-r border-border/40">{item.partCode}</TableCell>
                    <TableCell className="text-xs py-2">{item.kerat}</TableCell>
                    <TableCell className="text-xs py-2">{item.size}</TableCell>
                    <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">
                      {item.notes || <span className="italic text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-xs py-2">{item.roadMap}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات */}
      <div className="flex gap-2 flex-wrap">
        <ActionBtn label={`(−) ${t("scale.returnDust")}`}           variant="outline" onClick={() => setReturnDustOpen(true)}/>
        <ActionBtn label={`(−) ${t("scale.returnParts")}`}          variant="outline" onClick={() => setReturnPartsOpen(true)}/>
        <ActionBtn label={`(+) ${t("scale.measureCurrentQty")}`}    icon={Plus}       onClick={() => setMeasureQtyOpen(true)}/>
        <ActionBtn label={`(+) ${t("scale.measureCurrentWeight")}`} icon={Weight}     onClick={() => setMeasureWeightOpen(true)}/>
      </div>

      {/* بطاقة حساب الفاقد */}
      <div className="max-w-sm">
        <LossCalcCard lastTotal={lastTotalWeight} currentTotal={currentTotalWeight}/>
        <div className="mt-2 space-y-1">
          <Label className="text-xs">{t("scale.notes")}</Label>
          <Textarea value={lossNotes} onChange={e => setLossNotes(e.target.value)} className="text-xs h-16 resize-none" placeholder={t("scale.addRemarks")}/>
        </div>
      </div>

      {/* شريط الحفظ والطباعة */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border/40">
        <p className="text-xs text-muted-foreground">{t("scale.saveNote")}</p>
        <div className="flex gap-2 flex-wrap">
          <ActionBtn label={t("scale.print")} icon={Printer}      variant="outline" onClick={handlePrint}/>
          <ActionBtn label={t("scale.save")}  icon={CheckCircle2} variant="default" onClick={handleSave}/>
          {/* أزرار التأكيد نعم/لا */}
          <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden h-8">
            <Button size="sm" variant="ghost" className={cn("h-full rounded-none text-xs px-3", confirmed === true  ? "bg-green-500/20 text-green-700 font-bold" : "text-green-600")} onClick={handleYes}>{t("scale.yes")}</Button>
            <div className="w-px h-full bg-border"/>
            <Button size="sm" variant="ghost" className={cn("h-full rounded-none text-xs px-3", confirmed === false ? "bg-destructive/20 text-destructive font-bold" : "text-destructive")} onClick={handleNo}>{t("scale.no")}</Button>
          </div>
        </div>
      </div>

      {/* مربعات الحوار الخاصة بالصهر المباشر */}
      <Dialog open={measureWeightOpen} onOpenChange={setMeasureWeightOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.measureCurrentWeight")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1"><Label className="text-xs">{t("scale.newWeightG")}</Label>
              <Input type="number" value={newWeight} onChange={e=>setNewWeight(e.target.value)} placeholder="0.00"/></div>
            <Button className="w-full" onClick={() => { setCurrentTotalWeight(parseFloat(newWeight)||currentTotalWeight); setMeasureWeightOpen(false); setNewWeight(""); toast({title: t("scale.weightUpdated")}); }}>{t("common.confirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={measureQtyOpen} onOpenChange={setMeasureQtyOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.measureCurrentQty")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-xs text-muted-foreground">{t("scale.totalQtyItems")}: <strong>{insertCurrentQty}</strong></p>
            <Button className="w-full" onClick={() => { setMeasureQtyOpen(false); toast({title: t("scale.qtyConfirmed")}); }}>{t("common.confirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addQrOpen} onOpenChange={setAddQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.addQrTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1"><Label className="text-xs">{t("scale.newQrCode")}</Label>
              <Input value={newQr} onChange={e=>setNewQr(e.target.value)} placeholder="ORD-001 / BATCH-001" className="font-mono text-sm"/></div>
            <Button className="w-full" onClick={handleAddQr} disabled={!newQr.trim()}>{t("scale.addQr")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={returnDustOpen} onOpenChange={setReturnDustOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("scale.returnDustTitle")}</AlertDialogTitle><AlertDialogDescription>{t("scale.returnDustDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={()=>{ setReturnDustOpen(false); toast({title: t("scale.returnConfirmed")}); }}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={returnPartsOpen} onOpenChange={setReturnPartsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("scale.returnPartsTitle")}</AlertDialogTitle><AlertDialogDescription>{t("scale.returnPartsDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={()=>{ setReturnPartsOpen(false); toast({title: t("scale.returnConfirmed")}); }}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// تبويب الوزن — TAB 3: WEIGHT
// يعرض عناصر الوزن ويتيح إضافة المواد وحساب الفاقد
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// تبويب الوزن — WeightTab (مُحسَّن)
//
// التحسينات المضافة:
//   1. دعم دفعات متعددة (Batches) كل منها في تبويب منفصل
//      - يمكن إضافة أكثر من 5 دفعات بدون حد
//   2. كل "فتح صندوق جديد" ينشئ قسماً مستقلاً بجدول عناصر وجدول مواد خاص به
//   3. زر "قياس الكمية" يعمل فقط عند الدفعات من مصدر الصهر المباشر
//      (direct-melt) — أما دفعات الشجرة (tree) فتعرض رسالة توضيحية
//   4. أكواد الصناديق تُولَّد تلقائياً باستخدام generateCode("BOX")
// ═══════════════════════════════════════════════════════════════════════════════

// ─── أنواع البيانات المستخدمة في هذا التبويب ─────────────────────────────────

// بيانات دفعة واحدة (Batch)
interface BatchEntry {
  id:     string;               // معرّف فريد
  qr:     string;               // كود QR للدفعة
  source: "tree" | "direct-melt"; // مصدر الدفعة: شجرة أم صهر مباشر
}

// صندوق مفتوح — كل صندوق له جدول عناصره وجدول موادّه
interface OpenBox {
  id:        string;        // معرّف فريد
  code:      string;        // كود الصندوق (مُولَّد تلقائياً أو يدوياً)
  items:     WeightItem[];  // عناصر الصندوق
  materials: MaterialItem[]; // مواد الصندوق
}

function WeightTab() {
  const { t }    = useTranslation();
  const { toast} = useToast();

  // ─── دفعات متعددة (Batches) ─────────────────────────────────────────────────
  // كل دفعة لها كود QR ومصدر (شجرة أو صهر مباشر)
  const [batches, setBatches] = useState<BatchEntry[]>([
    { id: "b1", qr: "ORD-2026-001", source: "tree" },
  ]);
  // الدفعة النشطة حالياً (index)
  const [activeBatchIdx, setActiveBatchIdx] = useState(0);

  // ─── بيانات الجدول الرئيسي ──────────────────────────────────────────────────
  const [items, setItems] = useState<WeightItem[]>(() =>
    INITIAL_WEIGHT_ITEMS.map(i => ({ ...i }))
  );
  const [selectAll, setSelectAll] = useState(false);

  // ─── مواد الدفعة الرئيسية ────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // ─── الصناديق المفتوحة — كل صندوق قسم مستقل ────────────────────────────────
  const [boxes, setBoxes] = useState<OpenBox[]>([]);

  // ─── حالات الوزن والملاحظات ──────────────────────────────────────────────────
  const [lastTotalWeight,    setLastTotalWeight]    = useState(125.50);
  const [currentTotalWeight, setCurrentTotalWeight] = useState(124.20);
  const [lossNotes,          setLossNotes]          = useState("");
  const [confirmed,          setConfirmed]          = useState<boolean | null>(null);

  // ─── حالات حوارات المواد ─────────────────────────────────────────────────────
  const [addMaterialOpen,    setAddMaterialOpen]    = useState(false);
  const [returnMaterialOpen, setReturnMaterialOpen] = useState(false);
  const [newMatCode,         setNewMatCode]         = useState("");
  const [newMatQty,          setNewMatQty]          = useState("");
  const [newMatUnit,         setNewMatUnit]         = useState("");

  // ─── حالات حوارات الوزن والكمية ─────────────────────────────────────────────
  const [measureWeightOpen, setMeasureWeightOpen] = useState(false);
  const [measureQtyOpen,    setMeasureQtyOpen]    = useState(false);
  const [newWeight,         setNewWeight]          = useState("");

  // ─── حالات إضافة دفعة (QR) جديدة ───────────────────────────────────────────
  const [addQrOpen, setAddQrOpen] = useState(false);
  const [newQr,     setNewQr]     = useState("");
  // مصدر الدفعة الجديدة: شجرة أم صهر مباشر
  const [newQrSource, setNewQrSource] = useState<"tree" | "direct-melt">("tree");

  // ─── حالات فتح صندوق جديد ────────────────────────────────────────────────────
  const [openNewBoxOpen, setOpenNewBoxOpen] = useState(false);
  const [newBoxCode,     setNewBoxCode]     = useState("");

  // ─── حالات إضافة مواد للصناديق ───────────────────────────────────────────────
  const [boxAddMatOpen,   setBoxAddMatOpen]   = useState<string | null>(null); // معرّف الصندوق
  const [boxNewMatCode,   setBoxNewMatCode]   = useState("");
  const [boxNewMatQty,    setBoxNewMatQty]    = useState("");
  const [boxNewMatUnit,   setBoxNewMatUnit]   = useState("");

  // ─── حالات التأكيد ────────────────────────────────────────────────────────────
  const [returnDustOpen,  setReturnDustOpen]  = useState(false);
  const [returnPartsOpen, setReturnPartsOpen] = useState(false);
  const [orderDoneOpen,   setOrderDoneOpen]   = useState(false);

  // ─── مشتقات محسوبة ───────────────────────────────────────────────────────────
  // إجمالي عناصر الجدول الرئيسي
  const totalItems  = items.reduce((s, i) => s + i.qty, 0);
  // إجمالي عدد الدفعات
  const totalBatches = batches.length;

  // تجميع مواد الجدول الرئيسي حسب النوع (ذهب/غير ذهب)
  const goldMaterials    = materials.filter(m => m.goldNonGold === "Gold");
  const nonGoldMaterials = materials.filter(m => m.goldNonGold !== "Gold");
  const goldTotal        = goldMaterials.reduce((s, m) => s + m.totalWeight, 0);
  const nonGoldTotal     = nonGoldMaterials.reduce((s, m) => s + m.totalWeight, 0);

  // الدفعة النشطة حالياً
  const activeBatch = batches[activeBatchIdx];

  // ─── معالجة تحديد/إلغاء تحديد الكل ─────────────────────────────────────────
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setItems(prev => prev.map(i => ({ ...i, selected: checked })));
  };

  // ─── معالجة تحديد/إلغاء تحديد عنصر واحد ────────────────────────────────────
  const handleSelectItem = (id: number, checked: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: checked } : i));
  };

  // ─── إضافة مادة للجدول الرئيسي ───────────────────────────────────────────────
  const handleAddMaterial = () => {
    if (!newMatCode.trim()) return;
    const m: MaterialItem = {
      id: Date.now(), pic: "", materialCode: newMatCode, addedTo: "Tree 1", addedInSection: "Section A",
      qty: parseFloat(newMatQty) || 0, unitWeight: parseFloat(newMatUnit) || 0,
      totalWeight: (parseFloat(newMatQty) || 0) * (parseFloat(newMatUnit) || 0),
      goldNonGold: "Gold",
    };
    setMaterials(prev => [...prev, m]);
    setAddMaterialOpen(false);
    setNewMatCode(""); setNewMatQty(""); setNewMatUnit("");
    toast({ title: t("scale.materialAdded"), description: m.materialCode });
  };

  // ─── إزالة العناصر المحددة ────────────────────────────────────────────────────
  const handleRemoveSelected = () => {
    const selectedIds = items.filter(i => i.selected).map(i => i.id);
    if (selectedIds.length === 0) {
      toast({ title: t("scale.removeItem"), variant: "destructive" }); return;
    }
    setItems(prev => prev.filter(i => !i.selected));
    setSelectAll(false);
    toast({ title: t("scale.itemRemoved") });
  };

  // ─── إرجاع آخر مادة خام ──────────────────────────────────────────────────────
  const handleReturnMaterial = () => {
    setMaterials(prev => prev.slice(0, -1));
    setReturnMaterialOpen(false);
    toast({ title: t("scale.returnConfirmed") });
  };

  // ─── فتح صندوق جديد ──────────────────────────────────────────────────────────
  // كل صندوق يُنشئ قسماً مستقلاً بجدول عناصر وجدول مواد خاص به
  const handleOpenNewBox = () => {
    // توليد كود تلقائي إذا ترك الحقل فارغاً
    const code = newBoxCode.trim() || generateCode("BOX");
    const box: OpenBox = {
      id:        `box-${Date.now()}`,
      code,
      items:     INITIAL_WEIGHT_ITEMS.map(i => ({ ...i, selected: false })), // نسخة من العناصر الحالية
      materials: [],
    };
    setBoxes(prev => [...prev, box]);
    setOpenNewBoxOpen(false);
    setNewBoxCode("");
    toast({ title: t("scale.newBoxCreatedToast"), description: code });
  };

  // ─── إضافة مادة لصندوق محدد ──────────────────────────────────────────────────
  const handleAddBoxMaterial = (boxId: string) => {
    if (!boxNewMatCode.trim()) return;
    const m: MaterialItem = {
      id: Date.now(), pic: "", materialCode: boxNewMatCode,
      addedTo: boxId, addedInSection: "Box Section",
      qty: parseFloat(boxNewMatQty) || 0,
      unitWeight: parseFloat(boxNewMatUnit) || 0,
      totalWeight: (parseFloat(boxNewMatQty) || 0) * (parseFloat(boxNewMatUnit) || 0),
      goldNonGold: "Gold",
    };
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, materials: [...b.materials, m] } : b));
    setBoxAddMatOpen(null);
    setBoxNewMatCode(""); setBoxNewMatQty(""); setBoxNewMatUnit("");
    toast({ title: t("scale.materialAdded"), description: m.materialCode });
  };

  // ─── إنهاء الطلب ─────────────────────────────────────────────────────────────
  const handleOrderDone = () => {
    setOrderDoneOpen(false);
    toast({ title: t("scale.orderDoneToast") });
  };

  // ─── حفظ البيانات ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    setConfirmed(true);
    toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") });
  };

  // ─── طباعة التقرير ────────────────────────────────────────────────────────────
  const handlePrint = () => {
    toast({ title: t("scale.print") });
    setTimeout(() => window.print(), 300);
  };

  const handleYes = () => { setConfirmed(true);  toast({ title: t("scale.savedToast") }); };
  const handleNo  = () => { setConfirmed(false); toast({ title: t("common.cancel"), variant: "destructive" }); };

  // ─── إضافة دفعة QR جديدة ─────────────────────────────────────────────────────
  const handleAddQr = () => {
    if (!newQr.trim()) return;
    const newBatch: BatchEntry = {
      id:     `b${Date.now()}`,
      qr:     newQr.trim(),
      source: newQrSource,
    };
    setBatches(prev => [...prev, newBatch]);
    setActiveBatchIdx(batches.length); // الانتقال للدفعة الجديدة
    setNewQr("");
    setAddQrOpen(false);
    toast({ title: t("scale.addQrTitle"), description: newQr });
  };

  return (
    <div className="space-y-4">

      {/* ─── تبويبات الدفعات (Batches) ──────────────────────────────────────── */}
      {/* كل دفعة تظهر كتبويب مستقل — يمكن إضافة ما لا يُحصى من الدفعات */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* تبويب لكل دفعة */}
          {batches.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setActiveBatchIdx(idx)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeBatchIdx === idx
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50",
              )}
            >
              {/* أيقونة المصدر: شجرة أو لهب */}
              {b.source === "tree"
                ? <TreePine className="w-3 h-3"/>
                : <FlameKindling className="w-3 h-3"/>
              }
              <span className="font-mono">{b.qr || `BATCH-${idx + 1}`}</span>
              {/* شارة الدفعة النشطة */}
              {activeBatchIdx === idx && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"/>
              )}
            </button>
          ))}

          {/* زر إضافة دفعة جديدة */}
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 rounded-full" onClick={() => setAddQrOpen(true)}>
            <QrCode className="h-3.5 w-3.5"/>
            {t("scale.addAnotherQr")}
          </Button>

          {/* معلومات الدفعة الحالية */}
          <div className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("scale.totalBatches")}: <strong className="text-foreground">{totalBatches}</strong></span>
            {activeBatch && (
              <Badge variant={activeBatch.source === "tree" ? "outline" : "secondary"} className="text-[10px]">
                {activeBatch.source === "tree" ? t("scale.tabTree") : t("scale.tabDirectMelt")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ─── المحتوى الرئيسي ────────────────────────────────────────────────── */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* ── عمودان يسار: الجدول والمواد ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* جدول عناصر الوزن للدفعة النشطة */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                {activeBatch?.source === "tree"
                  ? <TreePine className="w-4 h-4 text-green-600"/>
                  : <FlameKindling className="w-4 h-4 text-orange-500"/>
                }
                {activeBatch?.qr || `BATCH-${activeBatchIdx + 1}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead colSpan={7} className="text-[10px] py-2 border-r border-border/40 text-center">{t("scale.itemsSpec")}</TableHead>
                      <TableHead colSpan={4} className="text-[10px] py-2 text-center">{t("scale.itemsRoadMap")}</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-[10px] py-1.5 w-8">
                        <div className="flex items-center gap-1">
                          <Checkbox checked={selectAll} onCheckedChange={(v) => handleSelectAll(!!v)} className="h-3 w-3"/>
                          <span>{t("scale.selectAll")}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.number")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.customerCode")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.modelCode")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.modelPic")}</TableHead>
                      <TableHead className="text-[10px] py-1.5 border-r border-border/40">{t("scale.partPicCode")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.karat")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.size")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.notes")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.roadMap")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id} className={item.selected ? "bg-primary/5" : ""}>
                        <TableCell className="py-2">
                          <Checkbox checked={item.selected} onCheckedChange={(v) => handleSelectItem(item.id, !!v)} className="h-3 w-3"/>
                        </TableCell>
                        <TableCell className="text-xs py-2">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-mono">{item.customerCode}</TableCell>
                        <TableCell className="text-xs py-2 font-mono">{item.modelCode}</TableCell>
                        <TableCell className="text-xs py-2">
                          {/* صورة الموديل — يُعرض أوّل حرفين من كود الموديل كصورة مؤقتة */}
                          {item.modelPic
                            ? <img src={item.modelPic} alt={item.modelCode} className="w-8 h-8 rounded object-cover border border-border"/>
                            : <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary" title={item.modelCode}>
                                {item.modelCode.slice(0,3)}
                              </div>
                          }
                        </TableCell>
                        <TableCell className="text-xs py-2 border-r border-border/40">{item.partCode}</TableCell>
                        <TableCell className="text-xs py-2">{item.kerat}</TableCell>
                        <TableCell className="text-xs py-2">{item.size}</TableCell>
                        <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{item.notes || "—"}</TableCell>
                        <TableCell className="text-xs py-2"><span className="text-[10px] text-muted-foreground">{item.roadMap}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* أزرار الإجراءات الرئيسية */}
          <div className="flex gap-2 flex-wrap">
            <ActionBtn label={`(−) ${t("scale.returnDust")}`}          variant="outline" onClick={() => setReturnDustOpen(true)}/>
            <ActionBtn label={`(−) ${t("scale.returnSupportsParts")}`} variant="outline" onClick={() => setReturnPartsOpen(true)}/>
            <ActionBtn label={`(−) ${t("scale.removeItem")}`}          variant="outline" onClick={handleRemoveSelected}/>
            <ActionBtn label={`(+) ${t("scale.measureWeight")}`}       icon={Weight}     onClick={() => setMeasureWeightOpen(true)}/>
            <ActionBtn label={`(+) ${t("scale.openNewBox")}`}          icon={Box}        onClick={() => setOpenNewBoxOpen(true)}/>
            <ActionBtn label={`(=) ${t("scale.orderDone")}`}           variant="default" icon={CheckCircle2} onClick={() => setOrderDoneOpen(true)}/>
            {/*
              زر "قياس الكمية":
              - للدفعات من مصدر "صهر مباشر": يُغيّر الكمية عادةً
              - للدفعات من مصدر "شجرة": يُظهر رسالة توضيحية فقط (الكمية ثابتة)
            */}
            <ActionBtn label={`(+) ${t("scale.measureQuantity")}`} icon={Plus} onClick={() => setMeasureQtyOpen(true)}/>
          </div>

          {/* جدول المواد المضافة للدفعة الرئيسية */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("scale.materialAddedBatch")}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {activeBatch?.qr || "—"} | Total: {materials.length}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] py-1.5">{t("scale.pic")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.number")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.materialCode")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.addedTo")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.addedInSection")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.unitWeight")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.totalWeightLabel")}</TableHead>
                      <TableHead className="text-[10px] py-1.5">{t("scale.goldNonGold")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-6">{t("scale.noMaterials")}</TableCell></TableRow>
                    )}
                    {materials.map((m, idx) => (
                      <TableRow key={m.id}>
                        <TableCell className="py-2">
                          {/* صورة المادة — مربع ملون يعرض الكود */}
                          <div className="w-8 h-8 rounded bg-muted border border-border/50 flex items-center justify-center text-[8px] font-mono font-bold text-muted-foreground" title={m.materialCode}>
                            {m.materialCode.slice(0,3)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-mono">{m.materialCode}</TableCell>
                        <TableCell className="text-xs py-2">{m.addedTo}</TableCell>
                        <TableCell className="text-xs py-2">{m.addedInSection}</TableCell>
                        <TableCell className="text-xs py-2">{m.qty}</TableCell>
                        <TableCell className="text-xs py-2">{m.unitWeight}g</TableCell>
                        <TableCell className="text-xs py-2 font-bold">{m.totalWeight.toFixed(2)}g</TableCell>
                        <TableCell className="text-xs py-2">
                          <Badge variant={m.goldNonGold === "Gold" ? "default" : "outline"} className="text-[10px]">{m.goldNonGold}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* أزرار المواد */}
          <div className="flex gap-2 flex-wrap">
            <ActionBtn label={`(+) ${t("scale.addMaterial")}`}    icon={Plus}       onClick={() => setAddMaterialOpen(true)}/>
            <ActionBtn label={`(−) ${t("scale.returnMaterial")}`} variant="outline" disabled={materials.length === 0} onClick={() => setReturnMaterialOpen(true)}/>
          </div>

          {/* ─── الصناديق المفتوحة — كل صندوق قسم مستقل ──────────────────── */}
          {/* يُنشأ صندوق جديد عند الضغط على "فتح صندوق جديد" */}
          {boxes.map(box => (
            <div key={box.id} className="space-y-3 border border-border/60 rounded-xl p-4 bg-muted/20">
              {/* رأس الصندوق */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-primary"/>
                  <span className="font-semibold text-sm font-mono">{box.code}</span>
                  <Badge variant="outline" className="text-[10px]">{t("scale.openNewBoxTitle")}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("scale.noOfItems")}: {box.items.reduce((s, i) => s + i.qty, 0)} |
                  {t("scale.addMaterial")}: {box.materials.length}
                </span>
              </div>

              {/* جدول عناصر الصندوق */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("scale.itemsSpec")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] py-1.5">#</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.customerCode")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.modelPic")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.modelCode")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.karat")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.size")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.notes")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {box.items.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs py-2">{idx + 1}</TableCell>
                            <TableCell className="text-xs py-2 font-mono">{item.customerCode}</TableCell>
                            <TableCell className="text-xs py-2">
                              {item.modelPic
                                ? <img src={item.modelPic} alt={item.modelCode} className="w-8 h-8 rounded object-cover border border-border"/>
                                : <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{item.modelCode.slice(0,3)}</div>
                              }
                            </TableCell>
                            <TableCell className="text-xs py-2 font-mono">{item.modelCode}</TableCell>
                            <TableCell className="text-xs py-2">{item.kerat}</TableCell>
                            <TableCell className="text-xs py-2">{item.size}</TableCell>
                            <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">{item.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* جدول مواد الصندوق */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("scale.materialAddedBatch")}</CardTitle>
                  <span className="text-xs text-muted-foreground">Total: {box.materials.length}</span>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] py-1.5">#</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.materialCode")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.unitWeight")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.totalWeightLabel")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.goldNonGold")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {box.materials.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-4">{t("scale.noMaterials")}</TableCell>
                          </TableRow>
                        )}
                        {box.materials.map((m, idx) => (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs py-2">{idx + 1}</TableCell>
                            <TableCell className="text-xs py-2 font-mono">{m.materialCode}</TableCell>
                            <TableCell className="text-xs py-2">{m.qty}</TableCell>
                            <TableCell className="text-xs py-2">{m.unitWeight}g</TableCell>
                            <TableCell className="text-xs py-2 font-bold">{m.totalWeight.toFixed(2)}g</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant={m.goldNonGold === "Gold" ? "default" : "outline"} className="text-[10px]">{m.goldNonGold}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* أزرار مواد الصندوق */}
              <div className="flex gap-2">
                <ActionBtn
                  label={`(+) ${t("scale.addMaterial")}`}
                  icon={Plus}
                  onClick={() => {
                    setBoxAddMatOpen(box.id);
                    setBoxNewMatCode(""); setBoxNewMatQty(""); setBoxNewMatUnit("");
                  }}
                />
              </div>
            </div>
          ))}

          {/* بطاقة حساب الفاقد */}
          <LossCalcCard lastTotal={lastTotalWeight} currentTotal={currentTotalWeight}/>
          <div className="space-y-1">
            <Label className="text-xs">{t("scale.notes")}</Label>
            <Textarea value={lossNotes} onChange={e => setLossNotes(e.target.value)} className="text-xs h-16 resize-none" placeholder={t("scale.addRemarks")}/>
          </div>
        </div>

        {/* ── عمود يمين: بطاقات الملخص ──────────────────────────────────────── */}
        <div className="space-y-3">
          {/* ملخص الدفعة النشطة */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                {activeBatch?.qr || "BATCH"} ({activeBatch?.source === "tree" ? t("scale.tabTree") : t("scale.tabDirectMelt")})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.noOfItems")}</td><td className="px-4 py-2 font-bold">{totalItems}</td></tr>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.totalWeightGold")}</td><td className="px-4 py-2 font-bold">{goldTotal > 0 ? `${goldTotal.toFixed(2)}g` : "—"}</td></tr>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.totalWeightNonGold")}</td><td className="px-4 py-2 font-bold">{nonGoldTotal > 0 ? `${nonGoldTotal.toFixed(2)}g` : "—"}</td></tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* ملخص جميع الدفعات */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("scale.materialAddedBatch12")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.totalBatchesLabel")}</td><td className="px-4 py-2 font-bold">{totalBatches}</td></tr>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.totalMatWeightGold")}</td><td className="px-4 py-2 font-bold">{goldTotal > 0 ? `${goldTotal.toFixed(2)}g` : "—"}</td></tr>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.totalMatWeightNonGold")}</td><td className="px-4 py-2 font-bold">{nonGoldTotal > 0 ? `${nonGoldTotal.toFixed(2)}g` : "—"}</td></tr>
                  <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.openNewBoxTitle")}</td><td className="px-4 py-2 font-bold">{boxes.length}</td></tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* ملاحظة حول دمج الأجزاء */}
          <Card className="border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              MERGE PARTS — When we open new box all the same will show with ADD column with choose which table and can add parts or so from direct melt to split the item — option to add more items.
            </p>
          </Card>
        </div>
      </div>

      {/* ── شريط الحفظ والطباعة ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border/40">
        <p className="text-xs text-muted-foreground">{t("scale.saveNote")}</p>
        <div className="flex gap-2 flex-wrap">
          <ActionBtn label={t("scale.print")} icon={Printer}      variant="outline" onClick={handlePrint}/>
          <ActionBtn label={t("scale.save")}  icon={CheckCircle2} variant="default" onClick={handleSave}/>
          <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden h-8">
            <Button size="sm" variant="ghost" className={cn("h-full rounded-none text-xs px-3", confirmed === true  ? "bg-green-500/20 text-green-700 font-bold" : "text-green-600")} onClick={handleYes}>{t("scale.yes")}</Button>
            <div className="w-px h-full bg-border"/>
            <Button size="sm" variant="ghost" className={cn("h-full rounded-none text-xs px-3", confirmed === false ? "bg-destructive/20 text-destructive font-bold" : "text-destructive")} onClick={handleNo}>{t("scale.no")}</Button>
          </div>
        </div>
      </div>

      {/* ═══ مربعات الحوار ══════════════════════════════════════════════════════ */}

      {/* حوار قياس الوزن */}
      <Dialog open={measureWeightOpen} onOpenChange={setMeasureWeightOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.measureWeight")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.newWeightG")}</Label>
              <Input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="0.00"/>
            </div>
            <Button className="w-full" onClick={() => {
              setCurrentTotalWeight(parseFloat(newWeight) || currentTotalWeight);
              setMeasureWeightOpen(false);
              setNewWeight("");
              toast({ title: t("scale.weightUpdated") });
            }}>{t("common.confirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/*
        حوار قياس الكمية:
        - إذا كانت الدفعة النشطة من مصدر "شجرة" (tree):
            تُعرض رسالة توضيحية تُخبر المستخدم أن الكمية لا تتغير
            للمنتجات القادمة من الشجرة (الوزن فقط يمكن تغييره)
        - إذا كانت الدفعة من مصدر "صهر مباشر":
            يتم تطبيق الكمية الجديدة على العناصر المحددة
      */}
      <Dialog open={measureQtyOpen} onOpenChange={setMeasureQtyOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.measureQuantity")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            {/* إجمالي العناصر */}
            <p className="text-xs text-muted-foreground">
              {t("scale.totalItemsCount")}: <strong>{totalItems}</strong>
            </p>

            {/* رسالة مصدر الدفعة */}
            {activeBatch?.source === "tree" ? (
              /* رسالة تحذيرية: الكمية لا تتغير للشجرة */
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      {t("scale.qtyTreeOnly") || "Tree Source — Weight Only"}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      {t("scale.qtyTreeMsg") || "This batch comes from the tree. Quantity cannot be changed — only weight measurements apply. Use Measure Weight instead."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* دفعة صهر مباشر — يمكن تغيير الكمية */
              <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <FlameKindling className="w-4 h-4 text-green-600 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                      {t("scale.qtyDirectMelt") || "Direct Melt — Quantity Can Change"}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      {t("scale.qtyDirectMsg") || "This batch is from direct melt. Confirming will update the quantity count."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* زر التأكيد — معطّل لدفعات الشجرة */}
            <Button
              className="w-full"
              disabled={activeBatch?.source === "tree"}
              onClick={() => {
                setMeasureQtyOpen(false);
                toast({ title: t("scale.qtyConfirmed") });
              }}
            >
              {activeBatch?.source === "tree"
                ? (t("scale.qtyNotApplicable") || "N/A for Tree Batches")
                : t("common.confirm")
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار إضافة مادة للدفعة الرئيسية */}
      <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t("scale.addMaterial")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.materialCode")} *</Label>
              <Input value={newMatCode} onChange={e => setNewMatCode(e.target.value)} placeholder="MAT-001" className="font-mono text-sm"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.qty")}</Label>
                <Input type="number" value={newMatQty} onChange={e => setNewMatQty(e.target.value)} placeholder="0"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.unitWeight")} (g)</Label>
                <Input type="number" value={newMatUnit} onChange={e => setNewMatUnit(e.target.value)} placeholder="0.00"/>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddMaterial} disabled={!newMatCode.trim()}>{t("scale.addMaterial")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار إضافة دفعة QR جديدة */}
      <Dialog open={addQrOpen} onOpenChange={setAddQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.addQrTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.newQrCode")}</Label>
              <Input value={newQr} onChange={e => setNewQr(e.target.value)} placeholder="ORD-001 / BATCH-001" className="font-mono text-sm"/>
            </div>
            {/* اختيار مصدر الدفعة الجديدة */}
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.batchSource") || "Source"}</Label>
              <div className="flex gap-2">
                <Button
                  size="sm" variant={newQrSource === "tree" ? "default" : "outline"}
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => setNewQrSource("tree")}
                >
                  <TreePine className="w-3 h-3"/> {t("scale.tabTree")}
                </Button>
                <Button
                  size="sm" variant={newQrSource === "direct-melt" ? "default" : "outline"}
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => setNewQrSource("direct-melt")}
                >
                  <FlameKindling className="w-3 h-3"/> {t("scale.tabDirectMelt")}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddQr} disabled={!newQr.trim()}>{t("scale.addQr")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار فتح صندوق جديد */}
      <Dialog open={openNewBoxOpen} onOpenChange={setOpenNewBoxOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.openNewBoxTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.newBoxCode")}</Label>
              <Input
                value={newBoxCode}
                onChange={e => setNewBoxCode(e.target.value)}
                placeholder="BOX-... (أو اتركه فارغاً للتوليد التلقائي)"
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                {t("scale.autoCodeHint") || "Leave empty to auto-generate a code like BOX-20260607-0001"}
              </p>
            </div>
            <Button className="w-full" onClick={handleOpenNewBox}>{t("scale.openBox")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار إضافة مادة لصندوق محدد */}
      <Dialog open={!!boxAddMatOpen} onOpenChange={() => setBoxAddMatOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t("scale.addMaterial")} — {boxes.find(b => b.id === boxAddMatOpen)?.code}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.materialCode")} *</Label>
              <Input value={boxNewMatCode} onChange={e => setBoxNewMatCode(e.target.value)} placeholder="MAT-001" className="font-mono text-sm"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.qty")}</Label>
                <Input type="number" value={boxNewMatQty} onChange={e => setBoxNewMatQty(e.target.value)} placeholder="0"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.unitWeight")} (g)</Label>
                <Input type="number" value={boxNewMatUnit} onChange={e => setBoxNewMatUnit(e.target.value)} placeholder="0.00"/>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => boxAddMatOpen && handleAddBoxMaterial(boxAddMatOpen)}
              disabled={!boxNewMatCode.trim()}
            >
              {t("scale.addMaterial")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار إرجاع المواد */}
      <AlertDialog open={returnMaterialOpen} onOpenChange={setReturnMaterialOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.returnMaterialTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scale.returnMaterialDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleReturnMaterial}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار إرجاع الغبار */}
      <AlertDialog open={returnDustOpen} onOpenChange={setReturnDustOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.returnDustTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scale.returnDustDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setReturnDustOpen(false); toast({ title: t("scale.returnConfirmed") }); }}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار إرجاع الأجزاء الداعمة */}
      <AlertDialog open={returnPartsOpen} onOpenChange={setReturnPartsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.returnPartsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scale.returnPartsDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setReturnPartsOpen(false); toast({ title: t("scale.returnConfirmed") }); }}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار إنهاء الطلب */}
      <AlertDialog open={orderDoneOpen} onOpenChange={setOrderDoneOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.orderDoneTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scale.orderDoneDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleOrderDone}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


export default function ScalePage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ─── حالة شريط المسح وعنوان الصفحة ──────────────────────────────────────
  const [workerInput, setWorkerInput] = useState("Ahmed Khan (Sales)");
  const [itemInput,   setItemInput]   = useState("");
  // التبويب النشط حالياً
  const [activeTab,   setActiveTab]   = useState<TabId>("tree");

  // تعريف التبويبات مع عناوينها وأيقوناتها
  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "tree",        label: t("scale.tabTree"),       icon: TreePine      },
    { id: "direct-melt", label: t("scale.tabDirectMelt"), icon: FlameKindling },
    { id: "weight",      label: t("scale.tabWeight"),     icon: Weight        },
  ];

  // معالجة مسح كود العنصر
  const handleScanItem = () => {
    if (itemInput.trim()) {
      toast({ title: t("scale.itemScanned"), description: itemInput });
      setItemInput("");
    } else {
      toast({ title: t("scale.scanning") });
    }
  };

  return (
    <div className="space-y-4 max-w-[1800px] mx-auto">
      {/* عنوان الصفحة ومؤشر الاتصال */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("scale.pageTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("scale.pageSubtitle")}</p>
        </div>
        {/* مؤشر حالة الاتصال بالنظام */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          {t("scale.connected")}
        </div>
      </div>

      {/* شريط المسح المشترك بين جميع التبويبات */}
      <ScanBar
        workerInput={workerInput} setWorkerInput={setWorkerInput}
        itemInput={itemInput}     setItemInput={setItemInput}
        onScanItem={handleScanItem}
      />

      {/* أزرار التنقل بين التبويبات */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="h-4 w-4"/>
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوى التبويب النشط */}
      <div>
        {activeTab === "tree"        && <TreeTab/>}
        {activeTab === "direct-melt" && <DirectMeltTab/>}
        {activeTab === "weight"      && <WeightTab/>}
      </div>
    </div>
  );
}
