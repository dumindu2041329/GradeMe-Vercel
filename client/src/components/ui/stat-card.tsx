import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-semibold mt-1 text-foreground">{value}</h3>
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              `bg-${color}-500/20`
            )}
          >
            <Icon className={cn("h-6 w-6", `text-${color}-500`)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
