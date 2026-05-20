"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type FileRejection, useDropzone } from "react-dropzone";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Table2,
  Upload,
} from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!accessToken) {
        setError("Your session is not ready. Please refresh and sign in again.");
        return;
      }
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(20);
      setResult(null);
      setError(null);

      try {
        setProgress(50);
        const data = await uploadsApi.upload(file, accessToken);
        setProgress(100);
        setResult(data);
        toast.success(`"${file.name}" processed successfully`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        toast.error(message);
        setProgress(0);
      } finally {
        setUploading(false);
      }
    },
    [accessToken],
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const firstError = fileRejections[0]?.errors[0];
    const message =
      firstError?.code === "file-too-large"
        ? "That file is larger than 10 MB."
        : firstError?.code === "file-invalid-type"
          ? "Use a CSV, Excel, or TXT file."
          : firstError?.message || "That file could not be uploaded.";

    setResult(null);
    setProgress(0);
    setError(message);
    toast.error(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
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

  const totalColumns = result?.processed_data.kpis.total_columns ?? result?.column_names.length ?? 0;
  const totalRecords = result?.processed_data.kpis.total_records ?? result?.row_count ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
        <p className="mt-1 text-muted-foreground">
          Add CSV, Excel, or text data for dashboards and reports
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-12 ${
              isDragActive
                ? "scale-[1.01] border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="mb-4 rounded-2xl bg-primary/10 p-4">
              {uploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
            </div>
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">Drop your file here</p>
            ) : uploading ? (
              <>
                <p className="text-lg font-medium">Uploading and processing</p>
                <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">Drag & drop your data file</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              </>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
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
            <p className="mt-3 text-xs text-muted-foreground">Max file size: 10 MB</p>
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <Card className="glass-card">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Processing your data...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">Parsing, cleaning, and extracting available metrics</p>
          </CardContent>
        </Card>
      )}

      {error && !uploading && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Upload failed</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setError(null)} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="glass-card border-green-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Processing Complete</CardTitle>
            </div>
            <CardDescription>
              {result.filename} - {result.row_count.toLocaleString()} rows processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Rows</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{totalColumns.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Columns</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">
                  {result.processed_data.kpis.total_beneficiaries?.toLocaleString() ?? "0"}
                </p>
                <p className="text-xs text-muted-foreground">People</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{result.processed_data.sentiment.score}%</p>
                <p className="text-xs text-muted-foreground">Sentiment</p>
              </div>
            </div>

            {result.column_names.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Table2 className="h-4 w-4 text-primary" />
                  Detected columns
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.column_names.slice(0, 12).map((column) => (
                    <Badge key={column} variant="secondary" className="max-w-full truncate">
                      {column}
                    </Badge>
                  ))}
                  {result.column_names.length > 12 && (
                    <Badge variant="outline">+{result.column_names.length - 12}</Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button onClick={() => router.push(`/reports?upload=${result.id}`)} className="flex-1 gap-2">
                Generate Impact Report <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setProgress(0);
                  setError(null);
                }}
              >
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
