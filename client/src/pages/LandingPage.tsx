import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function LandingPage() {
    const [params] = useSearch();
    const oiSession = new URLSearchParams(params).get("oi_session");
    const [, setLocation] = useLocation();
    const [progress, setProgress] = useState(0);

    const { data: info } = useQuery({
        queryKey: ["/api/landing-info", { oi_session: oiSession }],
        queryFn: async () => {
            const res = await fetch(`/api/landing-info?oi_session=${oiSession}`);
            return res.json();
        },
        enabled: !!oiSession,
    });

    useEffect(() => {
        if (oiSession) {
            const timer = setInterval(() => {
                setProgress((old) => {
                    if (old >= 100) {
                        clearInterval(timer);
                        if (info?.clientSurveyUrl) {
                            window.location.href = info.clientSurveyUrl;
                        } else {
                            setLocation(`/survey?oi_session=${oiSession}`);
                        }
                        return 100;
                    }
                    return old + 5;
                });
            }, 100);
            return () => clearInterval(timer);
        }
    }, [oiSession, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle className="text-center text-primary">Opinion Routing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-gray-600">
                        {info?.message || "Preparing your survey experience..."}
                    </p>
                    <div className="space-y-2">
                        <Progress value={progress} className="w-full" />
                        <p className="text-xs text-center text-gray-400 italic">
                            Redirecting to survey in a moment...
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
