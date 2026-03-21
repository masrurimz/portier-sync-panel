import { type Integration, type IntegrationOperatorStatus } from "@portier-sync/api";
import { Badge } from "@portier-sync/ui/components/badge";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ShieldAlertIcon,
} from "lucide-react";

export function StatusBadge({ status }: { status: Integration["status"] }) {
  const Icon =
    status === "synced"
      ? CheckCircle2Icon
      : status === "syncing"
        ? CircleDashedIcon
        : status === "conflict"
          ? ShieldAlertIcon
          : AlertTriangleIcon;

  const label =
    status === "synced"
      ? "Synced"
      : status === "syncing"
        ? "Syncing"
        : status === "conflict"
          ? "Conflict"
          : "Error";

  if (status === "conflict") {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/8">
        <Icon data-icon="inline-start" />
        {label}
      </Badge>
    );
  }

  const variant = status === "error" ? "destructive" : status === "syncing" ? "outline" : "secondary";

  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  );
}

export function OperatorStatusBadge({ status }: { status: IntegrationOperatorStatus }) {
  const config: Record<
    IntegrationOperatorStatus,
    { label: string; variant: "secondary" | "outline" | "destructive"; className?: string }
  > = {
    "up-to-date": { label: "Synced", variant: "secondary" },
    "preview-ready": {
      label: "Preview ready",
      variant: "outline",
      className: "border-blue-500/50 text-blue-600 bg-blue-500/8",
    },
    "conflicts-need-review": {
      label: "Conflicts to resolve",
      variant: "outline",
      className: "border-amber-500/50 text-amber-600 bg-amber-500/8",
    },
    "stale-draft": {
      label: "Stale draft",
      variant: "outline",
      className: "border-orange-500/50 text-orange-600 bg-orange-500/8",
    },
    "applying-locally": { label: "Applying…", variant: "outline" },
    "applied-locally": {
      label: "Applied locally",
      variant: "outline",
      className: "border-emerald-500/50 text-emerald-600 bg-emerald-500/8",
    },
    "remote-unavailable": { label: "Error", variant: "destructive" },
    "backend-syncing": {
      label: "Syncing",
      variant: "outline",
      className: "border-sky-500/50 text-sky-600 bg-sky-500/8",
    },
    "backend-conflict": {
      label: "Conflict",
      variant: "outline",
      className: "border-amber-500/50 text-amber-600 bg-amber-500/8",
    },
  };

  const { label, variant, className } = config[status];
  return <Badge variant={variant} className={className}>{label}</Badge>;
}
