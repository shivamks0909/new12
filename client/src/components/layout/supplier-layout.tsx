import { SupplierSidebar } from "./supplier-sidebar";
import { useSupplierAuth } from "@/hooks/use-supplier-auth";
import { BackgroundPaths } from "@/components/ui/background-paths";

interface SupplierLayoutProps {
  children: React.ReactNode;
}

export function SupplierLayout({ children }: SupplierLayoutProps) {
  const { user } = useSupplierAuth();

  return (
    <div className="flex min-h-screen w-full bg-slate-950 selection:bg-blue-500 selection:text-white font-sans overflow-hidden relative text-slate-200 transition-colors duration-500">
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>

      <SupplierSidebar username={user?.username} supplierCode={user?.supplierCode} />

      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl">
          <div className="flex flex-col">
            <h2 className="text-[9px] font-black text-blue-500/80 uppercase tracking-[0.4em] leading-none mb-1 shadow-sm">Partner Hub</h2>
            <p className="text-[13px] font-black text-white capitalize tracking-tight">Supplier Operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: <span className="text-emerald-500">Live</span></span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
