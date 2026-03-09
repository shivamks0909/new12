import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { SurveyResponse } from "@shared/schema";

interface DashboardStats {
  totalToday: number;
  completesToday: number;
  terminatesToday: number;
  quotafullsToday: number;
}

interface DailyCount {
  date: string;
  count: number;
}

const chartConfig: ChartConfig = {
  count: {
    label: "Responses",
    color: "hsl(var(--primary))",
  },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  const latestQuery = useQuery<SurveyResponse[]>({
    queryKey: ["/api/admin/responses"],
    refetchInterval: 10000,
  });

  const chartQuery = useQuery<DailyCount[]>({
    queryKey: ["/api/admin/daily-counts"],
    refetchInterval: 60000,
  });

  const stats = statsQuery.data;
  const latestResponses = latestQuery.data;
  const chartData = chartQuery.data;

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of today's survey activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Today"
              value={stats?.totalToday ?? 0}
              icon={Activity}
              description="All responses received today"
            />
            <StatCard
              title="Completes"
              value={stats?.completesToday ?? 0}
              icon={CheckCircle}
              description="Successful completions"
            />
            <StatCard
              title="Terminates"
              value={stats?.terminatesToday ?? 0}
              icon={XCircle}
              description="Terminated responses"
            />
            <StatCard
              title="Quota Fulls"
              value={stats?.quotafullsToday ?? 0}
              icon={AlertTriangle}
              description="Quota full responses"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Traffic (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent data-testid="chart-traffic">
            {chartQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData.map((d) => ({ ...d, label: formatChartDate(d.date) }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No response data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Live Activity</CardTitle>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </CardHeader>
          <CardContent data-testid="feed-activity">
            {latestQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : latestResponses && latestResponses.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {latestResponses.slice(0, 20).map((resp) => (
                  <div
                    key={resp.id}
                    className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
                    data-testid={`feed-item-${resp.id}`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate" data-testid={`text-feed-uid-${resp.id}`}>
                        {resp.uid || resp.oiSession || `#${resp.id}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(resp.createdAt as unknown as string)}{" "}
                        {formatTime(resp.createdAt as unknown as string)}
                      </span>
                    </div>
                    <StatusBadge status={resp.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
