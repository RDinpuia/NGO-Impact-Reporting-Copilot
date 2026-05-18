"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { dashboardApi, reportsApi } from "@/lib/api";
import type { DashboardStats, ReportListItem } from "@/types";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SentimentPie } from "@/components/dashboard/sentiment-pie";
import { RegionBarChart } from "@/components/dashboard/region-bar-chart";
import { MonthlyTrendLine } from "@/components/dashboard/monthly-trend-line";
import { BeneficiaryDistribution } from "@/components/dashboard/beneficiary-distribution";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async () => {
      try {
        const [statsData, reportsData] = await Promise.all([
          dashboardApi.stats(session.accessToken),
          reportsApi.list(session.accessToken),
        ]);
        setStats(statsData);
        setReports(reportsData);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading your impact overview...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">No data available yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Upload your first dataset to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your impact at a glance — {stats.kpis.total_uploads} dataset{stats.kpis.total_uploads !== 1 ? "s" : ""} processed
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={stats.kpis} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentPie sentiment={stats.sentiment} />
        <RegionBarChart data={stats.region_breakdown} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendLine data={stats.monthly_trends} />
        <BeneficiaryDistribution data={stats.beneficiary_distribution} />
      </div>

      {/* Recent Activity */}
      <RecentActivity uploads={stats.recent_uploads} reports={reports.slice(0, 5)} />
    </div>
  );
}
