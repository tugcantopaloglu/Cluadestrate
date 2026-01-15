export type WorkflowStatus = "idle" | "running" | "completed" | "error" | "paused";
export type StepStatus = "pending" | "running" | "completed" | "error" | "skipped";

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  sessionId?: string;
  prompt: string;
  model?: string;
  status: StepStatus;
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  dependsOn?: string[]; // IDs of steps that must complete first
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runsCount: number;
  currentStepIndex?: number;
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  steps: Omit<WorkflowStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[];
}

export interface WorkflowRunResult {
  workflowId: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
}
