/**
 * API client for communicating with the FastAPI backend.
 * Wraps fetch with auth token injection and error handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add auth header if token available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add content-type for JSON bodies (not for FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Request failed" }));
    let message = "Request failed";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.join("; ");
    } else if (Array.isArray(data?.errors)) {
      message = data.errors.join("; ");
    } else if (data?.detail?.errors && Array.isArray(data.detail.errors)) {
      message = data.detail.errors.join("; ");
    } else if (typeof data?.detail === "object") {
      message = JSON.stringify(data.detail);
    }

    throw new ApiError(message || `Error ${res.status}`, res.status);
  }

  // Handle PDF/blob responses
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/pdf")) {
    return (await res.blob()) as unknown as T;
  }

  return res.json();
}

/* ─── Auth ────────────────────────────────────────────────────────────── */

export const authApi = {
  login: (email: string, password: string) =>
    request<import("@/types").TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<import("@/types").TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  me: (token: string) =>
    request<import("@/types").User>("/api/auth/me", {}, token),
};

/* ─── Uploads ─────────────────────────────────────────────────────────── */

export const uploadsApi = {
  upload: (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<import("@/types").Upload>(
      "/api/uploads/",
      { method: "POST", body: formData },
      token,
    );
  },

  list: (token: string) =>
    request<import("@/types").UploadListItem[]>("/api/uploads/", {}, token),

  get: (id: string, token: string) =>
    request<import("@/types").Upload>(`/api/uploads/${id}`, {}, token),
};

/* ─── Dashboard ───────────────────────────────────────────────────────── */

export const dashboardApi = {
  stats: (token: string) =>
    request<import("@/types").DashboardStats>(
      "/api/dashboard/stats",
      {},
      token,
    ),
};

/* ─── Reports ─────────────────────────────────────────────────────────── */

export const reportsApi = {
  generate: (uploadId: string, tone: string, title: string, token: string) =>
    request<import("@/types").Report>(
      "/api/reports/generate",
      {
        method: "POST",
        body: JSON.stringify({ upload_id: uploadId, tone, title }),
      },
      token,
    ),

  list: (token: string) =>
    request<import("@/types").ReportListItem[]>("/api/reports/", {}, token),

  get: (id: string, token: string) =>
    request<import("@/types").Report>(`/api/reports/${id}`, {}, token),

  downloadPdf: (id: string, token: string) =>
    request<Blob>(`/api/reports/${id}/pdf`, {}, token),
};

export { ApiError };
