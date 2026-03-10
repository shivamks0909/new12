import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertCircle, Clock, ShieldAlert, Globe, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Respondent } from "@shared/schema";

export default function RedirectsPage() {
  const { data: respondents, isLoading } = useQuery<Respondent[]>({
    queryKey: ["/api/respondents"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "terminate": return <XCircle className="h-4 w-4 text-rose-500" />;
      case "quotafull": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "security": return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Pulse</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">Real-time respondent stream and routing diagnostics</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Volume" value={respondents?.length || 0} icon={Users} gradient="from-primary/10 to-transparent" />
        <StatCard title="Success Chain" value={respondents?.filter(r => r.status === "complete").length || 0} icon={CheckCircle2} gradient="from-emerald-500/10 to-transparent" />
        <StatCard title="Filtered Out" value={respondents?.filter(r => r.status === "terminate").length || 0} icon={XCircle} gradient="from-rose-500/10 to-transparent" />
        <StatCard title="Security Alerts" value={respondents?.filter(r => r.status === "security").length || 0} icon={ShieldAlert} gradient="from-amber-500/10 to-transparent" />
      </div>

      <Card className="bg-white/40 border-slate-200/60 rounded-[2.5rem] backdrop-blur-2xl shadow-xl shadow-slate-200/10 overflow-hidden group">
        <CardHeader className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
              <Activity className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
            </div>
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Real-Time Activity Feed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-slate-50 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Transaction / PID</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Source Hub</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto text-center">Locality</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Status Result</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto text-right">Activity Log</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {respondents?.map((r) => (
                    <TableRow key={r.id} className="group hover:bg-slate-50/80 transition-all border-none">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <code className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[120px] mb-0.5">{r.id}</code>
                          <span className="font-black text-[13px] text-slate-800 tracking-tight transition-colors group-hover:text-primary">{r.projectCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 capitalize">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                          {r.supplierCode}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-slate-300" />
                          <span className="font-black text-[11px] text-slate-600">{r.countryCode || "Global"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8">
                        <div className="flex items-center gap-2">
                          <div className="opacity-80 scale-90">{getStatusIcon(r.status || "started")}</div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{r.status || "active"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right font-bold text-[11px] text-slate-400">
                        {new Date(r.startedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && respondents?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-slate-300 italic text-sm">
                        No transactions recorded in the current session
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient }: { title: string, value: number, icon: any, gradient: string }) {
  return (
    <Card className="bg-white/40 border-slate-200/60 backdrop-blur-2xl rounded-[2.5rem] shadow-xl shadow-slate-200/5 overflow-hidden group hover:bg-white/60 hover:border-white hover:shadow-2xl transition-all duration-500">
      <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", gradient)} />
      <CardContent className="p-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
          </div>
          <div className="p-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
            <Icon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
