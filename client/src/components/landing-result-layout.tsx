import { useSearch } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Info, ShieldAlert, Ban } from "lucide-react";

type ColorTheme = "success" | "error" | "warning" | "info" | "dark" | "secondary";

const themeConfig: Record<ColorTheme, { bg: string; text: string; badge: string; accent: string; icon: typeof CheckCircle; gradient: string }> = {
  success: {
    bg: "from-emerald-950 via-emerald-900 to-emerald-950",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    accent: "text-emerald-300",
    icon: CheckCircle,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  error: {
    bg: "from-rose-950 via-rose-900 to-rose-950",
    text: "text-rose-400",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    accent: "text-rose-300",
    icon: XCircle,
    gradient: "from-rose-500 via-pink-500 to-red-500",
  },
  warning: {
    bg: "from-amber-950 via-amber-900 to-amber-950",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    accent: "text-amber-300",
    icon: AlertTriangle,
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
  },
  info: {
    bg: "from-sky-950 via-sky-900 to-sky-950",
    text: "text-sky-400",
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    accent: "text-sky-300",
    icon: Info,
    gradient: "from-sky-500 via-blue-500 to-cyan-500",
  },
  dark: {
    bg: "from-slate-950 via-slate-900 to-slate-950",
    text: "text-slate-400",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    accent: "text-slate-300",
    icon: ShieldAlert,
    gradient: "from-slate-500 via-gray-500 to-zinc-500",
  },
  secondary: {
    bg: "from-indigo-950 via-indigo-900 to-indigo-950",
    text: "text-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    accent: "text-indigo-300",
    icon: Ban,
    gradient: "from-indigo-500 via-violet-500 to-purple-500",
  },
};

interface LandingResultLayoutProps {
  title: string;
  badgeText: string;
  description: string;
  theme: ColorTheme;
}

export function LandingResultLayout({ title, badgeText, description, theme }: LandingResultLayoutProps) {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const projectId = params.get("pid") || params.get("project_id") || "N/A";
  const userId = params.get("uid") || params.get("user_id") || "N/A";
  const ipAddress = params.get("ip") || params.get("ip_address") || "N/A";
  const status = params.get("status") || badgeText;

  const config = themeConfig[theme];
  const Icon = config.icon;

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${config.bg} overflow-hidden`} data-testid="landing-result-container">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-[0.13]`}
        style={{ animation: "rainbowShift 8s ease-in-out infinite" }}
        data-testid="landing-gradient-animation"
      />

      <style>{`
        @keyframes rainbowShift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(60deg); }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center flex-1 justify-center">
        <Icon className={`w-16 h-16 ${config.text}`} data-testid="landing-icon" />

        <Badge
          variant="outline"
          className={`${config.badge} no-default-hover-elevate text-sm px-3 py-1`}
          data-testid="landing-badge"
        >
          {badgeText}
        </Badge>

        <h1 className={`text-4xl font-bold tracking-tight text-white sm:text-5xl`} data-testid="landing-title">
          {title}
        </h1>

        <p className={`max-w-md text-lg ${config.accent}`} data-testid="landing-description">
          {description}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pb-8" data-testid="landing-record-table">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-md p-5">
          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4" data-testid="text-record-header">
            Response Record
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50" data-testid="label-project-id">Project ID</span>
              <span className="text-sm font-mono text-white/90" data-testid="text-project-id">{projectId}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50" data-testid="label-user-id">User ID</span>
              <span className="text-sm font-mono text-white/90" data-testid="text-user-id">{userId}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50" data-testid="label-ip-address">IP Address</span>
              <span className="text-sm font-mono text-white/90" data-testid="text-ip-address">{ipAddress}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50" data-testid="label-status">Status</span>
              <Badge
                variant="outline"
                className={`${config.badge} no-default-hover-elevate text-xs`}
                data-testid="text-status"
              >
                {status}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
