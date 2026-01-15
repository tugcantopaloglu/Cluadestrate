import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import {
  SupervisorConfig,
  SupervisorExecution,
  SupervisorPlan,
  WorkerAgent,
  WorkerExecution,
  WorkerRole,
  SupervisorTemplate,
  SupervisorStats,
  PlanStep,
} from "../types/supervisor";

export class SupervisorManager extends EventEmitter {
  private supervisors: Map<string, SupervisorConfig> = new Map();
  private executions: Map<string, SupervisorExecution> = new Map();
  private templates: SupervisorTemplate[] = [
    {
      id: "code-review",
      name: "Code Review Pipeline",
      description: "Multi-agent code review with planner, reviewer, and tester",
      strategy: "sequential",
      category: "Development",
      systemPrompt: "You are a code review supervisor coordinating multiple agents to ensure high-quality code.",
      workers: [
        {
          name: "Code Analyzer",
          role: "reviewer",
          model: "claude-sonnet-4",
          systemPrompt: "Analyze code for issues, bugs, and improvements.",
          capabilities: ["code-analysis", "bug-detection"],
          enabled: true,
          priority: 1,
        },
        {
          name: "Security Auditor",
          role: "security",
          model: "claude-sonnet-4",
          systemPrompt: "Check code for security vulnerabilities and OWASP issues.",
          capabilities: ["security-analysis", "vulnerability-detection"],
          enabled: true,
          priority: 2,
        },
        {
          name: "Test Writer",
          role: "tester",
          model: "claude-haiku-3.5",
          systemPrompt: "Write unit tests for the reviewed code.",
          capabilities: ["test-writing", "coverage-analysis"],
          enabled: true,
          priority: 3,
        },
      ],
    },
    {
      id: "feature-development",
      name: "Feature Development Team",
      description: "Full feature development with planning, coding, testing, and documentation",
      strategy: "hierarchical",
      category: "Development",
      systemPrompt: "You are a development team lead coordinating feature implementation.",
      workers: [
        {
          name: "Architect",
          role: "planner",
          model: "claude-opus-4",
          systemPrompt: "Design the architecture and implementation plan for features.",
          capabilities: ["architecture", "planning"],
          enabled: true,
          priority: 1,
        },
        {
          name: "Developer",
          role: "coder",
          model: "claude-sonnet-4",
          systemPrompt: "Implement features according to the architecture plan.",
          capabilities: ["coding", "implementation"],
          enabled: true,
          priority: 2,
        },
        {
          name: "QA Engineer",
          role: "tester",
          model: "claude-sonnet-4",
          systemPrompt: "Write and execute tests for implemented features.",
          capabilities: ["testing", "qa"],
          enabled: true,
          priority: 3,
        },
        {
          name: "Technical Writer",
          role: "documenter",
          model: "claude-haiku-3.5",
          systemPrompt: "Write documentation for the implemented features.",
          capabilities: ["documentation", "technical-writing"],
          enabled: true,
          priority: 4,
        },
      ],
    },
    {
      id: "bug-fix-squad",
      name: "Bug Fix Squad",
      description: "Parallel debugging with multiple perspectives",
      strategy: "consensus",
      category: "Debugging",
      systemPrompt: "Coordinate multiple debugging agents to find and fix bugs efficiently.",
      workers: [
        {
          name: "Debugger Alpha",
          role: "debugger",
          model: "claude-sonnet-4",
          systemPrompt: "Debug using systematic elimination approach.",
          capabilities: ["debugging", "root-cause-analysis"],
          enabled: true,
          priority: 1,
        },
        {
          name: "Debugger Beta",
          role: "debugger",
          model: "claude-sonnet-4",
          systemPrompt: "Debug using trace analysis and logging.",
          capabilities: ["debugging", "trace-analysis"],
          enabled: true,
          priority: 1,
        },
        {
          name: "Fix Implementer",
          role: "coder",
          model: "claude-sonnet-4",
          systemPrompt: "Implement the agreed-upon fix.",
          capabilities: ["coding", "bug-fixing"],
          enabled: true,
          priority: 2,
        },
      ],
    },
  ];

  constructor() {
    super();
  }

