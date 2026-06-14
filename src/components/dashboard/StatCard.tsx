import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "primary" | "accent" | "default" | "warning";
}

export function StatCard({ label, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const iconBg = {
    primary: "gradient-primary text-primary-foreground",
    accent: "gradient-accent text-accent-foreground",
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-warning/20 text-warning-foreground",
  }[variant];

  return (
    <Card className="p-6 border-border/60 shadow-soft gradient-card hover:shadow-elegant transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="font-display text-3xl text-foreground">{value}</p>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
