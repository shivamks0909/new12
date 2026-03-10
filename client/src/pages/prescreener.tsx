import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PrescreenerPage() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();

    // Extract session from URL exactly like /landing does
    // E.g. /prescreener/:session?country=US
    const pathParts = location.split("?");
    const path = pathParts[0];
    const oiSession = path.replace("/prescreener/", "");
    const searchParams = new URLSearchParams(pathParts[1] || "");
    const country = searchParams.get("country") || "";

    const { data, isLoading, error } = useQuery<{ project: any; questions: any[] }>({
        queryKey: [`/api/prescreener/session/${oiSession}`],
        enabled: !!oiSession,
    });

    // answers map: questionId -> value(s)
    const [answers, setAnswers] = useState<Record<number, any>>({});

    const submitMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                answers: Object.entries(answers).map(([qId, val]) => ({
                    questionId: parseInt(qId),
                    answer: val,
                })),
                country
            };
            const res = await apiRequest("POST", `/api/prescreener/session/${oiSession}/submit`, payload);
            return res.json();
        },
        onSuccess: (data) => {
            if (data.status === "success" && data.nextUrl) {
                window.location.href = data.nextUrl;
            } else if (data.nextUrl) {
                window.location.href = data.nextUrl;
            } else {
                window.location.href = "/terminate?reason=prescreener_fail";
            }
        },
        onError: (err: any) => {
            toast({ title: "Error submitting answers", description: err.message, variant: "destructive" });
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading questions...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Error Loading Prescreener</CardTitle>
                        <CardDescription>We could not find your session or project details.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const handleSingleChoice = (qId: number, val: string) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleMultipleChoice = (qId: number, val: string, checked: boolean) => {
        setAnswers(prev => {
            const current = prev[qId] || [];
            if (checked) {
                return { ...prev, [qId]: [...current, val] };
            } else {
                return { ...prev, [qId]: current.filter((item: string) => item !== val) };
            }
        });
    };

    const handleTextInput = (qId: number, val: string) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = () => {
        // Basic validation
        const missingRequired = data.questions.some(q => q.required && !answers[q.id]);
        if (missingRequired) {
            toast({ title: "Required Questions", description: "Please answer all required questions before continuing.", variant: "destructive" });
            return;
        }
        submitMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl space-y-6">

                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Welcome to the Survey</h1>
                    <p className="text-slate-500">Please answer a few quick questions to see if you qualify.</p>
                </div>

                {data.questions.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No questions configured. Click continue to proceed.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {data.questions.map((q, idx) => {
                            const options = q.options ? JSON.parse(q.options) : [];

                            return (
                                <Card key={q.id}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {idx + 1}. {q.questionText}
                                            {q.required && <span className="text-red-500 ml-1">*</span>}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {q.questionType === "single_choice" && (
                                            <RadioGroup
                                                onValueChange={(val) => handleSingleChoice(q.id, val)}
                                                value={answers[q.id] || ""}
                                                className="space-y-3"
                                            >
                                                {options.map((opt: string, i: number) => (
                                                    <div className="flex items-center space-x-3" key={i}>
                                                        <RadioGroupItem value={opt} id={`q${q.id}-opt${i}`} />
                                                        <Label htmlFor={`q${q.id}-opt${i}`} className="font-normal cursor-pointer text-base">
                                                            {opt}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )}

                                        {q.questionType === "multiple_choice" && (
                                            <div className="space-y-3">
                                                {options.map((opt: string, i: number) => {
                                                    const isChecked = (answers[q.id] || []).includes(opt);
                                                    return (
                                                        <div className="flex items-center space-x-3" key={i}>
                                                            <Checkbox
                                                                id={`q${q.id}-opt${i}`}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => handleMultipleChoice(q.id, opt, checked as boolean)}
                                                            />
                                                            <Label htmlFor={`q${q.id}-opt${i}`} className="font-normal cursor-pointer text-base">
                                                                {opt}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {q.questionType === "text_input" && (
                                            <Input
                                                placeholder="Type your answer here..."
                                                value={answers[q.id] || ""}
                                                onChange={(e) => handleTextInput(q.id, e.target.value)}
                                                className="max-w-md"
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button size="lg" onClick={handleSubmit} disabled={submitMutation.isPending} className="w-full md:w-auto">
                        {submitMutation.isPending ? "Evaluating..." : "Continue to Survey"}
                    </Button>
                </div>

            </div>
        </div>
    );
}
