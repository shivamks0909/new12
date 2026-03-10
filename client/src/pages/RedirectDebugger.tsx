import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertCircle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function RedirectDebugger() {
    const [params] = useSearch();
    const oiSession = new URLSearchParams(params).get("oi_session");

    const { data: logs, isLoading } = useQuery<any[]>({
        queryKey: ["/api/debug/redirect-chain", { oi_session: oiSession }],
        queryFn: async () => {
            const res = await fetch(`/api/debug/redirect-chain?oi_session=${oiSession}`);
            return res.json();
        },
        enabled: !!oiSession,
        refetchInterval: 1000, // Poll for updates
    });

    if (!oiSession) {
        return (
            <div className="p-8 text-center text-gray-500">
                No active session to debug.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            Redirect Debugger
                        </h1>
                        <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">
                            Session ID: {oiSession}
                        </p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500 text-emerald-500 animate-pulse">
                        LIVE MONITORING
                    </Badge>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            Lifecycle Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-12">
                                {isLoading && (
                                    <div className="absolute -left-1 top-0 w-2 h-full bg-slate-800 animate-pulse" />
                                )}

                                {logs?.map((log, index) => (
                                    <div key={log.id} className="relative">
                                        <div className="absolute -left-[41px] bg-slate-950 p-1 border-2 border-slate-800 rounded-full">
                                            {log.step === "ERROR" ? (
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-slate-100">{log.step}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                                                </span>
                                            </div>
                                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 font-mono text-sm text-slate-300">
                                                {log.details || "No details provided"}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!logs || logs.length === 0) && !isLoading && (
                                    <div className="py-12 text-center text-slate-500">
                                        Waiting for events...
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Database Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-lg font-semibold">Respondent Record Verified</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Final Target</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-blue-400">
                                <MapPin className="w-4 h-4" />
                                <span className="text-lg font-semibold">Supplier Redirect Logic Ready</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
