const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

// Workflows API
export const workflowsApi = {
  list: () => api<any[]>("/api/workflows"),
  get: (id: string) => api<any>(`/api/workflows/${id}`),
  getStats: () => api<any>("/api/workflows/stats"),
  create: (data: { name: string; description: string; steps: any[] }) =>
    api<any>("/api/workflows", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    api<any>(`/api/workflows/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<any>(`/api/workflows/${id}`, { method: "DELETE" }),
  run: (id: string, initialInput?: string) =>
    api<any>(`/api/workflows/${id}/run`, { method: "POST", body: { initialInput } }),
  stop: (id: string) =>
    api<any>(`/api/workflows/${id}/stop`, { method: "POST" }),
};

// Automations API
export const automationsApi = {
  list: () => api<any[]>("/api/automations"),
  get: (id: string) => api<any>(`/api/automations/${id}`),
  getStats: () => api<any>("/api/automations/stats"),
  getLogs: (id: string, limit?: number) =>
    api<any[]>(`/api/automations/${id}/logs?limit=${limit || 50}`),
  create: (data: { name: string; description: string; trigger: any; workflowId?: string; sessionConfig?: any }) =>
    api<any>("/api/automations", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    api<any>(`/api/automations/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<any>(`/api/automations/${id}`, { method: "DELETE" }),
  activate: (id: string) =>
    api<any>(`/api/automations/${id}/activate`, { method: "POST" }),
  pause: (id: string) =>
    api<any>(`/api/automations/${id}/pause`, { method: "POST" }),
  run: (id: string) =>
    api<any>(`/api/automations/${id}/run`, { method: "POST" }),
};

// Knowledge API
export const knowledgeApi = {
  list: () => api<any[]>("/api/knowledge"),
  get: (id: string) => api<any>(`/api/knowledge/${id}`),
  getStats: () => api<any>("/api/knowledge/stats"),
  search: (query: string) => api<any[]>(`/api/knowledge/search?q=${encodeURIComponent(query)}`),
  getForSession: (sessionId: string) => api<any[]>(`/api/knowledge/session/${sessionId}`),
  generateClaudeMd: (sessionId: string) =>
    fetch(`${API_BASE}/api/knowledge/session/${sessionId}/claude-md`).then((r) => r.text()),
  create: (data: { title: string; description: string; type: string; content: string; tags: string[] }) =>
    api<any>("/api/knowledge", { method: "POST", body: data }),
  import: (filePath: string) =>
    api<any>("/api/knowledge/import", { method: "POST", body: { filePath } }),
  update: (id: string, data: any) =>
    api<any>(`/api/knowledge/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<any>(`/api/knowledge/${id}`, { method: "DELETE" }),
  sync: (id: string) =>
    api<any>(`/api/knowledge/${id}/sync`, { method: "POST" }),
  addToSession: (id: string, sessionId: string) =>
    api<any>(`/api/knowledge/${id}/sessions/${sessionId}`, { method: "POST" }),
  removeFromSession: (id: string, sessionId: string) =>
    api<any>(`/api/knowledge/${id}/sessions/${sessionId}`, { method: "DELETE" }),
};

// Tasks API
export const tasksApi = {
  list: () => api<any[]>("/api/tasks"),
  get: (id: string) => api<any>(`/api/tasks/${id}`),
  getBoard: () => api<any>("/api/tasks/board"),
  getStats: () => api<any>("/api/tasks/stats"),
  getOverdue: () => api<any[]>("/api/tasks/overdue"),
  getByStatus: (status: string) => api<any[]>(`/api/tasks/status/${status}`),
  getBySession: (sessionId: string) => api<any[]>(`/api/tasks/session/${sessionId}`),
  create: (data: { title: string; description: string; priority: string; tags?: string[]; dueDate?: string }) =>
    api<any>("/api/tasks", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    api<any>(`/api/tasks/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<any>(`/api/tasks/${id}`, { method: "DELETE" }),
  move: (id: string, status: string) =>
    api<any>(`/api/tasks/${id}/move/${status}`, { method: "POST" }),
  assign: (id: string, sessionId: string) =>
    api<any>(`/api/tasks/${id}/assign/${sessionId}`, { method: "POST" }),
  unassign: (id: string) =>
    api<any>(`/api/tasks/${id}/unassign`, { method: "POST" }),
};

// Chains API
export const chainsApi = {
  list: () => api<any[]>("/api/chains"),
  get: (id: string) => api<any>(`/api/chains/${id}`),
  getStats: () => api<any>("/api/chains/stats"),
  create: (data: { name: string; description: string; steps: { name: string; model: string; prompt: string; systemPrompt?: string }[] }) =>
    api<any>("/api/chains", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    api<any>(`/api/chains/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<any>(`/api/chains/${id}`, { method: "DELETE" }),
  run: (id: string, initialInput?: string) =>
    api<any>(`/api/chains/${id}/run`, { method: "POST", body: { initialInput } }),
  stop: (id: string) =>
    api<any>(`/api/chains/${id}/stop`, { method: "POST" }),
};

// Alerts API
export const alertsApi = {
  list: (includeAcknowledged?: boolean) =>
    api<any[]>(`/api/alerts?includeAcknowledged=${includeAcknowledged !== false}`),
  getActive: () => api<any[]>("/api/alerts/active"),
  get: (id: string) => api<any>(`/api/alerts/${id}`),
  getStats: () => api<any>("/api/alerts/stats"),
  acknowledge: (id: string) =>
    api<any>(`/api/alerts/${id}/acknowledge`, { method: "POST" }),
  acknowledgeAll: () =>
    api<any>("/api/alerts/acknowledge-all", { method: "POST" }),
  delete: (id: string) =>
    api<any>(`/api/alerts/${id}`, { method: "DELETE" }),
  // Rules
  listRules: () => api<any[]>("/api/alerts/rules"),
  getRule: (id: string) => api<any>(`/api/alerts/rules/${id}`),
  createRule: (data: { name: string; description: string; condition: any; type: string }) =>
    api<any>("/api/alerts/rules", { method: "POST", body: data }),
  updateRule: (id: string, data: any) =>
    api<any>(`/api/alerts/rules/${id}`, { method: "PATCH", body: data }),
  toggleRule: (id: string) =>
    api<any>(`/api/alerts/rules/${id}/toggle`, { method: "POST" }),
  deleteRule: (id: string) =>
    api<any>(`/api/alerts/rules/${id}`, { method: "DELETE" }),
};

// Notifications API
export const notificationsApi = {
  list: (limit?: number) => api<any[]>(`/api/notifications?limit=${limit || 100}`),
  getUnread: () => api<any[]>("/api/notifications/unread"),
  get: (id: string) => api<any>(`/api/notifications/${id}`),
  getStats: () => api<any>("/api/notifications/stats"),
  getPreferences: () => api<any>("/api/notifications/preferences"),
  updatePreferences: (data: any) =>
    api<any>("/api/notifications/preferences", { method: "PATCH", body: data }),
  markAsRead: (id: string) =>
    api<any>(`/api/notifications/${id}/read`, { method: "POST" }),
  markAllAsRead: () =>
    api<any>("/api/notifications/read-all", { method: "POST" }),
  delete: (id: string) =>
    api<any>(`/api/notifications/${id}`, { method: "DELETE" }),
  deleteAll: () =>
    api<any>("/api/notifications", { method: "DELETE" }),
  deleteRead: () =>
    api<any>("/api/notifications/read", { method: "DELETE" }),
};

// Integrations API
export const integrationsApi = {
  list: () => api<any[]>("/api/integrations"),
  getConnected: () => api<any[]>("/api/integrations/connected"),
  get: (id: string) => api<any>(`/api/integrations/${id}`),
  getStats: () => api<any>("/api/integrations/stats"),
  getDefinitions: () => api<any[]>("/api/integrations/definitions"),
  getDefinition: (id: string) => api<any>(`/api/integrations/definitions/${id}`),
  connect: (integrationId: string, config: Record<string, string>) =>
    api<any>("/api/integrations/connect", { method: "POST", body: { integrationId, config } }),
  test: (integrationId: string, config: Record<string, string>) =>
    api<any>("/api/integrations/test", { method: "POST", body: { integrationId, config } }),
  disconnect: (id: string) =>
    api<any>(`/api/integrations/${id}`, { method: "DELETE" }),
  sync: (id: string) =>
    api<any>(`/api/integrations/${id}/sync`, { method: "POST" }),
};
