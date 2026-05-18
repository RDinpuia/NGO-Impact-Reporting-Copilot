"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartItem } from "@/types";

interface BeneficiaryDistributionProps {
  data: ChartItem[];
}

const COLORS = [
  "oklch(0.45 0.12 180)",
  "oklch(0.55 0.15 145)",
  "oklch(0.6 0.12 250)",
  "oklch(0.7 0.14 80)",
  "oklch(0.55 0.2 330)",
  "oklch(0.65 0.1 200)",
];

export function BeneficiaryDistribution({ data }: BeneficiaryDistributionProps) {
  if (data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Beneficiary Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No distribution data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Beneficiary Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="count" paddingAngle={3} strokeWidth={2} stroke="var(--color-card)">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
