"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { uploadsApi } from "@/lib/api";
import type { Upload as UploadType } from "@/types";
import { toast } from "sonner";

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const accessToken = session?.accessToken;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadType | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!accessToken || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(20);
      setResult(null);

      try {
        setProgress(50);
        const data = await uploadsApi.upload(file, accessToken);
        setProgress(100);
        setResult(data);
        toast.success(`"${file.name}" processed successfully!`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
        setProgress(0);
      } finally {
        setUploading(false);
      }
    },
    [accessToken],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
        <p className="text-muted-foreground mt-1">
          Upload your field data to extract KPIs and generate impact reports
        </p>
      </div>

      {/* Dropzone */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">Drop your file here</p>
            ) : (
              <>
                <p className="text-lg font-medium">Drag & drop your data file</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </>
            )}
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary" className="gap-1">
                <FileSpreadsheet className="h-3 w-3" /> CSV
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <FileSpreadsheet className="h-3 w-3" /> Excel
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" /> TXT
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Max file size: 10 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {uploading && (
        <Card className="glass-card">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Processing your data...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">Parsing, cleaning, and extracting KPIs</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="glass-card border-green-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Processing Complete</CardTitle>
            </div>
            <CardDescription>{result.filename} — {result.row_count} rows processed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {result.processed_data.kpis.total_beneficiaries !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{result.processed_data.kpis.total_beneficiaries.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Beneficiaries</p>
                </div>
              )}
              {result.processed_data.kpis.total_activities !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{result.processed_data.kpis.total_activities}</p>
                  <p className="text-xs text-muted-foreground">Activities</p>
                </div>
              )}
              {result.processed_data.kpis.avg_attendance !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{result.processed_data.kpis.avg_attendance}</p>
                  <p className="text-xs text-muted-foreground">Avg Attendance</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{result.processed_data.sentiment.score}%</p>
                <p className="text-xs text-muted-foreground">Sentiment</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => router.push(`/reports?upload=${result.id}`)} className="flex-1 gap-2">
                Generate Impact Report <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => { setResult(null); setProgress(0); }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
