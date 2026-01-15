export type AlertType = "info" | "warning" | "critical";
export type AlertSource = "usage" | "session" | "workflow" | "system" | "mcp";

export interface Alert {
  id: string;
  type: AlertType;
  source: AlertSource;
  title: string;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  type: AlertType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

export interface AlertCondition {
  metric: string; // e.g., "usage.tokens", "session.idle_time", "error.rate"
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  window?: number; // Time window in minutes for rate-based metrics
}

export interface CreateAlertRuleInput {
  name: string;
  description: string;
  condition: AlertCondition;
  type: AlertType;
}

export interface AlertStats {
  total: number;
  active: number;
  critical: number;
  warning: number;
  info: number;
  rulesEnabled: number;
  rulesTotal: number;
}
