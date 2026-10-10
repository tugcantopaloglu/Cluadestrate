import type * as Model from "../../../backend/src/types/index";
import type { ApiRequests, ApiResponses, Wire } from "@/types/api";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  list: () => api<ApiResponses["GET /api/sessions"]>("/api/sessions"),
  get: (id: string) => api<ApiResponses["GET /api/sessions/{}"]>(`/api/sessions/${id}`),
  create: (data: Model.CreateSessionRequest) =>
    api<ApiResponses["POST /api/sessions"]>("/api/sessions", { method: "POST", body: data }),
  update: (id: string, data: Model.UpdateSessionRequest) =>
    api<ApiResponses["PATCH /api/sessions/{}"]>(`/api/sessions/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/sessions/{}"]>(`/api/sessions/${id}`, { method: "DELETE" }),
  start: (id: string, prompt?: string) =>
    api<ApiResponses["POST /api/sessions/{}/start"]>(`/api/sessions/${id}/start`, { method: "POST", body: { prompt } }),
  stop: (id: string) =>
    api<ApiResponses["POST /api/sessions/{}/stop"]>(`/api/sessions/${id}/stop`, { method: "POST" }),
  pause: (id: string) =>
    api<ApiResponses["POST /api/sessions/{}/pause"]>(`/api/sessions/${id}/pause`, { method: "POST" }),
  resume: (id: string) =>
    api<ApiResponses["POST /api/sessions/{}/resume"]>(`/api/sessions/${id}/resume`, { method: "POST" }),
  sendInput: (id: string, input: string) =>
    api<ApiResponses["POST /api/sessions/{}/input"]>(`/api/sessions/${id}/input`, { method: "POST", body: { input } }),
  getOutput: (id: string) => api<ApiResponses["GET /api/sessions/{}/output"]>(`/api/sessions/${id}/output`),
};

// MCP API
export const mcpApi = {
  list: () => api<ApiResponses["GET /api/mcp"]>("/api/mcp"),
  get: (id: string) => api<ApiResponses["GET /api/mcp/{}"]>(`/api/mcp/${id}`),
  create: (data: Model.CreateMCPServerRequest) =>
    api<ApiResponses["POST /api/mcp"]>("/api/mcp", { method: "POST", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/mcp/{}"]>(`/api/mcp/${id}`, { method: "DELETE" }),
  start: (id: string) =>
    api<ApiResponses["POST /api/mcp/{}/start"]>(`/api/mcp/${id}/start`, { method: "POST" }),
  stop: (id: string) =>
    api<ApiResponses["POST /api/mcp/{}/stop"]>(`/api/mcp/${id}/stop`, { method: "POST" }),
  restart: (id: string) =>
    api<ApiResponses["POST /api/mcp/{}/restart"]>(`/api/mcp/${id}/restart`, { method: "POST" }),
  getLogs: (id: string, limit?: number) =>
    api<ApiResponses["GET /api/mcp/{}/logs"]>(`/api/mcp/${id}/logs?limit=${limit || 100}`),
};

// Rules API
export const rulesApi = {
  getAll: () => api<ApiResponses["GET /api/rules"]>("/api/rules"),
  getHardRules: () => api<ApiResponses["GET /api/rules/hard"]>("/api/rules/hard"),
  addHardRule: (rule: string, createdBy: string) =>
    api<ApiResponses["POST /api/rules/hard"]>("/api/rules/hard", { method: "POST", body: { rule, createdBy } }),
  removeHardRule: (id: string) =>
    api<ApiResponses["DELETE /api/rules/hard/{}"]>(`/api/rules/hard/${id}`, { method: "DELETE" }),
  getDefaultRules: () => api<string[]>("/api/rules/default"),
  setDefaultRules: (rules: string[]) =>
    api<ApiResponses["PUT /api/rules/default"]>("/api/rules/default", { method: "PUT", body: { rules } }),
  getSessionRules: (sessionId: string) =>
    api<string[]>(`/api/rules/session/${sessionId}`),
  setSessionRules: (sessionId: string, rules: string[]) =>
    api<ApiResponses["PUT /api/rules/session/{}"]>(`/api/rules/session/${sessionId}`, { method: "PUT", body: { rules } }),
};

// Usage API
export const usageApi = {
  getSummary: () => api<ApiResponses["GET /api/usage"]>("/api/usage"),
  getHistory: (days?: number) =>
    api<ApiResponses["GET /api/usage/history"]>(`/api/usage/history?days=${days || 7}`),
  getBySession: () => api<ApiResponses["GET /api/usage/sessions"]>("/api/usage/sessions"),
  getAlerts: () => api<ApiResponses["GET /api/usage/alerts"]>("/api/usage/alerts"),
};

// Git API
export const gitApi = {
  getStatus: (directory?: string) =>
    api<ApiResponses["GET /api/git/status"]>(`/api/git/status${directory ? `?directory=${encodeURIComponent(directory)}` : ""}`),
  getBranches: (directory?: string) =>
    api<ApiResponses["GET /api/git/branches"]>(`/api/git/branches${directory ? `?directory=${encodeURIComponent(directory)}` : ""}`),
  getLog: (directory?: string, limit?: number) =>
    api<ApiResponses["GET /api/git/log"]>(
      `/api/git/log?limit=${limit || 20}${directory ? `&directory=${encodeURIComponent(directory)}` : ""}`
    ),
  getDiff: (directory?: string, file?: string, staged?: boolean) => {
    const params = new URLSearchParams();
    if (directory) params.set("directory", directory);
    if (file) params.set("file", file);
    if (staged) params.set("staged", "true");
    return api<ApiResponses["GET /api/git/diff"]>(`/api/git/diff?${params.toString()}`);
  },
  runCommand: (command: string, directory?: string) =>
    api<ApiResponses["POST /api/git/command"]>("/api/git/command", { method: "POST", body: { command, directory } }),
};

// Workflows API
export const workflowsApi = {
  list: () => api<ApiResponses["GET /api/workflows"]>("/api/workflows"),
  get: (id: string) => api<ApiResponses["GET /api/workflows/{}"]>(`/api/workflows/${id}`),
  getStats: () => api<ApiResponses["GET /api/workflows/stats"]>("/api/workflows/stats"),
  create: (data: Model.CreateWorkflowInput) =>
    api<ApiResponses["POST /api/workflows"]>("/api/workflows", { method: "POST", body: data }),
  update: (id: string, data: Partial<Model.Workflow>) =>
    api<ApiResponses["PATCH /api/workflows/{}"]>(`/api/workflows/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/workflows/{}"]>(`/api/workflows/${id}`, { method: "DELETE" }),
  run: (id: string, initialInput?: string) =>
    api<ApiResponses["POST /api/workflows/{}/run"]>(`/api/workflows/${id}/run`, { method: "POST", body: { initialInput } }),
  stop: (id: string) =>
    api<ApiResponses["POST /api/workflows/{}/stop"]>(`/api/workflows/${id}/stop`, { method: "POST" }),
};

