// ============================================================
// صفحة إدارة المصانع والمستخدمين — Admin Factories Page
// جميع النصوص تستخدم useTranslation لدعم تعدد اللغات بالكامل
// تتيح للمالك: إضافة/تعديل/حذف المصانع وحسابات المستخدمين
// البيانات محفوظة في localStorage للاستمرارية
// ============================================================
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role, ALL_ROLES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Building2, Users, Plus, Pencil, Trash2, Key, ShieldCheck, Eye, EyeOff, UserPlus, Factory } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── نوع بيانات المصنع ────────────────────────────────────────────────────────
interface FactoryRecord {
  id: string;
  name: string;
  password: string;
}

// ─── نوع بيانات المستخدم ───────────────────────────────────────────────────────
interface UserRecord {
  id: string;
  factoryId: string;
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

// ─── تحميل بيانات المصانع من localStorage ─────────────────────────────────────
function loadFactories(): FactoryRecord[] {
  try {
    const saved = localStorage.getItem("gf_admin_factories");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    { id: "f1", name: "PuraMax",          password: "puramax123" },
    { id: "f2", name: "Al-Rashid Factory", password: "alrashid123" },
    { id: "f3", name: "Golden Star",       password: "golden123" },
    { id: "f4", name: "eslam",             password: "eslam123" },
  ];
}

// ─── تحميل بيانات المستخدمين من localStorage ──────────────────────────────────
function loadUsers(): UserRecord[] {
  try {
    const saved = localStorage.getItem("gf_admin_users");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    { id: "u1",  factoryId: "f1", username: "admin",    password: "admin123",    role: "Owner",             displayName: "Admin" },
    { id: "u2",  factoryId: "f1", username: "manager",  password: "manager123",  role: "Production Manager", displayName: "Manager" },
    { id: "u3",  factoryId: "f1", username: "designer", password: "design123",   role: "Designer",           displayName: "Designer" },
    { id: "u4",  factoryId: "f1", username: "scale",    password: "scale123",    role: "Scale Operator",     displayName: "Scale Op." },
    { id: "u5",  factoryId: "f1", username: "worker",   password: "work123",     role: "Worker",             displayName: "Worker" },
    { id: "u6",  factoryId: "f1", username: "tree",     password: "tree123",     role: "Tree Responsible",   displayName: "Tree Op." },
    { id: "u7",  factoryId: "f1", username: "printer",  password: "print123",    role: "3D Printer",         displayName: "Printer" },
    { id: "u8",  factoryId: "f1", username: "section",  password: "section123",  role: "Section Manager",    displayName: "Sec. Mgr" },
    { id: "u9",  factoryId: "f2", username: "admin",    password: "admin123",    role: "Owner",             displayName: "Admin" },
    { id: "u10", factoryId: "f2", username: "manager",  password: "manager123",  role: "Production Manager", displayName: "Manager" },
    { id: "u11", factoryId: "f2", username: "worker",   password: "work123",     role: "Worker",             displayName: "Worker" },
    { id: "u12", factoryId: "f3", username: "admin",    password: "admin123",    role: "Owner",             displayName: "Admin" },
    { id: "u13", factoryId: "f3", username: "manager",  password: "manager123",  role: "Production Manager", displayName: "Manager" },
    { id: "u14", factoryId: "f4", username: "admin",    password: "eslam123",    role: "Owner",             displayName: "Admin" },
  ];
}

// ─── حفظ البيانات في localStorage ─────────────────────────────────────────────
function saveFactories(factories: FactoryRecord[]) {
  localStorage.setItem("gf_admin_factories", JSON.stringify(factories));
}
function saveUsers(users: UserRecord[]) {
  localStorage.setItem("gf_admin_users", JSON.stringify(users));
}

// ─── ألوان الأدوار ─────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  "Owner":              "bg-amber-500/15 text-amber-600 border-amber-500/30",
  "Production Manager": "bg-blue-500/15 text-blue-600 border-blue-500/30",
  "Designer":           "bg-purple-500/15 text-purple-600 border-purple-500/30",
  "3D Printer":         "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  "Tree Responsible":   "bg-green-500/15 text-green-600 border-green-500/30",
  "Scale Operator":     "bg-orange-500/15 text-orange-600 border-orange-500/30",
  "Section Manager":    "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  "Worker":             "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

// ─── المكوّن الرئيسي ───────────────────────────────────────────────────────────
export default function AdminFactoriesPage() {
  const { currentRole }   = useAuth();
  const { toast }         = useToast();
  // استخدام الترجمة — كل النصوص تمر عبر t() لدعم اللغتين
  const { t }             = useTranslation();

  // ─── حالة البيانات ────────────────────────────────────────────────────────
  const [factories, setFactories] = useState<FactoryRecord[]>(loadFactories);
  const [users,     setUsers]     = useState<UserRecord[]>(loadUsers);

  // ─── التبويب النشط (مصانع / مستخدمون) ────────────────────────────────────
  const [activeTab, setActiveTab] = useState("factories");

  // ─── نافذة إضافة/تعديل المصنع ────────────────────────────────────────────
  const [factoryDialog,    setFactoryDialog]    = useState(false);
  const [editingFactory,   setEditingFactory]   = useState<FactoryRecord | null>(null);
  const [fName,            setFName]            = useState("");
  const [fPass,            setFPass]            = useState("");
  const [showFPass,        setShowFPass]        = useState(false);

  // ─── نافذة إضافة/تعديل المستخدم ─────────────────────────────────────────
  const [userDialog,       setUserDialog]       = useState(false);
  const [editingUser,      setEditingUser]      = useState<UserRecord | null>(null);
  const [uFactory,         setUFactory]         = useState("");
  const [uUsername,        setUUsername]        = useState("");
  const [uPass,            setUPass]            = useState("");
  const [uRole,            setURole]            = useState<Role>("Worker");
  const [uDisplay,         setUDisplay]         = useState("");
  const [showUPass,        setShowUPass]        = useState(false);

  // ─── نافذة تأكيد الحذف ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ type: "factory" | "user"; id: string } | null>(null);

  // ─── فلتر المستخدمين حسب المصنع ──────────────────────────────────────────
  const [selectedFactoryFilter, setSelectedFactoryFilter] = useState<string>("all");

  // ─── دوال المزامنة مع localStorage ───────────────────────────────────────
  const persistFactories = (data: FactoryRecord[]) => { setFactories(data); saveFactories(data); };
  const persistUsers     = (data: UserRecord[])    => { setUsers(data);     saveUsers(data);     };

  // ─── التحقق من صلاحية الوصول: المالك فقط ────────────────────────────────
  if (currentRole !== "Owner") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <ShieldCheck className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">{t("admin.factories.ownerOnly")}</p>
      </div>
    );
  }

  // ─── منطق المصانع ─────────────────────────────────────────────────────────
  const openAddFactory = () => {
    setEditingFactory(null); setFName(""); setFPass(""); setFactoryDialog(true);
  };
  const openEditFactory = (f: FactoryRecord) => {
    setEditingFactory(f); setFName(f.name); setFPass(f.password); setFactoryDialog(true);
  };
  const saveFactory = () => {
    if (!fName.trim() || !fPass.trim()) {
      toast({ title: t("admin.factories.fillAll"), variant: "destructive" }); return;
    }
    if (editingFactory) {
      persistFactories(factories.map(f => f.id === editingFactory.id
        ? { ...f, name: fName.trim(), password: fPass.trim() } : f));
      toast({ title: t("admin.factories.factoryUpdated") });
    } else {
      persistFactories([...factories, { id: `f${Date.now()}`, name: fName.trim(), password: fPass.trim() }]);
      toast({ title: t("admin.factories.factoryAdded") });
    }
    setFactoryDialog(false);
  };

  // ─── منطق المستخدمين ──────────────────────────────────────────────────────
  const openAddUser = () => {
    setEditingUser(null);
    setUFactory(factories[0]?.id || ""); setUUsername(""); setUPass("");
    setURole("Worker"); setUDisplay(""); setUserDialog(true);
  };
  const openEditUser = (u: UserRecord) => {
    setEditingUser(u);
    setUFactory(u.factoryId); setUUsername(u.username); setUPass(u.password);
    setURole(u.role); setUDisplay(u.displayName); setUserDialog(true);
  };
  const saveUser = () => {
    if (!uUsername.trim() || !uPass.trim() || !uDisplay.trim() || !uFactory) {
      toast({ title: t("admin.factories.fillAll"), variant: "destructive" }); return;
    }
    if (editingUser) {
      persistUsers(users.map(u => u.id === editingUser.id
        ? { ...u, factoryId: uFactory, username: uUsername.trim(), password: uPass.trim(), role: uRole, displayName: uDisplay.trim() }
        : u));
      toast({ title: t("admin.factories.userUpdated") });
    } else {
      persistUsers([...users, {
        id: `u${Date.now()}`, factoryId: uFactory, username: uUsername.trim(),
        password: uPass.trim(), role: uRole, displayName: uDisplay.trim(),
      }]);
      toast({ title: t("admin.factories.userAdded") });
    }
    setUserDialog(false);
  };

  // ─── منطق الحذف ───────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "factory") {
      persistFactories(factories.filter(f => f.id !== deleteTarget.id));
      persistUsers(users.filter(u => u.factoryId !== deleteTarget.id));
    } else {
      persistUsers(users.filter(u => u.id !== deleteTarget.id));
    }
    toast({ title: t("admin.factories.deleted") });
    setDeleteTarget(null);
  };

  // ─── المستخدمون المصفّون حسب المصنع المختار ──────────────────────────────
  const filteredUsers = selectedFactoryFilter === "all"
    ? users
    : users.filter(u => u.factoryId === selectedFactoryFilter);

  return (
    <div className="space-y-4 p-1">

      {/* ── عنوان الصفحة ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Factory className="w-5 h-5 text-primary" />
        </div>
        <div>
          {/* العنوان الرئيسي — مترجم */}
          <h1 className="text-lg font-bold leading-none">{t("admin.factories.pageTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("admin.factories.subtitle")}</p>
        </div>
      </div>

      {/* ── بطاقات الإحصاءات السريعة ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* عدد المصانع المسجّلة */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{factories.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("admin.factories.totalFactories")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* إجمالي المستخدمين */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("admin.factories.totalUsers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* عدد الملّاك */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === "Owner").length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("admin.factories.totalOwners")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* عدد أنواع الأدوار */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{ALL_ROLES.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("admin.factories.totalRoles")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── تبويبات الإدارة ─────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          {/* تبويب المصانع */}
          <TabsTrigger value="factories" className="gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" />
            {t("admin.factories.factoriesTab")} ({factories.length})
          </TabsTrigger>
          {/* تبويب المستخدمين */}
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            {t("admin.factories.usersTab")} ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* ── محتوى تبويب المصانع ───────────────────────────────────────────── */}
        <TabsContent value="factories" className="mt-3">
          <Card className="border-border/50">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {t("admin.factories.factoryList")}
              </CardTitle>
              {/* زر إضافة مصنع جديد */}
              <Button size="sm" className="h-7 text-xs gap-1.5" onClick={openAddFactory}>
                <Plus className="w-3.5 h-3.5" /> {t("admin.factories.addFactory")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] py-2 w-10">#</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.factoryName")}</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.password")}</TableHead>
                    <TableHead className="text-[11px] py-2 text-center">{t("admin.factories.userCount")}</TableHead>
                    <TableHead className="text-[11px] py-2 w-24">{t("admin.factories.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factories.map((f, idx) => {
                    const count = users.filter(u => u.factoryId === f.id).length;
                    return (
                      <TableRow key={f.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs py-2 text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-semibold">{f.name}</TableCell>
                        <TableCell className="text-xs py-2 font-mono text-muted-foreground">{"•".repeat(f.password.length)}</TableCell>
                        <TableCell className="text-xs py-2 text-center">
                          {/* شارة عدد المستخدمين */}
                          <Badge variant="outline" className="text-[10px]">
                            {count} {t("admin.factories.usersBadge")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditFactory(f)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ type: "factory", id: f.id })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── محتوى تبويب المستخدمين ────────────────────────────────────────── */}
        <TabsContent value="users" className="mt-3">
          <Card className="border-border/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  {t("admin.factories.userList")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* فلتر حسب المصنع — مترجم */}
                  <Select value={selectedFactoryFilter} onValueChange={setSelectedFactoryFilter}>
                    <SelectTrigger className="h-7 text-xs w-44">
                      <SelectValue placeholder={t("admin.factories.allFactories")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.factories.allFactories")}</SelectItem>
                      {factories.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* زر إضافة مستخدم */}
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={openAddUser}>
                    <UserPlus className="w-3.5 h-3.5" /> {t("admin.factories.addUser")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] py-2 w-8">#</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.displayName")}</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.username")}</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.factory")}</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.role")}</TableHead>
                    <TableHead className="text-[11px] py-2">{t("admin.factories.password")}</TableHead>
                    <TableHead className="text-[11px] py-2 w-20">{t("admin.factories.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u, idx) => {
                    const factory = factories.find(f => f.id === u.factoryId);
                    return (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs py-2 text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-medium">{u.displayName}</TableCell>
                        <TableCell className="text-xs py-2 font-mono">{u.username}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{factory?.name || "—"}</TableCell>
                        <TableCell className="py-2">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium",
                            ROLE_COLOR[u.role] || "bg-muted text-foreground")}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-2 font-mono text-muted-foreground">
                          {"•".repeat(Math.min(u.password.length, 8))}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditUser(u)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ type: "user", id: u.id })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                        {t("admin.factories.noUsers")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── نافذة إضافة / تعديل المصنع ───────────────────────────────────────── */}
      <Dialog open={factoryDialog} onOpenChange={setFactoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {editingFactory ? t("admin.factories.editFactory") : t("admin.factories.addFactory")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* حقل اسم المصنع */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.factoryName")} *</Label>
              <Input
                value={fName}
                onChange={e => setFName(e.target.value)}
                placeholder={t("admin.factories.factoryNamePlaceholder")}
                className="h-9 text-sm" />
            </div>
            {/* حقل كلمة المرور */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.password")} *</Label>
              <div className="relative">
                <Input
                  type={showFPass ? "text" : "password"}
                  value={fPass}
                  onChange={e => setFPass(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-sm pr-9 rtl:pr-3 rtl:pl-9" />
                <button type="button" onClick={() => setShowFPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground rtl:right-auto rtl:left-2.5">
                  {showFPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 h-9 text-sm" onClick={saveFactory}>{t("admin.factories.save")}</Button>
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setFactoryDialog(false)}>{t("admin.factories.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── نافذة إضافة / تعديل المستخدم ─────────────────────────────────────── */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              {editingUser ? t("admin.factories.editUser") : t("admin.factories.addUser")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* اختيار المصنع */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.factory")} *</Label>
              <Select value={uFactory} onValueChange={setUFactory}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {factories.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* الاسم الظاهر */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.displayName")} *</Label>
              <Input value={uDisplay} onChange={e => setUDisplay(e.target.value)}
                placeholder={t("admin.factories.displayNamePlaceholder")} className="h-9 text-sm" />
            </div>
            {/* اسم المستخدم */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.username")} *</Label>
              <Input value={uUsername} onChange={e => setUUsername(e.target.value)}
                placeholder={t("admin.factories.usernamePlaceholder")} className="h-9 text-sm" />
            </div>
            {/* الدور الوظيفي */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.role")} *</Label>
              <Select value={uRole} onValueChange={v => setURole(v as Role)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admin.factories.password")} *</Label>
              <div className="relative">
                <Input type={showUPass ? "text" : "password"} value={uPass}
                  onChange={e => setUPass(e.target.value)} placeholder="••••••••"
                  className="h-9 text-sm pr-9 rtl:pr-3 rtl:pl-9" />
                <button type="button" onClick={() => setShowUPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground rtl:right-auto rtl:left-2.5">
                  {showUPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 h-9 text-sm" onClick={saveUser}>{t("admin.factories.save")}</Button>
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setUserDialog(false)}>{t("admin.factories.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── نافذة تأكيد الحذف ─────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.factories.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "factory"
                ? t("admin.factories.deleteFactory")
                : t("admin.factories.deleteUser")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.factories.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {t("admin.factories.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
