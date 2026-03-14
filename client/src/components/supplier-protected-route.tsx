import { Redirect, useLocation } from "wouter";
import { useSupplierAuth } from "@/hooks/use-supplier-auth";
import { Loader2 } from "lucide-react";

export function SupplierProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useSupplierAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={`/supplier/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}
