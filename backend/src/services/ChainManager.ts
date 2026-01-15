import { EventEmitter } from "events";
import { Storage, generateId } from "./Storage";
import type {
  Chain,
  ChainStep,
  ChainStatus,
  CreateChainInput,
  ChainRunResult,
  ModelTier,
} from "../types/chain";

// Model configurations for different tiers
const MODEL_IDS: Record<ModelTier, string> = {
  Haiku: "claude-haiku-3-5-20241022",
  Sonnet: "claude-sonnet-4-20250514",
  Opus: "claude-opus-4-5-20251101",
};

export class ChainManager extends EventEmitter {
  private storage: Storage<Chain>;
  private runningChains: Set<string> = new Set();

  constructor() {
    super();
    this.storage = new Storage<Chain>("chains");
  }

  list(): Chain[] {
    return this.storage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Chain | undefined {
    return this.storage.getById(id);
  }

  create(input: CreateChainInput): Chain {
    const now = new Date().toISOString();
    const chain: Chain = {
      id: generateId(),
      name: input.name,
      description: input.description,
      status: "idle",
      steps: input.steps.map((step) => ({
        id: generateId(),
        name: step.name,
        model: step.model,
        prompt: step.prompt,
        systemPrompt: step.systemPrompt,
        status: "pending",
      })),
      createdAt: now,
      updatedAt: now,
      runsCount: 0,
      totalTokensUsed: 0,
      avgExecutionTime: 0,
    };

    this.storage.create(chain);
    this.emit("chain:created", chain);
    return chain;
  }

  update(id: string, updates: Partial<Omit<Chain, "id" | "createdAt">>): Chain | undefined {
    const chain = this.storage.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (chain) {
      this.emit("chain:updated", chain);
    }
    return chain;
  }

  delete(id: string): boolean {
    if (this.runningChains.has(id)) {
      this.stop(id);
    }

    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("chain:deleted", { id });
    }
    return deleted;
  }

  async run(id: string, initialInput?: string): Promise<ChainRunResult> {
    const chain = this.storage.getById(id);
    if (!chain) {
      throw new Error(`Chain ${id} not found`);
    }

    if (this.runningChains.has(id)) {
      throw new Error(`Chain ${id} is already running`);
    }

    this.runningChains.add(id);
    const startedAt = new Date().toISOString();
    let totalTokensUsed = 0;

    // Reset all steps
    const steps: ChainStep[] = chain.steps.map((step) => ({
      ...step,
      status: "pending",
      input: undefined,
      output: undefined,
      error: undefined,
      tokensUsed: undefined,
      startedAt: undefined,
      completedAt: undefined,
    }));

    this.storage.update(id, {
      status: "running",
      steps,
      lastRunAt: startedAt,
    });

    this.emit("chain:started", { id, startedAt });

    let lastOutput = initialInput || "";

    try {
      for (let i = 0; i < steps.length; i++) {
        // Check if chain was stopped
        if (!this.runningChains.has(id)) {
          break;
        }

        const step = steps[i];
        step.input = lastOutput;
        step.status = "running";
        step.startedAt = new Date().toISOString();

        this.storage.update(id, { steps });
        this.emit("chain:step:started", { chainId: id, stepId: step.id, stepIndex: i });

        try {
          // Simulate API call to the model
          // In real implementation, this would call the Anthropic API
          const modelId = MODEL_IDS[step.model];
          const prompt = step.prompt.replace("{{input}}", step.input);

          // Simulate processing time based on model
          const processingTime = step.model === "Opus" ? 3000 : step.model === "Sonnet" ? 2000 : 1000;
          await new Promise((resolve) => setTimeout(resolve, processingTime));

          // Simulate token usage
          const inputTokens = Math.ceil(prompt.length / 4);
          const outputTokens = Math.ceil(inputTokens * 0.8);
          step.tokensUsed = inputTokens + outputTokens;
          totalTokensUsed += step.tokensUsed;

          // Generate output (in real implementation, this would be the model response)
          step.output = `[${step.model}] Processed: ${prompt.substring(0, 100)}...`;
          step.status = "completed";
          step.completedAt = new Date().toISOString();
          lastOutput = step.output;

          this.emit("chain:step:completed", {
            chainId: id,
            stepId: step.id,
            output: step.output,
            tokensUsed: step.tokensUsed,
          });
        } catch (error) {
          step.status = "error";
          step.completedAt = new Date().toISOString();
          step.error = error instanceof Error ? error.message : "Unknown error";

          this.storage.update(id, { status: "error", steps });
          this.emit("chain:step:error", { chainId: id, stepId: step.id, error: step.error });
          throw error;
        }

        this.storage.update(id, { steps });
      }

      const completedAt = new Date().toISOString();
      const executionTime = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // Update chain stats
      const runsCount = chain.runsCount + 1;
      const avgExecutionTime = Math.round(
        (chain.avgExecutionTime * chain.runsCount + executionTime) / runsCount
      );

      this.storage.update(id, {
        status: "completed",
        steps,
        runsCount,
        totalTokensUsed: chain.totalTokensUsed + totalTokensUsed,
        avgExecutionTime,
      });

      this.runningChains.delete(id);
      this.emit("chain:completed", { id, completedAt, totalTokensUsed });

      return {
        chainId: id,
        status: "completed",
        steps,
        totalTokensUsed,
        startedAt,
        completedAt,
        finalOutput: lastOutput,
      };
    } catch (error) {
      this.runningChains.delete(id);
      const completedAt = new Date().toISOString();

      return {
        chainId: id,
        status: "error",
        steps,
        totalTokensUsed,
        startedAt,
        completedAt,
      };
    }
  }

  stop(id: string): boolean {
    if (!this.runningChains.has(id)) {
      return false;
    }

    this.runningChains.delete(id);
    this.storage.update(id, { status: "idle" });
    this.emit("chain:stopped", { id });
    return true;
  }

  getStats(): {
    total: number;
    running: number;
    totalRuns: number;
    totalTokensUsed: number;
    avgSteps: number;
  } {
    const chains = this.storage.getAll();
    return {
      total: chains.length,
      running: this.runningChains.size,
      totalRuns: chains.reduce((sum, c) => sum + c.runsCount, 0),
      totalTokensUsed: chains.reduce((sum, c) => sum + c.totalTokensUsed, 0),
      avgSteps: chains.length > 0
        ? Math.round(chains.reduce((sum, c) => sum + c.steps.length, 0) / chains.length * 10) / 10
        : 0,
    };
  }
}
