import * as React from "react";

import { type IntegrationIcon as IntegrationIconName } from "@portier-sync/api";
import { cn } from "@portier-sync/ui/lib/utils";
import {
  CloudIcon,
  CreditCardIcon,
  MailIcon,
  MessageSquareIcon,
  TargetIcon,
  TicketIcon,
} from "lucide-react";

const integrationIconMap: Record<IntegrationIconName, React.ComponentType<{ className?: string }>> = {
  cloud: CloudIcon,
  target: TargetIcon,
  "credit-card": CreditCardIcon,
  "message-square": MessageSquareIcon,
  ticket: TicketIcon,
  mail: MailIcon,
};

export function IntegrationIcon({ icon, className }: { icon: IntegrationIconName; className?: string }) {
  const Icon = integrationIconMap[icon];
  return <Icon className={cn("size-5 text-muted-foreground", className)} aria-hidden />;
}
