// n8n Integration Types

export interface N8nConfig {
  enabled: boolean;
  instanceUrl: string;
  apiKey: string;
  webhookSecret: string;
  outgoingWebhooks: N8nOutgoingWebhook[];
  status: "connected" | "disconnected" | "error";
  lastConnected?: Date;
  error?: string;
}

export interface N8nOutgoingWebhook {
  id: string;
  eventType: N8nEventType;
  webhookUrl: string;
  enabled: boolean;
  headers?: Record<string, string>;
  retryOnFailure: boolean;
  maxRetries: number;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

export type N8nEventType =
  | "session:completed"
  | "session:started"
  | "session:error"
  | "session:output"
  | "workflow:completed"
  | "workflow:failed"
  | "task:created"
  | "task:completed"
  | "alert:triggered"
  | "file:changed";

export interface N8nWebhookPayload {
  event: N8nEventType;
  timestamp: string;
  data: {
    sessionId?: string;
    workflowId?: string;
    taskId?: string;
    alertId?: string;
    output?: unknown;
    status?: string;
    metadata?: Record<string, unknown>;
  };
  signature: string;
}

export interface N8nCreateSessionRequest {
  name: string;
  prompt: string;
  model?: string;
  thinkingMode?: "standard" | "extended";
  workingDirectory?: string;
  mcpServers?: string[];
  autoApprove?: boolean;
  rules?: string[];
  callbackUrl?: string;
}

export interface N8nSessionInputRequest {
  input: string;
  waitForResponse?: boolean;
  timeout?: number;
}

export interface N8nCreateTaskRequest {
  boardId: string;
  columnId?: string;
  title: string;
  description?: string;
  priority?: string;
  labels?: string[];
  assignToSessionId?: string;
}

export interface N8nTriggerWorkflowRequest {
  workflowId: string;
  inputs?: Record<string, unknown>;
  callbackUrl?: string;
}

export interface N8nApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
}
