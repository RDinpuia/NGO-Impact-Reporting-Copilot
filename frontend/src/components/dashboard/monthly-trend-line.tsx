"use client";

import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
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
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] bg-slate-50 rounded-lg">
          <TrendingUp className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-muted-foreground mb-2">
            No trend data available. Start tracking activity.
          </p>
          <Link
            href="/dashboard/upload"
            className="text-sm text-teal-600 hover:text-teal-700 underline"
          >
            Upload data
          </Link>
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
          <LineChart
            data={formatted}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.5}
            />
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
