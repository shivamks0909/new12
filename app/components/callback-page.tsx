"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type StatusTheme = {
  bg: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  accentText: string;
  borderColor: string;
};

const themes: Record<string, StatusTheme> = {
  complete: {
    bg: "linear-gradient(135deg, #0a2e1a 0%, #0d3320 30%, #0a2e1a 100%)",
    gradient: "linear-gradient(90deg, #10b981, #14b8a6, #06b6d4)",
    iconBg: "rgba(16, 185, 129, 0.15)",
    iconColor: "#10b981",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeText: "#34d399",
    accentText: "#6ee7b7",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  terminate: {
    bg: "linear-gradient(135deg, #2a0a0a 0%, #3b0d0d 30%, #2a0a0a 100%)",
    gradient: "linear-gradient(90deg, #ef4444, #ec4899, #f43f5e)",
    iconBg: "rgba(239, 68, 68, 0.15)",
    iconColor: "#ef4444",
    badgeBg: "rgba(239, 68, 68, 0.12)",
    badgeText: "#fca5a5",
    accentText: "#fca5a5",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  quotafull: {
    bg: "linear-gradient(135deg, #2a1a00 0%, #3b2506 30%, #2a1a00 100%)",
    gradient: "linear-gradient(90deg, #f59e0b, #f97316, #eab308)",
    iconBg: "rgba(245, 158, 11, 0.15)",
    iconColor: "#f59e0b",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeText: "#fcd34d",
    accentText: "#fcd34d",
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  security: {
    bg: "linear-gradient(135deg, #1a0a2e 0%, #1e0d3b 30%, #1a0a2e 100%)",
    gradient: "linear-gradient(90deg, #8b5cf6, #a78bfa, #7c3aed)",
    iconBg: "rgba(139, 92, 246, 0.15)",
    iconColor: "#8b5cf6",
    badgeBg: "rgba(139, 92, 246, 0.12)",
    badgeText: "#c4b5fd",
    accentText: "#c4b5fd",
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
};

const icons: Record<string, string> = {
  complete: "✓",
  terminate: "✕",
  quotafull: "⊘",
  security: "⚠",
};

interface CallbackPageProps {
  status: string;
  title: string;
  badge: string;
  description: string;
}

function CallbackContent({ status, title, badge, description }: CallbackPageProps) {
  const searchParams = useSearchParams();
  const theme = themes[status] || themes.terminate;

  const pid = searchParams.get("pid") || "N/A";
  const uid = searchParams.get("uid") || "N/A";
  const ip = searchParams.get("ip") || "N/A";
  const displayStatus = searchParams.get("status") || status;
  const country = searchParams.get("country") || "";
  const loi = searchParams.get("loi") || "—";
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const startTime = start ? new Date(parseInt(start) * 1000).toLocaleTimeString() : "—";
  const endTime = end ? new Date(parseInt(end) * 1000).toLocaleTimeString() : "—";

  return (
    <div
      style={{
        background: theme.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      {/* Animated gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.gradient,
          opacity: 0.08,
          animation: "hueShift 8s ease-in-out infinite",
        }}
      />

      <style>{`
        @keyframes hueShift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(45deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          textAlign: "center",
          animation: "fadeInUp 0.6s ease-out",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: theme.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            color: theme.iconColor,
            border: `2px solid ${theme.borderColor}`,
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          {icons[status]}
        </div>

        {/* Badge */}
        <div
          style={{
            background: theme.badgeBg,
            color: theme.badgeText,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: "9999px",
            padding: "4px 16px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: "16px",
            color: theme.accentText,
            maxWidth: "420px",
            lineHeight: 1.6,
            margin: 0,
            opacity: 0.9,
          }}
        >
          {description}
        </p>
      </div>

      {/* Response Record Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "460px",
          marginTop: "40px",
          animation: "fadeInUp 0.6s ease-out 0.2s both",
        }}
      >
        <div
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "20px",
              margin: "0 0 20px 0",
            }}
          >
            Response Record
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Project ID", value: pid },
              { label: "User ID", value: uid },
              { label: "Country", value: country || "—" },
              { label: "IP Address", value: ip },
              { label: "LOI (min)", value: loi },
              { label: "Start Time", value: startTime },
              { label: "End Time", value: endTime },
            ].map((row, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      color: "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
                {i < 6 && (
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255, 255, 255, 0.06)",
                      marginTop: "12px",
                    }}
                  />
                )}
              </div>
            ))}

            {/* Status row */}
            <div style={{ marginTop: "4px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                >
                  Status
                </span>
                <span
                  style={{
                    background: theme.badgeBg,
                    color: theme.badgeText,
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: "6px",
                    padding: "2px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {displayStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          marginTop: "32px",
          animation: "fadeInUp 0.6s ease-out 0.4s both",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.25)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          OpinionInsights Routing Platform
        </p>
      </div>
    </div>
  );
}

export default function CallbackPage(props: CallbackPageProps) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#94a3b8",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Loading...
        </div>
      }
    >
      <CallbackContent {...props} />
    </Suspense>
  );
}
