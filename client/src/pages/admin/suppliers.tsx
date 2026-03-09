import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2 } from "lucide-react";
import type { Project, Supplier } from "@shared/schema";
import { z } from "zod";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  supplierCode: z.string().min(1, "Supplier code is required"),
  completeUrl: z.string().optional().default(""),
  terminateUrl: z.string().optional().default(""),
  quotafullUrl: z.string().optional().default(""),
  securityUrl: z.string().optional().default(""),
  status: z.string().default("active"),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function SuppliersPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projectsList, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: suppliersList, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/projects", selectedProjectId, "suppliers"],
    enabled: !!selectedProjectId,
  });

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      supplierCode: "",
      completeUrl: "",
      terminateUrl: "",
      quotafullUrl: "",
      securityUrl: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      await apiRequest("POST", `/api/projects/${selectedProjectId}/suppliers`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "suppliers"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Supplier added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "suppliers"] });
      toast({ title: "Supplier deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    form.reset({
      name: "",
      supplierCode: "",
      completeUrl: "",
      terminateUrl: "",
      quotafullUrl: "",
      securityUrl: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: SupplierFormValues) => {
    createMutation.mutate(data);
  };

  const selectedProject = projectsList?.find((p) => String(p.id) === selectedProjectId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-suppliers-title">Suppliers</h1>
        {selectedProjectId && (
          <Button onClick={openCreate} data-testid="button-add-supplier">
            <Plus />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full max-w-sm" data-testid="select-project">
              <SelectValue placeholder="Choose a project..." />
            </SelectTrigger>
            <SelectContent>
              {projectsList?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} ({p.pid})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              Suppliers for {selectedProject?.name || ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {suppliersLoading || projectsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Complete URL</TableHead>
                    <TableHead>Terminate URL</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliersList?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No suppliers for this project
                      </TableCell>
                    </TableRow>
                  )}
                  {suppliersList?.map((s) => (
                    <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                      <TableCell className="font-medium" data-testid={`text-supplier-name-${s.id}`}>
                        {s.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-supplier-code-${s.id}`}>
                        {s.supplierCode}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {s.completeUrl ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm text-muted-foreground">{s.completeUrl}</span>
                            <CopyButton value={s.completeUrl} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {s.terminateUrl ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm text-muted-foreground">{s.terminateUrl}</span>
                            <CopyButton value={s.terminateUrl} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-delete-supplier-${s.id}`}
                            >
                              <Trash2 />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {s.name}? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-supplier-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplierCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Code</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-supplier-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="completeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-supplier-complete-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terminateUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terminate URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-supplier-terminate-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quotafullUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quota Full URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-supplier-quotafull-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="securityUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-supplier-security-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-supplier">
                  {createMutation.isPending ? "Adding..." : "Add Supplier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
