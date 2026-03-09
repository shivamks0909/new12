import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "complete"
  | "terminate"
  | "quotafull"
  | "security_terminate"
  | "security-terminate"
  | "started"
  | "active"
  | "paused"
  | "closed"
  | "archived"
  | "duplicate";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  complete: {
    label: "Complete",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  terminate: {
    label: "Terminate",
    className: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
  quotafull: {
    label: "Quota Full",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  security_terminate: {
    label: "Security Terminate",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300",
  },
  "security-terminate": {
    label: "Security Terminate",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300",
  },
  started: {
    label: "Started",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  },
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300",
  },
  duplicate: {
    label: "Duplicate",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    className: "bg-secondary text-secondary-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "no-default-hover-elevate border-transparent font-medium",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
