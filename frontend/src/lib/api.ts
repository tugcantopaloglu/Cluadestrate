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
  connect: (data: { integrationId: string; config: Record<string, string> }) =>
    api<any>("/api/integrations/connect", { method: "POST", body: data }),
  test: (data: { integrationId: string; config: Record<string, string> }) =>
    api<any>("/api/integrations/test", { method: "POST", body: data }),
  disconnect: (id: string) =>
    api<any>(`/api/integrations/${id}`, { method: "DELETE" }),
  sync: (id: string) =>
    api<any>(`/api/integrations/${id}/sync`, { method: "POST" }),
};

// File Sync API
export const fileSyncApi = {
  getStats: () => api<any>("/api/file-sync/stats"),
  getConfig: () => api<any>("/api/file-sync/config"),
  updateConfig: (updates: any) =>
    api<any>("/api/file-sync/config", { method: "PATCH", body: updates }),
  listFolders: () => api<any[]>("/api/file-sync/folders"),
  getFolder: (id: string) => api<any>(`/api/file-sync/folders/${id}`),
  addFolder: (data: { hostId: string; hostName: string; remotePath: string; patterns?: any }) =>
    api<any>("/api/file-sync/folders", { method: "POST", body: data }),
  removeFolder: (id: string) =>
    api<any>(`/api/file-sync/folders/${id}`, { method: "DELETE" }),
  syncFolder: (id: string) =>
    api<any>(`/api/file-sync/folders/${id}/sync`, { method: "POST" }),
  listFiles: (folderId?: string) =>
    api<any[]>(`/api/file-sync/files${folderId ? `?folderId=${folderId}` : ""}`),
  searchFiles: (query: string) =>
    api<any[]>(`/api/file-sync/files/search?q=${encodeURIComponent(query)}`),
  getFile: (id: string) => api<any>(`/api/file-sync/files/${id}`),
  getFileContent: (id: string) =>
    fetch(`${API_BASE}/api/file-sync/files/${id}/content`).then((r) => r.blob()),
  deleteFile: (id: string) =>
    api<any>(`/api/file-sync/files/${id}`, { method: "DELETE" }),
  getVersions: (fileId: string) =>
    api<any[]>(`/api/file-sync/files/${fileId}/versions`),
  restoreVersion: (fileId: string, versionId: string) =>
    api<any>(`/api/file-sync/files/${fileId}/versions/${versionId}/restore`, { method: "POST" }),
  getConflicts: () => api<any[]>("/api/file-sync/conflicts"),
  resolveConflict: (resolution: any) =>
    api<any>("/api/file-sync/conflicts/resolve", { method: "POST", body: resolution }),
  attachToSession: (fileId: string, sessionId: string) =>
    api<any>(`/api/file-sync/files/${fileId}/sessions/${sessionId}`, { method: "POST" }),
  detachFromSession: (fileId: string, sessionId: string) =>
    api<any>(`/api/file-sync/files/${fileId}/sessions/${sessionId}`, { method: "DELETE" }),
  getSessionAttachments: (sessionId: string) =>
    api<any[]>(`/api/file-sync/sessions/${sessionId}/files`),
};

// Auto-Update API
export const autoUpdateApi = {
  getStats: () => api<any>("/api/auto-update/stats"),
  getSettings: () => api<any>("/api/auto-update/settings"),
  updateSettings: (updates: any) =>
    api<any>("/api/auto-update/settings", { method: "PATCH", body: updates }),
  checkForUpdates: () =>
    api<any>("/api/auto-update/check", { method: "POST" }),
  getLatestVersion: () => api<any>("/api/auto-update/latest"),
  listHosts: () => api<any[]>("/api/auto-update/hosts"),
  getHost: (hostId: string) => api<any>(`/api/auto-update/hosts/${hostId}`),
  registerHost: (data: any) =>
    api<any>("/api/auto-update/hosts", { method: "POST", body: data }),
  unregisterHost: (hostId: string) =>
    api<any>(`/api/auto-update/hosts/${hostId}`, { method: "DELETE" }),
  updateHosts: (hostIds: string[]) =>
    api<any>("/api/auto-update/update", { method: "POST", body: { hostIds } }),
  updateAllHosts: () =>
    api<any>("/api/auto-update/update-all", { method: "POST" }),
  rollbackHost: (hostId: string) =>
    api<any>(`/api/auto-update/hosts/${hostId}/rollback`, { method: "POST" }),
  listOperations: () => api<any[]>("/api/auto-update/operations"),
  getHistory: () => api<any[]>("/api/auto-update/history"),
};

