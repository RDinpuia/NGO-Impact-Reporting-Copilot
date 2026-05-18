"use client";

import { Users, Activity, BarChart3, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsProps {
  kpis: {
    total_beneficiaries: number;
    total_activities: number;
    avg_attendance: number;
    sentiment_score: number;
  };
}

const cards = [
  { key: "total_beneficiaries", label: "Total Beneficiaries", icon: Users, format: (v: number) => v.toLocaleString(), color: "text-chart-1" },
  { key: "total_activities", label: "Activity Types", icon: Activity, format: (v: number) => v.toString(), color: "text-chart-2" },
  { key: "avg_attendance", label: "Avg Attendance", icon: BarChart3, format: (v: number) => v.toFixed(1), color: "text-chart-3" },
  { key: "sentiment_score", label: "Sentiment Score", icon: Heart, format: (v: number) => `${v}%`, color: "text-chart-5" },
] as const;

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = kpis[card.key as keyof typeof kpis] ?? 0;
        return (
          <Card key={card.key} className="glass-card hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{card.format(value)}</p>
                </div>
                <div className={`p-3 rounded-xl bg-primary/10 ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
