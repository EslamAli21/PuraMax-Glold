// ============================================================
// صفحة إدارة المصانع والمستخدمين — Admin Factories Page
// تتيح هذه الصفحة للمالك إدارة المصانع وحسابات المستخدمين
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

// ─── دالة تحميل بيانات المصانع من localStorage ─────────────────────────────
function loadFactories(): FactoryRecord[] {
  try {
    const saved = localStorage.getItem("gf_admin_factories");
    if (saved) return JSON.parse(saved);
  } catch {}
  // البيانات الافتراضية الأولية
  return [
    { id: "f1", name: "PuraMax",          password: "puramax123" },
    { id: "f2", name: "Al-Rashid Factory", password: "alrashid123" },
    { id: "f3", name: "Golden Star",       password: "golden123" },
  ];
}

// ─── دالة تحميل بيانات المستخدمين من localStorage ─────────────────────────
function loadUsers(): UserRecord[] {
  try {
    const saved = localStorage.getItem("gf_admin_users");
    if (saved) return JSON.parse(saved);
  } catch {}
  // المستخدمون الافتراضيون الأوليون
  return [
    { id: "u1",  factoryId: "f1", username: "admin",   password: "admin123",   role: "Owner",              displayName: "Admin" },
    { id: "u2",  factoryId: "f1", username: "manager",  password: "manager123", role: "Production Manager",  displayName: "Manager" },
    { id: "u3",  factoryId: "f1", username: "designer", password: "design123",  role: "Designer",            displayName: "Designer" },
    { id: "u4",  factoryId: "f1", username: "scale",    password: "scale123",   role: "Scale Operator",      displayName: "Scale Op." },
    { id: "u5",  factoryId: "f1", username: "worker",   password: "work123",    role: "Worker",              displayName: "Worker" },
    { id: "u6",  factoryId: "f1", username: "tree",     password: "tree123",    role: "Tree Responsible",    displayName: "Tree Op." },
    { id: "u7",  factoryId: "f1", username: "printer",  password: "print123",   role: "3D Printer",          displayName: "Printer" },
    { id: "u8",  factoryId: "f1", username: "section",  password: "section123", role: "Section Manager",     displayName: "Sec. Mgr" },
    { id: "u9",  factoryId: "f2", username: "admin",    password: "admin123",   role: "Owner",              displayName: "Admin" },
    { id: "u10", factoryId: "f2", username: "manager",  password: "manager123", role: "Production Manager",  displayName: "Manager" },
    { id: "u11", factoryId: "f2", username: "worker",   password: "work123",    role: "Worker",              displayName: "Worker" },
    { id: "u12", factoryId: "f3", username: "admin",    password: "admin123",   role: "Owner",              displayName: "Admin" },
    { id: "u13", factoryId: "f3", username: "manager",  password: "manager123", role: "Production Manager",  displayName: "Manager" },
  ];
}

// ─── دالة حفظ البيانات في localStorage ────────────────────────────────────────
function saveFactories(factories: FactoryRecord[]) {
  localStorage.setItem("gf_admin_factories", JSON.stringify(factories));
}
function saveUsers(users: UserRecord[]) {
  localStorage.setItem("gf_admin_users", JSON.stringify(users));
}

