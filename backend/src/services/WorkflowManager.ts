import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import { SessionManager } from "./SessionManager";
import type {
  Workflow,
  WorkflowStep,
  WorkflowStatus,
  StepStatus,
  CreateWorkflowInput,
  WorkflowRunResult,
} from "../types/workflow";

export class WorkflowManager extends EventEmitter {
  private storage: Storage<Workflow>;
  private sessionManager: SessionManager;
  private runningWorkflows: Map<string, { resolve: () => void; reject: (err: Error) => void }> = new Map();

  constructor(sessionManager: SessionManager) {
    super();
    this.storage = new Storage<Workflow>("workflows");
    this.sessionManager = sessionManager;
  }

  list(): Workflow[] {
    return this.storage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Workflow | undefined {
    return this.storage.getById(id);
  }

  create(input: CreateWorkflowInput): Workflow {
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id: generateId(),
      name: input.name,
      description: input.description,
      status: "idle",
      steps: input.steps.map((step) => ({
        ...step,
        id: generateId(),
        status: "pending" as StepStatus,
      })),
      createdAt: now,
      updatedAt: now,
      runsCount: 0,
    };

    this.storage.create(workflow);
    this.emit("workflow:created", workflow);
    return workflow;
  }

  update(id: string, updates: Partial<Omit<Workflow, "id" | "createdAt">>): Workflow | undefined {
    const workflow = this.storage.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (workflow) {
      this.emit("workflow:updated", workflow);
    }
    return workflow;
  }

  delete(id: string): boolean {
    // Stop if running
    if (this.runningWorkflows.has(id)) {
      this.stop(id);
    }

    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("workflow:deleted", { id });
    }
    return deleted;
  }

  async run(id: string, initialInput?: string): Promise<WorkflowRunResult> {
    const workflow = this.storage.getById(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    if (workflow.status === "running") {
      throw new Error(`Workflow ${id} is already running`);
    }

    const startedAt = new Date().toISOString();

    // Reset all steps to pending
    const steps: WorkflowStep[] = workflow.steps.map((step) => ({
      ...step,
      status: "pending" as StepStatus,
      output: undefined,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
    }));

    // Update workflow status
    this.storage.update(id, {
      status: "running",
      steps,
      currentStepIndex: 0,
      lastRunAt: startedAt,
    });

    this.emit("workflow:started", { id, startedAt });

    let lastOutput = initialInput || "";

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Check if workflow was stopped
        const currentWorkflow = this.storage.getById(id);
        if (currentWorkflow?.status !== "running") {
          break;
        }

        // Update step status to running
        step.status = "running";
        step.startedAt = new Date().toISOString();
        this.storage.update(id, { steps, currentStepIndex: i });
        this.emit("workflow:step:started", { workflowId: id, stepId: step.id, stepIndex: i });

        try {
          // Execute the step
          const prompt = step.prompt.replace("{{input}}", lastOutput);

          // Create a temporary session for this step
          const session = await this.sessionManager.create({
            name: `Workflow Step: ${step.name}`,
            workingDirectory: process.cwd(),
            mode: "doer",
            config: {
              model: (step.model as any) || "claude-sonnet-4-20250514",
            },
          });

          // Start the session with the prompt
          await this.sessionManager.start(session.id, prompt);

          // Wait for completion (simplified - in real implementation would use events)
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Get output (in real implementation would capture actual output)
          const output = `Step "${step.name}" completed successfully`;

          step.status = "completed";
          step.completedAt = new Date().toISOString();
          step.output = output;
          lastOutput = output;

          // Clean up session
          await this.sessionManager.stop(session.id);
          this.sessionManager.delete(session.id);

          this.emit("workflow:step:completed", { workflowId: id, stepId: step.id, output });
        } catch (error) {
          step.status = "error";
          step.completedAt = new Date().toISOString();
          step.error = error instanceof Error ? error.message : "Unknown error";

          this.storage.update(id, {
            status: "error",
            steps,
          });

          this.emit("workflow:step:error", { workflowId: id, stepId: step.id, error: step.error });
          throw error;
        }

        this.storage.update(id, { steps });
      }

      // Complete workflow
      const completedAt = new Date().toISOString();
      this.storage.update(id, {
        status: "completed",
        steps,
        runsCount: (workflow.runsCount || 0) + 1,
      });

      this.emit("workflow:completed", { id, completedAt });

      return {
        workflowId: id,
        status: "completed",
        steps,
        startedAt,
        completedAt,
      };
    } catch (error) {
      const completedAt = new Date().toISOString();
      return {
        workflowId: id,
        status: "error",
        steps,
        startedAt,
        completedAt,
      };
    }
  }

  stop(id: string): boolean {
    const workflow = this.storage.getById(id);
    if (!workflow || workflow.status !== "running") {
      return false;
    }

    // Update status to paused
    this.storage.update(id, { status: "paused" });
    this.emit("workflow:stopped", { id });

    return true;
  }

  getStats(): {
    total: number;
    running: number;
    completed: number;
    error: number;
    totalRuns: number;
  } {
    const workflows = this.storage.getAll();
    return {
      total: workflows.length,
      running: workflows.filter((w) => w.status === "running").length,
      completed: workflows.filter((w) => w.status === "completed").length,
      error: workflows.filter((w) => w.status === "error").length,
      totalRuns: workflows.reduce((sum, w) => sum + w.runsCount, 0),
    };
  }
}
