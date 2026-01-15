import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import { WorkflowManager } from "./WorkflowManager";
import { SessionManager } from "./SessionManager";
import type {
  Automation,
  AutomationRunLog,
  CreateAutomationInput,
} from "../types/automation";

// Simple cron parser for basic expressions
function parseCron(expression: string): { minutes: number[]; hours: number[]; days: number[] } {
  const parts = expression.split(" ");
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression");
  }

  const parseField = (field: string, max: number): number[] => {
    if (field === "*") {
      return Array.from({ length: max }, (_, i) => i);
    }
    if (field.includes("/")) {
      const [, step] = field.split("/");
      return Array.from({ length: Math.ceil(max / parseInt(step)) }, (_, i) => i * parseInt(step));
    }
    if (field.includes(",")) {
      return field.split(",").map((v) => parseInt(v));
    }
    return [parseInt(field)];
  };

  return {
    minutes: parseField(parts[0], 60),
    hours: parseField(parts[1], 24),
    days: parseField(parts[4], 7),
  };
}

export class AutomationManager extends EventEmitter {
  private storage: Storage<Automation>;
  private logStorage: Storage<AutomationRunLog>;
  private workflowManager: WorkflowManager;
  private sessionManager: SessionManager;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private dailyResetInterval?: NodeJS.Timeout;

