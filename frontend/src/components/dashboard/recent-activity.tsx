"use client";

import Link from "next/link";
import { FileText, Upload as UploadIcon, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReportListItem } from "@/types";

interface RecentActivityProps {
  uploads: {
    id: string;
    filename: string;
    row_count: number;
    created_at: string;
  }[];
  reports: ReportListItem[];
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity({ uploads, reports }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Uploads */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Uploads</CardTitle>
          <Link href="/upload" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {uploads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No uploads yet
            </p>
          ) : (
            uploads.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <UploadIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.row_count} rows
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeAgo(u.created_at)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Reports</CardTitle>
          <Link
            href="/reports"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No reports generated yet
            </p>
          ) : (
            reports.map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <FileText className="h-4 w-4 text-chart-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    {r.tone}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeAgo(r.created_at)}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
