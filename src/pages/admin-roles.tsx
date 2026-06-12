// ============================================================
// صفحة إدارة الأدوار والصلاحيات — Roles & Permissions Page
// جميع النصوص تستخدم useTranslation لدعم تعدد اللغات بالكامل
// يستطيع المالك النقر على خلايا المصفوفة لتفعيل/تعطيل الصلاحيات
// الصلاحيات تُحفظ في localStorage وتبقى بعد إعادة التحميل
// ============================================================
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role, ALL_ROLES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Check, X, Lock, Save, RotateCcw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// ─── تعريف بيانات الصفحة مع صلاحياتها ───────────────────────────────────────
interface PagePermission {
  page:       string;   // الاسم بالإنجليزية (يُستخدم للعرض في وضع EN)
  labelAr:    string;   // الاسم بالعربية (يُستخدم للعرض في وضع AR)
  path:       string;   // مسار الصفحة
  roles:      Role[];   // الأدوار الافتراضية المسموح لها
  categoryKey: string;  // مفتاح التصنيف — يُستخدم مع t() لترجمته
}

// ─── قائمة الصفحات والصلاحيات الافتراضية ────────────────────────────────────
const DEFAULT_PAGE_PERMISSIONS: PagePermission[] = [
  // ── عام ──
  { page: "Dashboard",         labelAr: "لوحة التحكم",        path: "/dashboard",       categoryKey: "cat_general",    roles: ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"] },
  { page: "Calculator",        labelAr: "الآلة الحاسبة",       path: "/calculator",      categoryKey: "cat_general",    roles: ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"] },
  // ── الطلبات ──
  { page: "Orders",            labelAr: "الطلبات",             path: "/orders",          categoryKey: "cat_orders",     roles: ["Owner","Production Manager","Section Manager"] },
  { page: "New Orders",        labelAr: "الطلبات الواردة",     path: "/new-orders",      categoryKey: "cat_orders",     roles: ["Owner","Production Manager"] },
  // ── الإنتاج ──
  { page: "Models",            labelAr: "الموديلات",           path: "/models",          categoryKey: "cat_production", roles: ["Owner","Production Manager"] },
  // ── الميزان ──
  { page: "Scale",             labelAr: "الميزان",             path: "/scale",           categoryKey: "cat_scale",      roles: ["Owner","Production Manager","Scale Operator","Tree Responsible"] },
  // ── إدارة الغبار ──
  { page: "Dust Collection",   labelAr: "تجميع الغبار",        path: "/dust-collection", categoryKey: "cat_dust",       roles: ["Owner","Production Manager","Scale Operator"] },
  { page: "Refinery Return",   labelAr: "إرجاع التكرير",       path: "/refinery-return", categoryKey: "cat_dust",       roles: ["Owner","Production Manager"] },
  // ── التتبع والتحليل ──
  { page: "Analytics",         labelAr: "التحليلات",           path: "/analytics",       categoryKey: "cat_tracking",   roles: ["Owner","Production Manager"] },
  { page: "Movements",         labelAr: "حركة البضائع",        path: "/movements",       categoryKey: "cat_tracking",   roles: ["Owner","Production Manager","Scale Operator","Section Manager"] },
  { page: "Alerts",            labelAr: "التنبيهات",           path: "/alerts",          categoryKey: "cat_tracking",   roles: ["Owner","Production Manager"] },
  { page: "Audit Log",         labelAr: "سجل التغييرات",       path: "/audit-log",       categoryKey: "cat_tracking",   roles: ["Owner","Production Manager"] },
  // ── مساحة العمل ──
  { page: "My Designs",        labelAr: "تصاميمي",             path: "/my-designs",      categoryKey: "cat_workspace",  roles: ["Designer"] },
  { page: "Print Queue",       labelAr: "قائمة الطباعة",       path: "/print-queue",     categoryKey: "cat_workspace",  roles: ["3D Printer"] },
  { page: "My Work",           labelAr: "عملي",                path: "/my-work",         categoryKey: "cat_workspace",  roles: ["Worker","Tree Responsible"] },
  // ── الإدارة ──
  { page: "Master Data",       labelAr: "البيانات الرئيسية",   path: "/master-data",     categoryKey: "cat_management", roles: ["Owner","Production Manager"] },
  { page: "Settings",          labelAr: "الإعدادات",           path: "/settings",        categoryKey: "cat_management", roles: ["Owner"] },
  // ── مشرف النظام ──
  { page: "Admin – Factories", labelAr: "إدارة المصانع",       path: "/admin/factories", categoryKey: "cat_system",     roles: ["Owner"] },
  { page: "Admin – Roles",     labelAr: "إدارة الأدوار",       path: "/admin/roles",     categoryKey: "cat_system",     roles: ["Owner"] },
];

// ─── مفتاح localStorage لحفظ الصلاحيات ──────────────────────────────────────
const STORAGE_KEY = "gf_permissions";

// ─── تحميل الصلاحيات من localStorage أو استخدام الافتراضية ─────────────────
function loadPermissions(): Record<string, Role[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const defaults: Record<string, Role[]> = {};
  DEFAULT_PAGE_PERMISSIONS.forEach(p => { defaults[p.path] = [...p.roles]; });
  return defaults;
}

// ─── ألوان الأدوار — كل دور له لون مميز ──────────────────────────────────────
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

// ─── ألوان التصنيفات — مفهرسة بـ categoryKey ─────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "cat_general":    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "cat_orders":     "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  "cat_production": "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  "cat_scale":      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "cat_dust":       "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  "cat_tracking":   "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  "cat_workspace":  "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
  "cat_management": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  "cat_system":     "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function AdminRolesPage() {
  const { currentRole } = useAuth();
  const { toast }       = useToast();
  // استخدام الترجمة لدعم كل اللغات
  const { t, i18n }     = useTranslation();
  const isAr            = i18n.language === "ar";

  // ─── حالة التمييز عند التمرير (hover) ────────────────────────────────────
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const [hoveredPage, setHoveredPage] = useState<string | null>(null);

  // ─── حالة الصلاحيات القابلة للتعديل ─────────────────────────────────────
  const [permissions, setPermissions] = useState<Record<string, Role[]>>(() => loadPermissions());

  // ─── وضع التعديل ─────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);

  // ─── مزامنة الصلاحيات مع localStorage عند كل تغيير ─────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  }, [permissions]);

  // ─── التحقق من الوصول: المالك فقط ───────────────────────────────────────
  if (currentRole !== "Owner") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Lock className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">{t("admin.roles.ownerOnly")}</p>
      </div>
    );
  }

  // ─── تبديل صلاحية دور على صفحة ──────────────────────────────────────────
  const togglePermission = (path: string, role: Role) => {
    if (!editMode) return;
    setPermissions(prev => {
      const current = prev[path] || [];
      const hasRole = current.includes(role);
      return { ...prev, [path]: hasRole ? current.filter(r => r !== role) : [...current, role] };
    });
  };

  // ─── حفظ الصلاحيات ───────────────────────────────────────────────────────
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    setEditMode(false);
    toast({ title: t("admin.roles.savedTitle"), description: t("admin.roles.savedDesc") });
  };

  // ─── إعادة تعيين الصلاحيات إلى القيم الافتراضية ─────────────────────────
  const handleReset = () => {
    const defaults: Record<string, Role[]> = {};
    DEFAULT_PAGE_PERMISSIONS.forEach(p => { defaults[p.path] = [...p.roles]; });
    setPermissions(defaults);
    setEditMode(false);
    toast({ title: t("admin.roles.resetTitle"), description: t("admin.roles.resetDesc") });
  };

  // ─── عدد الصفحات المسموح بها لكل دور ───────────────────────────────────
  const roleAccessCount = (role: Role) =>
    Object.values(permissions).filter(roles => roles.includes(role)).length;

  // ─── تجميع التصنيفات الفريدة بالترتيب ───────────────────────────────────
  const categoryKeys = Array.from(new Set(DEFAULT_PAGE_PERMISSIONS.map(p => p.categoryKey)));

  // ─── اسم الصفحة حسب اللغة ────────────────────────────────────────────────
  const pageLabel = (p: PagePermission) => isAr ? p.labelAr : p.page;

  return (
    <div className="space-y-4 p-1">

      {/* ── عنوان الصفحة وأزرار التحكم ─────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            {/* عنوان الصفحة الرئيسي — مترجم */}
            <h1 className="text-lg font-bold leading-none">{t("admin.roles.pageTitle")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t("admin.roles.subtitle")}</p>
          </div>
        </div>

        {/* أزرار التحكم — مترجمة */}
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              {/* زر الحفظ في وضع التعديل */}
              <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" />
                {t("admin.roles.saveChanges")}
              </Button>
              {/* زر إلغاء التعديل */}
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)} className="gap-1.5 text-xs">
                {t("admin.roles.cancel")}
              </Button>
            </>
          ) : (
            <>
              {/* زر الدخول لوضع التعديل */}
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1.5 text-xs">
                <Pencil className="w-3.5 h-3.5" />
                {t("admin.roles.editPermissions")}
              </Button>
              {/* زر إعادة التعيين للقيم الافتراضية */}
              <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                {t("admin.roles.resetDefault")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── شريط إعلام وضع التعديل — يظهر فقط عند تفعيل التعديل ───────────── */}
      {editMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <Pencil className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>{t("admin.roles.editModeActive")}</strong>{" — "}{t("admin.roles.editModeHint")}
          </span>
        </div>
      )}

      {/* ── بطاقات ملخص الصلاحيات لكل دور ─────────────────────────────────── */}
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
              {/* عدد الصلاحيات المتاحة */}
              <p className="text-lg font-bold">{roleAccessCount(role)}</p>
              <p className="text-[9px] font-semibold leading-tight mt-0.5 opacity-80">{role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── مصفوفة الصلاحيات ─────────────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            {/* عنوان المصفوفة — مترجم */}
            {t("admin.roles.matrixTitle")}
          </CardTitle>
          {/* تلميح التفاعل — يتغير بين وضع التعديل والعرض */}
          <p className="text-[11px] text-muted-foreground">
            {editMode ? t("admin.roles.matrixHintEdit") : t("admin.roles.matrixHintView")}
          </p>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            {/* رأس الجدول: أعمدة الأدوار */}
            <thead>
              <tr>
                {/* خلية الزاوية: عنوان الصفحة/الدور */}
                <th className="text-start px-4 py-2.5 font-semibold text-muted-foreground border-b border-border/40 min-w-[160px] sticky left-0 bg-card z-10">
                  {t("admin.roles.pageRoleHeader")}
                </th>
                {ALL_ROLES.map(role => (
                  <th
                    key={role}
                    className={cn(
                      "px-2 py-2.5 border-b border-border/40 text-center min-w-[88px] cursor-pointer transition-colors",
                      hoveredRole === role ? "bg-primary/10" : ""
                    )}
                    onMouseEnter={() => setHoveredRole(role)}
                    onMouseLeave={() => setHoveredRole(null)}
                  >
                    {/* اسم الدور بلونه المميز */}
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block leading-tight", ROLE_COLORS[role])}>
                      {role.split(" ").map((w, i) => <span key={i}>{w}<br /></span>)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* تكرار التصنيفات وصفحاتها */}
              {categoryKeys.map(catKey => {
                const catPages = DEFAULT_PAGE_PERMISSIONS.filter(p => p.categoryKey === catKey);
                return (
                  <React.Fragment key={catKey}>
                    {/* صف عنوان التصنيف — مترجم باستخدام t() */}
                    <tr>
                      <td
                        colSpan={ALL_ROLES.length + 1}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b border-border/20",
                          CATEGORY_COLORS[catKey] || "bg-muted/30"
                        )}
                      >
                        {t(`admin.roles.${catKey}`)}
                      </td>
                    </tr>

                    {/* صفوف الصفحات داخل التصنيف */}
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
                        {/* اسم الصفحة حسب اللغة + المسار */}
                        <td className="px-4 py-2 sticky left-0 bg-card z-10">
                          <div>
                            <p className="font-medium text-foreground">{pageLabel(page)}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{page.path}</p>
                          </div>
                        </td>

                        {/* خلايا الصلاحيات — قابلة للنقر في وضع التعديل */}
                        {ALL_ROLES.map(role => {
                          const allowed = (permissions[page.path] || []).includes(role);
                          return (
                            <td
                              key={role}
                              className={cn(
                                "text-center py-2 transition-colors select-none",
                                hoveredRole === role ? "bg-primary/10" : "",
                                hoveredRole === role && allowed  ? "bg-green-500/15" : "",
                                hoveredRole === role && !allowed ? "bg-red-500/5"    : "",
                                editMode ? "cursor-pointer" : "cursor-default"
                              )}
                              onClick={() => togglePermission(page.path, role)}
                              title={editMode ? `${allowed ? t("admin.roles.allowed") : t("admin.roles.notAllowed")} — ${pageLabel(page)} / ${role}` : ""}
                            >
                              {allowed ? (
                                /* مسموح — دائرة خضراء */
                                <div className={cn(
                                  "inline-flex w-6 h-6 rounded-full bg-green-500/15 border border-green-500/40 items-center justify-center mx-auto transition-all",
                                  editMode && "hover:scale-125 hover:bg-green-500/30"
                                )}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                              ) : (
                                /* غير مسموح — دائرة حمراء خافتة */
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

      {/* ── تذييل: مفتاح الأيقونات ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-green-600" />
          </div>
          <span>{t("admin.roles.allowed")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-red-500/5 border border-red-500/20 flex items-center justify-center">
            <X className="w-2.5 h-2.5 text-red-400/50" />
          </div>
          <span>{t("admin.roles.notAllowed")}</span>
        </div>
      </div>

    </div>
  );
}