  constructor(workflowManager: WorkflowManager, sessionManager: SessionManager) {
    super();
    this.storage = new Storage<Automation>("automations");
    this.logStorage = new Storage<AutomationRunLog>("automation-logs");
    this.workflowManager = workflowManager;
    this.sessionManager = sessionManager;

    // Initialize scheduled jobs
    this.initializeSchedules();

    // Reset daily counts at midnight
    this.dailyResetInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.resetDailyCounts();
      }
    }, 60000);
  }

  private initializeSchedules(): void {
    const automations = this.storage.getAll();
    automations.forEach((automation) => {
      if (automation.status === "active" && automation.trigger.type === "schedule") {
        this.scheduleAutomation(automation);
      }
    });
  }

  private scheduleAutomation(automation: Automation): void {
    if (!automation.trigger.schedule) return;

    // Clear existing schedule
    this.clearSchedule(automation.id);

    try {
      const cron = parseCron(automation.trigger.schedule);

      // Check every minute if we should run
      const interval = setInterval(() => {
        const now = new Date();
        if (
          cron.minutes.includes(now.getMinutes()) &&
          cron.hours.includes(now.getHours()) &&
          cron.days.includes(now.getDay())
        ) {
          this.run(automation.id);
        }
      }, 60000);

      this.scheduledJobs.set(automation.id, interval);
    } catch (error) {
      console.error(`Failed to schedule automation ${automation.id}:`, error);
    }
  }

  private clearSchedule(id: string): void {
    const interval = this.scheduledJobs.get(id);
    if (interval) {
      clearInterval(interval);
      this.scheduledJobs.delete(id);
    }
  }

  private resetDailyCounts(): void {
    const automations = this.storage.getAll();
    automations.forEach((automation) => {
      this.storage.update(automation.id, { runsToday: 0 });
    });
  }

  list(): Automation[] {
    return this.storage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Automation | undefined {
    return this.storage.getById(id);
  }

  create(input: CreateAutomationInput): Automation {
    const now = new Date().toISOString();
    const automation: Automation = {
      id: generateId(),
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      status: "paused",
      workflowId: input.workflowId,
      sessionConfig: input.sessionConfig,
      runsToday: 0,
      totalRuns: 0,
      successRate: 100,
      createdAt: now,
      updatedAt: now,
    };

    this.storage.create(automation);
    this.emit("automation:created", automation);
    return automation;
  }

  update(id: string, updates: Partial<Omit<Automation, "id" | "createdAt">>): Automation | undefined {
    const automation = this.storage.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (automation) {
      // Reschedule if needed
      if (updates.trigger || updates.status !== undefined) {
        this.clearSchedule(id);
        if (automation.status === "active" && automation.trigger.type === "schedule") {
          this.scheduleAutomation(automation);
        }
      }
      this.emit("automation:updated", automation);
    }
    return automation;
  }

  delete(id: string): boolean {
    this.clearSchedule(id);
    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("automation:deleted", { id });
    }
    return deleted;
  }

  async activate(id: string): Promise<Automation | undefined> {
    const automation = this.storage.getById(id);
    if (!automation) return undefined;

    const updated = this.storage.update(id, {
      status: "active",
      updatedAt: new Date().toISOString(),
    });

    if (updated && updated.trigger.type === "schedule") {
      this.scheduleAutomation(updated);
    }

    this.emit("automation:activated", updated);
    return updated;
  }

  async pause(id: string): Promise<Automation | undefined> {
    const automation = this.storage.getById(id);
    if (!automation) return undefined;

    this.clearSchedule(id);

    const updated = this.storage.update(id, {
      status: "paused",
      updatedAt: new Date().toISOString(),
    });

    this.emit("automation:paused", updated);
    return updated;
  }

  async run(id: string): Promise<AutomationRunLog> {
    const automation = this.storage.getById(id);
    if (!automation) {
      throw new Error(`Automation ${id} not found`);
    }

    const startedAt = new Date().toISOString();
    let status: "success" | "error" = "success";
    let output: string | undefined;
    let error: string | undefined;

    this.emit("automation:run:started", { id, startedAt });

    try {
      if (automation.workflowId) {
        // Run linked workflow
        const result = await this.workflowManager.run(automation.workflowId);
        output = `Workflow completed with status: ${result.status}`;
        if (result.status === "error") {
          status = "error";
          error = "Workflow execution failed";
        }
      } else if (automation.sessionConfig) {
        // Create and run a session
        const session = await this.sessionManager.create({
          name: `Automation: ${automation.name}`,
          workingDirectory: automation.sessionConfig.workingDirectory,
          mode: "doer",
          config: {
            model: automation.sessionConfig.model as any,
          },
        });

        await this.sessionManager.start(session.id, automation.sessionConfig.prompt);
        output = `Session ${session.id} started`;

        // Clean up session after a delay
        setTimeout(() => {
          this.sessionManager.stop(session.id);
          this.sessionManager.delete(session.id);
        }, 60000);
      } else {
        throw new Error("Automation has no workflow or session config");
      }
    } catch (err) {
      status = "error";
      error = err instanceof Error ? err.message : "Unknown error";
    }

    const completedAt = new Date().toISOString();
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    const log: AutomationRunLog = {
      id: generateId(),
      automationId: id,
      status,
      output,
      error,
      startedAt,
      completedAt,
      duration,
    };

    this.logStorage.create(log);

    // Update automation stats
    const totalRuns = (automation.totalRuns || 0) + 1;
    const successfulRuns = this.logStorage.count(
      (l) => l.automationId === id && l.status === "success"
    );
    const successRate = Math.round((successfulRuns / totalRuns) * 100);

    this.storage.update(id, {
      lastRunAt: completedAt,
      lastRunStatus: status,
      lastRunError: error,
      runsToday: (automation.runsToday || 0) + 1,
      totalRuns,
      successRate,
    });

    this.emit("automation:run:completed", { id, log });
    return log;
  }

  getLogs(automationId: string, limit: number = 50): AutomationRunLog[] {
    return this.logStorage
      .find((log) => log.automationId === automationId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  getStats(): {
    total: number;
    active: number;
    runsToday: number;
    successRate: number;
  } {
    const automations = this.storage.getAll();
    const totalRuns = automations.reduce((sum, a) => sum + a.totalRuns, 0);
    const successfulRuns = automations.reduce(
      (sum, a) => sum + Math.round((a.successRate / 100) * a.totalRuns),
      0
    );

    return {
      total: automations.length,
      active: automations.filter((a) => a.status === "active").length,
      runsToday: automations.reduce((sum, a) => sum + a.runsToday, 0),
      successRate: totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100,
    };
  }

  // Handle webhook triggers
  async handleWebhook(path: string, payload: unknown): Promise<AutomationRunLog | null> {
    const automation = this.storage.findOne(
      (a) => a.trigger.type === "webhook" && a.trigger.webhookPath === path && a.status === "active"
    );

    if (!automation) {
      return null;
    }

    return this.run(automation.id);
  }

  destroy(): void {
    // Clear all scheduled jobs
    this.scheduledJobs.forEach((interval) => clearInterval(interval));
    this.scheduledJobs.clear();

    if (this.dailyResetInterval) {
      clearInterval(this.dailyResetInterval);
    }
  }
}
