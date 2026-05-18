"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentPieProps {
  sentiment: { positive: number; negative: number; neutral: number; total: number };
}

const COLORS = [
  "oklch(0.55 0.15 145)",   // green - positive
  "oklch(0.6 0.2 25)",      // red - negative
  "oklch(0.7 0.05 260)",    // gray - neutral
];

export function SentimentPie({ sentiment }: SentimentPieProps) {
  const data = [
    { name: "Positive", value: sentiment.positive },
    { name: "Negative", value: sentiment.negative },
    { name: "Neutral", value: sentiment.neutral },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No sentiment data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
