import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassButton } from "@/components/ui/glass-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, ClipboardList, Link2, Copy, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema } from "@shared/schema";
import type { Supplier } from "@shared/schema";
import { useState } from "react";

export default function SuppliersPage() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      code: "",
      completeUrl: "",
      terminateUrl: "",
      quotafullUrl: "",
      securityUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier registered successfully" });
      form.reset();
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
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier removed from nexus" });
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Supplier Network</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">Manage traffic originators and dynamic callback parameters</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              Register Source
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white/95 backdrop-blur-3xl border-slate-200 rounded-[2.5rem] max-w-2xl shadow-2xl p-0 overflow-hidden">
            <div className="p-10">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  Supply Integration
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Configure a new traffic source with custom callback telemetry.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Supplier Entity</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Dynata Global" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all text-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unique Identifier (TAG)</FormLabel>
                          <FormControl>
                            <Input placeholder="DYN01" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all text-slate-800 font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">Callback Telemetry</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {["completeUrl", "terminateUrl", "quotafullUrl", "securityUrl"].map((fieldName) => (
                        <FormField
                          key={fieldName}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                {fieldName.replace('Url', '').toUpperCase()} Entry
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-800" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="pt-6">
                    <button type="submit" disabled={createMutation.isPending} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50">
                      {createMutation.isPending ? "Processing Nexus..." : "Synchronize Supplier"}
                    </button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-8 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-white/20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {suppliers?.map((supplier) => (
            <Card key={supplier.id} className="bg-white/40 border-slate-200/60 backdrop-blur-2xl rounded-[2.5rem] shadow-xl shadow-slate-200/10 overflow-hidden group hover:bg-white/60 hover:border-white transition-all duration-500">
              <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary transition-colors duration-500">
                    <ClipboardList className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 tracking-tight">{supplier.name}</CardTitle>
                    <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nexus Node: {supplier.code}</CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${supplier.name} from nexus?`)) {
                      deleteMutation.mutate(supplier.id);
                    }
                  }}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Link2 className="w-3 h-3" />
                      Universal Routing Link
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 group/link relative mb-4">
                    <code className="text-[11px] break-all font-mono text-slate-500 block leading-relaxed pr-10">
                      {window.location.origin}/track?code=[PID]&country=[CC]&sup={supplier.code}&uid=[RID]
                    </code>
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/track?code=[PID]&country=[CC]&sup=${supplier.code}&uid=[RID]`, supplier.code)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/10 rounded-lg transition-all"
                    >
                      {copiedId === supplier.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-300 hover:text-primary transition-colors" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {["Complete", "Terminate"].map((label) => (
                    <div key={label} className="p-4 rounded-2xl bg-white/40 border border-slate-100 flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{label} Target</span>
                      <span className="text-xs font-black text-slate-700 truncate opacity-60">
                        {supplier[`${label.toLowerCase()}Url` as keyof Supplier] || "Not Defined"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
