import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { Toaster } from "@/components/ui/toaster";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import { ThemeProvider } from "@/components/theme-provider";
  import { AuthProvider, useAuth } from "@/contexts/AuthContext";
  import { MockStateProvider } from "@/lib/mock-state";
  import { AppLayout } from "@/components/layout/AppLayout";

  // Pages — existing
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
  // Pages — new
  import NewOrdersPage from "@/pages/new-orders";
  import AuditLogPage from "@/pages/audit-log";
  import TreeBuildPage from "@/pages/tree-build";

  const queryClient = new QueryClient();

  function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }
    return <AppLayout>{children}</AppLayout>;
  }

  function Router() {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        
        <Route path="/dashboard">
          <AuthGuard><DashboardPage /></AuthGuard>
        </Route>
        <Route path="/orders">
          <AuthGuard><OrdersPage /></AuthGuard>
        </Route>
        <Route path="/new-orders">
          <AuthGuard><NewOrdersPage /></AuthGuard>
        </Route>
        <Route path="/scale">
          <AuthGuard><ScalePage /></AuthGuard>
        </Route>
        <Route path="/movements">
          <AuthGuard><MovementsPage /></AuthGuard>
        </Route>
        <Route path="/alerts">
          <AuthGuard><AlertsPage /></AuthGuard>
        </Route>
        <Route path="/analytics">
          <AuthGuard><AnalyticsPage /></AuthGuard>
        </Route>
        <Route path="/models">
          <AuthGuard><ModelsPage /></AuthGuard>
        </Route>
        <Route path="/master-data">
          <AuthGuard><MasterDataPage /></AuthGuard>
        </Route>
        <Route path="/settings">
          <AuthGuard><SettingsPage /></AuthGuard>
        </Route>
        <Route path="/my-designs">
          <AuthGuard><DesignerPage /></AuthGuard>
        </Route>
        <Route path="/print-queue">
          <AuthGuard><PrintQueuePage /></AuthGuard>
        </Route>
        <Route path="/my-work">
          <AuthGuard><WorkerPage /></AuthGuard>
        </Route>
        <Route path="/audit-log">
          <AuthGuard><AuditLogPage /></AuthGuard>
        </Route>
        <Route path="/tree-build">
          <AuthGuard><TreeBuildPage /></AuthGuard>
        </Route>
        
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    );
  }

  function App() {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <MockStateProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </QueryClientProvider>
          </MockStateProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  }

  export default App;
  