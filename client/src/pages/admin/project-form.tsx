import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema, insertSupplierSchema } from "@shared/schema";
import type { Project, Client, Supplier } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, RefreshCw } from "lucide-react";

const projectFormSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Name is required"),
  pid: z.string().min(1, "PID is required"),
  surveyUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  completeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  terminateUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  quotafullUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  securityTerminateUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  prescreenerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const supplierFormSchema = insertSupplierSchema.omit({ projectId: true }).extend({
  name: z.string().min(1, "Supplier name is required"),
  supplierCode: z.string().min(1, "Supplier code is required"),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

function generatePid(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 5; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export default function ProjectFormPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = Boolean(params.id);
  const projectId = params.id ? parseInt(params.id) : null;

  const { data: existingProject, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: isEditing && projectId !== null,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: existingSuppliers, isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/projects", projectId, "suppliers"],
    enabled: isEditing && projectId !== null,
  });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      pid: generatePid(),
      clientId: null,
      status: "active",
      surveyUrl: "",
      completeUrl: "",
      terminateUrl: "",
      quotafullUrl: "",
      securityTerminateUrl: "",
      prescreenerUrl: "",
      cpi: null,
      expectedCompletes: null,
      country: "",
      loi: null,
      ir: null,
    },
  });

  useEffect(() => {
    if (existingProject) {
      form.reset({
        name: existingProject.name,
        pid: existingProject.pid,
        clientId: existingProject.clientId,
        status: existingProject.status,
        surveyUrl: existingProject.surveyUrl || "",
        completeUrl: existingProject.completeUrl || "",
        terminateUrl: existingProject.terminateUrl || "",
        quotafullUrl: existingProject.quotafullUrl || "",
        securityTerminateUrl: existingProject.securityTerminateUrl || "",
        prescreenerUrl: existingProject.prescreenerUrl || "",
        cpi: existingProject.cpi,
        expectedCompletes: existingProject.expectedCompletes,
        country: existingProject.country || "",
        loi: existingProject.loi,
        ir: existingProject.ir,
      });
    }
  }, [existingProject, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const cleanData = {
        ...data,
        surveyUrl: data.surveyUrl || null,
        completeUrl: data.completeUrl || null,
        terminateUrl: data.terminateUrl || null,
        quotafullUrl: data.quotafullUrl || null,
        securityTerminateUrl: data.securityTerminateUrl || null,
        prescreenerUrl: data.prescreenerUrl || null,
        country: data.country || null,
      };

      if (isEditing && projectId) {
        await apiRequest("PATCH", `/api/projects/${projectId}`, cleanData);
      } else {
        await apiRequest("POST", "/api/projects", cleanData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: isEditing ? "Project updated" : "Project created" });
      setLocation("/admin/projects");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [supplierName, setSupplierName] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [supplierCompleteUrl, setSupplierCompleteUrl] = useState("");
  const [supplierTerminateUrl, setSupplierTerminateUrl] = useState("");
  const [supplierQuotafullUrl, setSupplierQuotafullUrl] = useState("");
  const [supplierSecurityUrl, setSupplierSecurityUrl] = useState("");

  const addSupplierMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Save the project first before adding suppliers");
      const data = {
        name: supplierName,
        supplierCode: supplierCode,
        completeUrl: supplierCompleteUrl || null,
        terminateUrl: supplierTerminateUrl || null,
        quotafullUrl: supplierQuotafullUrl || null,
        securityUrl: supplierSecurityUrl || null,
        status: "active",
      };
      const parsed = supplierFormSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error("Supplier name and code are required");
      }
      await apiRequest("POST", `/api/projects/${projectId}/suppliers`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "suppliers"] });
      setSupplierName("");
      setSupplierCode("");
      setSupplierCompleteUrl("");
      setSupplierTerminateUrl("");
      setSupplierQuotafullUrl("");
      setSupplierSecurityUrl("");
      toast({ title: "Supplier added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "suppliers"] });
      toast({ title: "Supplier removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    saveMutation.mutate(data);
  };

  if (isEditing && isLoadingProject) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/admin/projects")}
          data-testid="button-back-projects"
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-form-title">
            {isEditing ? "Edit Project" : "New Project"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update project settings" : "Configure a new survey project"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Survey Project" {...field} data-testid="input-project-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project ID (PID)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="OPI25505" {...field} data-testid="input-project-pid" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => form.setValue("pid", generatePid())}
                          data-testid="button-generate-pid"
                        >
                          <RefreshCw />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No client</SelectItem>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name} ({client.company})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="surveyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Survey URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://survey.example.com/start" {...field} value={field.value || ""} data-testid="input-survey-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="cpi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPI ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-cpi"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LOI (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-loi"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IR (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-ir"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedCompletes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Completes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-expected-completes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="US" {...field} value={field.value || ""} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Redirect URLs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="completeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complete URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-complete-url" />
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
                        <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-terminate-url" />
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
                        <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-quotafull-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityTerminateUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Terminate URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-security-terminate-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prescreenerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescreener URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-prescreener-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {isEditing && projectId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-lg">Suppliers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSuppliers ? (
                  <Skeleton className="h-20" />
                ) : (
                  <>
                    {existingSuppliers && existingSuppliers.length > 0 && (
                      <div className="space-y-3">
                        {existingSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="flex items-start justify-between gap-3 p-3 rounded-md border"
                            data-testid={`card-supplier-${supplier.id}`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm" data-testid={`text-supplier-name-${supplier.id}`}>
                                  {supplier.name}
                                </span>
                                <code className="text-xs bg-secondary px-1.5 py-0.5 rounded-md font-mono">
                                  {supplier.supplierCode}
                                </code>
                              </div>
                              {supplier.completeUrl && (
                                <p className="text-xs text-muted-foreground truncate">Complete: {supplier.completeUrl}</p>
                              )}
                              {supplier.terminateUrl && (
                                <p className="text-xs text-muted-foreground truncate">Terminate: {supplier.terminateUrl}</p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                              data-testid={`button-delete-supplier-${supplier.id}`}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border rounded-md p-4 space-y-3">
                      <p className="text-sm font-medium">Add Supplier</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Supplier name"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          data-testid="input-supplier-name"
                        />
                        <Input
                          placeholder="Supplier code"
                          value={supplierCode}
                          onChange={(e) => setSupplierCode(e.target.value)}
                          data-testid="input-supplier-code"
                        />
                        <Input
                          placeholder="Complete URL"
                          value={supplierCompleteUrl}
                          onChange={(e) => setSupplierCompleteUrl(e.target.value)}
                          data-testid="input-supplier-complete-url"
                        />
                        <Input
                          placeholder="Terminate URL"
                          value={supplierTerminateUrl}
                          onChange={(e) => setSupplierTerminateUrl(e.target.value)}
                          data-testid="input-supplier-terminate-url"
                        />
                        <Input
                          placeholder="Quota Full URL"
                          value={supplierQuotafullUrl}
                          onChange={(e) => setSupplierQuotafullUrl(e.target.value)}
                          data-testid="input-supplier-quotafull-url"
                        />
                        <Input
                          placeholder="Security URL"
                          value={supplierSecurityUrl}
                          onChange={(e) => setSupplierSecurityUrl(e.target.value)}
                          data-testid="input-supplier-security-url"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addSupplierMutation.mutate()}
                        disabled={addSupplierMutation.isPending || !supplierName || !supplierCode}
                        data-testid="button-add-supplier"
                      >
                        <Plus />
                        Add Supplier
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!isEditing && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Save the project first, then you can add suppliers from the edit page.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              data-testid="button-save-project"
            >
              {saveMutation.isPending ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/projects")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
