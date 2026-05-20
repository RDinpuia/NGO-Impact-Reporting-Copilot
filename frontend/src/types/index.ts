/* ─── Shared TypeScript types for the frontend ───────────────────────── */

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Upload {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  row_count: number;
  column_names: string[];
  processed_data: ProcessedData;
  created_at: string;
}

export interface UploadListItem {
  id: string;
  filename: string;
  file_type: string;
  row_count: number;
  created_at: string;
}

export interface ProcessedData {
  kpis: KPIs;
  sentiment: SentimentData;
  region_breakdown: ChartItem[];
  monthly_trends: MonthlyTrend[];
  beneficiary_distribution: ChartItem[];
  sample_rows: Record<string, unknown>[];
}

export interface KPIs {
  total_records: number;
  total_columns?: number;
  total_beneficiaries?: number;
  avg_beneficiaries?: number;
  avg_attendance?: number;
  total_activities?: number;
  activity_types?: Record<string, number>;
  columns: string[];
}

export interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  score: number;
  details: { text: string; sentiment: string }[];
}

export interface ChartItem {
  name: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  value?: number;
  count: number;
}

export interface ReportContent {
  executive_summary: string;
  key_metrics: string;
  impact_narrative: string;
  challenges_recommendations: string;
}

export interface Report {
  id: string;
  user_id: string;
  upload_id: string;
  title: string;
  tone: "formal" | "storytelling" | "concise";
  content: ReportContent;
  kpis: KPIs;
  sentiment: SentimentData;
  status: "generating" | "completed" | "failed";
  created_at: string;
}

export interface ReportListItem {
  id: string;
  title: string;
  tone: string;
  status: string;
  upload_id: string;
  created_at: string;
}

export interface DashboardStats {
  kpis: {
    total_beneficiaries: number;
    total_activities: number;
    avg_attendance: number;
    sentiment_score: number;
    total_uploads: number;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  };
  region_breakdown: ChartItem[];
  monthly_trends: MonthlyTrend[];
  beneficiary_distribution: ChartItem[];
  recent_uploads: {
    id: string;
    filename: string;
    row_count: number;
    created_at: string;
  }[];
}