// Automations API
export const automationsApi = {
  list: () => api<ApiResponses["GET /api/automations"]>("/api/automations"),
  get: (id: string) => api<ApiResponses["GET /api/automations/{}"]>(`/api/automations/${id}`),
  getStats: () => api<ApiResponses["GET /api/automations/stats"]>("/api/automations/stats"),
  getLogs: (id: string, limit?: number) =>
    api<ApiResponses["GET /api/automations/{}/logs"]>(`/api/automations/${id}/logs?limit=${limit || 50}`),
  create: (data: Model.CreateAutomationInput) =>
    api<ApiResponses["POST /api/automations"]>("/api/automations", { method: "POST", body: data }),
  update: (id: string, data: Partial<Model.Automation>) =>
    api<ApiResponses["PATCH /api/automations/{}"]>(`/api/automations/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/automations/{}"]>(`/api/automations/${id}`, { method: "DELETE" }),
  activate: (id: string) =>
    api<ApiResponses["POST /api/automations/{}/activate"]>(`/api/automations/${id}/activate`, { method: "POST" }),
  pause: (id: string) =>
    api<ApiResponses["POST /api/automations/{}/pause"]>(`/api/automations/${id}/pause`, { method: "POST" }),
  run: (id: string) =>
    api<ApiResponses["POST /api/automations/{}/run"]>(`/api/automations/${id}/run`, { method: "POST" }),
};

// Knowledge API
export const knowledgeApi = {
  list: () => api<ApiResponses["GET /api/knowledge"]>("/api/knowledge"),
  get: (id: string) => api<ApiResponses["GET /api/knowledge/{}"]>(`/api/knowledge/${id}`),
  getStats: () => api<ApiResponses["GET /api/knowledge/stats"]>("/api/knowledge/stats"),
  search: (query: string) => api<ApiResponses["GET /api/knowledge/search"]>(`/api/knowledge/search?q=${encodeURIComponent(query)}`),
  getForSession: (sessionId: string) => api<ApiResponses["GET /api/knowledge/session/{}"]>(`/api/knowledge/session/${sessionId}`),
  generateClaudeMd: (sessionId: string) =>
    fetch(`${API_BASE}/api/knowledge/session/${sessionId}/claude-md`).then((r) => r.text()),
  create: (data: { title: string; description: string; type: string; content: string; tags: string[] }) =>
    api<ApiResponses["POST /api/knowledge"]>("/api/knowledge", { method: "POST", body: data }),
  import: (filePath: string) =>
    api<ApiResponses["POST /api/knowledge/import"]>("/api/knowledge/import", { method: "POST", body: { filePath } }),
  update: (id: string, data: Partial<Model.KnowledgeItem>) =>
    api<ApiResponses["PATCH /api/knowledge/{}"]>(`/api/knowledge/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/knowledge/{}"]>(`/api/knowledge/${id}`, { method: "DELETE" }),
  sync: (id: string) =>
    api<ApiResponses["POST /api/knowledge/{}/sync"]>(`/api/knowledge/${id}/sync`, { method: "POST" }),
  addToSession: (id: string, sessionId: string) =>
    api<ApiResponses["POST /api/knowledge/{}/sessions/{}"]>(`/api/knowledge/${id}/sessions/${sessionId}`, { method: "POST" }),
  removeFromSession: (id: string, sessionId: string) =>
    api<ApiResponses["DELETE /api/knowledge/{}/sessions/{}"]>(`/api/knowledge/${id}/sessions/${sessionId}`, { method: "DELETE" }),
};

// Tasks API
export const tasksApi = {
  list: () => api<ApiResponses["GET /api/tasks"]>("/api/tasks"),
  get: (id: string) => api<ApiResponses["GET /api/tasks/{}"]>(`/api/tasks/${id}`),
  getBoard: () => api<ApiResponses["GET /api/tasks/board"]>("/api/tasks/board"),
  getStats: () => api<ApiResponses["GET /api/tasks/stats"]>("/api/tasks/stats"),
  getOverdue: () => api<ApiResponses["GET /api/tasks/overdue"]>("/api/tasks/overdue"),
  getByStatus: (status: string) => api<ApiResponses["GET /api/tasks/status/{}"]>(`/api/tasks/status/${status}`),
  getBySession: (sessionId: string) => api<ApiResponses["GET /api/tasks/session/{}"]>(`/api/tasks/session/${sessionId}`),
  create: (data: { title: string; description: string; priority: string; tags?: string[]; dueDate?: string }) =>
    api<ApiResponses["POST /api/tasks"]>("/api/tasks", { method: "POST", body: data }),
  update: (id: string, data: Model.UpdateTaskInput) =>
    api<ApiResponses["PATCH /api/tasks/{}"]>(`/api/tasks/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/tasks/{}"]>(`/api/tasks/${id}`, { method: "DELETE" }),
  move: (id: string, status: string) =>
    api<ApiResponses["POST /api/tasks/{}/move/{}"]>(`/api/tasks/${id}/move/${status}`, { method: "POST" }),
  assign: (id: string, sessionId: string) =>
    api<ApiResponses["POST /api/tasks/{}/assign/{}"]>(`/api/tasks/${id}/assign/${sessionId}`, { method: "POST" }),
  unassign: (id: string) =>
    api<ApiResponses["POST /api/tasks/{}/unassign"]>(`/api/tasks/${id}/unassign`, { method: "POST" }),
};

// Chains API
export const chainsApi = {
  list: () => api<ApiResponses["GET /api/chains"]>("/api/chains"),
  get: (id: string) => api<ApiResponses["GET /api/chains/{}"]>(`/api/chains/${id}`),
  getStats: () => api<ApiResponses["GET /api/chains/stats"]>("/api/chains/stats"),
  create: (data: { name: string; description: string; steps: { name: string; model: string; prompt: string; systemPrompt?: string }[] }) =>
    api<ApiResponses["POST /api/chains"]>("/api/chains", { method: "POST", body: data }),
  update: (id: string, data: Partial<Model.Chain>) =>
    api<ApiResponses["PATCH /api/chains/{}"]>(`/api/chains/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/chains/{}"]>(`/api/chains/${id}`, { method: "DELETE" }),
  run: (id: string, initialInput?: string) =>
    api<ApiResponses["POST /api/chains/{}/run"]>(`/api/chains/${id}/run`, { method: "POST", body: { initialInput } }),
  stop: (id: string) =>
    api<ApiResponses["POST /api/chains/{}/stop"]>(`/api/chains/${id}/stop`, { method: "POST" }),
};

// Alerts API
export const alertsApi = {
  list: (includeAcknowledged?: boolean) =>
    api<ApiResponses["GET /api/alerts"]>(`/api/alerts?includeAcknowledged=${includeAcknowledged !== false}`),
  getActive: () => api<ApiResponses["GET /api/alerts/active"]>("/api/alerts/active"),
  get: (id: string) => api<ApiResponses["GET /api/alerts/{}"]>(`/api/alerts/${id}`),
  getStats: () => api<ApiResponses["GET /api/alerts/stats"]>("/api/alerts/stats"),
  acknowledge: (id: string) =>
    api<ApiResponses["POST /api/alerts/{}/acknowledge"]>(`/api/alerts/${id}/acknowledge`, { method: "POST" }),
  acknowledgeAll: () =>
    api<ApiResponses["POST /api/alerts/acknowledge-all"]>("/api/alerts/acknowledge-all", { method: "POST" }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/alerts/{}"]>(`/api/alerts/${id}`, { method: "DELETE" }),
  // Rules
  listRules: () => api<ApiResponses["GET /api/alerts/rules"]>("/api/alerts/rules"),
  getRule: (id: string) => api<ApiResponses["GET /api/alerts/rules/{}"]>(`/api/alerts/rules/${id}`),
  createRule: (data: Model.CreateAlertRuleInput) =>
    api<ApiResponses["POST /api/alerts/rules"]>("/api/alerts/rules", { method: "POST", body: data }),
  updateRule: (id: string, data: Partial<Model.AlertRule>) =>
    api<ApiResponses["PATCH /api/alerts/rules/{}"]>(`/api/alerts/rules/${id}`, { method: "PATCH", body: data }),
  toggleRule: (id: string) =>
    api<ApiResponses["POST /api/alerts/rules/{}/toggle"]>(`/api/alerts/rules/${id}/toggle`, { method: "POST" }),
  deleteRule: (id: string) =>
    api<ApiResponses["DELETE /api/alerts/rules/{}"]>(`/api/alerts/rules/${id}`, { method: "DELETE" }),
};

// Notifications API
export const notificationsApi = {
  list: (limit?: number) => api<ApiResponses["GET /api/notifications"]>(`/api/notifications?limit=${limit || 100}`),
  getUnread: () => api<ApiResponses["GET /api/notifications/unread"]>("/api/notifications/unread"),
  get: (id: string) => api<ApiResponses["GET /api/notifications/{}"]>(`/api/notifications/${id}`),
  getStats: () => api<ApiResponses["GET /api/notifications/stats"]>("/api/notifications/stats"),
  getPreferences: () => api<ApiResponses["GET /api/notifications/preferences"]>("/api/notifications/preferences"),
  updatePreferences: (data: Partial<Model.NotificationPreferences>) =>
    api<ApiResponses["PATCH /api/notifications/preferences"]>("/api/notifications/preferences", { method: "PATCH", body: data }),
  markAsRead: (id: string) =>
    api<ApiResponses["POST /api/notifications/{}/read"]>(`/api/notifications/${id}/read`, { method: "POST" }),
  markAllAsRead: () =>
    api<ApiResponses["POST /api/notifications/read-all"]>("/api/notifications/read-all", { method: "POST" }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/notifications/{}"]>(`/api/notifications/${id}`, { method: "DELETE" }),
  deleteAll: () =>
    api<ApiResponses["DELETE /api/notifications"]>("/api/notifications", { method: "DELETE" }),
  deleteRead: () =>
    api<ApiResponses["DELETE /api/notifications/read"]>("/api/notifications/read", { method: "DELETE" }),
};

// Integrations API
export const integrationsApi = {
  list: () => api<ApiResponses["GET /api/integrations"]>("/api/integrations"),
  getConnected: () => api<ApiResponses["GET /api/integrations/connected"]>("/api/integrations/connected"),
  get: (id: string) => api<ApiResponses["GET /api/integrations/{}"]>(`/api/integrations/${id}`),
  getStats: () => api<ApiResponses["GET /api/integrations/stats"]>("/api/integrations/stats"),
  getDefinitions: () => api<ApiResponses["GET /api/integrations/definitions"]>("/api/integrations/definitions"),
  getDefinition: (id: string) => api<ApiResponses["GET /api/integrations/definitions/{}"]>(`/api/integrations/definitions/${id}`),
  connect: (data: { integrationId: string; config: Record<string, string> }) =>
    api<ApiResponses["POST /api/integrations/connect"]>("/api/integrations/connect", { method: "POST", body: data }),
  test: (data: { integrationId: string; config: Record<string, string> }) =>
    api<ApiResponses["POST /api/integrations/test"]>("/api/integrations/test", { method: "POST", body: data }),
  disconnect: (id: string) =>
    api<ApiResponses["DELETE /api/integrations/{}"]>(`/api/integrations/${id}`, { method: "DELETE" }),
  sync: (id: string) =>
    api<ApiResponses["POST /api/integrations/{}/sync"]>(`/api/integrations/${id}/sync`, { method: "POST" }),
};

// File Sync API
export const fileSyncApi = {
  getStats: () => api<ApiResponses["GET /api/file-sync/stats"]>("/api/file-sync/stats"),
  getConfig: () => api<ApiResponses["GET /api/file-sync/config"]>("/api/file-sync/config"),
  updateConfig: (updates: ApiRequests["PATCH /api/file-sync/config"]) =>
    api<ApiResponses["PATCH /api/file-sync/config"]>("/api/file-sync/config", { method: "PATCH", body: updates }),
  listOperations: () => api<ApiResponses["GET /api/file-sync/operations"]>("/api/file-sync/operations"),
  listFolders: () => api<ApiResponses["GET /api/file-sync/folders"]>("/api/file-sync/folders"),
  getFolder: (id: string) => api<ApiResponses["GET /api/file-sync/folders/{}"]>(`/api/file-sync/folders/${id}`),
  addFolder: (data: ApiRequests["POST /api/file-sync/folders"]) =>
    api<ApiResponses["POST /api/file-sync/folders"]>("/api/file-sync/folders", { method: "POST", body: data }),
  removeFolder: (id: string) =>
    api<ApiResponses["DELETE /api/file-sync/folders/{}"]>(`/api/file-sync/folders/${id}`, { method: "DELETE" }),
  syncFolder: (id: string) =>
    api<ApiResponses["POST /api/file-sync/folders/{}/sync"]>(`/api/file-sync/folders/${id}/sync`, { method: "POST" }),
  listFiles: (folderId?: string) =>
    api<ApiResponses["GET /api/file-sync/files"]>(`/api/file-sync/files${folderId ? `?folderId=${folderId}` : ""}`),
  searchFiles: (query: string) =>
    api<ApiResponses["GET /api/file-sync/files/search"]>(`/api/file-sync/files/search?q=${encodeURIComponent(query)}`),
  getFile: (id: string) => api<ApiResponses["GET /api/file-sync/files/{}"]>(`/api/file-sync/files/${id}`),
  getFileContent: (id: string) =>
    fetch(`${API_BASE}/api/file-sync/files/${id}/content`).then((r) => r.blob()),
  deleteFile: (id: string) =>
    api<ApiResponses["DELETE /api/file-sync/files/{}"]>(`/api/file-sync/files/${id}`, { method: "DELETE" }),
  getVersions: (fileId: string) =>
    api<ApiResponses["GET /api/file-sync/files/{}/versions"]>(`/api/file-sync/files/${fileId}/versions`),
  restoreVersion: (fileId: string, versionId: string) =>
    api<ApiResponses["POST /api/file-sync/files/{}/versions/{}/restore"]>(`/api/file-sync/files/${fileId}/versions/${versionId}/restore`, { method: "POST" }),
  getConflicts: () => api<ApiResponses["GET /api/file-sync/conflicts"]>("/api/file-sync/conflicts"),
  resolveConflict: (resolution: ApiRequests["POST /api/file-sync/conflicts/resolve"]) =>
    api<ApiResponses["POST /api/file-sync/conflicts/resolve"]>("/api/file-sync/conflicts/resolve", { method: "POST", body: resolution }),
  attachToSession: (fileId: string, sessionId: string) =>
    api<ApiResponses["POST /api/file-sync/files/{}/sessions/{}"]>(`/api/file-sync/files/${fileId}/sessions/${sessionId}`, { method: "POST" }),
  detachFromSession: (fileId: string, sessionId: string) =>
    api<ApiResponses["DELETE /api/file-sync/files/{}/sessions/{}"]>(`/api/file-sync/files/${fileId}/sessions/${sessionId}`, { method: "DELETE" }),
  getSessionAttachments: (sessionId: string) =>
    api<ApiResponses["GET /api/file-sync/sessions/{}/files"]>(`/api/file-sync/sessions/${sessionId}/files`),
};

// Auto-Update API
export const autoUpdateApi = {
  getStats: () => api<ApiResponses["GET /api/auto-update/stats"]>("/api/auto-update/stats"),
  getSettings: () => api<ApiResponses["GET /api/auto-update/settings"]>("/api/auto-update/settings"),
  updateSettings: (updates: ApiRequests["PATCH /api/auto-update/settings"]) =>
    api<ApiResponses["PATCH /api/auto-update/settings"]>("/api/auto-update/settings", { method: "PATCH", body: updates }),
  checkForUpdates: () =>
    api<ApiResponses["POST /api/auto-update/check"]>("/api/auto-update/check", { method: "POST" }),
  getLatestVersion: () => api<ApiResponses["GET /api/auto-update/latest"]>("/api/auto-update/latest"),
  listHosts: () => api<ApiResponses["GET /api/auto-update/hosts"]>("/api/auto-update/hosts"),
  getHost: (hostId: string) => api<ApiResponses["GET /api/auto-update/hosts/{}"]>(`/api/auto-update/hosts/${hostId}`),
  registerHost: (data: ApiRequests["POST /api/auto-update/hosts"]) =>
    api<ApiResponses["POST /api/auto-update/hosts"]>("/api/auto-update/hosts", { method: "POST", body: data }),
  unregisterHost: (hostId: string) =>
    api<ApiResponses["DELETE /api/auto-update/hosts/{}"]>(`/api/auto-update/hosts/${hostId}`, { method: "DELETE" }),
  updateHosts: (hostIds: string[]) =>
    api<ApiResponses["POST /api/auto-update/update"]>("/api/auto-update/update", { method: "POST", body: { hostIds } }),
  updateAllHosts: () =>
    api<ApiResponses["POST /api/auto-update/update-all"]>("/api/auto-update/update-all", { method: "POST" }),
  rollbackHost: (hostId: string) =>
    api<ApiResponses["POST /api/auto-update/hosts/{}/rollback"]>(`/api/auto-update/hosts/${hostId}/rollback`, { method: "POST" }),
  listOperations: () => api<ApiResponses["GET /api/auto-update/operations"]>("/api/auto-update/operations"),
  getHistory: () => api<ApiResponses["GET /api/auto-update/history"]>("/api/auto-update/history"),
};

// Image Sharing API
export const imagesApi = {
  getStats: () => api<ApiResponses["GET /api/images/stats"]>("/api/images/stats"),
  listRecent: (limit?: number) =>
    api<ApiResponses["GET /api/images/recent"]>(`/api/images/recent?limit=${limit || 10}`),
  upload: (data: { sessionId: string; filename: string; mimeType: string; base64Data: string }) =>
    api<ApiResponses["POST /api/images/upload"]>("/api/images/upload", { method: "POST", body: data }),
  captureScreenshot: (data: { sessionId: string; captureType: string }) =>
    api<ApiResponses["POST /api/images/screenshot"]>("/api/images/screenshot", { method: "POST", body: data }),
  captureRemoteScreenshot: (data: { sessionId: string; hostId: string; captureType: string }) =>
    api<ApiResponses["POST /api/images/screenshot/remote"]>("/api/images/screenshot/remote", { method: "POST", body: data }),
  pasteFromClipboard: (data: { sessionId: string; base64Data: string; mimeType: string }) =>
    api<ApiResponses["POST /api/images/clipboard"]>("/api/images/clipboard", { method: "POST", body: data }),
  getImage: (id: string) => api<ApiResponses["GET /api/images/{}"]>(`/api/images/${id}`),
  getImageBase64: (id: string) => api<ApiResponses["GET /api/images/{}/base64"]>(`/api/images/${id}/base64`),
  deleteImage: (id: string) =>
    api<ApiResponses["DELETE /api/images/{}"]>(`/api/images/${id}`, { method: "DELETE" }),
  listSessionImages: (sessionId: string) =>
    api<ApiResponses["GET /api/images/session/{}"]>(`/api/images/session/${sessionId}`),
};

// n8n API
export const n8nApi = {
  getStats: () => api<ApiResponses["GET /api/n8n/stats"]>("/api/n8n/stats"),
  getConfig: () => api<ApiResponses["GET /api/n8n/config"]>("/api/n8n/config"),
  updateConfig: (updates: ApiRequests["PATCH /api/n8n/config"]) =>
    api<ApiResponses["PATCH /api/n8n/config"]>("/api/n8n/config", { method: "PATCH", body: updates }),
  testConnection: () =>
    api<ApiResponses["POST /api/n8n/test"]>("/api/n8n/test", { method: "POST" }),
  listWebhooks: () => api<ApiResponses["GET /api/n8n/webhooks"]>("/api/n8n/webhooks"),
  addWebhook: (data: ApiRequests["POST /api/n8n/webhooks"]) =>
    api<ApiResponses["POST /api/n8n/webhooks"]>("/api/n8n/webhooks", { method: "POST", body: data }),
  toggleWebhook: (id: string) =>
    api<ApiResponses["POST /api/n8n/webhooks/{}/toggle"]>(`/api/n8n/webhooks/${id}/toggle`, { method: "POST" }),
  removeWebhook: (id: string) =>
    api<ApiResponses["DELETE /api/n8n/webhooks/{}"]>(`/api/n8n/webhooks/${id}`, { method: "DELETE" }),
};

// Bots API
export const botsApi = {
  getStats: () => api<ApiResponses["GET /api/bots/stats"]>("/api/bots/stats"),
  // Slack
  slack: {
    getConfig: () => api<ApiResponses["GET /api/bots/slack/config"]>("/api/bots/slack/config"),
    updateConfig: (updates: ApiRequests["PATCH /api/bots/slack/config"]) =>
      api<ApiResponses["PATCH /api/bots/slack/config"]>("/api/bots/slack/config", { method: "PATCH", body: updates }),
    connect: () => api<ApiResponses["POST /api/bots/slack/connect"]>("/api/bots/slack/connect", { method: "POST" }),
    disconnect: () => api<ApiResponses["POST /api/bots/slack/disconnect"]>("/api/bots/slack/disconnect", { method: "POST" }),
    listChannels: () => api<ApiResponses["GET /api/bots/slack/channels"]>("/api/bots/slack/channels"),
    listCommands: () => api<ApiResponses["GET /api/bots/slack/commands"]>("/api/bots/slack/commands"),
    listNotifications: () => api<ApiResponses["GET /api/bots/slack/notifications"]>("/api/bots/slack/notifications"),
    addNotification: (config: ApiRequests["POST /api/bots/slack/notifications"]) =>
      api<ApiResponses["POST /api/bots/slack/notifications"]>("/api/bots/slack/notifications", { method: "POST", body: config }),
  },
  // Discord
  discord: {
    getConfig: () => api<ApiResponses["GET /api/bots/discord/config"]>("/api/bots/discord/config"),
    updateConfig: (updates: ApiRequests["PATCH /api/bots/discord/config"]) =>
      api<ApiResponses["PATCH /api/bots/discord/config"]>("/api/bots/discord/config", { method: "PATCH", body: updates }),
    connect: () => api<ApiResponses["POST /api/bots/discord/connect"]>("/api/bots/discord/connect", { method: "POST" }),
    disconnect: () => api<ApiResponses["POST /api/bots/discord/disconnect"]>("/api/bots/discord/disconnect", { method: "POST" }),
    listGuilds: () => api<ApiResponses["GET /api/bots/discord/guilds"]>("/api/bots/discord/guilds"),
    listCommands: () => api<ApiResponses["GET /api/bots/discord/commands"]>("/api/bots/discord/commands"),
    listBindings: () => api<ApiResponses["GET /api/bots/discord/bindings"]>("/api/bots/discord/bindings"),
    addBinding: (binding: ApiRequests["POST /api/bots/discord/bindings"]) =>
      api<ApiResponses["POST /api/bots/discord/bindings"]>("/api/bots/discord/bindings", { method: "POST", body: binding }),
    removeBinding: (id: string) =>
      api<ApiResponses["DELETE /api/bots/discord/bindings/{}"]>(`/api/bots/discord/bindings/${id}`, { method: "DELETE" }),
    listNotifications: () => api<ApiResponses["GET /api/bots/discord/notifications"]>("/api/bots/discord/notifications"),
  },
  // Telegram
  telegram: {
    getConfig: () => api<ApiResponses["GET /api/bots/telegram/config"]>("/api/bots/telegram/config"),
    updateConfig: (updates: ApiRequests["PATCH /api/bots/telegram/config"]) =>
      api<ApiResponses["PATCH /api/bots/telegram/config"]>("/api/bots/telegram/config", { method: "PATCH", body: updates }),
    connect: () => api<ApiResponses["POST /api/bots/telegram/connect"]>("/api/bots/telegram/connect", { method: "POST" }),
    disconnect: () => api<ApiResponses["POST /api/bots/telegram/disconnect"]>("/api/bots/telegram/disconnect", { method: "POST" }),
    listCommands: () => api<ApiResponses["GET /api/bots/telegram/commands"]>("/api/bots/telegram/commands"),
    listChats: () => api<ApiResponses["GET /api/bots/telegram/chats"]>("/api/bots/telegram/chats"),
    authorizeChat: (chat: ApiRequests["POST /api/bots/telegram/chats"]) =>
      api<ApiResponses["POST /api/bots/telegram/chats"]>("/api/bots/telegram/chats", { method: "POST", body: chat }),
    deauthorizeChat: (chatId: string) =>
      api<ApiResponses["DELETE /api/bots/telegram/chats/{}"]>(`/api/bots/telegram/chats/${chatId}`, { method: "DELETE" }),
  },
};

// Workflow Builder API
export const workflowBuilderApi = {
  getStats: () => api<ApiResponses["GET /api/workflow-builder/stats"]>("/api/workflow-builder/stats"),
  listCanvases: () => api<ApiResponses["GET /api/workflow-builder/canvas"]>("/api/workflow-builder/canvas"),
  getTemplates: () => api<ApiResponses["GET /api/workflow-builder/templates"]>("/api/workflow-builder/templates"),
  getTemplate: (id: string) => api<ApiResponses["GET /api/workflow-builder/templates/{}"]>(`/api/workflow-builder/templates/${id}`),
  createCanvas: (workflowId: string) =>
    api<ApiResponses["POST /api/workflow-builder/canvas"]>("/api/workflow-builder/canvas", { method: "POST", body: { workflowId } }),
  getCanvas: (id: string) => api<ApiResponses["GET /api/workflow-builder/canvas/{}"]>(`/api/workflow-builder/canvas/${id}`),
  getCanvasByWorkflow: (workflowId: string) =>
    api<ApiResponses["GET /api/workflow-builder/canvas/workflow/{}"]>(`/api/workflow-builder/canvas/workflow/${workflowId}`),
  updateCanvas: (id: string, updates: ApiRequests["PATCH /api/workflow-builder/canvas/{}"]) =>
    api<ApiResponses["PATCH /api/workflow-builder/canvas/{}"]>(`/api/workflow-builder/canvas/${id}`, { method: "PATCH", body: updates }),
  deleteCanvas: (id: string) =>
    api<ApiResponses["DELETE /api/workflow-builder/canvas/{}"]>(`/api/workflow-builder/canvas/${id}`, { method: "DELETE" }),
  addNode: (canvasId: string, type: Model.WorkflowNodeType, position: { x: number; y: number }) =>
    api<ApiResponses["POST /api/workflow-builder/canvas/{}/nodes"]>(`/api/workflow-builder/canvas/${canvasId}/nodes`, { method: "POST", body: { type, position } }),
  updateNode: (canvasId: string, nodeId: string, updates: ApiRequests["PATCH /api/workflow-builder/canvas/{}/nodes/{}"]) =>
    api<ApiResponses["PATCH /api/workflow-builder/canvas/{}/nodes/{}"]>(`/api/workflow-builder/canvas/${canvasId}/nodes/${nodeId}`, { method: "PATCH", body: updates }),
  deleteNode: (canvasId: string, nodeId: string) =>
    api<ApiResponses["DELETE /api/workflow-builder/canvas/{}/nodes/{}"]>(`/api/workflow-builder/canvas/${canvasId}/nodes/${nodeId}`, { method: "DELETE" }),
  addEdge: (canvasId: string, source: string, target: string) =>
    api<ApiResponses["POST /api/workflow-builder/canvas/{}/edges"]>(`/api/workflow-builder/canvas/${canvasId}/edges`, { method: "POST", body: { source, target } }),
  deleteEdge: (canvasId: string, edgeId: string) =>
    api<ApiResponses["DELETE /api/workflow-builder/canvas/{}/edges/{}"]>(`/api/workflow-builder/canvas/${canvasId}/edges/${edgeId}`, { method: "DELETE" }),
  validate: (canvas: Wire<Model.WorkflowCanvas>) =>
    api<ApiResponses["POST /api/workflow-builder/validate"]>("/api/workflow-builder/validate", { method: "POST", body: { canvas } }),
  exportToSteps: (canvasId: string) =>
    api<ApiResponses["POST /api/workflow-builder/canvas/{}/export"]>(`/api/workflow-builder/canvas/${canvasId}/export`, { method: "POST" }),
  importFromWorkflow: (workflow: ApiRequests["POST /api/workflow-builder/import"]) =>
    api<ApiResponses["POST /api/workflow-builder/import"]>("/api/workflow-builder/import", { method: "POST", body: workflow }),
};

// Supervisor API
export const supervisorsApi = {
  getStats: () => api<ApiResponses["GET /api/supervisors/stats"]>("/api/supervisors/stats"),
  getTemplates: () => api<ApiResponses["GET /api/supervisors/templates"]>("/api/supervisors/templates"),
  getTemplate: (id: string) => api<ApiResponses["GET /api/supervisors/templates/{}"]>(`/api/supervisors/templates/${id}`),
  createFromTemplate: (templateId: string, name?: string) =>
    api<ApiResponses["POST /api/supervisors/from-template/{}"]>(`/api/supervisors/from-template/${templateId}`, { method: "POST", body: { name } }),
  list: () => api<ApiResponses["GET /api/supervisors"]>("/api/supervisors"),
  get: (id: string) => api<ApiResponses["GET /api/supervisors/{}"]>(`/api/supervisors/${id}`),
  create: (data: ApiRequests["POST /api/supervisors"]) =>
    api<ApiResponses["POST /api/supervisors"]>("/api/supervisors", { method: "POST", body: data }),
  update: (id: string, updates: ApiRequests["PATCH /api/supervisors/{}"]) =>
    api<ApiResponses["PATCH /api/supervisors/{}"]>(`/api/supervisors/${id}`, { method: "PATCH", body: updates }),
  delete: (id: string) =>
    api<ApiResponses["DELETE /api/supervisors/{}"]>(`/api/supervisors/${id}`, { method: "DELETE" }),
  addWorker: (supervisorId: string, worker: ApiRequests["POST /api/supervisors/{}/workers"]) =>
    api<ApiResponses["POST /api/supervisors/{}/workers"]>(`/api/supervisors/${supervisorId}/workers`, { method: "POST", body: worker }),
  updateWorker: (supervisorId: string, workerId: string, updates: ApiRequests["PATCH /api/supervisors/{}/workers/{}"]) =>
    api<ApiResponses["PATCH /api/supervisors/{}/workers/{}"]>(`/api/supervisors/${supervisorId}/workers/${workerId}`, { method: "PATCH", body: updates }),
  removeWorker: (supervisorId: string, workerId: string) =>
    api<ApiResponses["DELETE /api/supervisors/{}/workers/{}"]>(`/api/supervisors/${supervisorId}/workers/${workerId}`, { method: "DELETE" }),
  execute: (id: string, task: string) =>
    api<ApiResponses["POST /api/supervisors/{}/execute"]>(`/api/supervisors/${id}/execute`, { method: "POST", body: { task } }),
  listExecutions: (supervisorId?: string) =>
    api<ApiResponses["GET /api/supervisors/executions"]>(`/api/supervisors/executions${supervisorId ? `?supervisorId=${supervisorId}` : ""}`),
  getExecution: (id: string) => api<ApiResponses["GET /api/supervisors/executions/{}"]>(`/api/supervisors/executions/${id}`),
  stopExecution: (id: string) =>
    api<ApiResponses["POST /api/supervisors/executions/{}/stop"]>(`/api/supervisors/executions/${id}/stop`, { method: "POST" }),
};

// MCP Host Agents API
export const mcpHostsApi = {
  getStats: () => api<ApiResponses["GET /api/mcp-hosts/stats"]>("/api/mcp-hosts/stats"),
  listCommands: (hostId?: string) => api<ApiResponses["GET /api/mcp-hosts/commands"]>(`/api/mcp-hosts/commands${hostId ? `?hostId=${encodeURIComponent(hostId)}` : ""}`),
  getDiscoveryConfig: () => api<ApiResponses["GET /api/mcp-hosts/discovery/config"]>("/api/mcp-hosts/discovery/config"),
  updateDiscoveryConfig: (updates: ApiRequests["PATCH /api/mcp-hosts/discovery/config"]) =>
    api<ApiResponses["PATCH /api/mcp-hosts/discovery/config"]>("/api/mcp-hosts/discovery/config", { method: "PATCH", body: updates }),
  startDiscovery: () =>
    api<ApiResponses["POST /api/mcp-hosts/discovery/start"]>("/api/mcp-hosts/discovery/start", { method: "POST" }),
  stopDiscovery: () =>
    api<ApiResponses["POST /api/mcp-hosts/discovery/stop"]>("/api/mcp-hosts/discovery/stop", { method: "POST" }),
  listDiscoveredHosts: () => api<ApiResponses["GET /api/mcp-hosts/discovery/hosts"]>("/api/mcp-hosts/discovery/hosts"),
  connectDiscoveredHost: (id: string) =>
    api<ApiResponses["POST /api/mcp-hosts/discovery/hosts/{}/connect"]>(`/api/mcp-hosts/discovery/hosts/${id}/connect`, { method: "POST" }),
  listHosts: () => api<ApiResponses["GET /api/mcp-hosts/hosts"]>("/api/mcp-hosts/hosts"),
  getOnlineHosts: () => api<ApiResponses["GET /api/mcp-hosts/hosts/online"]>("/api/mcp-hosts/hosts/online"),
  getHost: (id: string) => api<ApiResponses["GET /api/mcp-hosts/hosts/{}"]>(`/api/mcp-hosts/hosts/${id}`),
  registerHost: (data: ApiRequests["POST /api/mcp-hosts/hosts"]) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts"]>("/api/mcp-hosts/hosts", { method: "POST", body: data }),
  connectHost: (id: string) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts/{}/connect"]>(`/api/mcp-hosts/hosts/${id}/connect`, { method: "POST" }),
  disconnectHost: (id: string) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts/{}/disconnect"]>(`/api/mcp-hosts/hosts/${id}/disconnect`, { method: "POST" }),
  removeHost: (id: string) =>
    api<ApiResponses["DELETE /api/mcp-hosts/hosts/{}"]>(`/api/mcp-hosts/hosts/${id}`, { method: "DELETE" }),
  startMCPServer: (hostId: string, serverId: string) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts/{}/mcp/{}/start"]>(`/api/mcp-hosts/hosts/${hostId}/mcp/${serverId}/start`, { method: "POST" }),
  stopMCPServer: (hostId: string, serverId: string) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts/{}/mcp/{}/stop"]>(`/api/mcp-hosts/hosts/${hostId}/mcp/${serverId}/stop`, { method: "POST" }),
  captureScreenshot: (hostId: string) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts/{}/screenshot"]>(`/api/mcp-hosts/hosts/${hostId}/screenshot`, { method: "POST" }),
  triggerUpdate: (hostId: string) =>
    api<ApiResponses["POST /api/mcp-hosts/hosts/{}/update"]>(`/api/mcp-hosts/hosts/${hostId}/update`, { method: "POST" }),
  generateInstallScript: (config: Wire<Model.InstallScriptConfig>) =>
    fetch(`${API_BASE}/api/mcp-hosts/install-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then((r) => r.text()),
};

// Email API
export const emailApi = {
  getStats: () => api<ApiResponses["GET /api/email/stats"]>("/api/email/stats"),
  getConfig: () => api<ApiResponses["GET /api/email/config"]>("/api/email/config"),
  updateConfig: (updates: ApiRequests["PATCH /api/email/config"]) =>
    api<ApiResponses["PATCH /api/email/config"]>("/api/email/config", { method: "PATCH", body: updates }),
  testConnection: () =>
    api<ApiResponses["POST /api/email/test"]>("/api/email/test", { method: "POST" }),
  listTemplates: (category?: string) =>
    api<ApiResponses["GET /api/email/templates"]>(`/api/email/templates${category ? `?category=${category}` : ""}`),
  getTemplate: (id: string) => api<ApiResponses["GET /api/email/templates/{}"]>(`/api/email/templates/${id}`),
  createTemplate: (data: ApiRequests["POST /api/email/templates"]) =>
    api<ApiResponses["POST /api/email/templates"]>("/api/email/templates", { method: "POST", body: data }),
  updateTemplate: (id: string, updates: ApiRequests["PATCH /api/email/templates/{}"]) =>
    api<ApiResponses["PATCH /api/email/templates/{}"]>(`/api/email/templates/${id}`, { method: "PATCH", body: updates }),
  deleteTemplate: (id: string) =>
    api<ApiResponses["DELETE /api/email/templates/{}"]>(`/api/email/templates/${id}`, { method: "DELETE" }),
  listRecipients: () => api<ApiResponses["GET /api/email/recipients"]>("/api/email/recipients"),
  getRecipient: (id: string) => api<ApiResponses["GET /api/email/recipients/{}"]>(`/api/email/recipients/${id}`),
  addRecipient: (data: ApiRequests["POST /api/email/recipients"]) =>
    api<ApiResponses["POST /api/email/recipients"]>("/api/email/recipients", { method: "POST", body: data }),
  updateRecipient: (id: string, updates: ApiRequests["PATCH /api/email/recipients/{}"]) =>
    api<ApiResponses["PATCH /api/email/recipients/{}"]>(`/api/email/recipients/${id}`, { method: "PATCH", body: updates }),
  removeRecipient: (id: string) =>
    api<ApiResponses["DELETE /api/email/recipients/{}"]>(`/api/email/recipients/${id}`, { method: "DELETE" }),
  sendEmail: (data: ApiRequests["POST /api/email/send"]) =>
    api<ApiResponses["POST /api/email/send"]>("/api/email/send", { method: "POST", body: data }),
  sendFromTemplate: (templateId: string, to: string[], variables: Record<string, unknown>) =>
    api<ApiResponses["POST /api/email/send/template/{}"]>(`/api/email/send/template/${templateId}`, { method: "POST", body: { to, variables } }),
  listMessages: (limit?: number) =>
    api<ApiResponses["GET /api/email/messages"]>(`/api/email/messages?limit=${limit || 50}`),
  getMessage: (id: string) => api<ApiResponses["GET /api/email/messages/{}"]>(`/api/email/messages/${id}`),
};
