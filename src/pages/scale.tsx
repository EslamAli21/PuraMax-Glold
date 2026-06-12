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
  Gem, Box, Scissors, Undo2, Map,
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
// مكوّن بطاقة حساب الفاقد — يقبل دالة onRetake لإعادة فتح نافذة القياس
function LossCalcCard({ lastTotal, currentTotal, onRetake }: {
  lastTotal: number; currentTotal: number; onRetake?: () => void;
}) {
  const { t } = useTranslation();
  // حساب إجمالي الفقد = الوزن السابق - الوزن الحالي
  const totalLoss = Math.max(0, lastTotal - currentTotal);

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm">{t("scale.lossCalc")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-xs">
          <tbody>
            {/* وزن آخر دفعة */}
            <tr className="border-t border-border/40">
              <td className="px-4 py-2 text-muted-foreground w-1/2">{t("scale.lastTotalWeight")}</td>
              <td className="px-4 py-2 font-medium">{lastTotal ? `${lastTotal} g` : ""}</td>
            </tr>
            {/* الوزن الحالي + زر RETAKE لإعادة فتح نافذة القياس */}
            <tr className="border-t border-border/40">
              <td className="px-4 py-2 text-muted-foreground">{t("scale.currentTotalWeight")}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentTotal ? `${currentTotal} g` : ""}</span>
                  {onRetake && (
                    <button
                      onClick={onRetake}
                      className="text-[10px] font-semibold text-primary border border-primary/40 rounded px-1.5 py-0.5 hover:bg-primary/10 transition-colors">
                      {t("scale.retake")}
                    </button>
                  )}
                </div>
              </td>
            </tr>
            {/* إجمالي الفاقد */}
            <tr className="border-t border-border/40">
              <td className="px-4 py-2 text-muted-foreground">{t("scale.totalLoss")}</td>
              <td className="px-4 py-2 font-medium">{totalLoss ? `${totalLoss} g` : ""}</td>
            </tr>
            {/* حقل الملاحظات (يُملأ من الخارج) */}
            <tr className="border-t border-border/40">
              <td className="px-4 py-2 text-muted-foreground">{t("scale.notes")}</td>
              <td className="px-4 py-2"/>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// تبويب الشجرة — TAB 1: TREE
// يتضمن قائمة الانتظار والشجرة النشطة مع دعم نقل الكميات الجزئية
// ─── بيانات عنصر محذوف مؤقتاً من الشجرة (يظهر في مسودة المحذوفات) ──────────
interface RemovedDraftItem {
  code: string; model: string; karat: string; qty: number; weight: number;
  reason: string; removedAt: string; image?: string;
}

// ─── بيانات حجر كريم مُضاف إلى الشجرة ────────────────────────────────────────
interface GemEntry {
  gemType: string; gemCode: string; modelCodes: string[];
  qty: number; weightPerUnit: number | null; totalWeight: number; addedAt: string;
}

// ─── قائمة الأحجار الكريمة المتوفرة في المخزون (بيانات نموذجية) ──────────────
const GEMS_INVENTORY = [
  { code: "DIA-001", name: "Diamond / ماس",          available: 500 },
  { code: "RUB-002", name: "Ruby / ياقوت أحمر",      available: 200 },
  { code: "EMR-003", name: "Emerald / زمرد",          available: 150 },
  { code: "SAP-004", name: "Sapphire / ياقوت أزرق",   available: 300 },
  { code: "PRL-005", name: "Pearl / لؤلؤ",            available: 100 },
  { code: "ZRC-006", name: "Zircon / زركون",          available: 1000 },
  { code: "OPL-007", name: "Opal / أوبال",            available: 80 },
];


// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// تبويب بناء الأشجار — TAB 1: TREE BUILDER
// يتيح نقل العناصر من قائمة الانتظار إلى الأشجار، وإدارة الأحجار الكريمة،
// وحساب الذهب اللازم للصهر بشكل تلقائي وحي
// ═══════════════════════════════════════════════════════════════════════════════
function TreeTab() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // ─── حالة الأشجار وقائمة الانتظار ───────────────────────────────────────
  const [trees, setTrees]               = useState<Tree[]>(INITIAL_TREES);
  const [activeTreeId, setActiveTreeId] = useState("tree-001");
  const [waitingItems, setWaitingItems] = useState<WaitingItem[]>(INITIAL_WAITING);

  // ─── تحديد عناصر الشجرة بمربعات الاختيار للحذف ──────────────────────────
  const [selectedTreeItems, setSelectedTreeItems] = useState<Set<string>>(new Set());

  // ─── حالة مسودة المحذوفات من الشجرة ─────────────────────────────────────
  // هذه القائمة تحفظ العناصر المحذوفة مؤقتاً ويمكن استعادتها قبل الحفظ النهائي
  const [removedDrafts, setRemovedDrafts] = useState<RemovedDraftItem[]>([]);

  // ─── حالة حوار حذف عناصر من الشجرة ──────────────────────────────────────
  const [removeTreeOpen, setRemoveTreeOpen] = useState(false);
  const [removeItemQtyMap, setRemoveItemQtyMap] = useState<Record<string, string>>({});
  const [removeReason, setRemoveReason] = useState("");

  // ─── حالة الأحجار الكريمة — مخزَّنة لكل شجرة على حدة ──────────────────────
  // كل شجرة تحتفظ بقائمة أحجارها المستقلة (key = tree ID)
  const [addedGemsPerTree, setAddedGemsPerTree] = useState<Record<string, GemEntry[]>>({});
  const [seeAllGemsOpen, setSeeAllGemsOpen]     = useState(false);

  // ─── حالة حوار إدراج الأحجار — نظام متعدد الخطوات ───────────────────────
  const [insertGemsOpen, setInsertGemsOpen] = useState(false);
  const [gemsStep, setGemsStep] = useState(1); // الخطوة الحالية: 1 اختيار الموديلات، 2 الأحجار، 3 مراجعة
  const [gemsSelectedModels, setGemsSelectedModels] = useState<Record<string, string>>({});
  const [gemInventoryCode, setGemInventoryCode] = useState("");
  const [gemInventoryCustom, setGemInventoryCustom] = useState(""); // نوع مخصص غير موجود في القائمة
  const [gemQtyInput, setGemQtyInput] = useState("");
  const [gemWeightPerUnit, setGemWeightPerUnit] = useState(""); // اختياري — وزن كل حجر
  const [gemTotalWeightManual, setGemTotalWeightManual] = useState(""); // الوزن الإجمالي اليدوي

  // ─── حالة حوار أخذ وزن الشجرة ───────────────────────────────────────────
  const [takeWeightOpen, setTakeWeightOpen] = useState(false);
  const [treeWeightInput, setTreeWeightInput]   = useState(""); // وزن الشجرة الإجمالي
  const [baseWeightInput, setBaseWeightInput]   = useState(""); // وزن قاعدة الشجرة فقط
  const [committedTreeWeight, setCommittedTreeWeight] = useState<number | null>(null);
  const [committedBaseWeight, setCommittedBaseWeight] = useState<number | null>(null);

  // ─── معامل الضرب لحساب الذهب اللازم للصهر (قابل للتعديل، افتراضي 16) ────
  const [multiplyByValue, setMultiplyByValue] = useState("16");

  // ─── حالة مربعات الحوار الأخرى ───────────────────────────────────────────
  const [isNewTreeOpen, setIsNewTreeOpen]             = useState(false);
  const [clearConfirmId, setClearConfirmId]           = useState<string|null>(null);
  const [dragOverTree, setDragOverTree]               = useState(false);
  const [removeWaitingOpen, setRemoveWaitingOpen]     = useState(false);
  const [removeWaitingCode, setRemoveWaitingCode]     = useState<string|null>(null);

  // ─── تحديد عناصر قائمة الانتظار للحذف مع الكمية والسبب ──────────────────
  // عند الضغط على "(−) REMOVE ITEM" يظهر حوار لاختيار العناصر والكميه والسبب
  const [selectedWaitingItems, setSelectedWaitingItems] = useState<Set<string>>(new Set());
  const [removeWaitingDialogOpen, setRemoveWaitingDialogOpen] = useState(false);
  const [removeWaitingQtyMap, setRemoveWaitingQtyMap]   = useState<Record<string, string>>({});
  const [removeWaitingReason, setRemoveWaitingReason]   = useState("");

  // ─── حقل إدخال وزن القاعدة يدوياً في بطاقة حساب الصهر ───────────────────
  // يمكن إدخاله يدوياً مباشرة في الجدول أو عبر حوار "أخذ الوزن"
  const [baseWeightManualInput, setBaseWeightManualInput] = useState("");
  const [draftSavedTimes, setDraftSavedTimes]         = useState<Record<string,string>>({});
  const [savedTimes, setSavedTimes]                   = useState<Record<string,string>>({});
  const [draftListOpen, setDraftListOpen]             = useState(false);

  // ─── حالة نموذج إنشاء شجرة جديدة ────────────────────────────────────────
  const [newCode, setNewCode]       = useState("");
  const [newModelCode, setNewModel] = useState("");
  const [newKarat, setNewKarat]     = useState("18K");
  const [newHolders, setNewHolders] = useState("40");

  // ─── حالة حوار الكمية الجزئية عند نقل عنصر من الانتظار إلى الشجرة ───────
  const [partialPlaceOpen,  setPartialPlaceOpen]  = useState(false);
  const [partialPlaceItem,  setPartialPlaceItem]  = useState<WaitingItem|null>(null);
  const [partialQtyInput,   setPartialQtyInput]   = useState("");

  const dragRef = useRef<WaitingItem|null>(null);

  // مرجع السحب لإرجاع عنصر من الشجرة إلى قائمة الانتظار بالسحب والإفلات
  const treeItemDragRef = useRef<TreeItem|null>(null);

  // ─── حالة حوار استرجاع عنصر من الشجرة إلى قائمة الانتظار ─────────────────
  // يُفتح سواء عبر السحب والإفلات أو بالضغط على زر الاسترجاع في الصف
  const [returnToWaitingOpen,     setReturnToWaitingOpen]     = useState(false);
  const [returnToWaitingItem,     setReturnToWaitingItem]     = useState<TreeItem|null>(null);
  const [returnToWaitingQtyInput, setReturnToWaitingQtyInput] = useState("");

  // ─── القيم المحسوبة ───────────────────────────────────────────────────────
  const activeTree  = trees.find(t => t.id === activeTreeId) || null;
  const totalItems  = activeTree ? activeTree.items.reduce((s,i) => s+i.qty, 0) : 0;
  const grossWeight = activeTree ? activeTree.items.reduce((s,i) => s+i.weight, 0) : 0;

  // أحجار الشجرة النشطة — مشتقة من الحالة المجمّعة بحسب معرّف الشجرة النشطة
  // هذا يجعل كل شجرة تحتفظ بأحجارها المستقلة ولا يتم خلطها
  const addedGems       = activeTreeId ? (addedGemsPerTree[activeTreeId] ?? []) : [];
  // إجمالي وزن الأحجار الكريمة المضافة للشجرة النشطة — محسوب تلقائياً
  const totalGemsWeight = addedGems.reduce((s, g) => s + g.totalWeight, 0);

  // الأوزان الفعلية: من قراءة الميزان إن وُجدت، وإلا من الإدخال اليدوي أو الصفر
  const effectiveTotalWeight = committedTreeWeight ?? grossWeight;
  // وزن القاعدة: من حوار "أخذ الوزن" إن وُجد، وإلا من حقل الإدخال اليدوي في بطاقة الصهر
  const effectiveBaseWeight  = (committedBaseWeight ?? parseFloat(baseWeightManualInput)) || 0;
  const multiplyBy           = parseFloat(multiplyByValue) || 16;

  // حساب الذهب اللازم للصهر = (وزن الشجرة - وزن القاعدة - وزن الأحجار) × معامل الضرب
  const goldNeeded = Math.max(0, (effectiveTotalWeight - effectiveBaseWeight - totalGemsWeight) * multiplyBy);

  // دالة تنسيق الوقت
  const fmt = (d: string) => new Date(d).toLocaleString();

  // ─── دالة إنشاء شجرة جديدة ───────────────────────────────────────────────
  const handleCreateTree = () => {
    const autoCode = newCode.trim() || generateCode("TR");
    const tr: Tree = {
      id: `tree-${Date.now()}`, code: autoCode,
      modelCode: newModelCode || generateCode("MDL"),
      karat: newKarat, holders: +newHolders || 40, items: [], notes: "",
    };
    setTrees(prev => [...prev, tr]);
    setActiveTreeId(tr.id);
    setIsNewTreeOpen(false);
    setNewCode(""); setNewModel(""); setNewKarat("18K"); setNewHolders("40");
    toast({ title: t("scale.treeCreated"), description: tr.code });
  };

  // ─── فتح حوار الكمية الجزئية عند نقل عنصر من الانتظار ───────────────────
  const openPartialPlaceDialog = (item: WaitingItem) => {
    if (!activeTree) return;
    setPartialPlaceItem(item);
    setPartialQtyInput(String(item.qty));
    setPartialPlaceOpen(true);
  };

  // ─── تأكيد نقل الكمية الجزئية أو الكاملة إلى الشجرة ─────────────────────
  const handleConfirmPartialPlace = () => {
    if (!partialPlaceItem || !activeTree) return;
    const qty = parseInt(partialQtyInput, 10);
    if (isNaN(qty) || qty < 1 || qty > partialPlaceItem.qty) return;
    const weightPerUnit = partialPlaceItem.weight / partialPlaceItem.qty;
    const movedWeight   = +(weightPerUnit * qty).toFixed(3);
    const existing = activeTree.items.find(i => i.code === partialPlaceItem.code);
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? {
        ...tr,
        items: existing
          ? tr.items.map(i => i.code === partialPlaceItem.code
              ? { ...i, qty: i.qty + qty, weight: +(i.weight + movedWeight).toFixed(3) } : i)
          : [...tr.items, { code: partialPlaceItem.code, model: partialPlaceItem.model,
              karat: partialPlaceItem.karat, qty, weight: movedWeight, gems: 0, image: partialPlaceItem.image }]
      } : tr
    ));
    const remaining = partialPlaceItem.qty - qty;
    if (remaining <= 0) {
      setWaitingItems(prev => prev.filter(w => w.code !== partialPlaceItem.code));
    } else {
      setWaitingItems(prev => prev.map(w =>
        w.code === partialPlaceItem.code
          ? { ...w, qty: remaining, weight: +(w.weight - movedWeight).toFixed(3) } : w
      ));
    }
    setPartialPlaceOpen(false); setPartialPlaceItem(null); setPartialQtyInput("");
    toast({ title: t("scale.itemPlaced"), description: `${qty} × ${partialPlaceItem.code} → ${activeTree.code}` });
  };

  // ─── سحب وإفلات: فتح حوار الكمية الجزئية ────────────────────────────────
  const handleDrop = () => {
    setDragOverTree(false);
    if (dragRef.current) { openPartialPlaceDialog(dragRef.current); dragRef.current = null; }
  };

  // ─── فتح حوار حذف العناصر المختارة من الشجرة ────────────────────────────
  // يفتح الحوار مع ملء خريطة الكميات بالكميات الحالية كافتراض
  const handleOpenRemoveTreeDialog = () => {
    if (!activeTree || selectedTreeItems.size === 0) return;
    const qtyMap: Record<string, string> = {};
    selectedTreeItems.forEach(code => {
      const item = activeTree.items.find(i => i.code === code);
      if (item) qtyMap[code] = String(item.qty);
    });
    setRemoveItemQtyMap(qtyMap);
    setRemoveReason("");
    setRemoveTreeOpen(true);
  };

  // ─── تأكيد حذف العناصر المختارة وإضافتها لمسودة المحذوفات ───────────────
  // المحذوفات تظهر تحت الشجرة بلون أحمر ويمكن استعادتها حتى الحفظ النهائي
  const handleConfirmRemoveFromTree = () => {
    if (!activeTree || !removeReason.trim()) {
      toast({ title: "يرجى إدخال سبب الحذف", variant: "destructive" }); return;
    }
    const now = new Date().toISOString();
    const newDrafts: RemovedDraftItem[] = [];
    const updatedItems = activeTree.items.map(item => {
      if (!selectedTreeItems.has(item.code)) return item;
      const removeQty = parseInt(removeItemQtyMap[item.code] || String(item.qty), 10) || item.qty;
      const safeQty   = Math.min(removeQty, item.qty);
      const wPerUnit  = item.weight / item.qty;
      // إضافة العنصر المحذوف إلى قائمة المسودات
      newDrafts.push({
        code: item.code, model: item.model, karat: item.karat,
        qty: safeQty, weight: +(wPerUnit * safeQty).toFixed(3),
        reason: removeReason, removedAt: now, image: item.image,
      });
      const remaining = item.qty - safeQty;
      // إرجاع العنصر إذا تبقت كمية منه
      return remaining > 0
        ? { ...item, qty: remaining, weight: +(wPerUnit * remaining).toFixed(3) }
        : null;
    }).filter(Boolean) as typeof activeTree.items;
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? { ...tr, items: updatedItems } : tr
    ));
    setRemovedDrafts(prev => [...prev, ...newDrafts]);
    setSelectedTreeItems(new Set());
    setRemoveTreeOpen(false);
    toast({ title: t("scale.toastItemsMovedToDraft", { count: newDrafts.length }), description: t("scale.toastSbRemovalReason", { reason: removeReason }) });
  };

  // ─── استعادة عنصر من مسودة المحذوفات إلى الشجرة ─────────────────────────
  // يُزيل العنصر من المسودات ويُضيفه مجدداً إلى الشجرة
  const handleRestoreDraft = (draft: RemovedDraftItem) => {
    if (!activeTree) return;
    const existing = activeTree.items.find(i => i.code === draft.code);
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? {
        ...tr,
        items: existing
          ? tr.items.map(i => i.code === draft.code
              ? { ...i, qty: i.qty + draft.qty, weight: +(i.weight + draft.weight).toFixed(3) } : i)
          : [...tr.items, { code: draft.code, model: draft.model, karat: draft.karat,
              qty: draft.qty, weight: draft.weight, gems: 0, image: draft.image }]
      } : tr
    ));
    setRemovedDrafts(prev => prev.filter(d => !(d.code === draft.code && d.removedAt === draft.removedAt)));
    toast({ title: t("scale.toastItemRestored", { code: draft.code }) });
  };

  // ─── فتح حوار استرجاع عنصر من الشجرة إلى قائمة الانتظار ──────────────────
  // يدعم الاسترجاع الجزئي: يمكن تحديد كمية أقل من الكمية الكاملة
  const openReturnToWaitingDialog = (item: TreeItem) => {
    setReturnToWaitingItem(item);
    setReturnToWaitingQtyInput(String(item.qty));
    setReturnToWaitingOpen(true);
  };

  // ─── تأكيد استرجاع الكمية المحددة من الشجرة إلى قائمة الانتظار ─────────
  const handleConfirmReturnToWaiting = () => {
    if (!returnToWaitingItem || !activeTree) return;
    const qty = parseInt(returnToWaitingQtyInput, 10);
    if (isNaN(qty) || qty < 1 || qty > returnToWaitingItem.qty) return;
    const weightPerUnit = returnToWaitingItem.weight / returnToWaitingItem.qty;
    const movedWeight   = +(weightPerUnit * qty).toFixed(3);
    const remaining     = returnToWaitingItem.qty - qty;
    // تحديث الشجرة — حذف العنصر نهائياً إذا كانت الكمية المُرجَعة تساوي الكل
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? {
        ...tr,
        items: remaining > 0
          ? tr.items.map(i => i.code === returnToWaitingItem.code
              ? { ...i, qty: remaining, weight: +(i.weight - movedWeight).toFixed(3) } : i)
          : tr.items.filter(i => i.code !== returnToWaitingItem.code)
      } : tr
    ));
    // إضافة إلى قائمة الانتظار — دمج مع عنصر موجود أو إدراج جديد
    const existingWaiting = waitingItems.find(w => w.code === returnToWaitingItem.code);
    if (existingWaiting) {
      setWaitingItems(prev => prev.map(w =>
        w.code === returnToWaitingItem.code
          ? { ...w, qty: w.qty + qty, weight: +(w.weight + movedWeight).toFixed(3) } : w
      ));
    } else {
      setWaitingItems(prev => [
        { code: returnToWaitingItem.code, model: returnToWaitingItem.model,
          karat: returnToWaitingItem.karat, qty, weight: movedWeight, image: returnToWaitingItem.image },
        ...prev
      ]);
    }
    setReturnToWaitingOpen(false);
    setReturnToWaitingItem(null);
    setReturnToWaitingQtyInput("");
    toast({ title: t("scale.toastReturnedToWaiting", { qty, code: returnToWaitingItem.code }) });
  };

  // ─── معالجة الإفلات على قائمة الانتظار (سحب عنصر من الشجرة) ─────────────
  const handleTreeItemDrop = () => {
    if (treeItemDragRef.current) {
      openReturnToWaitingDialog(treeItemDragRef.current);
      treeItemDragRef.current = null;
    }
  };

  // ─── حذف عنصر من قائمة الانتظار نهائياً (القديم — للتوافق) ──────────────
  const handleRemoveFromWaiting = () => {
    if (!removeWaitingCode) return;
    setWaitingItems(prev => prev.filter(w => w.code !== removeWaitingCode));
    setRemoveWaitingCode(null); setRemoveWaitingOpen(false);
    toast({ title: t("scale.itemRemoved") });
  };

  // ─── فتح حوار حذف العناصر المختارة من قائمة الانتظار ────────────────────
  // يُملأ جدول الكميات بالكميات الحالية كافتراض، ويُفتح الحوار
  const handleOpenRemoveWaitingDialog = () => {
    if (selectedWaitingItems.size === 0) {
      toast({ title: t("scale.toastSelectAtLeastOne"), variant: "destructive" });
      return;
    }
    const qtyMap: Record<string, string> = {};
    selectedWaitingItems.forEach(code => {
      const item = waitingItems.find(w => w.code === code);
      if (item) qtyMap[code] = String(item.qty);
    });
    setRemoveWaitingQtyMap(qtyMap);
    setRemoveWaitingReason("");
    setRemoveWaitingDialogOpen(true);
  };

  // ─── تأكيد حذف العناصر المختارة من قائمة الانتظار نهائياً ───────────────
  const handleConfirmRemoveWaiting = () => {
    if (!removeWaitingReason.trim()) {
      toast({ title: t("scale.toastEnterReason"), variant: "destructive" }); return;
    }
    const removed: string[] = [];
    setWaitingItems(prev => prev.map(item => {
      if (!selectedWaitingItems.has(item.code)) return item;
      const removeQty = parseInt(removeWaitingQtyMap[item.code] || String(item.qty), 10) || item.qty;
      const safeQty   = Math.min(removeQty, item.qty);
      removed.push(item.code);
      const remaining = item.qty - safeQty;
      return remaining > 0
        ? { ...item, qty: remaining, weight: +((item.weight / item.qty) * remaining).toFixed(3) }
        : null;
    }).filter(Boolean) as WaitingItem[]);
    setSelectedWaitingItems(new Set());
    setRemoveWaitingDialogOpen(false);
    toast({ title: t("scale.toastItemsRemovedWaiting", { count: removed.length }), description: t("scale.toastSbRemovalReason", { reason: removeWaitingReason }) });
  };

  // ─── فتح حوار إدراج الأحجار وإعادة تعيين خطوات الحوار ───────────────────
  const handleOpenInsertGems = () => {
    setGemsStep(1); setGemsSelectedModels({}); setGemInventoryCode("");
    setGemInventoryCustom(""); setGemQtyInput(""); setGemWeightPerUnit(""); setGemTotalWeightManual("");
    setInsertGemsOpen(true);
  };

  // ─── الانتقال من الخطوة 1 إلى الخطوة 2 (اختيار الأحجار) ─────────────────
  const handleGemsStep2 = () => {
    const hasSelected = Object.keys(gemsSelectedModels).some(k => parseInt(gemsSelectedModels[k]) > 0);
    if (!hasSelected) { toast({ title: t("scale.toastSelectModel"), variant: "destructive" }); return; }
    setGemsStep(2);
  };

  // ─── الانتقال من الخطوة 2 إلى الخطوة 3 (المراجعة) ───────────────────────
  const handleGemsStep3 = () => {
    const gemName = gemInventoryCode || gemInventoryCustom;
    if (!gemName.trim()) { toast({ title: t("scale.toastSelectGemType"), variant: "destructive" }); return; }
    if (!gemTotalWeightManual) { toast({ title: t("scale.toastEnterGemsWeight"), variant: "destructive" }); return; }
    setGemsStep(3);
  };

  // ─── تأكيد إضافة الأحجار الكريمة ─────────────────────────────────────────
  const handleConfirmInsertGems = () => {
    const gemName    = gemInventoryCode || gemInventoryCustom;
    const totalW     = parseFloat(gemTotalWeightManual) || 0;
    const wPerUnit   = gemWeightPerUnit ? parseFloat(gemWeightPerUnit) : null;
    const qty        = parseInt(gemQtyInput) || 0;
    const modelCodes = Object.keys(gemsSelectedModels).filter(k => parseInt(gemsSelectedModels[k]) > 0);
    const entry: GemEntry = {
      gemType: gemName, gemCode: gemInventoryCode || "CUSTOM",
      modelCodes, qty, weightPerUnit: wPerUnit, totalWeight: totalW,
      addedAt: new Date().toISOString(),
    };
    // حفظ الحجر الجديد تحت معرّف الشجرة النشطة فقط — لا تأثير على باقي الأشجار
    setAddedGemsPerTree(prev => ({
      ...prev,
      [activeTreeId]: [...(prev[activeTreeId] ?? []), entry],
    }));
    // تحديث عمود "الأحجار" في عناصر الشجرة
    setTrees(prev => prev.map(tr =>
      tr.id === activeTreeId ? {
        ...tr,
        items: tr.items.map(item =>
          modelCodes.includes(item.code) ? { ...item, gems: (item.gems || 0) + qty } : item
        )
      } : tr
    ));
    setInsertGemsOpen(false);
    toast({ title: t("scale.toastGemsAdded", { name: gemName, weight: totalW }), description: modelCodes.join(", ") });
  };

  // ─── تأكيد أخذ وزن الشجرة والقاعدة من الميزان الرقمي ───────────────────
  // حفظ الأوزان المُدخلة — وزن الأحجار يُحسب تلقائياً من قائمة الأحجار
  const handleConfirmTakeWeight = () => {
    const tw = parseFloat(treeWeightInput);
    const bw = parseFloat(baseWeightInput) || 0;
    if (isNaN(tw) || tw <= 0) { toast({ title: t("scale.toastEnterTreeWeight"), variant: "destructive" }); return; }
    setCommittedTreeWeight(tw);
    setCommittedBaseWeight(bw);
    setTakeWeightOpen(false);
    toast({ title: t("scale.toastWeightsSaved"), description: t("scale.toastWeightSavedDesc", { tree: tw, base: bw }) });
  };

  // ─── حفظ مسودة — يحتفظ بمسودة المحذوفات ─────────────────────────────────
  const handleSaveDraft = () => {
    const now = new Date().toISOString();
    setDraftSavedTimes(prev => ({ ...prev, [activeTreeId]: now }));
    // ملاحظة: عند حفظ مسودة يتم الاحتفاظ بمسودة المحذوفات كما هي
    toast({ title: t("scale.savedDraftToast"), description: t("scale.savedDraftDescToast") });
  };

  // ─── حفظ نهائي — يمسح مسودة المحذوفات نهائياً ───────────────────────────
  const handleSave = () => {
    const now = new Date().toISOString();
    setSavedTimes(prev => ({ ...prev, [activeTreeId]: now }));
    // عند الحفظ النهائي تُحذف مسودة المحذوفات نهائياً ولا يمكن استعادتها
    setRemovedDrafts([]);
    setSelectedTreeItems(new Set());
    toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") });
  };

  // ─── حفظ وطباعة ──────────────────────────────────────────────────────────
  const handleSaveAndPrint = () => {
    const now = new Date().toISOString();
    setSavedTimes(prev => ({ ...prev, [activeTreeId]: now }));
    setRemovedDrafts([]);
    toast({ title: t("scale.savedAndPrintedToast") });
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* ── مخطط مسار نقل المواد إلى الشجرة ──────────────────────────────── */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 overflow-x-auto">
        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <TreePine className="w-3.5 h-3.5" /> مسار نقل المواد إلى الشجرة — DATA TRANSFER TREE FLOW
        </p>
        <div className="flex items-start gap-0 text-[10px] min-w-[600px]">
          <div className="flex flex-col items-center">
            <div className="px-3 py-2 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-center whitespace-nowrap">
              <Package className="w-3 h-3 mx-auto mb-0.5" />
              {t("scale.flowWaitingNode")}<br/>
              <span className="font-mono font-normal text-[9px]">Item Waiting ({waitingItems.length})</span>
            </div>
            <div className="w-px h-4 bg-green-500/40" />
          </div>
          <div className="flex items-center mt-4 mx-1">
            <div className="w-8 h-px bg-green-500/60" />
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-green-500/60" />
          </div>
          <div className="flex flex-col items-center">
            <div className="px-3 py-2 rounded-lg border-2 border-green-500/70 bg-green-500/15 text-green-700 dark:text-green-400 font-bold text-center whitespace-nowrap shadow-sm">
              <TreePine className="w-3 h-3 mx-auto mb-0.5" />
              {t("scale.flowTreeNode")}<br/>
              <span className="font-mono font-normal text-[9px]">{activeTree ? activeTree.code : "—"}</span>
            </div>
            {activeTree && activeTree.items.length > 0 && (
              <div className="relative mt-1">
                <div className="w-px h-3 bg-green-500/40 mx-auto" />
                <div className="flex gap-2">
                  {activeTree.items.map(item => (
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
          <div className="flex items-center mt-4 mx-1">
            <div className="w-8 h-px bg-orange-500/60" />
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-orange-500/60" />
          </div>
          <div className="flex flex-col items-center">
            <div className="px-3 py-2 rounded-lg border-2 border-orange-500/60 bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold text-center whitespace-nowrap">
              <FlameKindling className="w-3 h-3 mx-auto mb-0.5" />
              {t("scale.flowCastingNode")}<br/>
              <span className="font-mono font-normal text-[9px]">Casting Section</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── أزرار التنقل بين الأشجار ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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
                <Button className="w-full" onClick={handleCreateTree}>
                  <TreePine className="h-4 w-4 me-2"/> {t("scale.createTree")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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

        {/* ── جانب يسار: قائمة الانتظار وحساب الصهر ───────────────────────── */}
        <div className="space-y-3">
          {/* بطاقة قائمة الانتظار — تقبل السحب من الشجرة بالإفلات */}
          <Card
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleTreeItemDrop(); }}
          >
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
                      {/* ── عمود مربع الاختيار لتحديد العناصر للحذف ── */}
                      <TableHead className="text-[10px] py-2 w-8">
                        <Checkbox
                          checked={waitingItems.length > 0 && selectedWaitingItems.size === waitingItems.length}
                          onCheckedChange={v => {
                            if (v) setSelectedWaitingItems(new Set(waitingItems.map(i => i.code)));
                            else setSelectedWaitingItems(new Set());
                          }}
                        />
                      </TableHead>
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
                      <TableHead className="text-[10px] py-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitingItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-xs text-muted-foreground py-8">
                          {t("scale.noItemsWaiting")}
                        </TableCell>
                      </TableRow>
                    )}
                    {waitingItems.map((item, idx) => (
                      <TableRow key={item.code} draggable onDragStart={() => { dragRef.current = item; }}
                        className={cn(
                          "cursor-grab active:cursor-grabbing transition-colors",
                          selectedWaitingItems.has(item.code) && "bg-amber-500/10"
                        )}>
                        {/* مربع الاختيار لتحديد العنصر للحذف */}
                        <TableCell className="text-xs py-2 w-8">
                          <Checkbox
                            checked={selectedWaitingItems.has(item.code)}
                            onCheckedChange={v => {
                              const s = new Set(selectedWaitingItems);
                              if (v) s.add(item.code); else s.delete(item.code);
                              setSelectedWaitingItems(s);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">—</TableCell>
                        <TableCell className="text-xs py-2 font-mono">{idx+1}</TableCell>
                        <TableCell className="text-xs py-2">designer</TableCell>
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
                          <Button size="sm" variant="ghost"
                            className="h-6 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                            onClick={() => openPartialPlaceDialog(item)}>
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

          {/* أزرار إجراءات قائمة الانتظار */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* (−) REMOVE ITEM: يفتح حوار تحديد الكمية والسبب للعناصر المختارة */}
            <ActionBtn
              label={`(−) ${t("scale.removeItem")}${selectedWaitingItems.size > 0 ? ` (${selectedWaitingItems.size})` : ""}`}
              icon={X} variant="outline"
              disabled={waitingItems.length === 0}
              onClick={handleOpenRemoveWaitingDialog}
            />
            {selectedWaitingItems.size > 0 && (
              <span className="text-[10px] text-amber-600">
                {t("scale.selectedInWaiting", { count: selectedWaitingItems.size })}
              </span>
            )}
          </div>

        </div>

        {/* ── جانب يمين: الشجرة النشطة ─────────────────────────────────────── */}
        <div
          className="space-y-3"
          onDragOver={e => { e.preventDefault(); setDragOverTree(true); }}
          onDragLeave={() => setDragOverTree(false)}
          onDrop={e => { e.preventDefault(); handleDrop(); }}
        >
          {activeTree ? (
            <>
              {/* ── جدول عناصر الشجرة مع مربعات الاختيار ──────────────── */}
              <Card className={cn("transition-colors", dragOverTree && "border-primary/60 bg-primary/5")}>
                <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{t("scale.treeNumber")} 1 — CODE {activeTree.code}</CardTitle>
                    {selectedTreeItems.size > 0 && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {t("scale.selectedInTree", { count: selectedTreeItems.size })}
                      </p>
                    )}
                  </div>
                  {/* شارة أحجار الشجرة النشطة — تظهر لكل شجرة على حدة بمجرد إضافة أي حجر */}
                  {addedGems.length > 0 && (
                    <button
                      onClick={() => setSeeAllGemsOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-violet-500/40 bg-violet-500/10 text-violet-600 text-[11px] font-semibold hover:bg-violet-500/20 transition-colors whitespace-nowrap shrink-0"
                      title="عرض أحجار هذه الشجرة"
                    >
                      <Gem className="w-3.5 h-3.5"/>
                      {t("scale.gemsCountBadge", { count: addedGems.length })}
                    </button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {/* ── عمود مربع الاختيار للحذف المجمَّع ── */}
                          <TableHead className="text-[10px] py-2 w-8">
                            <Checkbox
                              checked={activeTree.items.length > 0 && selectedTreeItems.size === activeTree.items.length}
                              onCheckedChange={v => {
                                if (v) setSelectedTreeItems(new Set(activeTree.items.map(i => i.code)));
                                else setSelectedTreeItems(new Set());
                              }}
                            />
                          </TableHead>
                          <TableHead colSpan={5} className="text-[10px] py-2 border-r border-border/40">{t("scale.modelSpec")}</TableHead>
                          <TableHead colSpan={4} className="text-[10px] py-2">{t("scale.seeAddedGems")}</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-[10px] py-1.5 w-8"></TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.number")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.source")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.pic")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.itemNameCode")}</TableHead>
                          <TableHead className="text-[10px] py-1.5 border-r border-border/40">{t("scale.karat")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.approxWeight")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.qty")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.addedGems")}</TableHead>
                          <TableHead className="text-[10px] py-1.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTree.items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                              {t("scale.dragItemsHere")}
                            </TableCell>
                          </TableRow>
                        )}
                        {activeTree.items.map((item, idx) => {
                          // حساب عدد الأحجار المضافة لهذا الموديل تحديداً
                          const gemsForItem = addedGems
                            .filter(g => g.modelCodes.includes(item.code))
                            .reduce((s, g) => s + g.qty, 0);
                          return (
                            <TableRow key={item.code}
                              draggable
                              onDragStart={() => { treeItemDragRef.current = item; }}
                              className={cn(
                                "hover:bg-green-500/8 border-l-2 transition-colors",
                                selectedTreeItems.has(item.code)
                                  ? "bg-amber-500/10 border-l-amber-500"
                                  : "bg-green-500/5 border-l-green-500/40"
                              )}>
                              {/* مربع الاختيار لتحديد العنصر للحذف */}
                              <TableCell className="text-xs py-2 w-8">
                                <Checkbox
                                  checked={selectedTreeItems.has(item.code)}
                                  onCheckedChange={v => {
                                    const s = new Set(selectedTreeItems);
                                    if (v) s.add(item.code); else s.delete(item.code);
                                    setSelectedTreeItems(s);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-xs py-2 font-mono">{idx+1}</TableCell>
                              <TableCell className="text-xs py-2">designer</TableCell>
                              <TableCell className="text-xs py-2">
                                {item.image ? (
                                  <img src={item.image} alt={item.model} className="w-7 h-7 object-cover rounded border border-border/50"/>
                                ) : (
                                  <div className="w-7 h-7 bg-muted rounded text-[9px] flex items-center justify-center text-muted-foreground">pic</div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs py-2 font-mono">{item.code}</TableCell>
                              <TableCell className="text-xs py-2 border-r border-border/40">{item.karat}</TableCell>
                              <TableCell className="text-xs py-2">{item.weight}g</TableCell>
                              <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                              {/* عمود الأحجار: يعرض العدد الفعلي المحسوب من قائمة الأحجار */}
                              <TableCell className="text-xs py-2">
                                {gemsForItem > 0 ? (
                                  <span className="text-violet-600 font-bold flex items-center gap-1">
                                    <Gem className="w-2.5 h-2.5"/> {gemsForItem}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                {/* زر استرجاع العنصر من الشجرة إلى الانتظار مع تحديد الكمية */}
                                <Button size="sm" variant="ghost"
                                  className="h-6 px-2 text-amber-600/70 hover:text-amber-600 hover:bg-amber-500/10"
                                  title="استرجاع إلى الانتظار — يمكن السحب أيضاً"
                                  onClick={() => openReturnToWaitingDialog(item)}>
                                  <Undo2 className="h-3 w-3"/>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* ── أزرار إجراءات الشجرة النشطة ────────────────────────── */}
              <div className="flex gap-2 flex-wrap">
                {/* (−) حذف مع السبب — يتطلب تحديد عناصر أولاً */}
                <ActionBtn
                  label={`${t("scale.removeWithReason")}${selectedTreeItems.size > 0 ? ` (${selectedTreeItems.size})` : ""}`}
                  icon={X} variant="outline"
                  disabled={selectedTreeItems.size === 0}
                  onClick={handleOpenRemoveTreeDialog}
                />
                {/* (+) إدراج أحجار كريمة — حوار متعدد الخطوات */}
                <ActionBtn label={`(+) ${t("scale.insertGems")}`} icon={Gem} onClick={handleOpenInsertGems}/>
                {/* (⚖) أخذ وزن الشجرة والقاعدة */}
                <ActionBtn label={`(⚖) ${t("scale.takeWeight")}`} icon={Weight} onClick={() => setTakeWeightOpen(true)}/>
              </div>

              {/* ── شبكة مزدوجة: مواصفات الشجرة + حساب الذهب للصهر جنباً إلى جنب ── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
              {/* ── بطاقة مواصفات الشجرة ─────────────────────────────────── */}
              <Card className="border-border/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("scale.treeSpec")} 1</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.treeCodeQr")}</td><td className="px-4 py-2 font-mono font-bold">{activeTree.code}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.karat")}</td><td className="px-4 py-2">{activeTree.karat}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.qtyInTree")}</td><td className="px-4 py-2 font-bold">{totalItems}</td></tr>
                      {/* عدد ووزن الأحجار المضافة — محسوب تلقائياً */}
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">{t("scale.addedGemsQtyWeight")}</td>
                        <td className="px-4 py-2">
                          {addedGems.length > 0
                            ? (
                              <span className="text-violet-600 font-medium">
                                {addedGems.length} — {totalGemsWeight.toFixed(3)}g
                              </span>
                            )
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                      {/* وزن الشجرة: من الميزان إن أُخذ وإلا الإجمالي التقريبي */}
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">{t("scale.treeTotalWeight")}</td>
                        <td className="px-4 py-2 font-bold">
                          {committedTreeWeight
                            ? <span className="text-green-600">{committedTreeWeight.toFixed(3)}g ⚖️</span>
                            : grossWeight > 0 ? `${grossWeight.toFixed(1)}g` : "—"}
                        </td>
                      </tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.savedDraftTime")}</td><td className="px-4 py-2 text-muted-foreground">{draftSavedTimes[activeTreeId] ? fmt(draftSavedTimes[activeTreeId]) : "—"}</td></tr>
                      <tr className="border-t border-border/40"><td className="px-4 py-2 text-muted-foreground">{t("scale.savedTime")}</td><td className="px-4 py-2 text-muted-foreground">{savedTimes[activeTreeId] ? fmt(savedTimes[activeTreeId]) : "—"}</td></tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* ── بطاقة حساب الذهب اللازم للصهر — مُنقلة لتكون بجانب مواصفات الشجرة ── */}
              <Card className="border-border/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <FlameKindling className="w-3.5 h-3.5 text-amber-600"/>
                    {t("scale.neededMeltCalc")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <tbody>
                      {/* وزن الشجرة الإجمالي */}
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground w-44">{t("scale.totalWeightG")}</td>
                        <td className="px-4 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            {effectiveTotalWeight > 0
                              ? <span className="font-bold font-mono text-green-600">{effectiveTotalWeight.toFixed(3)} g</span>
                              : <span className="text-muted-foreground italic">—</span>}
                            {committedTreeWeight && (
                              <span className="text-[10px] text-green-600 bg-green-500/10 px-1 py-0.5 rounded">{t("scale.weightFromScale")}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* وزن القاعدة — يمكن إدخالها يدوياً */}
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">{t("scale.baseWeightG")}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number" min="0" step="0.001"
                              value={committedBaseWeight !== null ? committedBaseWeight.toFixed(3) : baseWeightManualInput}
                              onChange={e => setBaseWeightManualInput(e.target.value)}
                              placeholder="0.000"
                              className="w-24 text-xs font-mono rounded border border-border/60 bg-background px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-muted-foreground">g</span>
                            {committedBaseWeight !== null
                              ? <span className="text-[10px] text-green-600">{t("scale.weightFromScale")}</span>
                              : <span className="text-[10px] text-muted-foreground italic">{t("scale.manualEntry")}</span>}
                          </div>
                        </td>
                      </tr>
                      {/* وزن الأحجار — محسوب تلقائياً من قائمة الأحجار */}
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">{t("scale.totalGemsWeight")}</td>
                        <td className="px-4 py-2">
                          {totalGemsWeight > 0
                            ? <span className="font-bold font-mono text-violet-600">{totalGemsWeight.toFixed(3)} g</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                      {/* معامل الضرب — قابل للتعديل */}
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">{t("scale.multiplyBy")}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number" min="1" step="0.1"
                            value={multiplyByValue}
                            onChange={e => setMultiplyByValue(e.target.value)}
                            className="w-20 text-xs font-bold rounded border border-border/60 bg-background px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                      </tr>
                      {/* ── الناتج النهائي: الذهب المطلوب للصهر ── */}
                      <tr className="border-t-2 border-amber-500/40 bg-amber-500/5">
                        <td className="px-4 py-2.5 font-semibold text-amber-700 dark:text-amber-400">{t("scale.neededGoldToMelt")}</td>
                        <td className="px-4 py-2.5">
                          {effectiveTotalWeight > 0 ? (
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-muted-foreground font-mono">
                                ({effectiveTotalWeight.toFixed(2)} − {effectiveBaseWeight.toFixed(2)} − {totalGemsWeight.toFixed(2)}) × {multiplyBy}
                              </div>
                              <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-base">{goldNeeded.toFixed(2)} g</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">{t("scale.enterTreeWeightFirst")}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              </div>{/* نهاية شبكة مواصفات الشجرة + حساب الصهر */}

              {/* ── قسم مسودة المحذوفات — يظهر فقط إذا كانت هناك عناصر محذوفة ──
                  المحذوفات تُحفظ عند "حفظ مسودة" وتُحذف نهائياً عند "حفظ"    */}
              {removedDrafts.length > 0 && (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-destructive"/>
                      <CardTitle className="text-sm text-destructive">
                        {t("scale.removedDraftCount", { count: removedDrafts.length })}
                      </CardTitle>
                    </div>
                    <span className="text-[10px] text-muted-foreground italic">
                      {t("scale.willDeleteOnSave")}
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colCode")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colModel")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colQty")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colWeight")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colKarat")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colReason")}</TableHead>
                          <TableHead className="text-[10px] py-1.5">{t("scale.colRemovedAt")}</TableHead>
                          <TableHead className="text-[10px] py-1.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {removedDrafts.map((d, idx) => (
                          <TableRow key={`${d.code}-${d.removedAt}-${idx}`} className="bg-destructive/5">
                            <TableCell className="text-xs py-2 font-mono text-destructive font-bold">{d.code}</TableCell>
                            <TableCell className="text-xs py-2">{d.model}</TableCell>
                            <TableCell className="text-xs py-2 font-bold">{d.qty}</TableCell>
                            <TableCell className="text-xs py-2">{d.weight}g</TableCell>
                            <TableCell className="text-xs py-2">{d.karat}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground max-w-[120px] truncate" title={d.reason}>{d.reason}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">{fmt(d.removedAt)}</TableCell>
                            <TableCell className="text-xs py-2">
                              {/* زر استعادة العنصر إلى الشجرة */}
                              <Button size="sm" variant="outline"
                                className="h-6 px-2 text-[10px] text-green-600 border-green-500/40 hover:bg-green-500/10"
                                onClick={() => handleRestoreDraft(d)}>
                                {t("scale.restoreItem")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {t("scale.selectOrCreateTree")}
            </Card>
          )}
        </div>
      </div>


      {/* ── شريط أزرار الحفظ ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border/40">
        <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
          <span>{t("scale.saveNote")}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* حفظ مسودة: يحتفظ بمسودة المحذوفات */}
          <ActionBtn label={t("scale.saveDraft")}    icon={Save}         variant="outline" onClick={handleSaveDraft}/>
          {/* حفظ نهائي: يمسح مسودة المحذوفات */}
          <ActionBtn label={t("scale.save")}         icon={CheckCircle2} variant="default" onClick={handleSave}/>
          <ActionBtn label={t("scale.saveAndPrint")} icon={Printer}      variant="default" onClick={handleSaveAndPrint}/>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          حوار قائمة المسودات — يعرض جميع الأشجار المحفوظة
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={draftListOpen} onOpenChange={setDraftListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600"/>
              {t("scale.draftListTitle") || "قائمة المسودات"}
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600">{trees.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-1">
            {trees.map(tr => {
              const isActiveTree = tr.id === activeTreeId;
              const totalQty = tr.items.reduce((s,i) => s+i.qty, 0);
              const totalW   = tr.items.reduce((s,i) => s+i.weight, 0).toFixed(1);
              return (
                <button key={tr.id}
                  onClick={() => { setActiveTreeId(tr.id); setDraftListOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border p-3 text-start transition-colors",
                    isActiveTree ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60"
                  )}>
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", isActiveTree ? "bg-primary/20" : "bg-muted")}>
                    <TreePine className={cn("w-4 h-4", isActiveTree ? "text-primary" : "text-muted-foreground")}/>
                  </div>
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
                    {tr.items.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {tr.items.slice(0, 5).map(item => (
                          <div key={item.code} title={item.code}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                            {item.code.slice(0,2)}
                          </div>
                        ))}
                        {tr.items.length > 5 && <span className="text-[10px] text-muted-foreground">+{tr.items.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    {draftSavedTimes[tr.id]
                      ? <p className="text-[9px] text-muted-foreground">{fmt(draftSavedTimes[tr.id])}</p>
                      : <p className="text-[9px] text-muted-foreground italic">{t("scale.noDraft") || "لم تُحفَظ"}</p>}
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
          حوار اختيار الكمية الجزئية عند نقل عنصر من الانتظار إلى الشجرة
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={partialPlaceOpen} onOpenChange={open => { if (!open) { setPartialPlaceOpen(false); setPartialPlaceItem(null); setPartialQtyInput(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" />
              {t("scale.moveToTreeTitle")}
            </DialogTitle>
          </DialogHeader>
          {partialPlaceItem && (
            <div className="space-y-4 pt-1">
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
                  <span className="text-muted-foreground">الكمية في الانتظار:</span>
                  <span className="font-bold text-primary">{partialPlaceItem.qty} قطعة</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">الشجرة الهدف:</span>
                  <span className="flex items-center gap-1 font-medium text-green-600">
                    <TreePine className="w-3 h-3"/> {activeTree?.code}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t("scale.qtyToTransfer")}
                  <span className="text-muted-foreground font-normal mr-1">({t("scale.fromRange", { max: partialPlaceItem.qty })})</span>
                </Label>
                <Input type="number" min={1} max={partialPlaceItem.qty}
                  value={partialQtyInput} onChange={e => setPartialQtyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleConfirmPartialPlace(); }}
                  className="text-center text-lg font-bold h-12" autoFocus/>
                <div className="flex gap-2 flex-wrap">
                  <button className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors" onClick={() => setPartialQtyInput("1")}>1 {t("scale.pcs")}</button>
                  <button className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors" onClick={() => setPartialQtyInput(String(Math.floor(partialPlaceItem.qty / 2)))}>{t("scale.halfQty", { n: Math.floor(partialPlaceItem.qty / 2) })}</button>
                  <button className="text-[10px] px-2 py-0.5 rounded border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors" onClick={() => setPartialQtyInput(String(partialPlaceItem.qty))}>{t("scale.allQty", { n: partialPlaceItem.qty })}</button>
                </div>
              </div>
              {partialQtyInput && parseInt(partialQtyInput) >= 1 && parseInt(partialQtyInput) <= partialPlaceItem.qty && (
                <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("scale.fieldTransferredQty")}</span>
                    <span className="font-bold text-green-700 dark:text-green-400">{parseInt(partialQtyInput)} {t("scale.pcs")}</span>
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
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setPartialPlaceOpen(false); setPartialPlaceItem(null); setPartialQtyInput(""); }}>إلغاء</Button>
                <Button className="flex-1 gap-2" onClick={handleConfirmPartialPlace}
                  disabled={!partialQtyInput || isNaN(parseInt(partialQtyInput)) || parseInt(partialQtyInput) < 1 || parseInt(partialQtyInput) > partialPlaceItem.qty}>
                  <ChevronRight className="w-4 h-4"/> نقل إلى الشجرة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          حوار حذف عناصر من الشجرة مع تحديد الكمية والسبب
          العناصر المحذوفة تنتقل إلى "مسودة المحذوفات" ويمكن استعادتها
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={removeTreeOpen} onOpenChange={open => { if (!open) setRemoveTreeOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="w-4 h-4"/> حذف عناصر من الشجرة (مع السبب)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* قائمة العناصر المختارة مع حقل تحديد الكمية لكل منها */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {activeTree && Array.from(selectedTreeItems).map(code => {
                const item = activeTree.items.find(i => i.code === code);
                if (!item) return null;
                return (
                  <div key={code} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    {/* صورة الموديل */}
                    {item.image
                      ? <img src={item.image} alt={item.code} className="w-9 h-9 rounded object-cover border border-border/50 shrink-0"/>
                      : <div className="w-9 h-9 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground border border-border/50 shrink-0">{item.code.slice(0,3)}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold">{item.code}</p>
                      <p className="text-[10px] text-muted-foreground">{item.model} · {item.karat}</p>
                    </div>
                    {/* حقل تحديد الكمية المراد حذفها */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <label className="text-[9px] text-muted-foreground">{t("scale.removeQtyFrom", { max: item.qty })}</label>
                      <input type="number" min="1" max={item.qty}
                        value={removeItemQtyMap[code] ?? String(item.qty)}
                        onChange={e => setRemoveItemQtyMap(prev => ({ ...prev, [code]: e.target.value }))}
                        className="w-20 text-xs text-center rounded border border-border/60 bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-destructive"/>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* حقل سبب الحذف — إلزامي */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                سبب الحذف <span className="text-destructive">*</span>
                <span className="text-[10px] text-muted-foreground font-normal">(مطلوب)</span>
              </Label>
              <textarea
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
                placeholder="مثال: تلف في القطعة، طلب العميل تغيير الموديل..."
                rows={3}
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-destructive placeholder:text-muted-foreground"
              />
            </div>
            {/* إشعار بأن العناصر ستكون قابلة للاستعادة */}
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <span className="mt-0.5">ℹ️</span>
              <span>ستُنقل العناصر إلى <strong>مسودة المحذوفات</strong> أسفل الشجرة ويمكن استعادتها حتى الحفظ النهائي.</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveTreeOpen(false)}>إلغاء</Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmRemoveFromTree} disabled={!removeReason.trim()}>
                <X className="w-4 h-4 me-1.5"/> نقل إلى مسودة المحذوفات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          حوار إدراج الأحجار الكريمة — ثلاث خطوات:
          1) اختيار الموديلات من الشجرة + الكمية لكل موديل
          2) اختيار نوع الحجر من المخزون + الكمية والوزن
          3) مراجعة البيانات وتأكيد الإضافة
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={insertGemsOpen} onOpenChange={open => { if (!open) setInsertGemsOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-violet-500"/>
              {t("scale.insertGems")}
              <span className="text-[11px] text-muted-foreground font-normal">— {t("scale.gemsStepOf", { step: gemsStep })}</span>
            </DialogTitle>
          </DialogHeader>

          {/* ── شريط تقدم الخطوات ────────────────────────────────────── */}
          <div className="flex gap-2 mb-2">
            {[1,2,3].map(step => (
              <div key={step} className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                gemsStep >= step ? "bg-violet-500" : "bg-muted"
              )}/>
            ))}
          </div>

          {/* ════ الخطوة 1: اختيار الموديلات ════════════════════════════ */}
          {gemsStep === 1 && (
            <div className="space-y-3">
              {/* وصف الخطوة الأولى: اختيار الموديلات التي ستُضاف إليها الأحجار */}
              <p className="text-xs text-muted-foreground">{t("scale.gemsStep1Desc")}</p>
              {!activeTree || activeTree.items.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("scale.gemsNoItemsInTree")}</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeTree.items.map(item => {
                    const isSelected = !!gemsSelectedModels[item.code];
                    return (
                      <div key={item.code}
                        className={cn("flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                          isSelected ? "border-violet-500/50 bg-violet-500/10" : "border-border/50 bg-muted/20"
                        )}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={v => {
                            setGemsSelectedModels(prev => {
                              const next = { ...prev };
                              if (v) next[item.code] = "1";
                              else delete next[item.code];
                              return next;
                            });
                          }}
                        />
                        {item.image
                          ? <img src={item.image} alt={item.code} className="w-8 h-8 rounded object-cover border border-border/50 shrink-0"/>
                          : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground border border-border/50 shrink-0">{item.code.slice(0,3)}</div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-bold">{item.code}</p>
                          <p className="text-[10px] text-muted-foreground">{item.model} · {item.qty} {t("scale.pcs")}</p>
                        </div>
                        {/* تم حذف حقل كمية الأحجار لكل موديل — الكمية تُدخَل في الخطوة 2 */}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setInsertGemsOpen(false)}>{t("common.cancel")}</Button>
                <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleGemsStep2}
                  disabled={Object.keys(gemsSelectedModels).length === 0}>
                  {t("scale.gemsNextSelectGem")}
                </Button>
              </div>
            </div>
          )}

          {/* ════ الخطوة 2: اختيار الحجر والكمية والوزن ════════════════ */}
          {gemsStep === 2 && (
            <div className="space-y-3">
              {/* وصف الخطوة الثانية */}
              <p className="text-xs text-muted-foreground">{t("scale.gemsStep2Desc")}</p>
              {/* اختيار نوع الحجر من المخزون */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t("scale.gemsFromInventory")}</Label>
                <Select value={gemInventoryCode} onValueChange={v => { setGemInventoryCode(v); setGemInventoryCustom(""); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("scale.gemsSelectFromInventory")}/>
                  </SelectTrigger>
                  <SelectContent>
                    {GEMS_INVENTORY.map(g => (
                      <SelectItem key={g.code} value={g.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">{g.code}</span>
                          <span>{g.name}</span>
                          <span className="text-[10px] text-muted-foreground">({g.available} {t("scale.pcs")})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* أو إدخال نوع مخصص */}
              <div className="space-y-1">
<Label className="text-xs font-medium">{t("scale.gemsOrCustom")}</Label>
                <Input value={gemInventoryCustom}
                  onChange={e => { setGemInventoryCustom(e.target.value); setGemInventoryCode(""); }}
                  placeholder={t("scale.gemsCustomPlaceholder")}
                  className="h-9 text-sm"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* الكمية الإجمالية للأحجار */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("scale.gemsTotalQty")}</Label>
                  <Input type="number" min="1" value={gemQtyInput}
                    onChange={e => {
                      setGemQtyInput(e.target.value);
                      // احتساب الوزن الإجمالي تلقائياً عند تغيير الكمية إذا كان وزن الحجر الواحد مُدخَلاً
                      if (gemWeightPerUnit) {
                        const total = parseFloat(gemWeightPerUnit) * parseInt(e.target.value);
                        if (!isNaN(total)) setGemTotalWeightManual(total.toFixed(3));
                      }
                    }} placeholder="0"/>
                </div>
                {/* وزن كل حجر (اختياري) */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("scale.gemsWeightPerUnit")}</Label>
                  <Input type="number" min="0" step="0.001" value={gemWeightPerUnit}
                    onChange={e => {
                      setGemWeightPerUnit(e.target.value);
                      // حساب الوزن الإجمالي تلقائياً من وزن الحجر الواحد × الكمية
                      if (gemQtyInput) {
                        const total = parseFloat(e.target.value) * parseInt(gemQtyInput);
                        if (!isNaN(total)) setGemTotalWeightManual(total.toFixed(3));
                      }
                    }} placeholder="0.000"/>
                </div>
              </div>
              {/* الوزن الإجمالي للأحجار */}
              <div className="space-y-1">
<Label className="text-xs font-medium">{t("scale.gemsTotalWeightRequired")} <span className="text-destructive">*</span></Label>
                <Input type="number" min="0" step="0.001" value={gemTotalWeightManual}
                  onChange={e => {
                    setGemTotalWeightManual(e.target.value);
                    // احتساب وزن كل حجر تلقائياً = الوزن الإجمالي ÷ الكمية
                    if (gemQtyInput && parseInt(gemQtyInput) > 0) {
                      const perUnit = parseFloat(e.target.value) / parseInt(gemQtyInput);
                      if (!isNaN(perUnit)) setGemWeightPerUnit(perUnit.toFixed(4));
                    }
                  }} placeholder="0.000"
                  className="font-mono"/>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setGemsStep(1)}>{t("scale.gemsBack")}</Button>
                <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleGemsStep3}
                  disabled={!(gemInventoryCode || gemInventoryCustom) || !gemTotalWeightManual}>
                  {t("scale.gemsNextReview")}
                </Button>
              </div>
            </div>
          )}

          {/* ════ الخطوة 3: مراجعة وتأكيد ══════════════════════════════ */}
          {gemsStep === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{t("scale.gemsStep3Desc")}</p>
              <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 divide-y divide-border/40 text-xs">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">{t("scale.gemsTypeLabel")}</span>
                  <span className="font-bold text-violet-700 dark:text-violet-400">
                    {GEMS_INVENTORY.find(g => g.code === gemInventoryCode)?.name || gemInventoryCustom}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">{t("scale.gemsTotalQtyLabel")}</span>
                  <span className="font-bold">{gemQtyInput || "—"} {t("scale.gemsStones")}</span>
                </div>
                {gemWeightPerUnit && (
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-muted-foreground">{t("scale.gemsWeightPerUnitLabel")}</span>
                    <span className="font-bold">{gemWeightPerUnit} g</span>
                  </div>
                )}
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">{t("scale.gemsTotalWeightLabel2")}</span>
                  <span className="font-bold text-violet-700 dark:text-violet-400">{gemTotalWeightManual} g</span>
                </div>
                <div className="px-3 py-2">
                  <span className="text-muted-foreground block mb-1">{t("scale.gemsLinkedModels")}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.keys(gemsSelectedModels).map(code => (
                      <span key={code} className="text-[10px] font-mono bg-violet-500/10 border border-violet-500/30 text-violet-600 px-2 py-0.5 rounded">
                        {code} × {gemsSelectedModels[code]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setGemsStep(2)}>{t("scale.gemsBack")}</Button>
                <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleConfirmInsertGems}>
                  <Gem className="w-4 h-4 me-1.5"/> {t("scale.gemsConfirmAdd")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          حوار عرض جميع الأحجار الكريمة المضافة للشجرة
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={seeAllGemsOpen} onOpenChange={setSeeAllGemsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-violet-500"/>
              أحجار: {activeTree?.code ?? ""} — الشجرة النشطة فقط
              <Badge className="bg-violet-500/20 text-violet-600 border-violet-500/40">{addedGems.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          {addedGems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">لم تُضَف أحجار بعد</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">#</TableHead>
                    <TableHead className="text-[10px]">نوع الحجر</TableHead>
                    <TableHead className="text-[10px]">الموديلات</TableHead>
                    <TableHead className="text-[10px]">الكمية</TableHead>
                    <TableHead className="text-[10px]">الوزن الإجمالي</TableHead>
                    <TableHead className="text-[10px]">وقت الإضافة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addedGems.map((g, idx) => (
                    <TableRow key={g.addedAt + idx}>
                      <TableCell className="text-xs py-2 font-mono">{idx+1}</TableCell>
                      <TableCell className="text-xs py-2 font-medium text-violet-600">{g.gemType}</TableCell>
                      <TableCell className="text-xs py-2">
                        <div className="flex flex-wrap gap-1">
                          {g.modelCodes.map(c => (
                            <span key={c} className="text-[9px] font-mono bg-violet-500/10 border border-violet-500/30 text-violet-600 px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-2 font-bold">{g.qty}</TableCell>
                      <TableCell className="text-xs py-2 font-bold">{g.totalWeight.toFixed(3)}g</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{fmt(g.addedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* إجمالي وزن الأحجار */}
              <div className="flex justify-between items-center px-4 py-2 bg-violet-500/5 border-t border-border/40 text-xs font-bold">
                <span>إجمالي وزن الأحجار:</span>
                <span className="text-violet-600 text-sm">{totalGemsWeight.toFixed(3)} g</span>
              </div>
            </div>
          )}
          <Button variant="outline" className="w-full text-xs" onClick={() => setSeeAllGemsOpen(false)}>إغلاق</Button>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          حوار أخذ وزن الشجرة والقاعدة من الميزان الرقمي
          وزن الأحجار يُحسب تلقائياً ولا يُدخَل يدوياً
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={takeWeightOpen} onOpenChange={setTakeWeightOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-primary"/>
              {t("scale.takeWeight")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* حقل وزن الشجرة الإجمالي */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t("scale.totalTreeWeightG")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input type="number" min="0" step="0.001"
                  value={treeWeightInput} onChange={e => setTreeWeightInput(e.target.value)}
                  placeholder="0.000" className="font-mono pr-24"/>
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-medium">
                  {t("scale.weightFromScale")}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("scale.takeWeightFromScale")}</p>
            </div>
            {/* حقل وزن قاعدة الشجرة فقط */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("scale.baseWeightOnlyG")}</Label>
              <div className="relative">
                <Input type="number" min="0" step="0.001"
                  value={baseWeightInput} onChange={e => setBaseWeightInput(e.target.value)}
                  placeholder="0.000" className="font-mono pr-24"/>
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-medium">
                  {t("scale.weightFromScale")}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("scale.takeBaseFromScale")}</p>
            </div>
            {/* وزن الأحجار — محسوب تلقائياً */}
            <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 px-3 py-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Gem className="w-3 h-3 text-violet-500"/> {t("scale.gemsAutoWeight")}
                </span>
                <span className={cn("font-bold", totalGemsWeight > 0 ? "text-violet-600" : "text-muted-foreground")}>
                  {totalGemsWeight > 0 ? `${totalGemsWeight.toFixed(3)} g` : t("scale.gemsNotAdded")}
                </span>
              </div>
            </div>
            {/* معاينة حساب الصهر */}
            {treeWeightInput && (
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 divide-y divide-border/30 text-xs">
                <div className="px-3 py-2 font-medium text-amber-700 dark:text-amber-400">{t("scale.meltPreview")}</div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-muted-foreground">{t("scale.meltTreeWeight")}</span>
                  <span className="font-mono">{parseFloat(treeWeightInput).toFixed(3)} g</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-muted-foreground">{t("scale.meltBaseWeight")}</span>
                  <span className="font-mono">{parseFloat(baseWeightInput || "0").toFixed(3)} g</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-muted-foreground">{t("scale.meltGemsWeight")}</span>
                  <span className="font-mono">{totalGemsWeight.toFixed(3)} g</span>
                </div>
                <div className="flex justify-between px-3 py-2 font-bold">
                  <span className="text-amber-700 dark:text-amber-400">{t("scale.meltGoldResult")}</span>
                  <span className="text-primary font-mono">
                    {Math.max(0, (parseFloat(treeWeightInput) - parseFloat(baseWeightInput || "0") - totalGemsWeight) * multiplyBy).toFixed(2)} g
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setTakeWeightOpen(false)}>{t("common.cancel")}</Button>
              <Button className="flex-1 gap-1.5" onClick={handleConfirmTakeWeight} disabled={!treeWeightInput}>
                <Weight className="w-4 h-4"/> {t("scale.saveWeights")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── حوار تأكيد مسح الشجرة ────────────────────────────────────────── */}
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
              setWaitingItems(p => [...tr.items.map(i => ({ code:i.code, model:i.model, karat:i.karat, qty:i.qty, weight:i.weight })), ...p]);
              setTrees(p => p.map(t => t.id === clearConfirmId ? { ...t, items: [] } : t));
              setClearConfirmId(null);
            }}>{t("scale.clear")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════════════════════════════════════════════════════════════════════
          حوار حذف عناصر من قائمة الانتظار مع تحديد الكمية والسبب
          يُفتح عند الضغط على "(−) REMOVE ITEM" مع تحديد عناصر
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={removeWaitingDialogOpen} onOpenChange={open => { if (!open) setRemoveWaitingDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="w-4 h-4"/> حذف عناصر من قائمة الانتظار
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* قائمة العناصر المختارة مع حقل الكمية لكل منها */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {Array.from(selectedWaitingItems).map(code => {
                const item = waitingItems.find(w => w.code === code);
                if (!item) return null;
                return (
                  <div key={code} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    {item.image
                      ? <img src={item.image} alt={item.code} className="w-9 h-9 rounded object-cover border border-border/50 shrink-0"/>
                      : <div className="w-9 h-9 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground border border-border/50 shrink-0">{item.code.slice(0,3)}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold">{item.code}</p>
                      <p className="text-[10px] text-muted-foreground">{item.model} · {item.karat} · {item.weight}g</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <label className="text-[9px] text-muted-foreground">الكمية (من {item.qty})</label>
                      <input type="number" min="1" max={item.qty}
                        value={removeWaitingQtyMap[code] ?? String(item.qty)}
                        onChange={e => setRemoveWaitingQtyMap(prev => ({ ...prev, [code]: e.target.value }))}
                        className="w-20 text-xs text-center rounded border border-border/60 bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-destructive"/>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* حقل السبب — إلزامي */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                سبب الحذف <span className="text-destructive">*</span>
              </Label>
              <textarea
                value={removeWaitingReason}
                onChange={e => setRemoveWaitingReason(e.target.value)}
                placeholder="مثال: إلغاء الطلب، تغيير في التصميم..."
                rows={2}
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-destructive placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveWaitingDialogOpen(false)}>إلغاء</Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmRemoveWaiting} disabled={!removeWaitingReason.trim()}>
                <X className="w-4 h-4 me-1.5"/> تأكيد الحذف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          حوار استرجاع عنصر من الشجرة إلى قائمة الانتظار
          يدعم الاسترجاع الجزئي (تحديد الكمية) وكذلك السحب والإفلات
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={returnToWaitingOpen} onOpenChange={open => {
        if (!open) { setReturnToWaitingOpen(false); setReturnToWaitingItem(null); setReturnToWaitingQtyInput(""); }
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-4 h-4 text-amber-600" />
              {t("scale.returnToWaitingTitle")}
            </DialogTitle>
          </DialogHeader>
          {returnToWaitingItem && (
            <div className="space-y-4 pt-1">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("scale.fieldModel")}</span>
                  <span className="font-mono font-bold">{returnToWaitingItem.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("scale.fieldName")}</span>
                  <span className="font-medium">{returnToWaitingItem.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("scale.fieldKarat")}</span>
                  <Badge variant="outline" className="text-[10px]">{returnToWaitingItem.karat}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("scale.fieldQtyInTree")}</span>
                  <span className="font-bold text-green-600">{returnToWaitingItem.qty} {t("scale.pcs")}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t("scale.qtyToReturn")}
                  <span className="text-muted-foreground font-normal mr-1">({t("scale.fromRange", { max: returnToWaitingItem.qty })})</span>
                </Label>
                <Input type="number" min={1} max={returnToWaitingItem.qty}
                  value={returnToWaitingQtyInput} onChange={e => setReturnToWaitingQtyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleConfirmReturnToWaiting(); }}
                  className="text-center text-lg font-bold h-12" autoFocus/>
                <div className="flex gap-2 flex-wrap">
                  <button className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                    onClick={() => setReturnToWaitingQtyInput("1")}>1 {t("scale.pcs")}</button>
                  <button className="text-[10px] px-2 py-0.5 rounded border border-border/50 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                    onClick={() => setReturnToWaitingQtyInput(String(Math.floor(returnToWaitingItem.qty / 2)))}>
                    {t("scale.halfQty", { n: Math.floor(returnToWaitingItem.qty / 2) })}</button>
                  <button className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-medium transition-colors"
                    onClick={() => setReturnToWaitingQtyInput(String(returnToWaitingItem.qty))}>
                    {t("scale.allQty", { n: returnToWaitingItem.qty })}</button>
                </div>
              </div>
              {returnToWaitingQtyInput && parseInt(returnToWaitingQtyInput) >= 1 && parseInt(returnToWaitingQtyInput) <= returnToWaitingItem.qty && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("scale.returnedQtyLabel")}</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{parseInt(returnToWaitingQtyInput)} {t("scale.pcs")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("scale.returnedWeightLabel")}</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {+((returnToWaitingItem.weight / returnToWaitingItem.qty) * parseInt(returnToWaitingQtyInput)).toFixed(3)}g
                    </span>
                  </div>
                  {parseInt(returnToWaitingQtyInput) < returnToWaitingItem.qty && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("scale.remainingInTree")}</span>
                      <span>{returnToWaitingItem.qty - parseInt(returnToWaitingQtyInput)} قطعة</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1"
                  onClick={() => { setReturnToWaitingOpen(false); setReturnToWaitingItem(null); setReturnToWaitingQtyInput(""); }}>
                  إلغاء
                </Button>
                <Button className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
                  onClick={handleConfirmReturnToWaiting}
                  disabled={!returnToWaitingQtyInput || isNaN(parseInt(returnToWaitingQtyInput)) || parseInt(returnToWaitingQtyInput) < 1 || parseInt(returnToWaitingQtyInput) > returnToWaitingItem.qty}>
                  <Undo2 className="w-4 h-4"/> {t("scale.returnBtn")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── حوار تأكيد حذف عنصر من قائمة الانتظار ───────────────────────── */}
      <AlertDialog open={removeWaitingOpen} onOpenChange={setRemoveWaitingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scale.removeItemTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scale.removeItemDesc")}{removeWaitingCode ? ` (${removeWaitingCode})` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveWaitingCode(null)}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleRemoveFromWaiting}>
              {t("scale.confirmRemove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// تبويب الصهر المباشر — DirectMeltTab
//
// التغييرات في هذا الإصدار:
//   1. حذف بطاقة إعداد السبائك (Gold Ingot Setup)
//   2. إضافة زر إخفاء/عرض صفوف الجدول (صف الكمية الإجمالية ظاهر دائماً)
//   3. دمج زري RETURN DUST + RETURN PARTS في زر واحد بنافذة تبويبية
//   4. دمج زري MEASURE CURRENT QTY + MEASURE CURRENT WEIGHT في زر واحد
// ═══════════════════════════════════════════════════════════════════════════════

// نوع مسودة الإرجاع (غبار أو أجزاء)
interface ReturnDraft {
  id:        string;
  type:      "dust" | "parts";
  weight:    number;
  qrCode:    string;
  createdAt: string;
}

function DirectMeltTab() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // ─── قائمة أوامر الصهر ───────────────────────────────────────────────────
  const [items, setItems] = useState<MeltOrderItem[]>(INITIAL_MELT_ITEMS);

  // ─── أوزان الفاقد ────────────────────────────────────────────────────────
  const [lastTotalWeight,    setLastTotalWeight]    = useState(320.5);
  const [currentTotalWeight, setCurrentTotalWeight] = useState(315.2);
  const [lossNotes,          setLossNotes]          = useState("");

  // ─── حالات الحوارات ───────────────────────────────────────────────────────
  const [addQrOpen,              setAddQrOpen]              = useState(false);
  const [newQr,                  setNewQr]                  = useState("");
  const [confirmed,              setConfirmed]              = useState<boolean|null>(null);
  const [roadmapOpen,            setRoadmapOpen]            = useState(false);

  // زر RETURN DUST&PARTS — حوار مدمج بتبويبين
  const [returnDustPartsOpen,    setReturnDustPartsOpen]    = useState(false);
  const [returnActiveTab,        setReturnActiveTab]        = useState<"dust"|"parts">("dust");
  const [dustWeight,             setDustWeight]             = useState("");
  const [dustQrCode,             setDustQrCode]             = useState("");
  const [partsWeight,            setPartsWeight]            = useState("");
  const [partsQrCode,            setPartsQrCode]            = useState("");
  // مسودات الإرجاع — تُعرض في الجدول وتُحذف بعد الحفظ النهائي
  const [returnDrafts,           setReturnDrafts]           = useState<ReturnDraft[]>([]);
  const [finalized,              setFinalized]              = useState(false);

  // زر MEASURE CURRENT QTY&WEIGHT — حوار مدمج
  const [measureOpen,            setMeasureOpen]            = useState(false);
  const [newMeasureWeight,       setNewMeasureWeight]       = useState("");

  // إخفاء/عرض صفوف بيانات الجدول (صف الكمية ظاهر دائماً)
  const [rowsVisible,            setRowsVisible]            = useState(true);
  // ملاحظة مدير الإنتاج للموظف — تُعرض للقراءة فقط بجانب ملاحظة الموظف
  const [pmNote] = useState("Please ensure all melt quantities are recorded accurately before proceeding to casting. Double-check karat grades and customer codes for each order.");

  // ─── مجموع الكميات في جميع الأوامر ──────────────────────────────────────
  const insertCurrentQty = items.reduce((s, i) => s + i.qty, 0);

  // ─── تعديل كمية موديل بالأزرار +/− ──────────────────────────────────────
  const adjustItemQty = (id: number, delta: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));

  // ─── توليد QR للغبار ─────────────────────────────────────────────────────
  const handleGenerateDustQr = () => {
    const code = generateCode("DST");
    setDustQrCode(code);
    toast({ title: t("scale.qrGenerated"), description: code });
  };

  // ─── حفظ مسودة الغبار ────────────────────────────────────────────────────
  const handleSaveDustDraft = () => {
    if (!dustWeight || !dustQrCode) {
      toast({ title: t("scale.generateQr"), variant: "destructive" });
      return;
    }
    setReturnDrafts(prev => [...prev, {
      id: `draft-${Date.now()}`,
      type: "dust",
      weight: parseFloat(dustWeight),
      qrCode: dustQrCode,
      createdAt: new Date().toLocaleTimeString(),
    }]);
    setDustWeight(""); setDustQrCode("");
    toast({ title: t("scale.draftSaved") });
  };

  // ─── توليد QR للأجزاء ────────────────────────────────────────────────────
  const handleGeneratePartsQr = () => {
    const code = generateCode("PRT");
    setPartsQrCode(code);
    toast({ title: t("scale.qrGenerated"), description: code });
  };

  // ─── حفظ مسودة الأجزاء ──────────────────────────────────────────────────
  const handleSavePartsDraft = () => {
    if (!partsWeight || !partsQrCode) {
      toast({ title: t("scale.generateQr"), variant: "destructive" });
      return;
    }
    setReturnDrafts(prev => [...prev, {
      id: `draft-${Date.now()}`,
      type: "parts",
      weight: parseFloat(partsWeight),
      qrCode: partsQrCode,
      createdAt: new Date().toLocaleTimeString(),
    }]);
    setPartsWeight(""); setPartsQrCode("");
    toast({ title: t("scale.draftSaved") });
  };

  // ─── حذف مسودة ───────────────────────────────────────────────────────────
  const handleDeleteDraft = (id: string) =>
    setReturnDrafts(prev => prev.filter(d => d.id !== id));

  // ─── إضافة كود QR جديد ───────────────────────────────────────────────────
  const handleAddQr = () => {
    if (!newQr.trim()) return;
    toast({ title: t("scale.addQrTitle"), description: newQr });
    setNewQr(""); setAddQrOpen(false);
  };

  // ─── حفظ نهائي — يُخفي المسودات وينقل الغبار لصفحة التجميع ─────────────
  const handleSave = () => {
    setConfirmed(true);
    if (returnDrafts.length > 0) {
      // نقل مدخلات الغبار إلى localStorage لتظهر في صفحة تجميع الغبار
      const dustDrafts = returnDrafts.filter(d => d.type === "dust");
      if (dustDrafts.length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem("puramax_scale_dust") || "[]");
          const newEntries = dustDrafts.map(d => ({
            id: d.qrCode,
            date: new Date().toLocaleString("en-GB", { hour12: false }).replace(",", ""),
            sectionId: "s4",
            collectedBy: "Scale Operator",
            weightGrams: d.weight,
            dustType: "mixed",
            status: "pending-refinery",
            notes: `Direct Melt — QR: ${d.qrCode}`,
          }));
          localStorage.setItem("puramax_scale_dust", JSON.stringify([...newEntries, ...existing]));
          toast({ title: t("scale.savedToast"), description: t("scale.scaleDustSent") });
        } catch (_) {
          toast({ title: t("scale.savedToast"), description: t("scale.finalizedDrafts") });
        }
      } else {
        toast({ title: t("scale.savedToast"), description: t("scale.finalizedDrafts") });
      }
      setFinalized(true);
    } else {
      toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") });
    }
  };

  const handlePrint  = () => { toast({ title: t("scale.print") }); setTimeout(() => window.print(), 300); };
  const handleYes    = () => { setConfirmed(true);  toast({ title: t("scale.savedToast"), description: t("scale.savedDescToast") }); };
  const handleNo     = () => { setConfirmed(false); toast({ title: t("common.cancel"), description: "—", variant: "destructive" }); };

  return (
    <div className="space-y-4">
      {/* وصف التبويب وزر إضافة QR */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{t("scale.meltDesc")}</p>
        <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => setAddQrOpen(true)}>
          <QrCode className="h-3.5 w-3.5"/> {t("scale.addAnotherQr")}
        </Button>
      </div>

      {/* ── جدول أوامر الصهر ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm uppercase tracking-wide">{t("scale.neededOrderModels")}</CardTitle>
            {/* زر إخفاء/عرض الصفوف — صف الكمية الإجمالية ظاهر دائماً */}
            <Button
              size="sm" variant="ghost"
              className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground px-2"
              onClick={() => setRowsVisible(v => !v)}>
              {rowsVisible ? (
                <><X className="w-3 h-3"/>{t("scale.toggleRows")}</>
              ) : (
                <><Plus className="w-3 h-3"/>{t("scale.showRows")}</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* صف الكمية الإجمالية — ظاهر دائماً بصرف النظر عن الإخفاء */}
          <div className="border-t border-border/40 text-center text-xs text-amber-700 dark:text-amber-400 py-2.5 font-medium bg-amber-500/5">
            {t("scale.insertCurrentQty")} = {insertCurrentQty}
          </div>
          {/* الجدول القابل للطي مع انتقال CSS سلس — max-height يضمن الحركة الانسيابية */}
          <div style={{
            maxHeight: rowsVisible ? "700px" : "0px",
            opacity: rowsVisible ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s ease-in-out, opacity 0.25s ease-in-out",
          }}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead colSpan={6} className="text-[10px] py-2 border-r border-border/40 text-center">
                      {t("scale.itemsSpec")}
                    </TableHead>
                    {/* زر خريطة الإنتاج */}
                    <TableHead colSpan={5} className="text-[10px] py-1.5 text-center">
                      <Button
                        size="sm" variant="ghost"
                        className="h-6 text-[10px] gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-500/10 px-2"
                        onClick={() => setRoadmapOpen(true)}>
                        <Map className="w-3 h-3"/>
                        {t("scale.viewRoadmap")}
                      </Button>
                    </TableHead>
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
                  {/* صفوف الموديلات */}
                  {items.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs py-2">{idx + 1}</TableCell>
                      <TableCell className="text-xs py-2 font-mono">{item.customerCode}</TableCell>
                      <TableCell className="text-xs py-2 font-mono">{item.orderCode}</TableCell>
                      <TableCell className="text-xs py-2 font-mono">{item.modelCode}</TableCell>
                      <TableCell className="text-xs py-2">
                        {item.modelPic
                          ? <img src={item.modelPic} alt={item.modelCode} className="w-8 h-8 rounded object-cover border border-border/50"/>
                          : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground">{item.modelCode.slice(0,3)}</div>}
                      </TableCell>
                      <TableCell className="text-xs py-2 border-r border-border/40">{item.partCode}</TableCell>
                      <TableCell className="text-xs py-2">{item.kerat}</TableCell>
                      <TableCell className="text-xs py-2">{item.size}</TableCell>
                      <TableCell className="text-xs py-2 font-bold">{item.qty}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">
                        {item.notes || <span className="italic text-muted-foreground/50">—</span>}
                      </TableCell>
                      <TableCell className="text-xs py-2">
                        <span className="text-[10px] text-muted-foreground">{item.roadMap}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── مسودات الإرجاع — تُعرض كمسودات قابلة للحذف حتى الحفظ النهائي ──── */}
      {returnDrafts.length > 0 && !finalized && (
        <Card className="border-dashed border-amber-500/40">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <FileText className="w-3.5 h-3.5"/>
              {t("scale.draftsSection")} ({returnDrafts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">{t("scale.dustTab")}/{t("scale.partsTab")}</th>
                  <th className="px-4 py-2 text-left font-medium">QR Code</th>
                  <th className="px-4 py-2 text-left font-medium">{t("scale.newWeightG")}</th>
                  <th className="px-4 py-2 text-left font-medium">{t("scale.notes")}</th>
                  <th className="px-4 py-2"/>
                </tr>
              </thead>
              <tbody>
                {returnDrafts.map(draft => (
                  <tr key={draft.id} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <Badge variant={draft.type === "dust" ? "default" : "outline"} className="text-[10px]">
                        {draft.type === "dust" ? t("scale.draftDust") : t("scale.draftParts")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-mono">{draft.qrCode}</td>
                    <td className="px-4 py-2">{draft.weight} g</td>
                    <td className="px-4 py-2 text-muted-foreground">{draft.createdAt}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1"
                          onClick={() => { toast({ title: t("scale.printQr"), description: draft.qrCode }); }}>
                          <Printer className="w-3 h-3"/>{t("scale.printQr")}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDraft(draft.id)}>
                          <Trash2 className="w-3 h-3"/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ── أزرار الإجراءات ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {/* زر مدمج: RETURN DUST&PARTS */}
        <ActionBtn
          label={`(−) ${t("scale.returnDustParts")}`}
          variant="outline"
          onClick={() => { setReturnActiveTab("dust"); setReturnDustPartsOpen(true); }}/>
        {/* زر مدمج: MEASURE CURRENT QTY&WEIGHT */}
        <ActionBtn
          label={`(+) ${t("scale.measureQtyWeight")}`}
          icon={Weight}
          onClick={() => setMeasureOpen(true)}/>
      </div>

      {/* ── بطاقة الفاقد والملاحظات ─────────────────────────────────────────── */}
      <div className="max-w-2xl">
        {/* LossCalcCard تقبل onRetake لإعادة فتح نافذة القياس */}
        <LossCalcCard lastTotal={lastTotalWeight} currentTotal={currentTotalWeight} onRetake={() => setMeasureOpen(true)}/>
        {/* قسم الملاحظات — عمودان: ملاحظة الموظف (يسار) وملاحظة مدير الإنتاج (يمين) */}
        <div className="mt-2 grid grid-cols-2 gap-3">
          {/* العمود الأول: ملاحظة الموظف للقسم التالي — قابل للتحرير */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("scale.employeeNote")}</Label>
            <Textarea
              value={lossNotes}
              onChange={e => setLossNotes(e.target.value)}
              className="text-xs h-[72px] resize-none"
              placeholder={t("scale.addRemarks")}/>
          </div>
          {/* العمود الثاني: ملاحظة مدير الإنتاج للموظف — للقراءة فقط */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("scale.pmNoteLabel")}</Label>
            <div className="text-xs h-[72px] rounded-md border border-border/50 bg-muted/20 px-3 py-2 overflow-y-auto leading-relaxed text-foreground/80">
              {pmNote
                ? pmNote
                : <span className="italic text-muted-foreground/50">{t("scale.noManagerNote")}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── شريط الحفظ والطباعة ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border/40">
        <p className="text-xs text-muted-foreground">{t("scale.saveNote")}</p>
        <div className="flex gap-2 flex-wrap">
          <ActionBtn label={t("scale.print")} icon={Printer}      variant="outline" onClick={handlePrint}/>
          <ActionBtn label={t("scale.save")}  icon={CheckCircle2} variant="default" onClick={handleSave}/>
          <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden h-8">
            <Button size="sm" variant="ghost"
              className={cn("h-full rounded-none text-xs px-3", confirmed === true  ? "bg-green-500/20 text-green-700 font-bold" : "text-green-600")}
              onClick={handleYes}>{t("scale.yes")}</Button>
            <div className="w-px h-full bg-border"/>
            <Button size="sm" variant="ghost"
              className={cn("h-full rounded-none text-xs px-3", confirmed === false ? "bg-destructive/20 text-destructive font-bold" : "text-destructive")}
              onClick={handleNo}>{t("scale.no")}</Button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          DIALOG 1 — RETURN DUST&PARTS (نافذة الإرجاع المدمجة)
          تحتوي على تبويبين: DUST وPARTS
          كل تبويب: إدخال الوزن → توليد QR → حفظ كمسودة
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={returnDustPartsOpen} onOpenChange={setReturnDustPartsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-4 h-4"/>
              {t("scale.returnDustPartsTitle")}
            </DialogTitle>
          </DialogHeader>

          {/* مبدّل التبويبات (DUST / PARTS) */}
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              className={cn("flex-1 py-2 text-xs font-semibold transition-colors",
                returnActiveTab === "dust"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 hover:bg-muted text-muted-foreground")}
              onClick={() => setReturnActiveTab("dust")}>
              {t("scale.dustTab")}
            </button>
            <button
              className={cn("flex-1 py-2 text-xs font-semibold transition-colors",
                returnActiveTab === "parts"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 hover:bg-muted text-muted-foreground")}
              onClick={() => setReturnActiveTab("parts")}>
              {t("scale.partsTab")}
            </button>
          </div>

          {/* ── تبويب DUST ──────────────────────────────────────────────────── */}
          {returnActiveTab === "dust" && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-muted-foreground">{t("scale.returnDustDesc")}</p>
              {/* حقل وزن الغبار */}
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.takeDustWeight")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number" min="0" step="0.001"
                    value={dustWeight}
                    onChange={e => setDustWeight(e.target.value)}
                    placeholder="0.000"
                    className="font-mono flex-1"/>
                  <span className="flex items-center text-xs text-muted-foreground">g</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t("scale.fromScaleOrManual")}</p>
              </div>
              {/* توليد كود QR */}
              <div className="space-y-2">
                <Button
                  variant="outline" className="w-full gap-2 text-xs"
                  onClick={handleGenerateDustQr}
                  disabled={!dustWeight}>
                  <QrCode className="w-3.5 h-3.5"/>
                  {t("scale.generateQr")}
                </Button>
                {dustQrCode && (
                  <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-md px-3 py-2">
                    <QrCode className="w-4 h-4 text-primary shrink-0"/>
                    <span className="font-mono text-sm font-bold flex-1">{dustQrCode}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1"
                      onClick={() => toast({ title: t("scale.printQr"), description: dustQrCode })}>
                      <Printer className="w-3 h-3"/>
                    </Button>
                  </div>
                )}
              </div>
              {/* حفظ كمسودة */}
              <Button
                className="w-full"
                disabled={!dustWeight || !dustQrCode}
                onClick={handleSaveDustDraft}>
                {t("scale.saveDraft")}
              </Button>
            </div>
          )}

          {/* ── تبويب PARTS ─────────────────────────────────────────────────── */}
          {returnActiveTab === "parts" && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-muted-foreground">{t("scale.returnPartsDesc")}</p>
              {/* حقل وزن الأجزاء */}
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.takePartsWeight")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number" min="0" step="0.001"
                    value={partsWeight}
                    onChange={e => setPartsWeight(e.target.value)}
                    placeholder="0.000"
                    className="font-mono flex-1"/>
                  <span className="flex items-center text-xs text-muted-foreground">g</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t("scale.fromScaleOrManual")}</p>
              </div>
              {/* توليد كود QR */}
              <div className="space-y-2">
                <Button
                  variant="outline" className="w-full gap-2 text-xs"
                  onClick={handleGeneratePartsQr}
                  disabled={!partsWeight}>
                  <QrCode className="w-3.5 h-3.5"/>
                  {t("scale.generateQr")}
                </Button>
                {partsQrCode && (
                  <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-md px-3 py-2">
                    <QrCode className="w-4 h-4 text-primary shrink-0"/>
                    <span className="font-mono text-sm font-bold flex-1">{partsQrCode}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1"
                      onClick={() => toast({ title: t("scale.printQr"), description: partsQrCode })}>
                      <Printer className="w-3 h-3"/>
                    </Button>
                  </div>
                )}
              </div>
              {/* حفظ كمسودة */}
              <Button
                className="w-full"
                disabled={!partsWeight || !partsQrCode}
                onClick={handleSavePartsDraft}>
                {t("scale.saveDraft")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          DIALOG 2 — MEASURE CURRENT QTY&WEIGHT (نافذة القياس المدمجة)
          قسم 1: تعديل الكميات لكل موديل (أزرار +/−)
          قسم 2: إدخال الوزن الحالي (يدوياً أو من الميزان)
          SAVE: يحدّث currentTotalWeight وكميات الأوامر
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={measureOpen} onOpenChange={setMeasureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-primary"/>
              {t("scale.measureQtyWeightTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* ── قسم الكميات ────────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/40 pb-1">
                {t("scale.qtySection")}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("scale.measureQtyDesc")}</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 border border-border/50 rounded-lg p-2 bg-muted/10">
                    {item.modelPic
                      ? <img src={item.modelPic} alt={item.modelCode} className="w-8 h-8 rounded object-cover border border-border/50 shrink-0"/>
                      : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground shrink-0">{item.modelCode.slice(0,3)}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold">{item.modelCode}</p>
                      <p className="text-[10px] text-muted-foreground">{item.orderCode}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="w-6 h-6 rounded border border-border/60 bg-background hover:bg-muted flex items-center justify-center text-xs font-bold transition-colors"
                        onClick={() => adjustItemQty(item.id, -1)}>−</button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                      <button className="w-6 h-6 rounded border border-border/60 bg-background hover:bg-muted flex items-center justify-center text-xs font-bold transition-colors"
                        onClick={() => adjustItemQty(item.id, +1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-right">
                {t("scale.totalQtyItems")}: <strong className="text-foreground">{insertCurrentQty}</strong>
              </p>
            </div>

            {/* ── قسم الوزن الحالي ────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/40 pb-1">
                {t("scale.weightSection")}
              </p>
              <div className="space-y-1">
                <Label className="text-xs">{t("scale.takeCurrentWeight")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min="0" step="0.001"
                    value={newMeasureWeight}
                    onChange={e => setNewMeasureWeight(e.target.value)}
                    placeholder="0.000"
                    className="font-mono flex-1"/>
                  <span className="text-xs text-muted-foreground shrink-0">g</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t("scale.fromScaleOrManual")}</p>
              </div>
            </div>

            {/* زر الحفظ — يحدّث الوزن الحالي في بطاقة الفاقد */}
            <Button className="w-full" onClick={() => {
              if (newMeasureWeight) {
                setCurrentTotalWeight(parseFloat(newMeasureWeight) || currentTotalWeight);
              }
              setMeasureOpen(false);
              setNewMeasureWeight("");
              toast({ title: t("scale.weightUpdated") });
            }}>
              {t("scale.saveDraft")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── حوار إضافة كود QR جديد ──────────────────────────────────────────── */}
      <Dialog open={addQrOpen} onOpenChange={setAddQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>{t("scale.addQrTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">{t("scale.newQrCode")}</Label>
              <Input value={newQr} onChange={e => setNewQr(e.target.value)} placeholder="ORD-001 / BATCH-001" className="font-mono text-sm"/>
            </div>
            <Button className="w-full" onClick={handleAddQr} disabled={!newQr.trim()}>{t("scale.addQr")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── حوار خريطة الإنتاج ──────────────────────────────────────────────── */}
      <Dialog open={roadmapOpen} onOpenChange={setRoadmapOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-4 h-4 text-violet-500"/>
              {t("scale.viewRoadmap")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">{t("scale.roadmapDialogDesc")}</p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="border border-border/50 rounded-lg p-3 space-y-2 bg-muted/5">
                <div className="flex items-center gap-2.5">
                  {item.modelPic
                    ? <img src={item.modelPic} alt={item.modelCode} className="w-10 h-10 rounded object-cover border border-border/50 shrink-0"/>
                    : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground shrink-0">{item.modelCode.slice(0,3)}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-xs">{item.modelCode}</p>
                    <p className="text-[10px] text-muted-foreground">{item.orderCode} · {item.customerCode} · {item.kerat}</p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                    {t("scale.qty")}: {item.qty}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {item.roadMap.split(" → ").map((step, si, arr) => (
                    <React.Fragment key={si}>
                      <span className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-medium">
                        {step}
                      </span>
                      {si < arr.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0"/>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={() => setRoadmapOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogContent>
      </Dialog>
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