// Image Sharing API
export const imagesApi = {
  getStats: () => api<any>("/api/images/stats"),
  listRecent: (limit?: number) =>
    api<any[]>(`/api/images/recent?limit=${limit || 10}`),
  upload: (data: { sessionId: string; filename: string; mimeType: string; base64Data: string }) =>
    api<any>("/api/images/upload", { method: "POST", body: data }),
  captureScreenshot: (data: { sessionId: string; captureType: string }) =>
    api<any>("/api/images/screenshot", { method: "POST", body: data }),
  captureRemoteScreenshot: (data: { sessionId: string; hostId: string; captureType: string }) =>
    api<any>("/api/images/screenshot/remote", { method: "POST", body: data }),
  pasteFromClipboard: (data: { sessionId: string; base64Data: string; mimeType: string }) =>
    api<any>("/api/images/clipboard", { method: "POST", body: data }),
  getImage: (id: string) => api<any>(`/api/images/${id}`),
  getImageBase64: (id: string) => api<any>(`/api/images/${id}/base64`),
  deleteImage: (id: string) =>
    api<any>(`/api/images/${id}`, { method: "DELETE" }),
  listSessionImages: (sessionId: string) =>
    api<any[]>(`/api/images/session/${sessionId}`),
};

// n8n API
export const n8nApi = {
  getStats: () => api<any>("/api/n8n/stats"),
  getConfig: () => api<any>("/api/n8n/config"),
  updateConfig: (updates: any) =>
    api<any>("/api/n8n/config", { method: "PATCH", body: updates }),
  testConnection: () =>
    api<any>("/api/n8n/test", { method: "POST" }),
  listWebhooks: () => api<any[]>("/api/n8n/webhooks"),
  addWebhook: (data: any) =>
    api<any>("/api/n8n/webhooks", { method: "POST", body: data }),
  toggleWebhook: (id: string) =>
    api<any>(`/api/n8n/webhooks/${id}/toggle`, { method: "POST" }),
  removeWebhook: (id: string) =>
    api<any>(`/api/n8n/webhooks/${id}`, { method: "DELETE" }),
};

// Bots API
export const botsApi = {
  getStats: () => api<any>("/api/bots/stats"),
  // Slack
  slack: {
    getConfig: () => api<any>("/api/bots/slack/config"),
    updateConfig: (updates: any) =>
      api<any>("/api/bots/slack/config", { method: "PATCH", body: updates }),
    connect: () => api<any>("/api/bots/slack/connect", { method: "POST" }),
    disconnect: () => api<any>("/api/bots/slack/disconnect", { method: "POST" }),
    listChannels: () => api<any[]>("/api/bots/slack/channels"),
    listCommands: () => api<any[]>("/api/bots/slack/commands"),
    listNotifications: () => api<any[]>("/api/bots/slack/notifications"),
    addNotification: (config: any) =>
      api<any>("/api/bots/slack/notifications", { method: "POST", body: config }),
  },
  // Discord
  discord: {
    getConfig: () => api<any>("/api/bots/discord/config"),
    updateConfig: (updates: any) =>
      api<any>("/api/bots/discord/config", { method: "PATCH", body: updates }),
    connect: () => api<any>("/api/bots/discord/connect", { method: "POST" }),
    disconnect: () => api<any>("/api/bots/discord/disconnect", { method: "POST" }),
    listGuilds: () => api<any[]>("/api/bots/discord/guilds"),
    listCommands: () => api<any[]>("/api/bots/discord/commands"),
    listBindings: () => api<any[]>("/api/bots/discord/bindings"),
    addBinding: (binding: any) =>
      api<any>("/api/bots/discord/bindings", { method: "POST", body: binding }),
    removeBinding: (id: string) =>
      api<any>(`/api/bots/discord/bindings/${id}`, { method: "DELETE" }),
    listNotifications: () => api<any[]>("/api/bots/discord/notifications"),
  },
  // Telegram
  telegram: {
    getConfig: () => api<any>("/api/bots/telegram/config"),
    updateConfig: (updates: any) =>
      api<any>("/api/bots/telegram/config", { method: "PATCH", body: updates }),
    connect: () => api<any>("/api/bots/telegram/connect", { method: "POST" }),
    disconnect: () => api<any>("/api/bots/telegram/disconnect", { method: "POST" }),
    listCommands: () => api<any[]>("/api/bots/telegram/commands"),
    listChats: () => api<any[]>("/api/bots/telegram/chats"),
    authorizeChat: (chat: any) =>
      api<any>("/api/bots/telegram/chats", { method: "POST", body: chat }),
    deauthorizeChat: (chatId: string) =>
      api<any>(`/api/bots/telegram/chats/${chatId}`, { method: "DELETE" }),
  },
};

