import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/admin/dashboard";
import CompletePage from "@/pages/complete";
import TerminatePage from "@/pages/terminate";
import QuotaFullPage from "@/pages/quotafull";
import SecurityTerminatePage from "@/pages/security-terminate";
import DuplicateIpPage from "@/pages/duplicate-ip";
import DuplicateStringPage from "@/pages/duplicate-string";
import LandingPage from "@/pages/LandingPage";
import PrescreenerPage from "@/pages/prescreener";
import MockSurvey from "@/pages/MockSurvey";
import RedirectDebugger from "@/pages/RedirectDebugger";
import ProjectFormPage from "@/pages/admin/project-form";
import ProjectsPage from "@/pages/admin/projects";
import ResponsesPage from "@/pages/admin/responses";
import ClientsPage from "@/pages/admin/clients";
import SuppliersPage from "@/pages/admin/suppliers";
import RedirectsPage from "@/pages/admin/redirects";
import SettingsPage from "@/pages/admin/settings";
import PausedPage from "@/pages/paused";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/auth" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={LoginPage} />

      {/* Admin Routes */}
      <Route path="/admin" component={() => <Redirect to="/admin/dashboard" />} />
      <Route path="/admin/dashboard">
        <ProtectedRoute path="/admin/dashboard" component={DashboardPage} />
      </Route>
      <Route path="/admin/project/new">
        <ProtectedRoute path="/admin/project/new" component={() => <Redirect to="/admin/projects/new" />} />
      </Route>
      <Route path="/admin/projects/new">
        <ProtectedRoute path="/admin/projects/new" component={ProjectFormPage} />
      </Route>
      <Route path="/admin/projects/:id/edit">
        {(params) => (
          <ProtectedRoute path={`/admin/projects/${params.id}/edit`} component={ProjectFormPage} />
        )}
      </Route>
      <Route path="/admin/projects">
        <ProtectedRoute path="/admin/projects" component={ProjectsPage} />
      </Route>
      <Route path="/admin/responses">
        <ProtectedRoute path="/admin/responses" component={ResponsesPage} />
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute path="/admin/clients" component={ClientsPage} />
      </Route>
      <Route path="/admin/suppliers">
        <ProtectedRoute path="/admin/suppliers" component={SuppliersPage} />
      </Route>
      <Route path="/admin/redirects">
        <ProtectedRoute path="/admin/redirects" component={RedirectsPage} />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute path="/admin/settings" component={SettingsPage} />
      </Route>

      {/* User/Mock Routes */}
      <Route path="/complete" component={CompletePage} />
      <Route path="/terminate" component={TerminatePage} />
      <Route path="/quotafull" component={QuotaFullPage} />
      <Route path="/security-terminate" component={SecurityTerminatePage} />
      <Route path="/duplicate-ip" component={DuplicateIpPage} />
      <Route path="/duplicate-string" component={DuplicateStringPage} />
      <Route path="/paused" component={PausedPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/prescreener/:session" component={PrescreenerPage} />
      <Route path="/survey" component={MockSurvey} />
      <Route path="/debug/redirect-chain" component={RedirectDebugger} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
