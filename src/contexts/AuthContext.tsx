// ============================================================
// سياق المصادقة — AuthContext
// يتولى هذا الملف إدارة تسجيل الدخول، والتحقق من المصنع والمستخدم
// يدعم الآن تسجيل الدخول بشاشة واحدة فقط (اسم المستخدم + كلمة المرور)
// بدون الحاجة لاختيار المصنع — يتم التعرف على المصنع تلقائياً
// ============================================================
import React, { createContext, useContext, useState } from "react";
import { Role } from "@/lib/mock-data";

// ─── أنواع البيانات ──────────────────────────────────────────────────────────

// بيانات حساب المصنع (اسم + كلمة مرور)
interface FactoryAccount {
  name: string;
  password: string;
}

// بيانات حساب المستخدم داخل المصنع مع حقل المصنع الذي ينتمي إليه
interface UserAccount {
  username: string;
  password: string;
  role: Role;
  displayName: string;
  factoryName: string; // اسم المصنع الذي ينتمي إليه المستخدم
}

// ─── البيانات الافتراضية للمصانع (تُستخدم إذا لم يوجد في localStorage) ───────
const DEFAULT_FACTORIES: FactoryAccount[] = [
  { name: "PuraMax",           password: "puramax123"  },
  { name: "Al-Rashid Factory", password: "alrashid123" },
  { name: "Golden Star",       password: "golden123"   },
];

// ─── المستخدمون الافتراضيون لكل مصنع ────────────────────────────────────────
const DEFAULT_USERS: Record<string, UserAccount[]> = {
  "PuraMax": [
    { username: "admin",    password: "admin123",   role: "Owner",             displayName: "Admin",    factoryName: "PuraMax" },
    { username: "manager",  password: "manager123", role: "Production Manager", displayName: "Manager",  factoryName: "PuraMax" },
    { username: "designer", password: "design123",  role: "Designer",           displayName: "Designer", factoryName: "PuraMax" },
    { username: "scale",    password: "scale123",   role: "Scale Operator",     displayName: "Scale Op.",factoryName: "PuraMax" },
    { username: "worker",   password: "work123",    role: "Worker",             displayName: "Worker",   factoryName: "PuraMax" },
    { username: "tree",     password: "tree123",    role: "Tree Responsible",   displayName: "Tree Op.", factoryName: "PuraMax" },
    { username: "printer",  password: "print123",   role: "3D Printer",         displayName: "Printer",  factoryName: "PuraMax" },
    { username: "section",  password: "section123", role: "Section Manager",    displayName: "Sec. Mgr", factoryName: "PuraMax" },
  ],
  "Al-Rashid Factory": [
    { username: "admin",   password: "admin123",   role: "Owner",             displayName: "Admin",   factoryName: "Al-Rashid Factory" },
    { username: "manager", password: "manager123", role: "Production Manager", displayName: "Manager", factoryName: "Al-Rashid Factory" },
    { username: "worker",  password: "work123",    role: "Worker",             displayName: "Worker",  factoryName: "Al-Rashid Factory" },
  ],
  "Golden Star": [
    { username: "admin",   password: "admin123",   role: "Owner",             displayName: "Admin",   factoryName: "Golden Star" },
    { username: "manager", password: "manager123", role: "Production Manager", displayName: "Manager", factoryName: "Golden Star" },
  ],
};

// ─── تحميل المصانع من localStorage أو استخدام القيم الافتراضية ──────────────
function getFactories(): FactoryAccount[] {
  try {
    const saved = localStorage.getItem("gf_admin_factories");
    if (saved) {
      // تحويل سجلات الإدارة إلى قائمة مبسطة
      const records: { id: string; name: string; password: string }[] = JSON.parse(saved);
      return records.map(r => ({ name: r.name, password: r.password }));
    }
  } catch {}
  return DEFAULT_FACTORIES;
}

// ─── تحميل جميع المستخدمين من كل المصانع في قائمة مسطحة واحدة ───────────────
// هذا يُمكّن البحث عن المستخدم عبر جميع المصانع دفعة واحدة
function getAllUsers(): UserAccount[] {
  try {
    const savedFactories = localStorage.getItem("gf_admin_factories");
    const savedUsers     = localStorage.getItem("gf_admin_users");
    if (savedFactories && savedUsers) {
      // تحليل بيانات المصانع المحفوظة
      const factoryRecords: { id: string; name: string }[] = JSON.parse(savedFactories);
      // تحليل بيانات المستخدمين المحفوظة
      const userRecords: {
        id: string; factoryId: string; username: string;
        password: string; role: Role; displayName: string;
      }[] = JSON.parse(savedUsers);
      // بناء قائمة موحدة لجميع المستخدمين مع اسم المصنع الخاص بكل منهم
      const users: UserAccount[] = [];
      factoryRecords.forEach(f => {
        userRecords
          .filter(u => u.factoryId === f.id)
          .forEach(u => {
            users.push({
              username:    u.username,
              password:    u.password,
              role:        u.role,
              displayName: u.displayName,
              factoryName: f.name,
            });
          });
      });
      return users;
    }
  } catch {}
  // تجميع جميع المستخدمين الافتراضيين في قائمة واحدة مسطحة
  const allDefault: UserAccount[] = [];
  Object.values(DEFAULT_USERS).forEach(list => {
    list.forEach(u => allDefault.push(u));
  });
  return allDefault;
}

