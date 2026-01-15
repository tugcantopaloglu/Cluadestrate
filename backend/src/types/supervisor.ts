// Supervisor Agent Types

export interface SupervisorConfig {
  id: string;
  name: string;
  model: "claude-opus-4" | "claude-sonnet-4";
  strategy: SupervisorStrategy;
  systemPrompt: string;
  workers: WorkerAgent[];
  settings: {
    maxIterations: number;
    timeout: number;
    consensusThreshold?: number;
    parallelWorkers: number;
    aggregationEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type SupervisorStrategy =
  | "sequential"     // Run workers one after another
  | "parallel"       // Run all workers simultaneously
  | "adaptive"       // Dynamically decide based on task
  | "consensus"      // Get consensus from multiple workers
  | "hierarchical";  // Nested supervisor structure

export interface WorkerAgent {
  id: string;
  name: string;
  role: WorkerRole;
  model: "claude-opus-4" | "claude-sonnet-4" | "claude-haiku-3.5";
  systemPrompt: string;
  capabilities: string[];
  enabled: boolean;
  priority: number;
  config?: {
    mcpServers?: string[];
    autoApprove?: boolean;
    timeout?: number;
  };
}

export type WorkerRole =
  | "planner"       // Plans implementation approach
  | "coder"         // Writes code
  | "reviewer"      // Reviews code/changes
  | "tester"        // Writes and runs tests
  | "documenter"    // Writes documentation
  | "debugger"      // Debugs issues
  | "refactorer"    // Refactors code
  | "security"      // Security analysis
  | "custom";       // Custom role

export interface SupervisorExecution {
  id: string;
  supervisorId: string;
  status: "pending" | "planning" | "executing" | "aggregating" | "completed" | "failed";
  task: string;
  plan?: SupervisorPlan;
  workerExecutions: WorkerExecution[];
  aggregatedResult?: string;
  iterations: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metrics: {
    totalTokens: number;
    totalCost: number;
    totalDuration: number;
  };
}

export interface SupervisorPlan {
  steps: PlanStep[];
  dependencies: Record<string, string[]>;
  estimatedDuration: number;
  createdAt: Date;
}

export interface PlanStep {
  id: string;
  workerId: string;
  task: string;
  inputs: Record<string, unknown>;
  expectedOutputs: string[];
  order: number;
}

export interface WorkerExecution {
  id: string;
  workerId: string;
  workerName: string;
  role: WorkerRole;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  task: string;
  input: string;
  output?: string;
  error?: string;
  tokens: {
    input: number;
    output: number;
  };
  duration: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface SupervisorTemplate {
  id: string;
  name: string;
  description: string;
  strategy: SupervisorStrategy;
  workers: Omit<WorkerAgent, "id">[];
  systemPrompt: string;
  category: string;
}

export interface SupervisorStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  averageIterations: number;
  tokenUsage: {
    total: number;
    bySupervisor: Record<string, number>;
    byWorker: Record<string, number>;
  };
  costEstimate: number;
}
