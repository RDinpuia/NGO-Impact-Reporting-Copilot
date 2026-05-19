"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Loader2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportsApi, uploadsApi } from "@/lib/api";
import type { ReportListItem, UploadListItem } from "@/types";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const preselectedUpload = searchParams.get("upload");
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [uploads, setUploads] = useState<UploadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(!!preselectedUpload);
  const [selectedUpload, setSelectedUpload] = useState<string | null>(
    preselectedUpload,
  );
  const [tone, setTone] = useState<string | null>("formal");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!session?.accessToken) return;
    Promise.all([
      reportsApi.list(session.accessToken),
      uploadsApi.list(session.accessToken),
    ])
      .then(([r, u]) => {
        setReports(r);
        setUploads(u);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleGenerate = async () => {
    if (!session?.accessToken || !selectedUpload) return;
    setGenerating(true);
    try {
      const report = await reportsApi.generate(
        selectedUpload,
        tone ?? "formal",
        title,
        session.accessToken,
      );
      toast.success("Report generated!");
      setReports((prev) => [
        {
          id: report.id,
          title: report.title,
          tone: report.tone,
          status: report.status,
          upload_id: report.upload_id,
          created_at: report.created_at,
        },
        ...prev,
      ]);
      setShowGenerate(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            AI-generated impact reports
          </p>
        </div>
        <Button
          onClick={() => setShowGenerate(!showGenerate)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> New Report
        </Button>
      </div>

      {showGenerate && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Generate Report
            </CardTitle>
            <CardDescription>Select a dataset and tone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dataset</Label>
                <Select
                  value={selectedUpload}
                  onValueChange={setSelectedUpload}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uploads.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.filename} ({u.row_count} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="storytelling">Storytelling</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedUpload || generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate"}
            </Button>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-16">
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium">No reports yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`}>
              <Card className="glass-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{r.status}</Badge>
                  </div>
                  <h3 className="font-semibold line-clamp-2">{r.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {r.tone}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
