import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project, Client } from "@shared/schema";
import { Plus, FolderOpen, Globe, Users, BarChart3, Pencil, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/projects/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getClientName = (clientId: number | null) => {
    if (!clientId || !clients) return "No client";
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-projects-title">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your survey projects
          </p>
        </div>
        <Button
          onClick={() => setLocation("/admin/projects/new")}
          data-testid="button-create-project"
        >
          <Plus />
          New Project
        </Button>
      </div>

      {projects && projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium" data-testid="text-no-projects">
              No projects yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first project to get started
            </p>
            <Button
              className="mt-4"
              onClick={() => setLocation("/admin/projects/new")}
              data-testid="button-create-first-project"
            >
              <Plus />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Card key={project.id} data-testid={`card-project-${project.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate" data-testid={`text-project-name-${project.id}`}>
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-secondary px-1.5 py-0.5 rounded-md font-mono" data-testid={`text-project-pid-${project.id}`}>
                      {project.pid}
                    </code>
                    <CopyButton value={project.pid} />
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate" data-testid={`text-project-client-${project.id}`}>
                    {getClientName(project.clientId)}
                  </span>
                </div>

                {project.country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span data-testid={`text-project-country-${project.id}`}>{project.country}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {project.cpi != null && (
                    <span data-testid={`text-project-cpi-${project.id}`}>CPI: ${project.cpi.toFixed(2)}</span>
                  )}
                  {project.loi != null && (
                    <span data-testid={`text-project-loi-${project.id}`}>LOI: {project.loi}m</span>
                  )}
                  {project.ir != null && (
                    <span data-testid={`text-project-ir-${project.id}`}>IR: {project.ir}%</span>
                  )}
                </div>

                {project.expectedCompletes != null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span data-testid={`text-project-expected-${project.id}`}>
                      Target: {project.expectedCompletes} completes
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {project.status === "active" ? "Active" : "Paused"}
                    </span>
                    <Switch
                      checked={project.status === "active"}
                      onCheckedChange={(checked) =>
                        toggleStatusMutation.mutate({
                          id: project.id,
                          status: checked ? "active" : "paused",
                        })
                      }
                      data-testid={`switch-project-status-${project.id}`}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setLocation(`/admin/projects/${project.id}/edit`)}
                      data-testid={`button-edit-project-${project.id}`}
                    >
                      <Pencil />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-delete-project-${project.id}`}
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(project.id)}
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
