import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, Filter, Database, ArrowUpDown, Globe } from "lucide-react";
import type { Respondent } from "@shared/schema";

export default function ResponsesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: responses, isLoading } = useQuery<Respondent[]>({
    queryKey: ["/api/responses"],
  });

  const filteredResponses = responses?.filter((r) => {
    const matchesSearch =
      r.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierCode.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Respondent Stream</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">Transaction ledger for all incoming traffic nodes</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by SID, PID or Hub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 bg-white/40 border-slate-200/60 rounded-2xl backdrop-blur-xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-slate-800 placeholder:text-slate-300 font-bold"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-56 h-14 bg-white/40 border-slate-200/60 rounded-2xl backdrop-blur-xl text-slate-600 font-bold px-5 focus:ring-4 focus:ring-primary/5 transition-all">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white/90 backdrop-blur-2xl border-slate-200 rounded-2xl p-1 shadow-2xl">
            <SelectItem value="all" className="rounded-xl font-bold text-slate-600 focus:bg-primary focus:text-white transition-colors">All Transitions</SelectItem>
            <SelectItem value="complete" className="rounded-xl font-bold text-slate-600 focus:bg-primary focus:text-white transition-colors">Complete</SelectItem>
            <SelectItem value="terminate" className="rounded-xl font-bold text-slate-600 focus:bg-primary focus:text-white transition-colors">Terminate</SelectItem>
            <SelectItem value="quotafull" className="rounded-xl font-bold text-slate-600 focus:bg-primary focus:text-white transition-colors">Quota Full</SelectItem>
            <SelectItem value="security" className="rounded-xl font-bold text-slate-600 focus:bg-primary focus:text-white transition-colors">Security</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white/40 border-slate-200/60 rounded-[2.5rem] backdrop-blur-2xl shadow-xl shadow-slate-200/10 overflow-hidden group">
        <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
              <Database className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Transaction Registry</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                {filteredResponses?.length || 0} Records found in current partition
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Session ID / Context</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Origin Cluster</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Regional Node</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto">Result State</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-8 py-5 h-auto text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredResponses?.map((r) => (
                    <TableRow key={r.id} className="group hover:bg-slate-50/80 transition-all border-none">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <code className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[120px] group-hover:text-primary/40 transition-colors">{r.id}</code>
                          <span className="font-black text-[13px] text-slate-800 tracking-tight group-hover:translate-x-1 transition-transform">{r.projectCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 capitalize">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                          {r.supplierCode}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 text-center">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[11px] font-black text-slate-600">{r.countryCode || "Global"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8">
                        <StatusBadge status={r.status || "started"} />
                      </TableCell>
                      <TableCell className="px-8 text-right font-bold text-[11px] text-slate-400">
                        {new Date(r.startedAt || Date.now()).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && filteredResponses?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                          <Database className="w-10 h-10" />
                          <p className="text-sm font-black uppercase tracking-[0.2em]">No Synchronized Records</p>
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
