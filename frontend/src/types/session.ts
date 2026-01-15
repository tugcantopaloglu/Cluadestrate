export type SessionStatus = "idle" | "running" | "paused" | "error";
export type SessionMode = "planner" | "doer";
export type ModelId =
  | "claude-opus-4-5-20251101"
  | "claude-sonnet-4-20250514"
  | "claude-haiku-3-5-20241022";

export type ThinkingMode = "standard" | "extended";

export interface ThinkingBudget {
  type: "preset" | "custom";
  preset?: "light" | "medium" | "deep" | "ultra" | "max";
  customTokens?: number;
  actualTokens: number;
}

export interface SessionConfig {
  autoApprove: boolean;
  mcpServers: string[];
  rules: string[];
  systemPrompt?: string;
  model: ModelId;
  thinkingMode: ThinkingMode;
  thinkingBudget?: ThinkingBudget;
}

export interface SessionProcess {
  pid?: number;
  startedAt?: Date;
  lastActivity?: Date;
}

export interface SessionUsage {
  tokensUsed: number;
  estimatedCost: number;
  requestCount: number;
}

export interface SessionGit {
  branch: string;
  uncommittedChanges: number;
  lastCommit: string;
}

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  mode: SessionMode;
  workingDirectory: string;
  config: SessionConfig;
  process: SessionProcess;
  usage: SessionUsage;
  git?: SessionGit;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionOutput {
  sessionId: string;
  type: "stdout" | "stderr" | "system" | "thinking" | "tool_use" | "tool_result";
  content: string;
  timestamp: number;
}

export interface BackgroundTask {
  id: string;
  sessionId: string;
  type: "agent" | "shell" | "file_operation";
  status: "pending" | "running" | "completed" | "failed";
  description: string;
  progress?: number;
  output?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}
