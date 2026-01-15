export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface UsageCost {
  estimated: number;
  currency: "USD";
}

export interface UsageRequest {
  type: "chat" | "tool_use" | "agent";
  duration: number;
}

export interface UsageRecord {
  id: string;
  sessionId: string;
  timestamp: Date;
  tokens: TokenUsage;
  cost: UsageCost;
  request: UsageRequest;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  bySession: Record<string, { tokens: number; cost: number }>;
}

export interface UsageAlert {
  id: string;
  type: "warning" | "critical";
  threshold: number;
  currentUsage: number;
  message: string;
  triggeredAt: Date;
}
