import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AdminStatCard({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: number | string; helper?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          {helper ? <p className="mt-1 text-xs text-neutral-400">{helper}</p> : null}
        </div>
        <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
