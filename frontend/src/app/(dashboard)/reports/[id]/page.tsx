"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { reportsApi } from "@/lib/api";
import type { Report } from "@/types";
import { toast } from "sonner";

export default function ReportDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!session?.accessToken || !reportId) return;
    reportsApi
      .get(reportId, session.accessToken)
      .then(setReport)
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, [session?.accessToken, reportId]);

  const handleDownloadPdf = async () => {
    if (!session?.accessToken || !reportId) return;
    setDownloading(true);
    try {
      const blob = await reportsApi.downloadPdf(reportId, session.accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report?.title || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Report not found</p>
        <Link href="/reports">
          <Button variant="outline" className="mt-4">
            Back to Reports
          </Button>
        </Link>
      </div>
    );
  }

  const sections = [
    { title: "Executive Summary", content: report.content.executive_summary },
    { title: "Key Impact Metrics", content: report.content.key_metrics },
    { title: "Impact Narrative", content: report.content.impact_narrative },
    {
      title: "Challenges & Recommendations",
      content: report.content.challenges_recommendations,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Reports
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{report.tone}</Badge>
            <Badge variant="secondary">{report.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(report.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <Button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="gap-2 shrink-0"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {(report.kpis.total_beneficiaries || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Beneficiaries</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {report.kpis.total_activities || 0}
            </p>
            <p className="text-xs text-muted-foreground">Activities</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {report.kpis.avg_attendance || 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Attendance</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{report.sentiment.score}%</p>
            <p className="text-xs text-muted-foreground">Sentiment</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Report Content */}
      {sections.map((section) =>
        section.content ? (
          <Card key={section.title} className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ) : null,
      )}
    </div>
  );
}
