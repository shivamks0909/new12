import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@shared/schema";

function UrlRow({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between gap-2 py-2">
        <span className="text-sm font-medium min-w-[140px]">{label}</span>
        <span className="text-sm text-muted-foreground">Not set</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-sm font-medium min-w-[140px]">{label}</span>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-sm text-muted-foreground truncate flex-1">{url}</span>
        <CopyButton value={url} />
      </div>
    </div>
  );
}

export default function RedirectsPage() {
  const { data: projectsList, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-redirects-title">Redirect URLs</h1>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : projectsList?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No projects yet. Create a project to see redirect URLs.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projectsList?.map((project) => (
            <Card key={project.id} data-testid={`card-redirect-${project.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <StatusBadge status={project.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>PID: {project.pid}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                <div className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium min-w-[140px]">Entry URL</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {`${window.location.origin}/r/${project.pid}`}
                    </span>
                    <CopyButton value={`${window.location.origin}/r/${project.pid}`} />
                  </div>
                </div>
                <UrlRow label="Survey URL" url={project.surveyUrl} />
                <UrlRow label="Complete URL" url={project.completeUrl} />
                <UrlRow label="Terminate URL" url={project.terminateUrl} />
                <UrlRow label="Quota Full URL" url={project.quotafullUrl} />
                <UrlRow label="Security Term URL" url={project.securityTerminateUrl} />
                <UrlRow label="Prescreener URL" url={project.prescreenerUrl} />
                <div className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium min-w-[140px]">Track Complete</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {`${window.location.origin}/track/complete?oi_session={oi_session}`}
                    </span>
                    <CopyButton value={`${window.location.origin}/track/complete?oi_session={oi_session}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium min-w-[140px]">Track Terminate</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {`${window.location.origin}/track/terminate?oi_session={oi_session}`}
                    </span>
                    <CopyButton value={`${window.location.origin}/track/terminate?oi_session={oi_session}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium min-w-[140px]">Track Quota Full</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {`${window.location.origin}/track/quotafull?oi_session={oi_session}`}
                    </span>
                    <CopyButton value={`${window.location.origin}/track/quotafull?oi_session={oi_session}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium min-w-[140px]">Track Security</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {`${window.location.origin}/track/security-terminate?oi_session={oi_session}`}
                    </span>
                    <CopyButton value={`${window.location.origin}/track/security-terminate?oi_session={oi_session}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
