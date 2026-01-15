const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Sessions API
export const sessionsApi = {
  list: () => api<any[]>("/api/sessions"),
  get: (id: string) => api<any>(`/api/sessions/${id}`),
  create: (data: { name: string; workingDirectory: string; mode?: string; config?: any }) =>
    api<any>("/api/sessions", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    api<any>(`/api/sessions/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<any>(`/api/sessions/${id}`, { method: "DELETE" }),
  start: (id: string, prompt?: string) =>
    api<any>(`/api/sessions/${id}/start`, { method: "POST", body: { prompt } }),
  stop: (id: string) =>
    api<any>(`/api/sessions/${id}/stop`, { method: "POST" }),
  pause: (id: string) =>
    api<any>(`/api/sessions/${id}/pause`, { method: "POST" }),
  resume: (id: string) =>
    api<any>(`/api/sessions/${id}/resume`, { method: "POST" }),
  sendInput: (id: string, input: string) =>
    api<any>(`/api/sessions/${id}/input`, { method: "POST", body: { input } }),
  getOutput: (id: string) => api<any>(`/api/sessions/${id}/output`),
};

// MCP API
export const mcpApi = {
  list: () => api<any[]>("/api/mcp"),
  get: (id: string) => api<any>(`/api/mcp/${id}`),
  create: (data: { name: string; config: any }) =>
    api<any>("/api/mcp", { method: "POST", body: data }),
  delete: (id: string) =>
    api<any>(`/api/mcp/${id}`, { method: "DELETE" }),
  start: (id: string) =>
    api<any>(`/api/mcp/${id}/start`, { method: "POST" }),
  stop: (id: string) =>
    api<any>(`/api/mcp/${id}/stop`, { method: "POST" }),
  restart: (id: string) =>
    api<any>(`/api/mcp/${id}/restart`, { method: "POST" }),
  getLogs: (id: string, limit?: number) =>
    api<any>(`/api/mcp/${id}/logs?limit=${limit || 100}`),
};

// Rules API
export const rulesApi = {
  getAll: () => api<any>("/api/rules"),
  getHardRules: () => api<any[]>("/api/rules/hard"),
  addHardRule: (rule: string, createdBy: string) =>
    api<any>("/api/rules/hard", { method: "POST", body: { rule, createdBy } }),
  removeHardRule: (id: string) =>
    api<any>(`/api/rules/hard/${id}`, { method: "DELETE" }),
  getDefaultRules: () => api<string[]>("/api/rules/default"),
  setDefaultRules: (rules: string[]) =>
    api<any>("/api/rules/default", { method: "PUT", body: { rules } }),
  getSessionRules: (sessionId: string) =>
    api<string[]>(`/api/rules/session/${sessionId}`),
  setSessionRules: (sessionId: string, rules: string[]) =>
    api<any>(`/api/rules/session/${sessionId}`, { method: "PUT", body: { rules } }),
};

// Usage API
export const usageApi = {
  getSummary: () => api<any>("/api/usage"),
  getHistory: (days?: number) =>
    api<any[]>(`/api/usage/history?days=${days || 7}`),
  getBySession: () => api<any>("/api/usage/sessions"),
  getAlerts: () => api<any[]>("/api/usage/alerts"),
};

// Git API
export const gitApi = {
  getStatus: (directory?: string) =>
    api<any>(`/api/git/status${directory ? `?directory=${encodeURIComponent(directory)}` : ""}`),
  getBranches: (directory?: string) =>
    api<any>(`/api/git/branches${directory ? `?directory=${encodeURIComponent(directory)}` : ""}`),
  getLog: (directory?: string, limit?: number) =>
    api<any[]>(
      `/api/git/log?limit=${limit || 20}${directory ? `&directory=${encodeURIComponent(directory)}` : ""}`
    ),
  getDiff: (directory?: string, file?: string, staged?: boolean) => {
    const params = new URLSearchParams();
    if (directory) params.set("directory", directory);
    if (file) params.set("file", file);
    if (staged) params.set("staged", "true");
    return api<any>(`/api/git/diff?${params.toString()}`);
  },
  runCommand: (command: string, directory?: string) =>
    api<any>("/api/git/command", { method: "POST", body: { command, directory } }),
};
