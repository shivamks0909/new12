import { useQuery } from "@tanstack/react-query";
import { SupplierLayout } from "@/components/layout/supplier-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Download, Search, Filter, Database, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import type { Respondent } from "@shared/schema";

export default function SupplierResponsesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: responses, isLoading, isError, error } = useQuery<Respondent[]>({
    queryKey: ["/api/supplier/responses"],
  });

  if (isError) {
    return (
      <SupplierLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold text-white">Failed to load responses</h2>
          <p className="text-slate-400">{(error as Error)?.message || "Internal server error"}</p>
        </div>
      </SupplierLayout>
    );
  }

  const responsesList = Array.isArray(responses) ? responses : [];

  const filteredResponses = responsesList.filter((r) => {
    const matchesSearch =
      r.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      (r.supplierRid || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (!filteredResponses) return;
    
    const headers = ["ID", "Project Code", "RID (UID)", "Status", "Started At", "Completed At"];
    const csvContent = [
      headers.join(","),
      ...filteredResponses.map(r => [
        r.id,
        r.projectCode,
        r.supplierRid || "",
        r.status,
        r.startedAt ? new Date(r.startedAt).toISOString() : "",
        r.completedAt ? new Date(r.completedAt).toISOString() : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `responses_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SupplierLayout>
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Respondent stream</h1>
            <p className="text-sm text-slate-400 mt-1 font-bold">Trace and audit all assigned traffic flows</p>
          </div>
          <GlassButton
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </GlassButton>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              placeholder="Search by PID or RID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl backdrop-blur-xl focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-500 font-bold"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-56 h-14 bg-white/5 border-white/10 rounded-2xl backdrop-blur-xl text-white font-bold px-5 focus:ring-4 focus:ring-blue-500/10 transition-all">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 rounded-2xl p-1 shadow-2xl">
              <SelectItem value="all" className="rounded-xl font-bold text-slate-300 focus:bg-blue-500 focus:text-white transition-colors cursor-pointer">All Transitions</SelectItem>
              <SelectItem value="complete" className="rounded-xl font-bold text-slate-300 focus:bg-blue-500 focus:text-white transition-colors cursor-pointer">Complete</SelectItem>
              <SelectItem value="terminate" className="rounded-xl font-bold text-slate-300 focus:bg-blue-500 focus:text-white transition-colors cursor-pointer">Terminate</SelectItem>
              <SelectItem value="quotafull" className="rounded-xl font-bold text-slate-300 focus:bg-blue-500 focus:text-white transition-colors cursor-pointer">Quota Full</SelectItem>
              <SelectItem value="security" className="rounded-xl font-bold text-slate-300 focus:bg-blue-500 focus:text-white transition-colors cursor-pointer">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white/5 border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl overflow-hidden group">
          <CardHeader className="p-8 border-b border-white/10 flex flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                <Database className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Response Registry</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  {filteredResponses?.length || 0} Assignments in current partition
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-white/10 bg-white/[0.02]">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto">Response ID</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto">Project</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto">RID (UID)</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto text-center">S2S</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto text-center">LOI</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 py-5 h-auto text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {filteredResponses?.map((r) => {
                      const getLOI = (start?: string | Date, end?: string | Date | null) => {
                        if (!start || !end) return "—";
                        const s = new Date(start).getTime();
                        const e = new Date(end).getTime();
                        const diff = Math.floor((e - s) / 60000);
                        return `${diff}m`;
                      };

                      return (
                        <TableRow key={r.id} className="group hover:bg-white/[0.03] transition-all border-none">
                          <TableCell className="px-8 py-6">
                            <code className="text-[10px] font-mono font-bold text-slate-500">{r.id.substring(0, 8)}...</code>
                          </TableCell>
                          <TableCell className="px-8">
                            <span className="font-black text-[12px] text-white tracking-tight">{r.projectCode}</span>
                          </TableCell>
                          <TableCell className="px-8">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {r.supplierRid || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 text-center">
                            {r.s2sVerified ? (
                              <div className="inline-flex items-center gap-1 text-emerald-400 font-black text-[9px] uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" />
                                V-OK
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-slate-600 font-black text-[9px] uppercase tracking-widest">
                                <ShieldAlert className="w-3 h-3" />
                                NONE
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-8">
                            <StatusBadge status={r.status || "started"} />
                          </TableCell>
                          <TableCell className="px-8 text-center">
                            <div className="flex items-center justify-center gap-1 text-slate-400 font-bold text-[10px]">
                              <Clock className="w-3 h-3" />
                              {getLOI(r.startedAt, r.completedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="px-8 text-right font-bold text-[10px] text-slate-500">
                            {new Date(r.startedAt || Date.now()).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!isLoading && filteredResponses?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                            <Database className="w-10 h-10 text-white" />
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-white">No assigned records</p>
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
    </SupplierLayout>
  );
}
