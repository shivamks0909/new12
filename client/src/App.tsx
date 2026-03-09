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
import PausedPage from "@/pages/paused";
import ProjectsPage from "@/pages/admin/projects";
import ProjectFormPage from "@/pages/admin/project-form";
import ResponsesPage from "@/pages/admin/responses";
import ClientsPage from "@/pages/admin/clients";
import SuppliersPage from "@/pages/admin/suppliers";
import RedirectsPage from "@/pages/admin/redirects";
import SettingsPage from "@/pages/admin/settings";
import { Loader2 } from "lucide-react";

function ProtectedAdminRouter() {
  const { user, isLoading, isAuthenticated } = useAuth();

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
      <Switch>
        <Route path="/admin/dashboard" component={DashboardPage} />
        <Route path="/admin/projects/new" component={ProjectFormPage} />
        <Route path="/admin/projects/:id/edit" component={ProjectFormPage} />
        <Route path="/admin/projects" component={ProjectsPage} />
        <Route path="/admin/responses" component={ResponsesPage} />
        <Route path="/admin/clients" component={ClientsPage} />
        <Route path="/admin/suppliers" component={SuppliersPage} />
        <Route path="/admin/redirects" component={RedirectsPage} />
        <Route path="/admin/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <Redirect to="/login" />}</Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/complete" component={CompletePage} />
      <Route path="/terminate" component={TerminatePage} />
      <Route path="/quotafull" component={QuotaFullPage} />
      <Route path="/security-terminate" component={SecurityTerminatePage} />
      <Route path="/duplicate-ip" component={DuplicateIpPage} />
      <Route path="/duplicate-string" component={DuplicateStringPage} />
      <Route path="/paused" component={PausedPage} />
      <Route path="/admin/:rest*" component={ProtectedAdminRouter} />
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
