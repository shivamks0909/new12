import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { SurveyResponse, Project } from "@shared/schema";

export default function ResponsesPage() {
  const { toast } = useToast();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const limit = 25;

  const params = new URLSearchParams();
  if (projectFilter !== "all") params.set("projectId", projectFilter);
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data: responsesData, isLoading } = useQuery<{ data: SurveyResponse[]; total: number }>({
    queryKey: ["/api/responses", `?${params.toString()}`],
  });

  const { data: projectsList } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("DELETE", "/api/responses/bulk", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responses"] });
      setSelectedIds([]);
      toast({ title: "Responses deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const totalPages = responsesData ? Math.ceil(responsesData.total / limit) : 0;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!responsesData) return;
    const allIds = responsesData.data.map((r) => r.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleExport = () => {
    const exportParams = new URLSearchParams();
    if (projectFilter !== "all") exportParams.set("projectId", projectFilter);
    if (statusFilter !== "all") exportParams.set("status", statusFilter);
    if (search) exportParams.set("search", search);
    window.open(`/api/responses/export?${exportParams.toString()}`, "_blank");
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-responses-title">Responses</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-bulk-delete">
                  <Trash2 />
                  Delete ({selectedIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Responses</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedIds.length} response(s)? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                    data-testid="button-confirm-delete"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download />
            Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by UID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]" data-testid="select-project-filter">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projectsList?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.pid})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="terminate">Terminate</SelectItem>
                <SelectItem value="quotafull">Quota Full</SelectItem>
                <SelectItem value="security-terminate">Security Terminate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          responsesData?.data?.length
                            ? responsesData.data.every((r) => selectedIds.includes(r.id))
                            : false
                        }
                        onChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>OI Session</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsesData?.data?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No responses found
                      </TableCell>
                    </TableRow>
                  )}
                  {responsesData?.data?.map((r) => (
                    <TableRow key={r.id} data-testid={`row-response-${r.id}`}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          data-testid={`checkbox-response-${r.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[180px] truncate" data-testid={`text-session-${r.id}`}>
                        {r.oiSession || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-uid-${r.id}`}>{r.uid || "-"}</TableCell>
                      <TableCell data-testid={`text-ip-${r.id}`}>{r.ipAddress || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell data-testid={`text-project-${r.id}`}>
                        {projectsList?.find((p) => p.id === r.projectId)?.name || r.pid}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm" data-testid={`text-time-${r.id}`}>
                        {formatDate(r.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4 p-4 border-t">
                <span className="text-sm text-muted-foreground" data-testid="text-total-count">
                  {responsesData?.total || 0} total responses
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-sm" data-testid="text-page-info">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="button-next-page"
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