  // Supervisor Management
  createSupervisor(data: {
    name: string;
    model: SupervisorConfig["model"];
    strategy: SupervisorConfig["strategy"];
    systemPrompt: string;
    workers: Omit<WorkerAgent, "id">[];
    settings?: Partial<SupervisorConfig["settings"]>;
  }): SupervisorConfig {
    const supervisor: SupervisorConfig = {
      id: randomUUID(),
      name: data.name,
      model: data.model,
      strategy: data.strategy,
      systemPrompt: data.systemPrompt,
      workers: data.workers.map((w) => ({ ...w, id: randomUUID() })),
      settings: {
        maxIterations: data.settings?.maxIterations || 10,
        timeout: data.settings?.timeout || 300000,
        consensusThreshold: data.settings?.consensusThreshold || 0.7,
        parallelWorkers: data.settings?.parallelWorkers || 3,
        aggregationEnabled: data.settings?.aggregationEnabled ?? true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.supervisors.set(supervisor.id, supervisor);
    this.emit("supervisor:created", supervisor);
    return supervisor;
  }

  createFromTemplate(templateId: string, name?: string): SupervisorConfig | null {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) return null;

    return this.createSupervisor({
      name: name || template.name,
      model: "claude-sonnet-4",
      strategy: template.strategy,
      systemPrompt: template.systemPrompt,
      workers: template.workers,
    });
  }

  getSupervisor(id: string): SupervisorConfig | undefined {
    return this.supervisors.get(id);
  }

  listSupervisors(): SupervisorConfig[] {
    return Array.from(this.supervisors.values());
  }

  updateSupervisor(id: string, updates: Partial<SupervisorConfig>): SupervisorConfig | null {
    const supervisor = this.supervisors.get(id);
    if (!supervisor) return null;

    const updated = {
      ...supervisor,
      ...updates,
      updatedAt: new Date(),
    };

    this.supervisors.set(id, updated);
    this.emit("supervisor:updated", updated);
    return updated;
  }

  deleteSupervisor(id: string): boolean {
    const result = this.supervisors.delete(id);
    if (result) {
      this.emit("supervisor:deleted", { id });
    }
    return result;
  }

  // Worker Management
  addWorker(supervisorId: string, worker: Omit<WorkerAgent, "id">): WorkerAgent | null {
    const supervisor = this.supervisors.get(supervisorId);
    if (!supervisor) return null;

    const newWorker: WorkerAgent = { ...worker, id: randomUUID() };
    supervisor.workers.push(newWorker);
    supervisor.updatedAt = new Date();
    this.supervisors.set(supervisorId, supervisor);

    this.emit("worker:added", { supervisorId, worker: newWorker });
    return newWorker;
  }

  updateWorker(supervisorId: string, workerId: string, updates: Partial<WorkerAgent>): WorkerAgent | null {
    const supervisor = this.supervisors.get(supervisorId);
    if (!supervisor) return null;

    const workerIndex = supervisor.workers.findIndex((w) => w.id === workerId);
    if (workerIndex === -1) return null;

    supervisor.workers[workerIndex] = {
      ...supervisor.workers[workerIndex],
      ...updates,
    };
    supervisor.updatedAt = new Date();
    this.supervisors.set(supervisorId, supervisor);

    this.emit("worker:updated", { supervisorId, worker: supervisor.workers[workerIndex] });
    return supervisor.workers[workerIndex];
  }

  removeWorker(supervisorId: string, workerId: string): boolean {
    const supervisor = this.supervisors.get(supervisorId);
    if (!supervisor) return false;

    const workerIndex = supervisor.workers.findIndex((w) => w.id === workerId);
    if (workerIndex === -1) return false;

    supervisor.workers.splice(workerIndex, 1);
    supervisor.updatedAt = new Date();
    this.supervisors.set(supervisorId, supervisor);

    this.emit("worker:removed", { supervisorId, workerId });
    return true;
  }

  // Execution
  async execute(supervisorId: string, task: string): Promise<SupervisorExecution> {
    const supervisor = this.supervisors.get(supervisorId);
    if (!supervisor) throw new Error("Supervisor not found");

    const execution: SupervisorExecution = {
      id: randomUUID(),
      supervisorId,
      status: "planning",
      task,
      workerExecutions: [],
      iterations: 0,
      startedAt: new Date(),
      metrics: {
        totalTokens: 0,
        totalCost: 0,
        totalDuration: 0,
      },
    };

    this.executions.set(execution.id, execution);
    this.emit("execution:started", execution);

    try {
      // Phase 1: Planning
      execution.plan = await this.createPlan(supervisor, task);
      execution.status = "executing";
      this.executions.set(execution.id, execution);
      this.emit("execution:planning-complete", { executionId: execution.id, plan: execution.plan });

      // Phase 2: Execute workers based on strategy
      switch (supervisor.strategy) {
        case "sequential":
          await this.executeSequential(execution, supervisor);
          break;
        case "parallel":
          await this.executeParallel(execution, supervisor);
          break;
        case "consensus":
          await this.executeConsensus(execution, supervisor);
          break;
        case "adaptive":
          await this.executeAdaptive(execution, supervisor);
          break;
        case "hierarchical":
          await this.executeHierarchical(execution, supervisor);
          break;
      }

      // Phase 3: Aggregation
      if (supervisor.settings.aggregationEnabled) {
        execution.status = "aggregating";
        this.executions.set(execution.id, execution);
        execution.aggregatedResult = await this.aggregateResults(execution, supervisor);
      }

      execution.status = "completed";
      execution.completedAt = new Date();
      execution.metrics.totalDuration = execution.completedAt.getTime() - execution.startedAt.getTime();
    } catch (error) {
      execution.status = "failed";
      execution.error = (error as Error).message;
      execution.completedAt = new Date();
    }

    this.executions.set(execution.id, execution);
    this.emit("execution:completed", execution);
    return execution;
  }

  private async createPlan(supervisor: SupervisorConfig, task: string): Promise<SupervisorPlan> {
    // Simulate planning phase
    const enabledWorkers = supervisor.workers.filter((w) => w.enabled);
    const steps: PlanStep[] = enabledWorkers
      .sort((a, b) => a.priority - b.priority)
      .map((worker, index) => ({
        id: randomUUID(),
        workerId: worker.id,
        task: `${worker.role}: ${task}`,
        inputs: {},
        expectedOutputs: [`${worker.role}_output`],
        order: index,
      }));

    return {
      steps,
      dependencies: {},
      estimatedDuration: steps.length * 30000,
      createdAt: new Date(),
    };
  }

  private async executeSequential(execution: SupervisorExecution, supervisor: SupervisorConfig): Promise<void> {
    const enabledWorkers = supervisor.workers.filter((w) => w.enabled).sort((a, b) => a.priority - b.priority);
    let previousOutput: string | undefined;

    for (const worker of enabledWorkers) {
      const workerExec = await this.executeWorker(execution.id, worker, execution.task, previousOutput);
      execution.workerExecutions.push(workerExec);
      execution.metrics.totalTokens += workerExec.tokens.input + workerExec.tokens.output;
      execution.iterations++;
      this.executions.set(execution.id, execution);
      this.emit("worker:executed", { executionId: execution.id, workerExecution: workerExec });

      if (workerExec.status === "completed") {
        previousOutput = workerExec.output;
      } else if (workerExec.status === "failed") {
        throw new Error(`Worker ${worker.name} failed: ${workerExec.error}`);
      }
    }
  }

  private async executeParallel(execution: SupervisorExecution, supervisor: SupervisorConfig): Promise<void> {
    const enabledWorkers = supervisor.workers.filter((w) => w.enabled);
    const batchSize = supervisor.settings.parallelWorkers;

    for (let i = 0; i < enabledWorkers.length; i += batchSize) {
      const batch = enabledWorkers.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((worker) => this.executeWorker(execution.id, worker, execution.task))
      );

      for (const result of results) {
        execution.workerExecutions.push(result);
        execution.metrics.totalTokens += result.tokens.input + result.tokens.output;
      }
      execution.iterations++;
      this.executions.set(execution.id, execution);
    }
  }

