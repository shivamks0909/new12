import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface SupplierUser {
  id: string;
  username: string;
  supplierId: string;
  supplierCode: string;
}

export function useSupplierAuth() {
  const { data: user, isLoading, isError } = useQuery<SupplierUser | null>({
    queryKey: ["/api/supplier/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
  };
}
