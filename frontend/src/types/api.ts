import type * as Model from "../../../backend/src/types/index";

export type Wire<T> = T extends Date ? string : T extends readonly (infer U)[] ? Wire<U>[] : T extends object ? { [K in keyof T]: Wire<T[K]> } : T;

export interface ApiResponses {
  "GET /api/sessions": Wire<Model.Session[]>;
  "GET /api/sessions/{}": Wire<Model.Session>;
  "POST /api/sessions": Wire<Model.Session>;
  "PATCH /api/sessions/{}": Wire<Model.Session>;
  "DELETE /api/sessions/{}": Wire<{
    success: true;
}>;
  "POST /api/sessions/{}/start": Wire<{
    success: true;
}>;
  "POST /api/sessions/{}/stop": Wire<{
    success: true;
}>;
  "POST /api/sessions/{}/pause": Wire<{
    success: true;
}>;
  "POST /api/sessions/{}/resume": Wire<{
    success: true;
}>;
  "POST /api/sessions/{}/input": Wire<{
    success: true;
}>;
  "GET /api/sessions/{}/output": Wire<{
    output: string[];
}>;
  "GET /api/mcp": Wire<Model.MCPServer[]>;
  "GET /api/mcp/{}": Wire<Model.MCPServer>;
  "POST /api/mcp": Wire<Model.MCPServer>;
  "DELETE /api/mcp/{}": Wire<{
    success: true;
}>;
  "POST /api/mcp/{}/start": Wire<{
    success: true;
}>;
  "POST /api/mcp/{}/stop": Wire<{
    success: true;
}>;
  "POST /api/mcp/{}/restart": Wire<{
    success: true;
}>;
  "GET /api/mcp/{}/logs": Wire<{
    logs: Model.LogEntry[];
}>;
  "GET /api/rules": Wire<Model.RulesConfig>;
  "GET /api/rules/hard": Wire<Model.HardRule[]>;
  "POST /api/rules/hard": Wire<Model.HardRule>;
  "DELETE /api/rules/hard/{}": Wire<{
    success: true;
}>;
  "GET /api/rules/default": Wire<string[]>;
  "PUT /api/rules/default": Wire<{
    success: true;
}>;
  "GET /api/rules/session/{}": Wire<string[]>;
  "PUT /api/rules/session/{}": Wire<{
    success: true;
}>;
  "DELETE /api/rules/session/{}": Wire<{
    success: true;
}>;
  "GET /api/rules/prompt/{}": Wire<{
    prompt: string;
}>;
  "GET /api/usage": Wire<Model.UsageSummary>;
  "GET /api/usage/history": Wire<Model.UsageHistoryEntry[]>;
  "GET /api/usage/sessions": Wire<Record<string, Model.SessionUsageSummary>>;
  "GET /api/usage/sessions/{}": Wire<Model.UsageRecord[]>;
  "GET /api/usage/alerts": Wire<Model.UsageAlert[]>;
  "PUT /api/usage/thresholds": Wire<{
    success: true;
}>;
  "PUT /api/usage/limit": Wire<{
    success: true;
}>;
  "GET /api/usage/export": Wire<{
    exportDate: string;
    period: {
        days: number;
        startDate: string | null;
        endDate: string | null;
    };
    summary: {
        totalTokens: number;
        totalCost: number;
        bySession: Record<string, Model.SessionUsageSummary>;
    };
    daily: Model.UsageHistoryEntry[];
}>;
  "GET /api/usage/export/sessions": Wire<{
    exportDate: string;
    sessions: {
        sessionId: string;
        sessionName: string;
        totalTokens: number;
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
        requestCount: number;
        lastUsed: Date;
    }[];
}>;
  "GET /api/git/status": Wire<{
    branch: string;
    changes: {
        status: string;
        file: string;
        staged: boolean;
    }[];
    uncommittedCount: number;
}>;
  "GET /api/git/branches": Wire<{
    current: string;
    branches: string[];
}>;
  "GET /api/git/log": Wire<{
    hash: string;
    shortHash: string;
    author: string;
    email: string;
    message: string;
    date: string;
}[]>;
  "GET /api/git/diff": Wire<{
    diff: string;
}>;
  "POST /api/git/command": Wire<{
    stdout: string;
    stderr: string;
}>;
  "GET /api/workflows": Wire<Model.Workflow[]>;
  "GET /api/workflows/stats": Wire<{
    total: number;
    running: number;
    completed: number;
    error: number;
    totalRuns: number;
}>;
  "GET /api/workflows/{}": Wire<Model.Workflow>;
  "POST /api/workflows": Wire<Model.Workflow>;
  "PATCH /api/workflows/{}": Wire<Model.Workflow>;
  "DELETE /api/workflows/{}": Wire<{
    success: true;
}>;
  "POST /api/workflows/{}/run": Wire<Model.WorkflowRunResult>;
  "POST /api/workflows/{}/stop": Wire<{
    success: true;
}>;
  "GET /api/automations": Wire<Model.Automation[]>;
  "GET /api/automations/stats": Wire<{
    total: number;
    active: number;
    runsToday: number;
    successRate: number;
}>;
  "GET /api/automations/{}": Wire<Model.Automation>;
  "GET /api/automations/{}/logs": Wire<Model.AutomationRunLog[]>;
  "POST /api/automations": Wire<Model.Automation>;
  "PATCH /api/automations/{}": Wire<Model.Automation>;
  "DELETE /api/automations/{}": Wire<{
    success: true;
}>;
  "POST /api/automations/{}/activate": Wire<Model.Automation>;
  "POST /api/automations/{}/pause": Wire<Model.Automation>;
  "POST /api/automations/{}/run": Wire<Model.AutomationRunLog>;
  "POST /api/automations/webhook/{}": Wire<Model.AutomationRunLog>;
  "GET /api/knowledge": Wire<Model.KnowledgeItem[]>;
  "GET /api/knowledge/stats": Wire<{
    total: number;
    totalSize: number;
    byType: Record<string, number>;
    sessionsUsing: number;
}>;
  "GET /api/knowledge/search": Wire<Model.KnowledgeSearchResult[]>;
  "GET /api/knowledge/session/{}": Wire<Model.KnowledgeItem[]>;
  "GET /api/knowledge/{}": Wire<Model.KnowledgeItem>;
  "POST /api/knowledge": Wire<Model.KnowledgeItem>;
  "POST /api/knowledge/import": Wire<Model.KnowledgeItem>;
  "PATCH /api/knowledge/{}": Wire<Model.KnowledgeItem>;
  "DELETE /api/knowledge/{}": Wire<{
    success: true;
}>;
  "POST /api/knowledge/{}/sync": Wire<Model.KnowledgeItem>;
  "POST /api/knowledge/{}/sessions/{}": Wire<Model.KnowledgeItem>;
  "DELETE /api/knowledge/{}/sessions/{}": Wire<Model.KnowledgeItem>;
  "GET /api/tasks": Wire<Model.Task[]>;
  "GET /api/tasks/board": Wire<Model.TaskBoard>;
  "GET /api/tasks/stats": Wire<{
    total: number;
    byStatus: Record<Model.TaskStatus, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completedToday: number;
}>;
  "GET /api/tasks/overdue": Wire<Model.Task[]>;
  "GET /api/tasks/status/{}": Wire<Model.Task[]>;
  "GET /api/tasks/session/{}": Wire<Model.Task[]>;
  "GET /api/tasks/{}": Wire<Model.Task>;
  "POST /api/tasks": Wire<Model.Task>;
  "PATCH /api/tasks/{}": Wire<Model.Task>;
  "DELETE /api/tasks/{}": Wire<{
    success: true;
}>;
  "POST /api/tasks/{}/move/{}": Wire<Model.Task>;
  "POST /api/tasks/{}/assign/{}": Wire<Model.Task>;
  "POST /api/tasks/{}/unassign": Wire<Model.Task>;
  "GET /api/chains": Wire<Model.Chain[]>;
  "GET /api/chains/stats": Wire<{
    total: number;
    running: number;
    totalRuns: number;
    totalTokensUsed: number;
    avgSteps: number;
}>;
  "GET /api/chains/{}": Wire<Model.Chain>;
  "POST /api/chains": Wire<Model.Chain>;
  "PATCH /api/chains/{}": Wire<Model.Chain>;
  "DELETE /api/chains/{}": Wire<{
    success: true;
}>;
  "POST /api/chains/{}/run": Wire<Model.ChainRunResult>;
  "POST /api/chains/{}/stop": Wire<{
    success: true;
}>;
  "GET /api/alerts/stats": Wire<Model.AlertStats>;
  "GET /api/alerts": Wire<Model.Alert[]>;
  "GET /api/alerts/active": Wire<Model.Alert[]>;
  "GET /api/alerts/{}": Wire<Model.Alert>;
  "POST /api/alerts/{}/acknowledge": Wire<Model.Alert>;
  "POST /api/alerts/acknowledge-all": Wire<{
    acknowledged: number;
}>;
  "DELETE /api/alerts/{}": Wire<{
    success: true;
}>;
  "GET /api/alerts/rules": Wire<Model.AlertRule[]>;
  "GET /api/alerts/rules/{}": Wire<Model.AlertRule>;
  "POST /api/alerts/rules": Wire<Model.AlertRule>;
  "PATCH /api/alerts/rules/{}": Wire<Model.AlertRule>;
  "POST /api/alerts/rules/{}/toggle": Wire<Model.AlertRule>;
  "DELETE /api/alerts/rules/{}": Wire<{
    success: true;
}>;
  "POST /api/alerts/check": Wire<{
    success: true;
}>;
  "GET /api/notifications/stats": Wire<Model.NotificationStats>;
  "GET /api/notifications": Wire<Model.Notification[]>;
  "GET /api/notifications/unread": Wire<Model.Notification[]>;
  "GET /api/notifications/preferences": Wire<Model.NotificationPreferences>;
  "PATCH /api/notifications/preferences": Wire<Model.NotificationPreferences>;
  "GET /api/notifications/{}": Wire<Model.Notification>;
  "POST /api/notifications": Wire<Model.Notification>;
  "POST /api/notifications/{}/read": Wire<Model.Notification>;
  "POST /api/notifications/read-all": Wire<{
    marked: number;
}>;
  "DELETE /api/notifications/{}": Wire<{
    success: true;
}>;
  "DELETE /api/notifications": Wire<{
    deleted: number;
}>;
  "DELETE /api/notifications/read": Wire<{
    deleted: number;
}>;
  "GET /api/integrations/stats": Wire<Model.IntegrationStats>;
  "GET /api/integrations": Wire<(Model.IntegrationDefinition & {
    connected: boolean;
    status?: Model.IntegrationStatus;
    lastSyncAt?: string;
})[]>;
  "GET /api/integrations/connected": Wire<{
    config: {
        [k: string]: string;
    };
    id: string;
    name: string;
    description: string;
    category: Model.IntegrationCategory;
    status: Model.IntegrationStatus;
    lastSyncAt?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}[]>;
  "GET /api/integrations/definitions": Wire<Model.IntegrationDefinition[]>;
  "GET /api/integrations/definitions/{}": Wire<Model.IntegrationDefinition>;
  "GET /api/integrations/{}": Wire<{
    config: {
        [k: string]: string;
    };
    id: string;
    name: string;
    description: string;
    category: Model.IntegrationCategory;
    status: Model.IntegrationStatus;
    lastSyncAt?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}>;
  "POST /api/integrations/connect": Wire<{
    config: {
        [k: string]: string;
    };
    id: string;
    name: string;
    description: string;
    category: Model.IntegrationCategory;
    status: Model.IntegrationStatus;
    lastSyncAt?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}>;
  "POST /api/integrations/test": Wire<{
    success: boolean;
    error?: string;
} | {
    success: false;
    error: string;
}>;
  "DELETE /api/integrations/{}": Wire<{
    success: true;
}>;
  "POST /api/integrations/{}/sync": Wire<{
    config: {
        [k: string]: string;
    };
    id: string;
    name: string;
    description: string;
    category: Model.IntegrationCategory;
    status: Model.IntegrationStatus;
    lastSyncAt?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}>;
  "GET /api/file-sync/stats": Wire<Model.FileSyncStats>;
  "GET /api/file-sync/config": Wire<Model.FileSyncConfig>;
  "PATCH /api/file-sync/config": Wire<Model.FileSyncConfig>;
  "GET /api/file-sync/folders": Wire<Model.SyncedFolder[]>;
  "GET /api/file-sync/folders/host/{}": Wire<Model.SyncedFolder[]>;
  "GET /api/file-sync/folders/{}": Wire<Model.SyncedFolder>;
  "POST /api/file-sync/folders": Wire<Model.SyncedFolder>;
  "DELETE /api/file-sync/folders/{}": Wire<{
    success: true;
}>;
  "POST /api/file-sync/folders/{}/sync": Wire<Model.SyncOperation>;
  "GET /api/file-sync/files": Wire<Model.SyncedFile[]>;
  "GET /api/file-sync/files/search": Wire<Model.SyncedFile[]>;
  "GET /api/file-sync/files/{}": Wire<Model.SyncedFile>;
  "POST /api/file-sync/files": Wire<Model.SyncedFile>;
  "PUT /api/file-sync/files/{}": Wire<Model.SyncedFile>;
  "DELETE /api/file-sync/files/{}": Wire<{
    success: true;
}>;
  "GET /api/file-sync/files/{}/versions": Wire<Model.FileVersion[]>;
  "POST /api/file-sync/files/{}/versions/{}/restore": Wire<Model.SyncedFile>;
  "GET /api/file-sync/conflicts": Wire<Model.SyncedFile[]>;
  "POST /api/file-sync/conflicts/resolve": Wire<Model.SyncedFile>;
  "POST /api/file-sync/files/{}/sessions/{}": Wire<Model.SessionAttachedFile>;
  "DELETE /api/file-sync/files/{}/sessions/{}": Wire<{
    success: true;
}>;
  "GET /api/file-sync/sessions/{}/files": Wire<Model.SessionAttachedFile[]>;
  "GET /api/file-sync/operations": Wire<Model.SyncOperation[]>;
  "GET /api/file-sync/operations/{}": Wire<Model.SyncOperation>;
  "GET /api/auto-update/stats": Wire<{
    totalHosts: number;
    upToDate: number;
    outdated: number;
    updating: number;
    errors: number;
    latestVersion: string | undefined;
    lastCheck: number | null;
    pendingUpdates: number;
}>;
  "GET /api/auto-update/settings": Wire<Model.UpdateSettings>;
  "PATCH /api/auto-update/settings": Wire<Model.UpdateSettings>;
  "POST /api/auto-update/check": Wire<{
    message: string;
} | Model.UpdateInfo>;
  "GET /api/auto-update/latest": Wire<Model.UpdateInfo>;
  "GET /api/auto-update/hosts": Wire<Model.HostVersion[]>;
  "GET /api/auto-update/hosts/{}": Wire<Model.HostVersion>;
  "POST /api/auto-update/hosts": Wire<Model.HostVersion>;
  "DELETE /api/auto-update/hosts/{}": Wire<{
    success: true;
}>;
  "POST /api/auto-update/update": Wire<Model.UpdateOperation>;
  "POST /api/auto-update/update-all": Wire<Model.UpdateOperation>;
  "POST /api/auto-update/hosts/{}/rollback": Wire<Model.UpdateResult>;
  "GET /api/auto-update/operations": Wire<Model.UpdateOperation[]>;
  "GET /api/auto-update/operations/{}": Wire<Model.UpdateOperation>;
  "GET /api/auto-update/history": Wire<Model.UpdateHistory[]>;
  "GET /api/images/stats": Wire<Model.ImageStats>;
  "GET /api/images/recent": Wire<Model.SessionImage[]>;
  "POST /api/images/upload": Wire<Model.SessionImage>;
  "POST /api/images/screenshot": Wire<Model.SessionImage>;
  "POST /api/images/screenshot/remote": Wire<Model.SessionImage>;
  "POST /api/images/clipboard": Wire<Model.SessionImage>;
  "GET /api/images/{}": Wire<Model.SessionImage>;
  "GET /api/images/{}/base64": Wire<{
    base64: string;
    mimeType: string | undefined;
    dataUri: string;
}>;
  "DELETE /api/images/{}": Wire<{
    success: true;
}>;
  "POST /api/images/{}/used/{}": Wire<{
    success: true;
}>;
  "GET /api/images/session/{}": Wire<Model.SessionImage[]>;
  "GET /api/n8n/stats": Wire<{
    enabled: boolean;
    status: "error" | "connected" | "disconnected";
    totalWebhooks: number;
    activeWebhooks: number;
    totalSuccess: number;
    totalFailures: number;
    lastConnected: Date | undefined;
}>;
  "GET /api/n8n/config": Wire<Omit<Model.N8nConfig, "apiKey" | "webhookSecret"> & {
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
}>;
  "PATCH /api/n8n/config": Wire<Omit<Model.N8nConfig, "apiKey" | "webhookSecret"> & {
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
}>;
  "POST /api/n8n/test": Wire<{
    success: boolean;
    status: "error" | "connected" | "disconnected";
}>;
  "GET /api/n8n/webhooks": Wire<Model.N8nOutgoingWebhook[]>;
  "POST /api/n8n/webhooks": Wire<Model.N8nOutgoingWebhook>;
  "POST /api/n8n/webhooks/{}/toggle": Wire<Model.N8nOutgoingWebhook>;
  "DELETE /api/n8n/webhooks/{}": Wire<{
    success: true;
}>;
  "POST /api/n8n/api/sessions/create": Wire<Model.N8nApiResponse<unknown>>;
  "POST /api/n8n/api/sessions/{}/input": Wire<Model.N8nApiResponse<unknown>>;
  "GET /api/n8n/api/sessions/{}/status": Wire<{
    success: true;
    data: {
        sessionId: string;
        status: string;
    };
    requestId: `${string}-${string}-${string}-${string}-${string}`;
}>;
  "POST /api/n8n/api/tasks/create": Wire<Model.N8nApiResponse<unknown>>;
  "POST /api/n8n/api/workflows/trigger": Wire<Model.N8nApiResponse<unknown>>;
  "POST /api/n8n/webhook": Wire<{
    success: true;
    message: string;
}>;
  "GET /api/bots/stats": Wire<{
    slack: Model.BotStats;
    discord: Model.BotStats;
    telegram: Model.BotStats;
}>;
  "GET /api/bots/slack/config": Wire<Omit<Model.SlackBotConfig, "botToken" | "appToken" | "signingSecret"> & {
    hasToken: boolean;
}>;
  "PATCH /api/bots/slack/config": Wire<Omit<Model.SlackBotConfig, "botToken" | "appToken" | "signingSecret"> & {
    hasToken: boolean;
}>;
  "POST /api/bots/slack/connect": Wire<{
    success: boolean;
    status: "error" | "online" | "offline";
}>;
  "POST /api/bots/slack/disconnect": Wire<{
    success: true;
}>;
  "GET /api/bots/slack/channels": Wire<Model.SlackChannel[]>;
  "GET /api/bots/slack/commands": Wire<Model.SlackCommand[]>;
  "GET /api/bots/slack/notifications": Wire<Model.SlackNotificationConfig[]>;
  "POST /api/bots/slack/notifications": Wire<{
    success: true;
}>;
  "DELETE /api/bots/slack/notifications/{}/{}": Wire<{
    success: true;
}>;
  "POST /api/bots/slack/send": Wire<{
    success: boolean;
}>;
  "POST /api/bots/slack/command": Wire<{
    text: string;
    response_type?: string;
}>;
  "GET /api/bots/discord/config": Wire<Omit<Model.DiscordBotConfig, "botToken" | "publicKey"> & {
    hasToken: boolean;
}>;
  "PATCH /api/bots/discord/config": Wire<Omit<Model.DiscordBotConfig, "botToken" | "publicKey"> & {
    hasToken: boolean;
}>;
  "POST /api/bots/discord/connect": Wire<{
    success: boolean;
    status: "error" | "online" | "offline";
}>;
  "POST /api/bots/discord/disconnect": Wire<{
    success: true;
}>;
  "GET /api/bots/discord/guilds": Wire<Model.DiscordGuild[]>;
  "GET /api/bots/discord/commands": Wire<Model.DiscordSlashCommand[]>;
  "GET /api/bots/discord/bindings": Wire<Model.DiscordChannelBinding[]>;
  "POST /api/bots/discord/bindings": Wire<Model.DiscordChannelBinding>;
  "DELETE /api/bots/discord/bindings/{}": Wire<{
    success: boolean;
}>;
  "GET /api/bots/discord/notifications": Wire<Model.DiscordNotificationChannel[]>;
  "POST /api/bots/discord/notifications": Wire<Model.DiscordNotificationChannel>;
  "DELETE /api/bots/discord/notifications/{}": Wire<{
    success: boolean;
}>;
  "POST /api/bots/discord/send/{}": Wire<{
    success: boolean;
}>;
  "POST /api/bots/discord/interactions": Wire<{
    type: number;
    data?: {
        content?: string;
        embeds?: Model.DiscordEmbed[];
        flags?: number;
    };
}>;
  "GET /api/bots/telegram/config": Wire<Omit<Model.TelegramBotConfig, "botToken"> & {
    hasToken: boolean;
}>;
  "PATCH /api/bots/telegram/config": Wire<Omit<Model.TelegramBotConfig, "botToken"> & {
    hasToken: boolean;
}>;
  "POST /api/bots/telegram/connect": Wire<{
    success: boolean;
    status: "error" | "online" | "offline";
}>;
  "POST /api/bots/telegram/disconnect": Wire<{
    success: true;
}>;
  "GET /api/bots/telegram/commands": Wire<Model.TelegramCommand[]>;
  "GET /api/bots/telegram/chats": Wire<Model.TelegramChat[]>;
  "POST /api/bots/telegram/chats": Wire<{
    success: true;
}>;
  "DELETE /api/bots/telegram/chats/{}": Wire<{
    success: boolean;
}>;
  "POST /api/bots/telegram/send": Wire<{
    success: boolean;
}>;
  "POST /api/bots/telegram/photo": Wire<{
    success: boolean;
}>;
  "POST /api/bots/telegram/webhook": Wire<{
    success: true;
}>;
  "GET /api/workflow-builder/stats": Wire<{
    totalCanvases: number;
    totalNodes: number;
    totalEdges: number;
    validCanvases: number;
}>;
  "GET /api/workflow-builder/canvas": Wire<Model.WorkflowCanvas[]>;
  "GET /api/workflow-builder/templates": Wire<Model.NodeTemplate[]>;
  "GET /api/workflow-builder/templates/{}": Wire<Model.NodeTemplate>;
  "POST /api/workflow-builder/canvas": Wire<Model.WorkflowCanvas>;
  "GET /api/workflow-builder/canvas/{}": Wire<Model.WorkflowCanvas>;
  "GET /api/workflow-builder/canvas/workflow/{}": Wire<Model.WorkflowCanvas>;
  "PATCH /api/workflow-builder/canvas/{}": Wire<Model.WorkflowCanvas>;
  "DELETE /api/workflow-builder/canvas/{}": Wire<{
    success: true;
}>;
  "POST /api/workflow-builder/canvas/{}/nodes": Wire<Model.WorkflowNode>;
  "PATCH /api/workflow-builder/canvas/{}/nodes/{}": Wire<Model.WorkflowNode>;
  "DELETE /api/workflow-builder/canvas/{}/nodes/{}": Wire<{
    success: true;
}>;
  "POST /api/workflow-builder/canvas/{}/edges": Wire<Model.WorkflowEdge>;
  "PATCH /api/workflow-builder/canvas/{}/edges/{}": Wire<Model.WorkflowEdge>;
  "DELETE /api/workflow-builder/canvas/{}/edges/{}": Wire<{
    success: true;
}>;
  "POST /api/workflow-builder/validate": Wire<Model.ValidateCanvasResponse>;
  "POST /api/workflow-builder/canvas/{}/export": Wire<{
    steps: unknown[];
}>;
  "POST /api/workflow-builder/import": Wire<Model.WorkflowCanvas>;
  "GET /api/supervisors/stats": Wire<Model.SupervisorStats>;
  "GET /api/supervisors/templates": Wire<Model.SupervisorTemplate[]>;
  "GET /api/supervisors/templates/{}": Wire<Model.SupervisorTemplate>;
  "POST /api/supervisors/from-template/{}": Wire<Model.SupervisorConfig>;
  "GET /api/supervisors": Wire<Model.SupervisorConfig[]>;
  "GET /api/supervisors/{}": Wire<Model.SupervisorConfig>;
  "POST /api/supervisors": Wire<Model.SupervisorConfig>;
  "PATCH /api/supervisors/{}": Wire<Model.SupervisorConfig>;
  "DELETE /api/supervisors/{}": Wire<{
    success: true;
}>;
  "POST /api/supervisors/{}/workers": Wire<Model.WorkerAgent>;
  "PATCH /api/supervisors/{}/workers/{}": Wire<Model.WorkerAgent>;
  "DELETE /api/supervisors/{}/workers/{}": Wire<{
    success: true;
}>;
  "GET /api/supervisors/executions": Wire<Model.SupervisorExecution[]>;
  "GET /api/supervisors/executions/{}": Wire<Model.SupervisorExecution>;
  "POST /api/supervisors/{}/execute": Wire<Model.SupervisorExecution>;
  "POST /api/supervisors/executions/{}/stop": Wire<{
    success: true;
}>;
  "GET /api/mcp-hosts/stats": Wire<Model.AgentStats>;
  "GET /api/mcp-hosts/discovery/config": Wire<Model.NetworkDiscoveryConfig>;
  "PATCH /api/mcp-hosts/discovery/config": Wire<Model.NetworkDiscoveryConfig>;
  "POST /api/mcp-hosts/discovery/start": Wire<{
    success: true;
}>;
  "POST /api/mcp-hosts/discovery/stop": Wire<{
    success: true;
}>;
  "GET /api/mcp-hosts/discovery/hosts": Wire<Model.DiscoveredHost[]>;
  "POST /api/mcp-hosts/discovery/hosts/{}/connect": Wire<Model.MCPHostAgent>;
  "GET /api/mcp-hosts/hosts": Wire<Model.MCPHostAgent[]>;
  "GET /api/mcp-hosts/hosts/online": Wire<Model.MCPHostAgent[]>;
  "GET /api/mcp-hosts/hosts/{}": Wire<Model.MCPHostAgent>;
  "POST /api/mcp-hosts/hosts": Wire<Model.MCPHostAgent>;
  "POST /api/mcp-hosts/hosts/{}/connect": Wire<{
    success: boolean;
}>;
  "POST /api/mcp-hosts/hosts/{}/disconnect": Wire<{
    success: boolean;
}>;
  "DELETE /api/mcp-hosts/hosts/{}": Wire<{
    success: true;
}>;
  "POST /api/mcp-hosts/hosts/{}/heartbeat": Wire<{
    success: true;
}>;
  "PUT /api/mcp-hosts/hosts/{}/mcp-servers": Wire<{
    success: true;
}>;
  "POST /api/mcp-hosts/hosts/{}/mcp/{}/start": Wire<{
    success: true;
    commandId: string;
    method: string;
} | {
    success: boolean;
    method: string;
}>;
  "POST /api/mcp-hosts/hosts/{}/mcp/{}/stop": Wire<{
    success: true;
    commandId: string;
    method: string;
} | {
    success: boolean;
    method: string;
}>;
  "POST /api/mcp-hosts/hosts/{}/mcp/{}/restart": Wire<{
    success: true;
    commandId: string;
    method: string;
} | {
    success: boolean;
    method: string;
}>;
  "GET /api/mcp-hosts/commands": Wire<Model.AgentCommand[]>;
  "GET /api/mcp-hosts/commands/{}": Wire<Model.AgentCommand>;
  "POST /api/mcp-hosts/hosts/{}/screenshot": Wire<{
    success: true;
    commandId: string;
    method: string;
} | {
    filename: string;
    method: string;
}>;
  "POST /api/mcp-hosts/hosts/{}/update": Wire<{
    success: true;
    commandId: string;
    method: string;
} | {
    success: boolean;
    method: string;
}>;
  "GET /api/mcp-hosts/agents": Wire<never[] | {
    hostId: string;
    hostName: string;
    platform: string;
    connectedAt: Date;
}[]>;
  "POST /api/mcp-hosts/hosts/{}/command": Wire<{
    success: boolean;
    commandId: string;
}>;
  "GET /api/email/stats": Wire<Model.EmailStats>;
  "GET /api/email/config": Wire<Omit<Model.EmailConfig, "smtp" | "sendgrid" | "mailgun" | "ses"> & {
    configured: boolean;
}>;
  "PATCH /api/email/config": Wire<Omit<Model.EmailConfig, "smtp" | "sendgrid" | "mailgun" | "ses"> & {
    configured: boolean;
}>;
  "POST /api/email/test": Wire<{
    success: boolean;
}>;
  "GET /api/email/templates": Wire<Model.EmailTemplate[]>;
  "GET /api/email/templates/{}": Wire<Model.EmailTemplate>;
  "POST /api/email/templates": Wire<Model.EmailTemplate>;
  "PATCH /api/email/templates/{}": Wire<Model.EmailTemplate>;
  "DELETE /api/email/templates/{}": Wire<{
    success: true;
}>;
  "GET /api/email/recipients": Wire<Model.EmailRecipient[]>;
  "GET /api/email/recipients/{}": Wire<Model.EmailRecipient>;
  "POST /api/email/recipients": Wire<Model.EmailRecipient>;
  "PATCH /api/email/recipients/{}": Wire<Model.EmailRecipient>;
  "DELETE /api/email/recipients/{}": Wire<{
    success: true;
}>;
  "POST /api/email/send": Wire<Model.EmailMessage>;
  "POST /api/email/send/template/{}": Wire<Model.EmailMessage>;
  "GET /api/email/messages": Wire<Model.EmailMessage[]>;
  "GET /api/email/messages/{}": Wire<Model.EmailMessage>;
}