// Workflow Builder API
export const workflowBuilderApi = {
  getTemplates: () => api<any[]>("/api/workflow-builder/templates"),
  getTemplate: (id: string) => api<any>(`/api/workflow-builder/templates/${id}`),
  createCanvas: (workflowId: string) =>
    api<any>("/api/workflow-builder/canvas", { method: "POST", body: { workflowId } }),
  getCanvas: (id: string) => api<any>(`/api/workflow-builder/canvas/${id}`),
  getCanvasByWorkflow: (workflowId: string) =>
    api<any>(`/api/workflow-builder/canvas/workflow/${workflowId}`),
  updateCanvas: (id: string, updates: any) =>
    api<any>(`/api/workflow-builder/canvas/${id}`, { method: "PATCH", body: updates }),
  deleteCanvas: (id: string) =>
    api<any>(`/api/workflow-builder/canvas/${id}`, { method: "DELETE" }),
  addNode: (canvasId: string, type: string, position: { x: number; y: number }) =>
    api<any>(`/api/workflow-builder/canvas/${canvasId}/nodes`, { method: "POST", body: { type, position } }),
  updateNode: (canvasId: string, nodeId: string, updates: any) =>
    api<any>(`/api/workflow-builder/canvas/${canvasId}/nodes/${nodeId}`, { method: "PATCH", body: updates }),
  deleteNode: (canvasId: string, nodeId: string) =>
    api<any>(`/api/workflow-builder/canvas/${canvasId}/nodes/${nodeId}`, { method: "DELETE" }),
  addEdge: (canvasId: string, source: string, target: string) =>
    api<any>(`/api/workflow-builder/canvas/${canvasId}/edges`, { method: "POST", body: { source, target } }),
  deleteEdge: (canvasId: string, edgeId: string) =>
    api<any>(`/api/workflow-builder/canvas/${canvasId}/edges/${edgeId}`, { method: "DELETE" }),
  validate: (canvas: any) =>
    api<any>("/api/workflow-builder/validate", { method: "POST", body: { canvas } }),
  exportToSteps: (canvasId: string) =>
    api<any>(`/api/workflow-builder/canvas/${canvasId}/export`, { method: "POST" }),
  importFromWorkflow: (workflow: any) =>
    api<any>("/api/workflow-builder/import", { method: "POST", body: workflow }),
};

// Supervisor API
export const supervisorsApi = {
  getStats: () => api<any>("/api/supervisors/stats"),
  getTemplates: () => api<any[]>("/api/supervisors/templates"),
  getTemplate: (id: string) => api<any>(`/api/supervisors/templates/${id}`),
  createFromTemplate: (templateId: string, name?: string) =>
    api<any>(`/api/supervisors/from-template/${templateId}`, { method: "POST", body: { name } }),
  list: () => api<any[]>("/api/supervisors"),
  get: (id: string) => api<any>(`/api/supervisors/${id}`),
  create: (data: any) =>
    api<any>("/api/supervisors", { method: "POST", body: data }),
  update: (id: string, updates: any) =>
    api<any>(`/api/supervisors/${id}`, { method: "PATCH", body: updates }),
  delete: (id: string) =>
    api<any>(`/api/supervisors/${id}`, { method: "DELETE" }),
  addWorker: (supervisorId: string, worker: any) =>
    api<any>(`/api/supervisors/${supervisorId}/workers`, { method: "POST", body: worker }),
  updateWorker: (supervisorId: string, workerId: string, updates: any) =>
    api<any>(`/api/supervisors/${supervisorId}/workers/${workerId}`, { method: "PATCH", body: updates }),
  removeWorker: (supervisorId: string, workerId: string) =>
    api<any>(`/api/supervisors/${supervisorId}/workers/${workerId}`, { method: "DELETE" }),
  execute: (id: string, task: string) =>
    api<any>(`/api/supervisors/${id}/execute`, { method: "POST", body: { task } }),
  listExecutions: (supervisorId?: string) =>
    api<any[]>(`/api/supervisors/executions${supervisorId ? `?supervisorId=${supervisorId}` : ""}`),
  getExecution: (id: string) => api<any>(`/api/supervisors/executions/${id}`),
  stopExecution: (id: string) =>
    api<any>(`/api/supervisors/executions/${id}/stop`, { method: "POST" }),
};

