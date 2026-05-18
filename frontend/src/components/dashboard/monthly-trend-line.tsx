"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyTrend } from "@/types";

interface MonthlyTrendLineProps {
  data: MonthlyTrend[];
}

export function MonthlyTrendLine({ data }: MonthlyTrendLineProps) {
  if (data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No trend data available
        </CardContent>
      </Card>
    );
  }

  // Format month labels for display
  const formatted = data.map((d) => ({
    ...d,
    label: d.month.length > 7 ? d.month.slice(0, 7) : d.month,
  }));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Monthly Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
            />
            {data[0]?.value !== undefined && (
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                dot={{ fill: "var(--color-chart-1)", r: 4 }}
                name="Beneficiaries"
              />
            )}
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "var(--color-chart-3)", r: 3 }}
              name="Activities"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
