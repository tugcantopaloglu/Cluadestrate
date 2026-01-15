export type ChainStatus = "idle" | "running" | "completed" | "error";
export type ChainStepStatus = "pending" | "running" | "completed" | "error";
export type ModelTier = "Haiku" | "Sonnet" | "Opus";

export interface ChainStep {
  id: string;
  name: string;
  model: ModelTier;
  prompt: string;
  systemPrompt?: string;
  status: ChainStepStatus;
  input?: string; // Input from previous step or initial input
  output?: string;
  error?: string;
  tokensUsed?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Chain {
  id: string;
  name: string;
  description: string;
  status: ChainStatus;
  steps: ChainStep[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runsCount: number;
  totalTokensUsed: number;
  avgExecutionTime: number; // in milliseconds
}

export interface CreateChainInput {
  name: string;
  description: string;
  steps: {
    name: string;
    model: ModelTier;
    prompt: string;
    systemPrompt?: string;
  }[];
}

export interface ChainRunResult {
  chainId: string;
  status: ChainStatus;
  steps: ChainStep[];
  totalTokensUsed: number;
  startedAt: string;
  completedAt?: string;
  finalOutput?: string;
}
