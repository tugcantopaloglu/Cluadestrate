export type TriggerType = "schedule" | "webhook" | "event";
export type AutomationStatus = "active" | "paused" | "error";

export interface AutomationTrigger {
  type: TriggerType;
  schedule?: string; // Cron expression for schedule triggers
  webhookPath?: string; // Path for webhook triggers
  event?: string; // Event name for event triggers
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  status: AutomationStatus;
  workflowId?: string; // Optional linked workflow
  sessionConfig?: {
    workingDirectory: string;
    prompt: string;
    model?: string;
  };
  lastRunAt?: string;
  lastRunStatus?: "success" | "error";
  lastRunError?: string;
  runsToday: number;
  totalRuns: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationInput {
  name: string;
  description: string;
  trigger: AutomationTrigger;
  workflowId?: string;
  sessionConfig?: {
    workingDirectory: string;
    prompt: string;
    model?: string;
  };
}

export interface AutomationRunLog {
  id: string;
  automationId: string;
  status: "success" | "error";
  output?: string;
  error?: string;
  startedAt: string;
  completedAt: string;
  duration: number;
}
