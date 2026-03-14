import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
    LayoutDashboard,
    MessageSquare,
    LogOut,
    ShieldCheck,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { title: "Dashboard", url: "/supplier/dashboard", icon: LayoutDashboard },
    { title: "Responses", url: "/supplier/responses", icon: MessageSquare },
];

interface SupplierSidebarProps {
    username?: string;
    supplierCode?: string;
}

export function SupplierSidebar({ username, supplierCode }: SupplierSidebarProps) {
    const [location, setLocation] = useLocation();

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/supplier/auth/logout");
        },
        onSuccess: () => {
            queryClient.clear();
            setLocation("/supplier/login");
        },
    });

    return (
        <aside className="w-[180px] border-r border-white/10 bg-slate-950 flex flex-col h-screen sticky top-0 z-50 text-white shrink-0 shadow-2xl shadow-black/50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transform rotate-3">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-white tracking-tight">Supplier</h1>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
                {navItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                        <Link
                            key={item.title}
                            href={item.url}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-200",
                                isActive ? "text-blue-400 scale-110" : "text-slate-500 group-hover:scale-110"
                            )} />
                            <span>{item.title}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-white/5 bg-white/5">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">{username || "Supplier"}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Code: {supplierCode || "N/A"}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl px-4"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold">Sign Out</span>
                </Button>
            </div>
        </aside>
    );
}
