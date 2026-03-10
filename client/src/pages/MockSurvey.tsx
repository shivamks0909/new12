import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function MockSurvey() {
    const [params] = useSearch();
    const oiSession = new URLSearchParams(params).get("oi_session");
    const [, setLocation] = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: logic } = useQuery({
        queryKey: ["/api/survey-logic", { oi_session: oiSession }],
        queryFn: async () => {
            const res = await fetch(`/api/survey-logic?oi_session=${oiSession}`);
            return res.json();
        },
        enabled: !!oiSession,
    });

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            if (logic?.status) {
                window.location.href = `/track/${logic.status}?oi_session=${oiSession}`;
            }
        }, 5000); // Wait 5 seconds as requested
    };

    if (!oiSession) return <div>Invalid Session</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Consumer Insights Survey</CardTitle>
                    <CardDescription>Mock Survey Platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">How often do you purchase electronic gadgets online?</h3>
                        <RadioGroup defaultValue="weekly">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="daily" id="r1" />
                                <Label htmlFor="r1">Daily</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="weekly" id="r2" />
                                <Label htmlFor="r2">Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="monthly" id="r3" />
                                <Label htmlFor="r3">Monthly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="rarely" id="r4" />
                                <Label htmlFor="r4">Rarely</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Response...
                            </>
                        ) : (
                            "Submit Answer"
                        )}
                    </Button>

                    {isSubmitting && (
                        <p className="text-center text-sm text-gray-500 animate-pulse">
                            Simulating survey platform processing (5s)...
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