export interface ApiRequests {
  "PATCH /api/file-sync/config": Wire<Partial<Model.FileSyncConfig>>;
  "POST /api/file-sync/folders": Wire<{
    hostId: string;
    hostName: string;
    remotePath: string;
    patterns?: {
        include?: string[];
        exclude?: string[];
    };
}>;
  "POST /api/file-sync/conflicts/resolve": Wire<Model.ConflictResolution>;
  "PATCH /api/auto-update/settings": Wire<Partial<Model.UpdateSettings>>;
  "POST /api/auto-update/hosts": Wire<{
    hostId: string;
    hostName: string;
    platform: "windows" | "macos" | "linux";
    claudeVersion: string;
    agentVersion: string;
}>;
  "POST /api/images/upload": Wire<Model.ImageUploadRequest>;
  "POST /api/images/screenshot": Wire<Model.ScreenshotRequest>;
  "POST /api/images/screenshot/remote": Wire<Model.RemoteScreenshotRequest>;
  "PATCH /api/n8n/config": Wire<{
    enabled?: boolean;
    instanceUrl?: string;
    apiKey?: string;
}>;
  "POST /api/n8n/webhooks": Wire<{
    eventType: Model.N8nEventType;
    webhookUrl: string;
    headers?: Record<string, string>;
    retryOnFailure?: boolean;
    maxRetries?: number;
}>;
  "POST /api/n8n/api/sessions/create": Wire<Model.N8nCreateSessionRequest>;
  "POST /api/n8n/api/sessions/{}/input": Wire<Model.N8nSessionInputRequest>;
  "POST /api/n8n/api/tasks/create": Wire<Model.N8nCreateTaskRequest>;
  "POST /api/n8n/api/workflows/trigger": Wire<Model.N8nTriggerWorkflowRequest>;
  "PATCH /api/bots/slack/config": Wire<{
    enabled?: boolean;
    botToken?: string;
    appToken?: string;
    signingSecret?: string;
}>;
  "POST /api/bots/slack/notifications": Wire<Model.SlackNotificationConfig>;
  "POST /api/bots/slack/send": Wire<Model.SlackMessage>;
  "PATCH /api/bots/discord/config": Wire<{
    enabled?: boolean;
    botToken?: string;
    applicationId?: string;
    publicKey?: string;
}>;
  "POST /api/bots/discord/bindings": Wire<Omit<Model.DiscordChannelBinding, "id">>;
  "POST /api/bots/discord/notifications": Wire<Omit<Model.DiscordNotificationChannel, "id">>;
  "PATCH /api/bots/telegram/config": Wire<{
    enabled?: boolean;
    botToken?: string;
    webhookUrl?: string;
}>;
  "POST /api/bots/telegram/chats": Wire<Model.TelegramChat>;
  "POST /api/bots/telegram/send": Wire<Model.TelegramMessage>;
  "PATCH /api/workflow-builder/canvas/{}": Wire<Partial<Model.WorkflowCanvas>>;
  "PATCH /api/workflow-builder/canvas/{}/nodes/{}": Wire<Partial<Model.WorkflowNode>>;
  "PATCH /api/workflow-builder/canvas/{}/edges/{}": Wire<Partial<Model.WorkflowEdge>>;
  "POST /api/workflow-builder/import": Wire<{
    id: string;
    steps: unknown[];
}>;
  "POST /api/supervisors": Wire<{
    name: string;
    model: Model.SupervisorConfig["model"];
    strategy: Model.SupervisorConfig["strategy"];
    systemPrompt: string;
    workers: Omit<Model.WorkerAgent, "id">[];
    settings?: Partial<Model.SupervisorConfig["settings"]>;
}>;
  "PATCH /api/supervisors/{}": Wire<Partial<Model.SupervisorConfig>>;
  "POST /api/supervisors/{}/workers": Wire<Omit<Model.WorkerAgent, "id">>;
  "PATCH /api/supervisors/{}/workers/{}": Wire<Partial<Model.WorkerAgent>>;
  "PATCH /api/mcp-hosts/discovery/config": Wire<Partial<Model.NetworkDiscoveryConfig>>;
  "POST /api/mcp-hosts/hosts": Wire<{
    hostName: string;
    platform: "windows" | "macos" | "linux";
    version: string;
    capabilities: Model.MCPHostCapability[];
    network: Model.MCPHostAgent["network"];
    security: Model.MCPHostAgent["security"];
}>;
  "POST /api/mcp-hosts/install-script": Wire<Model.InstallScriptConfig>;
  "PATCH /api/email/config": Wire<Partial<Model.EmailConfig>>;
  "POST /api/email/templates": Wire<Omit<Model.EmailTemplate, "id" | "createdAt" | "updatedAt">>;
  "PATCH /api/email/templates/{}": Wire<Partial<Model.EmailTemplate>>;
  "POST /api/email/recipients": Wire<Omit<Model.EmailRecipient, "id" | "createdAt">>;
  "PATCH /api/email/recipients/{}": Wire<Partial<Model.EmailRecipient>>;
  "POST /api/email/send": Wire<{
    to: string[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    attachments?: Model.EmailAttachment[];
    category?: Model.EmailCategory;
}>;
}
