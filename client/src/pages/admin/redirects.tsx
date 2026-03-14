import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Activity, 
  ShieldAlert, 
  ExternalLink,
  Target,
  Zap,
  Lock
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import type { Respondent, DashboardStats } from "@shared/schema";

export default function RedirectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: responses, isLoading: isTableLoading } = useQuery<Respondent[]>({
    queryKey: ["/api/admin/responses"],
    refetchInterval: 10000,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  const filteredResponses = responses?.filter((r) => {
    const matchesSearch =
      r.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      r.oiSession.toLowerCase().includes(search.toLowerCase()) ||
      (r.supplierCode || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completionRate = stats 
    ? ((stats.completes / (stats.totalRespondents || 1)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Redirect Nexus</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">Real-time traffic routing & redirection diagnostics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Engine Active</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Traffic"
          value={stats?.totalRespondents || 0}
          icon={Activity}
          description="Global routing hits"
        />
        <StatCard
          title="Success Rate"
          value={`${completionRate}%`}
          icon={Zap}
          description="Conversion efficiency"
        />
        <StatCard
          title="System Filtered"
          value={(stats?.terminates || 0) + (stats?.quotafulls || 0)}
          icon={Target}
          description="Traffic management"
        />
        <StatCard
          title="Security Blocks"
          value={stats?.securityTerminates || 0}
          icon={Lock}
          description="Fraud prevention"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by Session, Project or Hub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-white/40 border-slate-200/60 backdrop-blur-xl rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-slate-300"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-56 h-14 bg-white/40 border-slate-200/60 backdrop-blur-xl rounded-2xl shadow-sm font-black px-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="Status Matrix" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-2xl p-2 shadow-2xl">
            <SelectItem value="all" className="rounded-xl font-bold p-3">Full Spectrum</SelectItem>
            <SelectItem value="complete" className="rounded-xl font-bold p-3">Completed</SelectItem>
            <SelectItem value="terminate" className="rounded-xl font-bold p-3">Terminated</SelectItem>
            <SelectItem value="quotafull" className="rounded-xl font-bold p-3">Quota Full</SelectItem>
            <SelectItem value="security-terminate" className="rounded-xl font-bold p-3">Security Term</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <Card className="bg-white/40 border-slate-200/60 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl shadow-slate-200/10 overflow-hidden group">
        <CardHeader className="p-8 border-b border-slate-100/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Response Chain Audit</CardTitle>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {filteredResponses?.length || 0} Records Found
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isTableLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100/50" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100/50 bg-slate-50/10">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-6 h-auto">Session / Trace</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-6 h-auto">Project Source</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-6 h-auto">Hub Identity</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-6 h-auto">Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-6 h-auto">Transmission</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-6 h-auto text-right">Destination</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100/30">
                  {filteredResponses?.map((r) => (
                    <TableRow key={r.id} className="group hover:bg-white/60 transition-all border-none">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col">
                          <code className="text-[11px] font-mono font-black text-slate-900">{r.oiSession.substring(0, 16)}</code>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Trace ID: {r.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8">
                        <span className="font-black text-sm text-slate-800 tracking-tight">{r.projectCode}</span>
                      </TableCell>
                      <TableCell className="px-8">
                        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border inline-flex items-center gap-2 ${
                          r.supplierCode ? 'bg-primary/5 text-primary border-primary/10' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {r.supplierCode || "DIRECT"}
                        </div>
                      </TableCell>
                      <TableCell className="px-8">
                        <StatusBadge status={r.status || "started"} className="scale-90 origin-left" />
                      </TableCell>
                      <TableCell className="px-8 text-[11px] font-bold text-slate-400">
                        {new Date(r.completedAt || r.startedAt || Date.now()).toLocaleTimeString([], { 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        {r.redirectUrl ? (
                          <div className="flex items-center justify-end gap-3 group/link">
                            <span className="text-[10px] font-mono text-slate-300 truncate max-w-[180px] group-hover/link:text-primary transition-colors">{r.redirectUrl}</span>
                            <a 
                              href={r.redirectUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-50 hover:bg-primary/10 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm border border-slate-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-200 tracking-widest uppercase italic bg-slate-50/50 px-3 py-1 rounded-lg">No Exit Path</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isTableLoading && filteredResponses?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-80 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20">
                          <Activity className="w-16 h-16 mb-4 text-slate-400" />
                          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Nexus Traffic Quiet</p>
                        </div>
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
