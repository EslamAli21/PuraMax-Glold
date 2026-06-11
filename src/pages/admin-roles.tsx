// ============================================================
// صفحة إدارة الأدوار والصلاحيات — Roles & Permissions Page
// تم تحديث هذه الصفحة لتدعم تعديل الصلاحيات:
//   - يستطيع المالك النقر على أي خلية في المصفوفة لتفعيل/تعطيل الصلاحية
//   - يتم حفظ التعديلات في localStorage لتبقى محفوظة بعد إعادة التحميل
//   - يمكن إعادة تعيين الصلاحيات إلى القيم الافتراضية
// ============================================================
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role, ALL_ROLES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Check, X, Lock, Save, RotateCcw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── تعريف الصفحة مع صلاحيات الأدوار ────────────────────────────────────────
interface PagePermission {
  page:    string;   // اسم الصفحة بالإنجليزية
  labelAr: string;   // اسم الصفحة بالعربية
  path:    string;   // مسار الصفحة في التطبيق
  roles:   Role[];   // الأدوار الافتراضية المسموح لها بالوصول
  category: string;  // التصنيف (للتجميع في المصفوفة)
}

// ─── قائمة جميع صفحات التطبيق والصلاحيات الافتراضية ─────────────────────────
const DEFAULT_PAGE_PERMISSIONS: PagePermission[] = [
  // ── لوحة التحكم ──
  { page: "Dashboard",         labelAr: "لوحة التحكم",        path: "/dashboard",       category: "عام",         roles: ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"] },
  // ── الطلبات ──
  { page: "Orders",            labelAr: "الطلبات",             path: "/orders",          category: "الطلبات",     roles: ["Owner","Production Manager","Section Manager"] },
  { page: "New Orders",        labelAr: "الطلبات الواردة",     path: "/new-orders",      category: "الطلبات",     roles: ["Owner","Production Manager"] },
  // ── الموديلات ──
  { page: "Models",            labelAr: "الموديلات",           path: "/models",          category: "الإنتاج",     roles: ["Owner","Production Manager"] },
  // ── الميزان ──
  { page: "Scale",             labelAr: "الميزان",             path: "/scale",           category: "الميزان",     roles: ["Owner","Production Manager","Scale Operator","Tree Responsible"] },
  // ── إدارة الغبار ──
  { page: "Dust Collection",   labelAr: "تجميع الغبار",        path: "/dust-collection", category: "الغبار",      roles: ["Owner","Production Manager","Scale Operator"] },
  { page: "Refinery Return",   labelAr: "إرجاع التكرير",       path: "/refinery-return", category: "الغبار",      roles: ["Owner","Production Manager"] },
  // ── التحليلات والتتبع ──
  { page: "Analytics",         labelAr: "التحليلات",           path: "/analytics",       category: "التتبع",      roles: ["Owner","Production Manager"] },
  { page: "Movements",         labelAr: "حركة البضائع",        path: "/movements",       category: "التتبع",      roles: ["Owner","Production Manager","Scale Operator","Section Manager"] },
  { page: "Alerts",            labelAr: "التنبيهات",           path: "/alerts",          category: "التتبع",      roles: ["Owner","Production Manager"] },
  { page: "Audit Log",         labelAr: "سجل التغييرات",       path: "/audit-log",       category: "التتبع",      roles: ["Owner","Production Manager"] },
  // ── مساحة العمل ──
  { page: "My Designs",        labelAr: "تصاميمي",             path: "/my-designs",      category: "مساحة العمل", roles: ["Designer"] },
  { page: "Print Queue",       labelAr: "قائمة الطباعة",       path: "/print-queue",     category: "مساحة العمل", roles: ["3D Printer"] },
  { page: "My Work",           labelAr: "عملي",                path: "/my-work",         category: "مساحة العمل", roles: ["Worker","Tree Responsible"] },
  // ── الإدارة ──
  { page: "Master Data",       labelAr: "البيانات الرئيسية",   path: "/master-data",     category: "الإدارة",     roles: ["Owner","Production Manager"] },
  { page: "Settings",          labelAr: "الإعدادات",           path: "/settings",        category: "الإدارة",     roles: ["Owner"] },
  // ── الإدارة العليا ──
  { page: "Admin – Factories", labelAr: "إدارة المصانع",       path: "/admin/factories", category: "النظام",      roles: ["Owner"] },
  { page: "Admin – Roles",     labelAr: "إدارة الأدوار",       path: "/admin/roles",     category: "النظام",      roles: ["Owner"] },
  // ── عام ──
  { page: "Calculator",        labelAr: "الآلة الحاسبة",       path: "/calculator",      category: "عام",         roles: ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"] },
];

// ─── مفتاح localStorage لحفظ الصلاحيات المعدّلة ─────────────────────────────
const STORAGE_KEY = "gf_permissions";

// ─── دالة تحميل الصلاحيات من localStorage أو استخدام الافتراضية ─────────────
function loadPermissions(): Record<string, Role[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // تحويل القائمة الافتراضية إلى كائن مفهرس بالمسار
  const defaults: Record<string, Role[]> = {};
  DEFAULT_PAGE_PERMISSIONS.forEach(p => { defaults[p.path] = [...p.roles]; });
  return defaults;
}

// ─── ألوان الأدوار ────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  "Owner":              "bg-amber-500/15 text-amber-700 border-amber-500/40",
  "Production Manager": "bg-blue-500/15 text-blue-700 border-blue-500/40",
  "Designer":           "bg-purple-500/15 text-purple-700 border-purple-500/40",
  "3D Printer":         "bg-cyan-500/15 text-cyan-700 border-cyan-500/40",
  "Tree Responsible":   "bg-green-500/15 text-green-700 border-green-500/40",
  "Scale Operator":     "bg-orange-500/15 text-orange-700 border-orange-500/40",
  "Section Manager":    "bg-indigo-500/15 text-indigo-700 border-indigo-500/40",
  "Worker":             "bg-gray-500/15 text-gray-700 border-gray-500/40",
};

// ─── ألوان التصنيفات ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "عام":         "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "الطلبات":     "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  "الإنتاج":     "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  "الميزان":     "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "الغبار":      "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  "التتبع":      "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  "مساحة العمل": "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
  "الإدارة":     "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  "النظام":      "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function AdminRolesPage() {
  const { currentRole } = useAuth();
  const { toast }       = useToast();

  // ─── حالة تأثير التمرير (hover) لتمييز الأعمدة والصفوف ──────────────────
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const [hoveredPage, setHoveredPage] = useState<string | null>(null);

  // ─── حالة الصلاحيات القابلة للتعديل ─────────────────────────────────────
  // permissions: كائن مفهرس بمسار الصفحة — يحتوي على قائمة الأدوار المسموح لها
  const [permissions, setPermissions] = useState<Record<string, Role[]>>(() => loadPermissions());

  // ─── حالة التعديل: هل نحن في وضع التعديل؟ ────────────────────────────────
  const [editMode, setEditMode] = useState(false);

  // ─── مزامنة الصلاحيات مع localStorage عند كل تغيير ─────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  }, [permissions]);

  // ─── التحقق من صلاحية الوصول للصفحة (للمالك فقط) ────────────────────────
  if (currentRole !== "Owner") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Lock className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">هذه الصفحة متاحة للمالك فقط</p>
      </div>
    );
  }

  // ─── تبديل صلاحية دور معين على صفحة معينة ────────────────────────────────
  // عند النقر على خلية في المصفوفة: إضافة الدور إذا لم يكن موجوداً، أو حذفه إذا كان موجوداً
  const togglePermission = (path: string, role: Role) => {
    if (!editMode) return; // لا تسمح بالتعديل إذا لم نكن في وضع التعديل
    setPermissions(prev => {
      const current = prev[path] || [];
      const hasRole = current.includes(role);
      return {
        ...prev,
        // إضافة الدور أو إزالته من قائمة الأدوار المسموح لها
        [path]: hasRole ? current.filter(r => r !== role) : [...current, role],
      };
    });
  };

  // ─── حفظ الصلاحيات ───────────────────────────────────────────────────────
  const handleSave = () => {
    // الصلاحيات تُحفظ تلقائياً في useEffect، لكن نُظهر رسالة تأكيد للمستخدم
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    setEditMode(false);
    toast({
      title:       "تم حفظ الصلاحيات",
      description: "تم تحديث صلاحيات الأدوار بنجاح وحفظها",
    });
  };

  // ─── إعادة تعيين الصلاحيات إلى القيم الافتراضية ─────────────────────────
  const handleReset = () => {
    const defaults: Record<string, Role[]> = {};
    DEFAULT_PAGE_PERMISSIONS.forEach(p => { defaults[p.path] = [...p.roles]; });
    setPermissions(defaults);
    setEditMode(false);
    toast({
      title:       "تمت إعادة التعيين",
      description: "تمت إعادة الصلاحيات إلى القيم الافتراضية",
    });
  };

  // ─── حساب عدد الصفحات المسموح بها لكل دور ───────────────────────────────
  const roleAccessCount = (role: Role) =>
    Object.values(permissions).filter(roles => roles.includes(role)).length;

  // ─── تجميع الصفحات حسب التصنيف للعرض في المصفوفة ────────────────────────
  const categories = Array.from(new Set(DEFAULT_PAGE_PERMISSIONS.map(p => p.category)));

  return (
    <div className="space-y-4 p-1">

      {/* ── عنوان الصفحة وأزرار التحكم ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* أيقونة الشعار */}
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">إدارة الأدوار والصلاحيات</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Roles & Permissions Matrix</p>
          </div>
        </div>

        {/* أزرار التعديل والحفظ والإعادة */}
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              {/* زر الحفظ — يظهر فقط في وضع التعديل */}
              <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" />
                حفظ التعديلات
              </Button>
              {/* زر الإلغاء والخروج من وضع التعديل */}
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)} className="gap-1.5 text-xs">
                إلغاء
              </Button>
            </>
          ) : (
            <>
              {/* زر الدخول لوضع التعديل */}
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1.5 text-xs">
                <Pencil className="w-3.5 h-3.5" />
                تعديل الصلاحيات
              </Button>
              {/* زر إعادة التعيين إلى القيم الافتراضية */}
              <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة تعيين
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── شريط إعلام وضع التعديل ──────────────────────────────────────────── */}
      {editMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <Pencil className="w-3.5 h-3.5 shrink-0" />
          {/* إرشادات وضع التعديل */}
          <span>
            <strong>وضع التعديل نشط</strong> — انقر على أي خلية في المصفوفة لتفعيل أو تعطيل الصلاحية لذلك الدور.
            اضغط "حفظ التعديلات" عند الانتهاء.
          </span>
        </div>
      )}

      {/* ── بطاقات ملخص عدد الصلاحيات لكل دور ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ALL_ROLES.map(role => (
          <Card
            key={role}
            className={cn(
              "border cursor-pointer transition-all duration-150",
              hoveredRole === role ? "ring-2 ring-primary/40 shadow-md" : "border-border/50",
              ROLE_COLORS[role]
            )}
            onMouseEnter={() => setHoveredRole(role)}
            onMouseLeave={() => setHoveredRole(null)}
          >
            <CardContent className="p-2.5 text-center">
              {/* عدد الصلاحيات المتاحة لهذا الدور */}
              <p className="text-lg font-bold">{roleAccessCount(role)}</p>
              <p className="text-[9px] font-semibold leading-tight mt-0.5 opacity-80">{role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── مصفوفة الصلاحيات القابلة للتعديل ────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            مصفوفة الصلاحيات الكاملة — Full Permissions Matrix
          </CardTitle>
          {/* تعليمات التفاعل مع المصفوفة */}
          <p className="text-[11px] text-muted-foreground">
            {editMode
              ? "انقر على أي خلية لتبديل الصلاحية · انقر مرة أخرى لعكسها"
              : "مرّر فوق اسم الدور لإبراز عموده · مرّر فوق اسم الصفحة لإبراز صفه · اضغط «تعديل الصلاحيات» للتعديل"}
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            {/* ── رأس الجدول: أسماء الأدوار ────────────────────────────────── */}
            <thead>
              <tr>
                {/* زاوية الجدول */}
                <th className="text-start px-4 py-2.5 font-semibold text-muted-foreground border-b border-border/40 min-w-[160px] sticky left-0 bg-card z-10">
                  الصفحة / الدور
                </th>
                {ALL_ROLES.map(role => (
                  <th
                    key={role}
                    className={cn(
                      "px-2 py-2.5 border-b border-border/40 text-center min-w-[90px] cursor-pointer transition-colors",
                      hoveredRole === role ? "bg-primary/10" : ""
                    )}
                    onMouseEnter={() => setHoveredRole(role)}
                    onMouseLeave={() => setHoveredRole(null)}
                  >
                    {/* اسم الدور مع لونه المميز */}
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block leading-tight", ROLE_COLORS[role])}>
                      {role.split(" ").map((w, i) => <span key={i}>{w}<br /></span>)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* تكرار التصنيفات وعرض صفحاتها */}
              {categories.map(cat => {
                // الصفحات التي تنتمي لهذا التصنيف
                const catPages = DEFAULT_PAGE_PERMISSIONS.filter(p => p.category === cat);
                return (
                  <React.Fragment key={cat}>
                    {/* صف عنوان التصنيف */}
                    <tr>
                      <td
                        colSpan={ALL_ROLES.length + 1}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b border-border/20",
                          CATEGORY_COLORS[cat] || "bg-muted/30"
                        )}
                      >
                        {cat}
                      </td>
                    </tr>

                    {/* صفوف الصفحات لهذا التصنيف */}
                    {catPages.map(page => (
                      <tr
                        key={page.path}
                        className={cn(
                          "border-b border-border/20 transition-colors",
                          hoveredPage === page.path ? "bg-primary/5" : "hover:bg-muted/20"
                        )}
                        onMouseEnter={() => setHoveredPage(page.path)}
                        onMouseLeave={() => setHoveredPage(null)}
                      >
                        {/* اسم الصفحة والمسار */}
                        <td className="px-4 py-2 sticky left-0 bg-card z-10">
                          <div>
                            <p className="font-medium text-foreground">{page.labelAr}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{page.path}</p>
                          </div>
                        </td>

                        {/* خلايا الصلاحيات — قابلة للنقر في وضع التعديل */}
                        {ALL_ROLES.map(role => {
                          // التحقق إذا كان هذا الدور مسموحاً له بهذه الصفحة
                          const allowed = (permissions[page.path] || []).includes(role);
                          return (
                            <td
                              key={role}
                              className={cn(
                                "text-center py-2 transition-colors select-none",
                                // تمييز العمود عند التمرير
                                hoveredRole === role ? "bg-primary/10" : "",
                                hoveredRole === role && allowed  ? "bg-green-500/15" : "",
                                hoveredRole === role && !allowed ? "bg-red-500/5"    : "",
                                // مؤشر النقر في وضع التعديل
                                editMode ? "cursor-pointer" : "cursor-default"
                              )}
                              // النقر لتبديل الصلاحية
                              onClick={() => togglePermission(page.path, role)}
                              title={
                                editMode
                                  ? allowed
                                    ? `انقر لإزالة صلاحية "${role}" من "${page.labelAr}"`
                                    : `انقر لإضافة صلاحية "${role}" إلى "${page.labelAr}"`
                                  : ""
                              }
                            >
                              {allowed ? (
                                /* ✓ مسموح — دائرة خضراء */
                                <div className={cn(
                                  "inline-flex w-6 h-6 rounded-full bg-green-500/15 border border-green-500/40 items-center justify-center mx-auto transition-all",
                                  editMode && "hover:scale-125 hover:bg-green-500/30"
                                )}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                              ) : (
                                /* ✗ غير مسموح — دائرة حمراء خافتة */
                                <div className={cn(
                                  "inline-flex w-6 h-6 rounded-full bg-red-500/5 border border-red-500/20 items-center justify-center mx-auto transition-all",
                                  editMode && "hover:scale-125 hover:bg-red-500/15"
                                )}>
                                  <X className="w-3 h-3 text-red-400/50" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── مفتاح الألوان في أسفل الصفحة ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
            <Check className="w-3 h-3 text-green-600" />
          </div>
          <span>مسموح — Allowed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-red-500/5 border border-red-500/20 flex items-center justify-center">
            <X className="w-3 h-3 text-red-400/50" />
          </div>
          <span>غير مسموح — Not Allowed</span>
        </div>
        {/* توضيح وضع التعديل */}
        {editMode && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px]">
            <Pencil className="w-2.5 h-2.5 mr-1" />
            وضع التعديل نشط — انقر على الخلايا للتعديل
          </Badge>
        )}
      </div>
    </div>
  );
}