  private async executeConsensus(execution: SupervisorExecution, supervisor: SupervisorConfig): Promise<void> {
    // Run all workers in parallel and find consensus
    const enabledWorkers = supervisor.workers.filter((w) => w.enabled);
    const results = await Promise.all(
      enabledWorkers.map((worker) => this.executeWorker(execution.id, worker, execution.task))
    );

    for (const result of results) {
      execution.workerExecutions.push(result);
      execution.metrics.totalTokens += result.tokens.input + result.tokens.output;
    }
    execution.iterations = 1;
  }

  private async executeAdaptive(execution: SupervisorExecution, supervisor: SupervisorConfig): Promise<void> {
    // Start with planner, then decide based on output
    const planner = supervisor.workers.find((w) => w.role === "planner" && w.enabled);
    if (planner) {
      const planResult = await this.executeWorker(execution.id, planner, execution.task);
      execution.workerExecutions.push(planResult);
      execution.metrics.totalTokens += planResult.tokens.input + planResult.tokens.output;
    }

    // Execute remaining workers sequentially
    const remainingWorkers = supervisor.workers.filter((w) => w.role !== "planner" && w.enabled);
    for (const worker of remainingWorkers) {
      const result = await this.executeWorker(execution.id, worker, execution.task);
      execution.workerExecutions.push(result);
      execution.metrics.totalTokens += result.tokens.input + result.tokens.output;
      execution.iterations++;
    }
  }