// ─── المكوّن الرئيسي لصفحة إدارة المصانع ─────────────────────────────────────
export default function AdminFactoriesPage() {
  const { currentRole } = useAuth();
  const { toast } = useToast();

  // حالة البيانات
  const [factories, setFactories] = useState<FactoryRecord[]>(loadFactories);
  const [users, setUsers] = useState<UserRecord[]>(loadUsers);

  // حالة التبويب النشط
  const [activeTab, setActiveTab] = useState("factories");

  // حالة نافذة إضافة/تعديل المصنع
  const [factoryDialog, setFactoryDialog] = useState(false);
  const [editingFactory, setEditingFactory] = useState<FactoryRecord | null>(null);
  const [fName, setFName] = useState("");
  const [fPass, setFPass] = useState("");
  const [showFPass, setShowFPass] = useState(false);

  // حالة نافذة إضافة/تعديل المستخدم
  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [uFactory, setUFactory] = useState("");
  const [uUsername, setUUsername] = useState("");
  const [uPass, setUPass] = useState("");
  const [uRole, setURole] = useState<Role>("Worker");
  const [uDisplay, setUDisplay] = useState("");
  const [showUPass, setShowUPass] = useState(false);

  // حالة حوار حذف العنصر
  const [deleteTarget, setDeleteTarget] = useState<{ type: "factory" | "user"; id: string } | null>(null);

  // حالة المصنع المحدد في لوحة المستخدمين
  const [selectedFactoryFilter, setSelectedFactoryFilter] = useState<string>("all");

  // ── حفظ بيانات المصانع ────────────────────────────────────────────────────
  const persistFactories = (data: FactoryRecord[]) => {
    setFactories(data);
    saveFactories(data);
  };
  const persistUsers = (data: UserRecord[]) => {
    setUsers(data);
    saveUsers(data);
  };

  // ── فتح نافذة إضافة مصنع جديد ─────────────────────────────────────────────
  const openAddFactory = () => {
    setEditingFactory(null);
    setFName(""); setFPass("");
    setFactoryDialog(true);
  };

  // ── فتح نافذة تعديل مصنع ────────────────────────────────────────────────────
  const openEditFactory = (f: FactoryRecord) => {
    setEditingFactory(f);
    setFName(f.name); setFPass(f.password);
    setFactoryDialog(true);
  };

  // ── حفظ المصنع (إضافة أو تعديل) ────────────────────────────────────────────
  const saveFactory = () => {
    if (!fName.trim() || !fPass.trim()) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" }); return;
    }
    if (editingFactory) {
      // تعديل مصنع موجود
      persistFactories(factories.map(f => f.id === editingFactory.id ? { ...f, name: fName.trim(), password: fPass.trim() } : f));
      toast({ title: "تم تحديث المصنع بنجاح ✓" });
    } else {
      // إضافة مصنع جديد
      const newF: FactoryRecord = { id: `f${Date.now()}`, name: fName.trim(), password: fPass.trim() };
      persistFactories([...factories, newF]);
      toast({ title: "تم إضافة المصنع بنجاح ✓" });
    }
    setFactoryDialog(false);
  };

  // ── حذف المصنع ──────────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "factory") {
      // حذف المصنع وجميع مستخدميه
      persistFactories(factories.filter(f => f.id !== deleteTarget.id));
      persistUsers(users.filter(u => u.factoryId !== deleteTarget.id));
      toast({ title: "تم حذف المصنع والمستخدمين المرتبطين به" });
    } else {
      // حذف مستخدم واحد
      persistUsers(users.filter(u => u.id !== deleteTarget.id));
      toast({ title: "تم حذف المستخدم بنجاح" });
    }
    setDeleteTarget(null);
  };

  // ── فتح نافذة إضافة مستخدم ──────────────────────────────────────────────────
  const openAddUser = () => {
    setEditingUser(null);
    setUFactory(factories[0]?.id || ""); setUUsername(""); setUPass("");
    setURole("Worker"); setUDisplay("");
    setUserDialog(true);
  };

  // ── فتح نافذة تعديل مستخدم ──────────────────────────────────────────────────
  const openEditUser = (u: UserRecord) => {
    setEditingUser(u);
    setUFactory(u.factoryId); setUUsername(u.username); setUPass(u.password);
    setURole(u.role); setUDisplay(u.displayName);
    setUserDialog(true);
  };

  // ── حفظ المستخدم (إضافة أو تعديل) ──────────────────────────────────────────
  const saveUser = () => {
    if (!uUsername.trim() || !uPass.trim() || !uDisplay.trim() || !uFactory) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" }); return;
    }
    if (editingUser) {
      persistUsers(users.map(u => u.id === editingUser.id
        ? { ...u, factoryId: uFactory, username: uUsername.trim(), password: uPass.trim(), role: uRole, displayName: uDisplay.trim() }
        : u));
      toast({ title: "تم تحديث المستخدم بنجاح ✓" });
    } else {
      const newU: UserRecord = {
        id: `u${Date.now()}`, factoryId: uFactory, username: uUsername.trim(),
        password: uPass.trim(), role: uRole, displayName: uDisplay.trim(),
      };
      persistUsers([...users, newU]);
      toast({ title: "تم إضافة المستخدم بنجاح ✓" });
    }
    setUserDialog(false);
  };

  // ── تصفية المستخدمين حسب المصنع المحدد ──────────────────────────────────────
  const filteredUsers = selectedFactoryFilter === "all"
    ? users
    : users.filter(u => u.factoryId === selectedFactoryFilter);

  // ── ألوان الأدوار لعرض الشارات ───────────────────────────────────────────────
  const roleColor: Record<string, string> = {
    "Owner": "bg-amber-500/15 text-amber-600 border-amber-500/30",
    "Production Manager": "bg-blue-500/15 text-blue-600 border-blue-500/30",
    "Designer": "bg-purple-500/15 text-purple-600 border-purple-500/30",
    "3D Printer": "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
    "Tree Responsible": "bg-green-500/15 text-green-600 border-green-500/30",
    "Scale Operator": "bg-orange-500/15 text-orange-600 border-orange-500/30",
    "Section Manager": "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    "Worker": "bg-gray-500/15 text-gray-600 border-gray-500/30",
  };

  // ── التحقق من صلاحية الوصول ───────────────────────────────────────────────────
  if (currentRole !== "Owner") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <ShieldCheck className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">هذه الصفحة متاحة للمالك فقط</p>
        <p className="text-xs opacity-60">Only Owner can access admin management</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {/* ── عنوان الصفحة ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Factory className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none">إدارة المصانع والمستخدمين</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Factory & User Account Management</p>
        </div>
      </div>

      {/* ── بطاقات الإحصاءات السريعة ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{factories.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">مصنع مسجّل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">مستخدم إجمالي</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u=>u.role==="Owner").length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ملّاك</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{ALL_ROLES.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">دور وظيفي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── تبويبات الإدارة ────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="factories" className="gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" /> المصانع ({factories.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" /> المستخدمون ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* ── تبويب المصانع ──────────────────────────────────────────────────── */}
        <TabsContent value="factories" className="mt-3">
          <Card className="border-border/50">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> قائمة المصانع
              </CardTitle>
              <Button size="sm" className="h-7 text-xs gap-1.5" onClick={openAddFactory}>
                <Plus className="w-3.5 h-3.5" /> إضافة مصنع
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] py-2 w-10">#</TableHead>
                    <TableHead className="text-[11px] py-2">اسم المصنع</TableHead>
                    <TableHead className="text-[11px] py-2">كلمة المرور</TableHead>
                    <TableHead className="text-[11px] py-2 text-center">عدد المستخدمين</TableHead>
                    <TableHead className="text-[11px] py-2 w-24">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factories.map((f, idx) => {
                    const count = users.filter(u => u.factoryId === f.id).length;
                    return (
                      <TableRow key={f.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs py-2 text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-semibold">{f.name}</TableCell>
                        <TableCell className="text-xs py-2 font-mono text-muted-foreground">{'•'.repeat(f.password.length)}</TableCell>
                        <TableCell className="text-xs py-2 text-center">
                          <Badge variant="outline" className="text-[10px]">{count} مستخدم</Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditFactory(f)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "factory", id: f.id })}>
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

        {/* ── تبويب المستخدمين ───────────────────────────────────────────────── */}
        <TabsContent value="users" className="mt-3">
          <Card className="border-border/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> قائمة المستخدمين
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* فلتر حسب المصنع */}
                  <Select value={selectedFactoryFilter} onValueChange={setSelectedFactoryFilter}>
                    <SelectTrigger className="h-7 text-xs w-44">
                      <SelectValue placeholder="جميع المصانع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المصانع</SelectItem>
                      {factories.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={openAddUser}>
                    <UserPlus className="w-3.5 h-3.5" /> إضافة مستخدم
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] py-2 w-8">#</TableHead>
                    <TableHead className="text-[11px] py-2">الاسم</TableHead>
                    <TableHead className="text-[11px] py-2">اسم المستخدم</TableHead>
                    <TableHead className="text-[11px] py-2">المصنع</TableHead>
                    <TableHead className="text-[11px] py-2">الدور</TableHead>
                    <TableHead className="text-[11px] py-2">كلمة المرور</TableHead>
                    <TableHead className="text-[11px] py-2 w-20">إجراءات</TableHead>
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
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", roleColor[u.role] || "bg-muted text-foreground")}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-2 font-mono text-muted-foreground">{'•'.repeat(Math.min(u.password.length, 8))}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditUser(u)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "user", id: u.id })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">لا يوجد مستخدمون</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── نافذة إضافة / تعديل المصنع ──────────────────────────────────────── */}
      <Dialog open={factoryDialog} onOpenChange={setFactoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {editingFactory ? "تعديل المصنع" : "إضافة مصنع جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">اسم المصنع *</Label>
              <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="مثال: مصنع الذهب" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">كلمة المرور *</Label>
              <div className="relative">
                <Input type={showFPass ? "text" : "password"} value={fPass} onChange={e => setFPass(e.target.value)} placeholder="••••••••" className="h-9 text-sm pr-9 rtl:pr-3 rtl:pl-9" />
                <button type="button" onClick={() => setShowFPass(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground rtl:right-auto rtl:left-2.5">
                  {showFPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 h-9 text-sm" onClick={saveFactory}>حفظ</Button>
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setFactoryDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── نافذة إضافة / تعديل المستخدم ────────────────────────────────────── */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              {editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* المصنع */}
            <div className="space-y-1.5">
              <Label className="text-xs">المصنع *</Label>
              <Select value={uFactory} onValueChange={setUFactory}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {factories.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* الاسم الظاهر */}
            <div className="space-y-1.5">
              <Label className="text-xs">الاسم الظاهر *</Label>
              <Input value={uDisplay} onChange={e => setUDisplay(e.target.value)} placeholder="مثال: أحمد نصار" className="h-9 text-sm" />
            </div>
            {/* اسم المستخدم */}
            <div className="space-y-1.5">
              <Label className="text-xs">اسم المستخدم *</Label>
              <Input value={uUsername} onChange={e => setUUsername(e.target.value)} placeholder="مثال: ahmad.nassar" className="h-9 text-sm" />
            </div>
            {/* الدور الوظيفي */}
            <div className="space-y-1.5">
              <Label className="text-xs">الدور الوظيفي *</Label>
              <Select value={uRole} onValueChange={v => setURole(v as Role)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <Label className="text-xs">كلمة المرور *</Label>
              <div className="relative">
                <Input type={showUPass ? "text" : "password"} value={uPass} onChange={e => setUPass(e.target.value)} placeholder="••••••••" className="h-9 text-sm pr-9 rtl:pr-3 rtl:pl-9" />
                <button type="button" onClick={() => setShowUPass(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground rtl:right-auto rtl:left-2.5">
                  {showUPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 h-9 text-sm" onClick={saveUser}>حفظ</Button>
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setUserDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── حوار تأكيد الحذف ─────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "factory"
                ? "سيتم حذف المصنع وجميع مستخدميه المرتبطين. هذا الإجراء لا يمكن التراجع عنه."
                : "سيتم حذف هذا المستخدم نهائياً. هذا الإجراء لا يمكن التراجع عنه."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
