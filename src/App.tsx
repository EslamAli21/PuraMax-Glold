// ============================================================
// ملف التوجيه الرئيسي للتطبيق — App.tsx
// يحتوي على جميع مسارات الصفحات وطبقات الحماية
// ============================================================
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MockStateProvider } from "@/lib/mock-state";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { AppLayout } from "@/components/layout/AppLayout";

// ─── استيراد جميع صفحات التطبيق ─────────────────────────────────────────────
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import OrdersPage from "@/pages/orders";
import ScalePage from "@/pages/scale";
import MovementsPage from "@/pages/movements";
import AlertsPage from "@/pages/alerts";
import ModelsPage from "@/pages/models";
import MasterDataPage from "@/pages/master-data";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import DesignerPage from "@/pages/designer";
import PrintQueuePage from "@/pages/print-queue";
import WorkerPage from "@/pages/worker";
import NotFound from "@/pages/not-found";
import NewOrdersPage from "@/pages/new-orders";
import AuditLogPage from "@/pages/audit-log";
import CalculatorPage from "@/pages/calculator";
import DustCollectionPage from "@/pages/dust-collection";
import DustManagementPage from "@/pages/dust-management";
import RefineryReturnPage from "@/pages/refinery-return";
// ─── صفحات لوحة إدارة النظام ─────────────────────────────────────────────────
import AdminFactoriesPage from "@/pages/admin-factories";
import AdminRolesPage from "@/pages/admin-roles";

// ─── عميل React Query لإدارة الطلبات ──────────────────────────────────────────
const queryClient = new QueryClient();

// ─── حارس المصادقة: يعيد التوجيه إلى صفحة الدخول إذا لم يكن المستخدم مسجّلاً ──
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  return <AppLayout>{children}</AppLayout>;
}

// ─── مكوّن التوجيه الرئيسي ────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* ── صفحة الدخول (عامة) ──────────────────────────────────────────── */}
      <Route path="/login" component={LoginPage} />

      {/* ── صفحات التطبيق الرئيسية (تتطلب تسجيل الدخول) ─────────────────── */}
      <Route path="/dashboard"><AuthGuard><DashboardPage /></AuthGuard></Route>
      <Route path="/orders"><AuthGuard><OrdersPage /></AuthGuard></Route>
      <Route path="/new-orders"><AuthGuard><NewOrdersPage /></AuthGuard></Route>
      <Route path="/scale"><AuthGuard><ScalePage /></AuthGuard></Route>
      <Route path="/movements"><AuthGuard><MovementsPage /></AuthGuard></Route>
      <Route path="/dust-collection"><AuthGuard><DustCollectionPage /></AuthGuard></Route>
      <Route path="/dust-management"><AuthGuard><DustManagementPage /></AuthGuard></Route>
      <Route path="/refinery-return"><AuthGuard><RefineryReturnPage /></AuthGuard></Route>
      <Route path="/alerts"><AuthGuard><AlertsPage /></AuthGuard></Route>
      <Route path="/analytics"><AuthGuard><AnalyticsPage /></AuthGuard></Route>
      <Route path="/models"><AuthGuard><ModelsPage /></AuthGuard></Route>
      <Route path="/master-data"><AuthGuard><MasterDataPage /></AuthGuard></Route>
      <Route path="/settings"><AuthGuard><SettingsPage /></AuthGuard></Route>
      <Route path="/my-designs"><AuthGuard><DesignerPage /></AuthGuard></Route>
      <Route path="/print-queue"><AuthGuard><PrintQueuePage /></AuthGuard></Route>
      <Route path="/my-work"><AuthGuard><WorkerPage /></AuthGuard></Route>
      <Route path="/audit-log"><AuthGuard><AuditLogPage /></AuthGuard></Route>
      <Route path="/calculator"><AuthGuard><CalculatorPage /></AuthGuard></Route>

      {/* ── صفحات لوحة إدارة النظام (للمالك فقط) ────────────────────────── */}
      <Route path="/admin/factories"><AuthGuard><AdminFactoriesPage /></AuthGuard></Route>
      <Route path="/admin/roles"><AuthGuard><AdminRolesPage /></AuthGuard></Route>

      {/* ── إعادة التوجيه الافتراضية ──────────────────────────────────────── */}
      <Route path="/"><Redirect to="/dashboard" /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── المكوّن الجذر للتطبيق ────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <MockStateProvider>
          <EditModeProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </QueryClientProvider>
          </EditModeProvider>
        </MockStateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
