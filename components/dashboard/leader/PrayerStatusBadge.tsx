"use client";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string, className: string, icon: any }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200", icon: Clock },
  ANSWER: { label: "Exaucé", className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200", icon: CheckCircle2 },
  FAILED: { label: "Non exaucé", className: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200", icon: XCircle },
};

export function PrayerStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} flex w-fit items-center gap-1 shadow-sm`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}