  private async executeHierarchical(execution: SupervisorExecution, supervisor: SupervisorConfig): Promise<void> {
    // Execute by priority levels
    const priorityGroups = new Map<number, WorkerAgent[]>();
    for (const worker of supervisor.workers.filter((w) => w.enabled)) {
      const group = priorityGroups.get(worker.priority) || [];
      group.push(worker);
      priorityGroups.set(worker.priority, group);
    }

    const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => a - b);

    for (const priority of sortedPriorities) {
      const workers = priorityGroups.get(priority)!;

      // Run same-priority workers in parallel
      const results = await Promise.all(
        workers.map((worker) => this.executeWorker(execution.id, worker, execution.task))
      );

      for (const result of results) {
        execution.workerExecutions.push(result);
        execution.metrics.totalTokens += result.tokens.input + result.tokens.output;
      }
      execution.iterations++;
    }
  }

  private async executeWorker(
    executionId: string,
    worker: WorkerAgent,
    task: string,
    previousOutput?: string
  ): Promise<WorkerExecution> {
    const workerExec: WorkerExecution = {
      id: randomUUID(),
      workerId: worker.id,
      workerName: worker.name,
      role: worker.role,
      status: "running",
      task,
      input: previousOutput || task,
      tokens: { input: 0, output: 0 },
      duration: 0,
      startedAt: new Date(),
    };

    try {
      // Simulate worker execution
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));

      workerExec.output = `[${worker.name}] Completed: ${task.substring(0, 50)}...`;
      workerExec.tokens = {
        input: Math.floor(Math.random() * 1000) + 500,
        output: Math.floor(Math.random() * 2000) + 1000,
      };
      workerExec.status = "completed";
    } catch (error) {
      workerExec.status = "failed";
      workerExec.error = (error as Error).message;
    }

    workerExec.completedAt = new Date();
    workerExec.duration = workerExec.completedAt.getTime() - workerExec.startedAt.getTime();
    return workerExec;
  }

  private async aggregateResults(execution: SupervisorExecution, supervisor: SupervisorConfig): Promise<string> {
    const completedOutputs = execution.workerExecutions
      .filter((w) => w.status === "completed" && w.output)
      .map((w) => `[${w.workerName}]: ${w.output}`)
      .join("\n\n");

    return `Aggregated Results:\n\n${completedOutputs}`;
  }

  stopExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status === "completed" || execution.status === "failed") {
      return false;
    }

    execution.status = "failed";
    execution.error = "Execution stopped by user";
    execution.completedAt = new Date();
    this.executions.set(executionId, execution);

    this.emit("execution:stopped", { executionId });
    return true;
  }

  // Queries
  getExecution(id: string): SupervisorExecution | undefined {
    return this.executions.get(id);
  }

  listExecutions(supervisorId?: string): SupervisorExecution[] {
    const all = Array.from(this.executions.values());
    if (supervisorId) {
      return all.filter((e) => e.supervisorId === supervisorId);
    }
    return all;
  }

  // Templates
  getTemplates(): SupervisorTemplate[] {
    return [...this.templates];
  }

  getTemplate(id: string): SupervisorTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  // Stats
  getStats(): SupervisorStats {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter((e) => e.status === "completed");

    const bySuper: Record<string, number> = {};
    const byWorker: Record<string, number> = {};

    for (const exec of executions) {
      bySuper[exec.supervisorId] = (bySuper[exec.supervisorId] || 0) + exec.metrics.totalTokens;
      for (const we of exec.workerExecutions) {
        byWorker[we.workerId] = (byWorker[we.workerId] || 0) + we.tokens.input + we.tokens.output;
      }
    }

    return {
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? completed.length / executions.length : 0,
      averageDuration: completed.length > 0
        ? completed.reduce((sum, e) => sum + e.metrics.totalDuration, 0) / completed.length
        : 0,
      averageIterations: completed.length > 0
        ? completed.reduce((sum, e) => sum + e.iterations, 0) / completed.length
        : 0,
      tokenUsage: {
        total: executions.reduce((sum, e) => sum + e.metrics.totalTokens, 0),
        bySupervisor: bySuper,
        byWorker: byWorker,
      },
      costEstimate: executions.reduce((sum, e) => sum + e.metrics.totalCost, 0),
    };
  }
}