// MCP Host Agents API
export const mcpHostsApi = {
  getStats: () => api<any>("/api/mcp-hosts/stats"),
  getDiscoveryConfig: () => api<any>("/api/mcp-hosts/discovery/config"),
  updateDiscoveryConfig: (updates: any) =>
    api<any>("/api/mcp-hosts/discovery/config", { method: "PATCH", body: updates }),
  startDiscovery: () =>
    api<any>("/api/mcp-hosts/discovery/start", { method: "POST" }),
  stopDiscovery: () =>
    api<any>("/api/mcp-hosts/discovery/stop", { method: "POST" }),
  listDiscoveredHosts: () => api<any[]>("/api/mcp-hosts/discovery/hosts"),
  connectDiscoveredHost: (id: string) =>
    api<any>(`/api/mcp-hosts/discovery/hosts/${id}/connect`, { method: "POST" }),
  listHosts: () => api<any[]>("/api/mcp-hosts/hosts"),
  getOnlineHosts: () => api<any[]>("/api/mcp-hosts/hosts/online"),
  getHost: (id: string) => api<any>(`/api/mcp-hosts/hosts/${id}`),
  registerHost: (data: any) =>
    api<any>("/api/mcp-hosts/hosts", { method: "POST", body: data }),
  connectHost: (id: string) =>
    api<any>(`/api/mcp-hosts/hosts/${id}/connect`, { method: "POST" }),
  disconnectHost: (id: string) =>
    api<any>(`/api/mcp-hosts/hosts/${id}/disconnect`, { method: "POST" }),
  removeHost: (id: string) =>
    api<any>(`/api/mcp-hosts/hosts/${id}`, { method: "DELETE" }),
  startMCPServer: (hostId: string, serverId: string) =>
    api<any>(`/api/mcp-hosts/hosts/${hostId}/mcp/${serverId}/start`, { method: "POST" }),
  stopMCPServer: (hostId: string, serverId: string) =>
    api<any>(`/api/mcp-hosts/hosts/${hostId}/mcp/${serverId}/stop`, { method: "POST" }),
  captureScreenshot: (hostId: string) =>
    api<any>(`/api/mcp-hosts/hosts/${hostId}/screenshot`, { method: "POST" }),
  triggerUpdate: (hostId: string) =>
    api<any>(`/api/mcp-hosts/hosts/${hostId}/update`, { method: "POST" }),
  generateInstallScript: (config: any) =>
    fetch(`${API_BASE}/api/mcp-hosts/install-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then((r) => r.text()),
};

// Email API
export const emailApi = {
  getStats: () => api<any>("/api/email/stats"),
  getConfig: () => api<any>("/api/email/config"),
  updateConfig: (updates: any) =>
    api<any>("/api/email/config", { method: "PATCH", body: updates }),
  testConnection: () =>
    api<any>("/api/email/test", { method: "POST" }),
  listTemplates: (category?: string) =>
    api<any[]>(`/api/email/templates${category ? `?category=${category}` : ""}`),
  getTemplate: (id: string) => api<any>(`/api/email/templates/${id}`),
  createTemplate: (data: any) =>
    api<any>("/api/email/templates", { method: "POST", body: data }),
  updateTemplate: (id: string, updates: any) =>
    api<any>(`/api/email/templates/${id}`, { method: "PATCH", body: updates }),
  deleteTemplate: (id: string) =>
    api<any>(`/api/email/templates/${id}`, { method: "DELETE" }),
  listRecipients: () => api<any[]>("/api/email/recipients"),
  getRecipient: (id: string) => api<any>(`/api/email/recipients/${id}`),
  addRecipient: (data: any) =>
    api<any>("/api/email/recipients", { method: "POST", body: data }),
  updateRecipient: (id: string, updates: any) =>
    api<any>(`/api/email/recipients/${id}`, { method: "PATCH", body: updates }),
  removeRecipient: (id: string) =>
    api<any>(`/api/email/recipients/${id}`, { method: "DELETE" }),
  sendEmail: (data: any) =>
    api<any>("/api/email/send", { method: "POST", body: data }),
  sendFromTemplate: (templateId: string, to: string[], variables: any) =>
    api<any>(`/api/email/send/template/${templateId}`, { method: "POST", body: { to, variables } }),
  listMessages: (limit?: number) =>
    api<any[]>(`/api/email/messages?limit=${limit || 50}`),
  getMessage: (id: string) => api<any>(`/api/email/messages/${id}`),
};
