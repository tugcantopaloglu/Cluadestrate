import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import type {
  Alert,
  AlertRule,
  AlertType,
  AlertSource,
  CreateAlertRuleInput,
  AlertStats,
  AlertCondition,
} from "../types/alert";

export class AlertManager extends EventEmitter {
  private alertStorage: Storage<Alert>;
  private ruleStorage: Storage<AlertRule>;
  private metrics: Map<string, number> = new Map();
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.alertStorage = new Storage<Alert>("alerts");
    this.ruleStorage = new Storage<AlertRule>("alert-rules");

    // Initialize default rules if none exist
    if (this.ruleStorage.getAll().length === 0) {
      this.initializeDefaultRules();
    }

    // Start periodic rule checking
    this.checkInterval = setInterval(() => this.checkRules(), 60000);
  }

  private initializeDefaultRules(): void {
    const defaultRules: CreateAlertRuleInput[] = [
      {
        name: "Token Usage Warning",
        description: "Alert when token usage exceeds 75% of daily limit",
        condition: { metric: "usage.percent", operator: "gt", threshold: 75 },
        type: "warning",
      },
      {
        name: "Token Usage Critical",
        description: "Alert when token usage exceeds 90% of daily limit",
        condition: { metric: "usage.percent", operator: "gt", threshold: 90 },
        type: "critical",
      },
      {
        name: "Session Idle",
        description: "Alert when a session has been idle for over 1 hour",
        condition: { metric: "session.idle_minutes", operator: "gt", threshold: 60 },
        type: "warning",
      },
      {
        name: "Error Rate High",
        description: "Alert when error rate exceeds 10%",
        condition: { metric: "error.rate", operator: "gt", threshold: 10, window: 60 },
        type: "warning",
      },
    ];

    defaultRules.forEach((rule) => this.createRule(rule));
  }

  // Alert CRUD
  listAlerts(includeAcknowledged: boolean = true): Alert[] {
    let alerts = this.alertStorage.getAll();
    if (!includeAcknowledged) {
      alerts = alerts.filter((a) => !a.acknowledged);
    }
    return alerts.sort((a, b) =>
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  getAlert(id: string): Alert | undefined {
    return this.alertStorage.getById(id);
  }

  createAlert(
    type: AlertType,
    source: AlertSource,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Alert {
    const alert: Alert = {
      id: generateId(),
      type,
      source,
      title,
      message,
      triggeredAt: new Date().toISOString(),
      acknowledged: false,
      metadata,
    };

    this.alertStorage.create(alert);
    this.emit("alert:created", alert);
    return alert;
  }

  acknowledgeAlert(id: string, acknowledgedBy: string = "user"): Alert | undefined {
    const alert = this.alertStorage.update(id, {
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy,
    });

    if (alert) {
      this.emit("alert:acknowledged", alert);
    }
    return alert;
  }

  acknowledgeAll(): number {
    const unacknowledged = this.alertStorage.find((a) => !a.acknowledged);
    const now = new Date().toISOString();

    unacknowledged.forEach((alert) => {
      this.alertStorage.update(alert.id, {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy: "user",
      });
    });

    this.emit("alerts:acknowledged-all", { count: unacknowledged.length });
    return unacknowledged.length;
  }

  deleteAlert(id: string): boolean {
    const deleted = this.alertStorage.delete(id);
    if (deleted) {
      this.emit("alert:deleted", { id });
    }
    return deleted;
  }

  // Rule CRUD
  listRules(): AlertRule[] {
    return this.ruleStorage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getRule(id: string): AlertRule | undefined {
    return this.ruleStorage.getById(id);
  }

  createRule(input: CreateAlertRuleInput): AlertRule {
    const now = new Date().toISOString();
    const rule: AlertRule = {
      id: generateId(),
      name: input.name,
      description: input.description,
      condition: input.condition,
      type: input.type,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    };

    this.ruleStorage.create(rule);
    this.emit("rule:created", rule);
    return rule;
  }

  updateRule(id: string, updates: Partial<Omit<AlertRule, "id" | "createdAt">>): AlertRule | undefined {
    const rule = this.ruleStorage.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (rule) {
      this.emit("rule:updated", rule);
    }
    return rule;
  }

  deleteRule(id: string): boolean {
    const deleted = this.ruleStorage.delete(id);
    if (deleted) {
      this.emit("rule:deleted", { id });
    }
    return deleted;
  }

  toggleRule(id: string): AlertRule | undefined {
    const rule = this.ruleStorage.getById(id);
    if (!rule) return undefined;

    return this.updateRule(id, { enabled: !rule.enabled });
  }

  // Metrics and rule checking
  setMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  private checkCondition(condition: AlertCondition): boolean {
    const value = this.metrics.get(condition.metric);
    if (value === undefined) return false;

    switch (condition.operator) {
      case "gt":
        return value > condition.threshold;
      case "lt":
        return value < condition.threshold;
      case "eq":
        return value === condition.threshold;
      case "gte":
        return value >= condition.threshold;
      case "lte":
        return value <= condition.threshold;
      default:
        return false;
    }
  }

  private checkRules(): void {
    const rules = this.ruleStorage.find((r) => r.enabled);

    for (const rule of rules) {
      if (this.checkCondition(rule.condition)) {
        // Check if we already have an active alert for this rule
        const existingAlert = this.alertStorage.findOne(
          (a) =>
            !a.acknowledged &&
            a.metadata?.ruleId === rule.id &&
            // Don't re-alert within 5 minutes
            new Date().getTime() - new Date(a.triggeredAt).getTime() < 300000
        );

        if (!existingAlert) {
          const metricValue = this.metrics.get(rule.condition.metric);
          this.createAlert(
            rule.type,
            this.getSourceFromMetric(rule.condition.metric),
            rule.name,
            `${rule.description} (Current: ${metricValue}, Threshold: ${rule.condition.threshold})`,
            { ruleId: rule.id }
          );

          // Update rule trigger count
          this.ruleStorage.update(rule.id, {
            lastTriggeredAt: new Date().toISOString(),
            triggerCount: rule.triggerCount + 1,
          });
        }
      }
    }
  }

  private getSourceFromMetric(metric: string): AlertSource {
    if (metric.startsWith("usage.")) return "usage";
    if (metric.startsWith("session.")) return "session";
    if (metric.startsWith("workflow.")) return "workflow";
    if (metric.startsWith("mcp.")) return "mcp";
    return "system";
  }

  // Force check rules (useful for testing)
  forceCheck(): void {
    this.checkRules();
  }

  getStats(): AlertStats {
    const alerts = this.alertStorage.getAll();
    const rules = this.ruleStorage.getAll();
    const active = alerts.filter((a) => !a.acknowledged);

    return {
      total: alerts.length,
      active: active.length,
      critical: active.filter((a) => a.type === "critical").length,
      warning: active.filter((a) => a.type === "warning").length,
      info: active.filter((a) => a.type === "info").length,
      rulesEnabled: rules.filter((r) => r.enabled).length,
      rulesTotal: rules.length,
    };
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