// ─── نوع حالة المصادقة ───────────────────────────────────────────────────────
interface AuthState {
  currentRole:     Role | null;
  factoryName:     string | null;
  username:        string | null;
  displayName:     string | null;
  isAuthenticated: boolean;
}

// ─── نوع سياق المصادقة ───────────────────────────────────────────────────────
interface AuthContextType extends AuthState {
  // تسجيل دخول بعد التحقق من البيانات
  login: (role: Role, factoryName: string, username: string, displayName: string) => void;
  // تسجيل خروج وحذف بيانات الجلسة
  logout: () => void;
  // التحقق من بيانات المصنع (يُستخدم في إدارة المصانع)
  verifyFactory: (name: string, password: string) => boolean;
  // الدالة الرئيسية للتسجيل الموحّد: تبحث عن المستخدم عبر جميع المصانع تلقائياً
  loginWithCredentials: (username: string, password: string) => UserAccount | null;
  // الحصول على أسماء المصانع
  getFactoryNames: () => string[];
}

// ─── إنشاء سياق المصادقة ─────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── مزوّد سياق المصادقة ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // استعادة حالة تسجيل الدخول من localStorage عند تحميل التطبيق
  const [state, setState] = useState<AuthState>(() => {
    const role        = localStorage.getItem("gf_role") as Role | null;
    const factory     = localStorage.getItem("gf_factory");
    const username    = localStorage.getItem("gf_username");
    const displayName = localStorage.getItem("gf_display");
    return {
      currentRole:     role,
      factoryName:     factory,
      username,
      displayName,
      isAuthenticated: !!(role && factory),
    };
  });

  // ── التحقق من بيانات المصنع (للمقارنة في إدارة المصانع) ─────────────────
  const verifyFactory = (name: string, password: string): boolean => {
    const factories = getFactories();
    return factories.some(
      f => f.name.toLowerCase() === name.toLowerCase() && f.password === password
    );
  };

  // ── الدالة الجديدة: البحث عن المستخدم عبر جميع المصانع تلقائياً ──────────
  // تسمح للمستخدم بتسجيل الدخول بكلمة مرور واسم مستخدم فقط دون اختيار المصنع
  // يتم إرجاع بيانات المستخدم كاملةً بما فيها اسم المصنع المكتشف تلقائياً
  const loginWithCredentials = (username: string, password: string): UserAccount | null => {
    const allUsers = getAllUsers();
    return (
      allUsers.find(
        u =>
          u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password
      ) || null
    );
  };

  // ── الحصول على قائمة أسماء المصانع ───────────────────────────────────────
  const getFactoryNames = (): string[] => {
    return getFactories().map(f => f.name);
  };

  // ── تسجيل الدخول وحفظ البيانات في localStorage ────────────────────────────
  const login = (role: Role, factoryName: string, username: string, displayName: string) => {
    // حفظ بيانات الجلسة لاستمرارية الدخول عند إعادة تحميل الصفحة
    localStorage.setItem("gf_role",     role);
    localStorage.setItem("gf_factory",  factoryName);
    localStorage.setItem("gf_username", username);
    localStorage.setItem("gf_display",  displayName);
    // تحديث حالة React
    setState({ currentRole: role, factoryName, username, displayName, isAuthenticated: true });
  };

  // ── تسجيل الخروج ──────────────────────────────────────────────────────────
  const logout = () => {
    // حذف جميع بيانات الجلسة من localStorage
    localStorage.removeItem("gf_role");
    localStorage.removeItem("gf_factory");
    localStorage.removeItem("gf_username");
    localStorage.removeItem("gf_display");
    // إعادة الحالة إلى الوضع الابتدائي
    setState({ currentRole: null, factoryName: null, username: null, displayName: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, verifyFactory, loginWithCredentials, getFactoryNames }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── خطاف useAuth للوصول لسياق المصادقة من أي مكوّن ──────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
