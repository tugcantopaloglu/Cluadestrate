import type { UsageRecord, UsageSummary, TokenUsage, UsageAlert } from "../types";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

interface UsageThresholds {
  warning: number;
  critical: number;
}

// Cost per million tokens (approximate)
const MODEL_COSTS = {
  "claude-opus-4-5-20251101": { input: 15, output: 75 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-haiku-3-5-20241022": { input: 0.25, output: 1.25 },
};

export class UsageTracker extends EventEmitter {
  private records: UsageRecord[] = [];
  private alerts: UsageAlert[] = [];
  private thresholds: UsageThresholds = { warning: 75, critical: 90 };
  private dailyLimit: number = 100000; // Default daily token limit

  constructor() {
    super();
  }

  async trackUsage(
    sessionId: string,
    tokens: TokenUsage,
    model: string = "claude-sonnet-4-20250514"
  ): Promise<UsageRecord> {
    const costs =
      MODEL_COSTS[model as keyof typeof MODEL_COSTS] ||
      MODEL_COSTS["claude-sonnet-4-20250514"];

    const estimatedCost =
      (tokens.input / 1_000_000) * costs.input +
      (tokens.output / 1_000_000) * costs.output;

    const record: UsageRecord = {
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
      tokens,
      cost: {
        estimated: estimatedCost,
        currency: "USD",
      },
      request: {
        type: "chat",
        duration: 0,
      },
    };

    this.records.push(record);
    await this.checkAlerts();

    // Emit usage updated event
    const summary = await this.getSummary();
    this.emit("usage:updated", {
      totalTokens: summary.totalTokens,
      totalCost: summary.totalCost,
      record,
    });

    return record;
  }

  async getSummary(): Promise<UsageSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = this.records.filter(
      (r) => new Date(r.timestamp) >= today
    );

    const bySession: Record<string, { tokens: number; cost: number }> = {};

    for (const record of todayRecords) {
      if (!bySession[record.sessionId]) {
        bySession[record.sessionId] = { tokens: 0, cost: 0 };
      }
      bySession[record.sessionId].tokens += record.tokens.total;
      bySession[record.sessionId].cost += record.cost.estimated;
    }

    return {
      totalTokens: todayRecords.reduce((sum, r) => sum + r.tokens.total, 0),
      totalCost: todayRecords.reduce((sum, r) => sum + r.cost.estimated, 0),
      bySession,
    };
  }

  async getHistory(
    days: number = 7
  ): Promise<{ date: string; tokens: number; cost: number }[]> {
    const now = new Date();
    const history: { date: string; tokens: number; cost: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRecords = this.records.filter((r) => {
        const recordDate = new Date(r.timestamp);
        return recordDate >= date && recordDate < nextDate;
      });

      history.push({
        date: date.toISOString().split("T")[0],
        tokens: dayRecords.reduce((sum, r) => sum + r.tokens.total, 0),
        cost: dayRecords.reduce((sum, r) => sum + r.cost.estimated, 0),
      });
    }

    return history;
  }

  async getBySession(sessionId: string): Promise<UsageRecord[]> {
    return this.records.filter((r) => r.sessionId === sessionId);
  }

  getAlerts(): UsageAlert[] {
    return this.alerts.filter((a) => {
      // Remove alerts older than 24 hours
      const age = Date.now() - a.triggeredAt.getTime();
      return age < 24 * 60 * 60 * 1000;
    });
  }

  setThresholds(thresholds: Partial<UsageThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  setDailyLimit(limit: number): void {
    this.dailyLimit = limit;
  }

  private async checkAlerts(): Promise<void> {
    const summary = await this.getSummary();
    const usagePercent = (summary.totalTokens / this.dailyLimit) * 100;

    if (usagePercent >= this.thresholds.critical) {
      this.createAlert(
        "critical",
        this.thresholds.critical,
        usagePercent,
        `Usage at ${usagePercent.toFixed(1)}% - critical threshold reached!`
      );
    } else if (usagePercent >= this.thresholds.warning) {
      this.createAlert(
        "warning",
        this.thresholds.warning,
        usagePercent,
        `Usage at ${usagePercent.toFixed(1)}% - approaching limit`
      );
    }
  }

  private createAlert(
    type: "warning" | "critical",
    threshold: number,
    currentUsage: number,
    message: string
  ): void {
    // Don't create duplicate alerts within 1 hour
    const recentAlert = this.alerts.find(
      (a) =>
        a.type === type &&
        Date.now() - a.triggeredAt.getTime() < 60 * 60 * 1000
    );

    if (!recentAlert) {
      this.alerts.push({
        id: uuidv4(),
        type,
        threshold,
        currentUsage,
        message,
        triggeredAt: new Date(),
      });
    }
  }
}
