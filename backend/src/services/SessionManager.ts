import { spawn, ChildProcess } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import type {
  Session,
  SessionConfig,
  SessionStatus,
  CreateSessionRequest,
  UpdateSessionRequest,
  BackgroundTask,
  ModelId,
  ThinkingMode,
} from "../types";

interface ActiveSession {
  session: Session;
  process: ChildProcess | null;
  outputBuffer: string[];
}

const DEFAULT_CONFIG: SessionConfig = {
  autoApprove: false,
  mcpServers: [],
  rules: [],
  model: "claude-sonnet-4-20250514",
  thinkingMode: "standard",
};

export class SessionManager {
  private sessions: Map<string, ActiveSession> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async createSession(request: CreateSessionRequest): Promise<Session> {
    const id = uuidv4();
    const now = new Date();

    const session: Session = {
      id,
      name: request.name,
      status: "idle",
      mode: request.mode || "doer",
      workingDirectory: request.workingDirectory,
      config: { ...DEFAULT_CONFIG, ...request.config },
      process: {},
      usage: {
        tokensUsed: 0,
        estimatedCost: 0,
        requestCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, {
      session,
      process: null,
      outputBuffer: [],
    });

    this.io.emit("session:created", session);
    return session;
  }

  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).map((s) => s.session);
  }

  async getSession(id: string): Promise<Session | null> {
    const active = this.sessions.get(id);
    return active?.session || null;
  }

  async updateSession(
    id: string,
    request: UpdateSessionRequest
  ): Promise<Session | null> {
    const active = this.sessions.get(id);
    if (!active) return null;

    if (request.name !== undefined) {
      active.session.name = request.name;
    }
    if (request.mode !== undefined) {
      active.session.mode = request.mode;
    }
    if (request.config !== undefined) {
      active.session.config = { ...active.session.config, ...request.config };
    }

    active.session.updatedAt = new Date();
    this.io.emit("session:updated", active.session);

    return active.session;
  }

  async deleteSession(id: string): Promise<boolean> {
    const active = this.sessions.get(id);
    if (!active) return false;

    // Stop the session if running
    if (active.process) {
      await this.stopSession(id);
    }

    this.sessions.delete(id);
    this.io.emit("session:deleted", { id });
    return true;
  }

  async startSession(id: string, initialPrompt?: string): Promise<boolean> {
    const active = this.sessions.get(id);
    if (!active) return false;

    if (active.session.status === "running") {
      return false; // Already running
    }

    const args = this.buildClaudeArgs(active.session);

    try {
      const claudeProcess = spawn("claude", args, {
        cwd: active.session.workingDirectory,
        shell: true,
        env: {
          ...process.env,
          FORCE_COLOR: "1",
        },
      });

      active.process = claudeProcess;
      active.session.status = "running";
      active.session.process.pid = claudeProcess.pid;
      active.session.process.startedAt = new Date();

      // Handle stdout
      claudeProcess.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        this.handleOutput(id, "stdout", output);
      });

      // Handle stderr
      claudeProcess.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        this.handleOutput(id, "stderr", output);
      });

      // Handle process exit
      claudeProcess.on("close", (code) => {
        this.handleProcessExit(id, code);
      });

      claudeProcess.on("error", (error) => {
        this.handleProcessError(id, error);
      });

      // Send initial prompt if provided
      if (initialPrompt) {
        setTimeout(() => {
          this.sendInput(id, initialPrompt);
        }, 500);
      }

      this.io.emit("session:status", {
        sessionId: id,
        status: "running",
      });

      return true;
    } catch (error) {
      active.session.status = "error";
      this.io.emit("session:error", {
        sessionId: id,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async stopSession(id: string): Promise<boolean> {
    const active = this.sessions.get(id);
    if (!active || !active.process) return false;

    try {
      active.process.kill("SIGTERM");

      // Force kill after timeout
      setTimeout(() => {
        if (active.process && !active.process.killed) {
          active.process.kill("SIGKILL");
        }
      }, 5000);

      active.session.status = "idle";
      active.session.process.pid = undefined;

      this.io.emit("session:status", {
        sessionId: id,
        status: "idle",
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async pauseSession(id: string): Promise<boolean> {
    const active = this.sessions.get(id);
    if (!active || active.session.status !== "running") return false;

    // Send pause signal (Ctrl+Z equivalent)
    if (active.process && process.platform !== "win32") {
      active.process.kill("SIGTSTP");
    }

    active.session.status = "paused";
    this.io.emit("session:status", {
      sessionId: id,
      status: "paused",
    });

    return true;
  }

  async resumeSession(id: string): Promise<boolean> {
    const active = this.sessions.get(id);
    if (!active || active.session.status !== "paused") return false;

    // Send continue signal
    if (active.process && process.platform !== "win32") {
      active.process.kill("SIGCONT");
    }

    active.session.status = "running";
    this.io.emit("session:status", {
      sessionId: id,
      status: "running",
    });

    return true;
  }

  async sendInput(id: string, input: string): Promise<boolean> {
    const active = this.sessions.get(id);
    if (!active || !active.process) return false;

    try {
      active.process.stdin?.write(input + "\n");
      active.session.process.lastActivity = new Date();

      this.io.to(`session:${id}`).emit("session:input", {
        sessionId: id,
        input,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  getOutputBuffer(id: string): string[] {
    const active = this.sessions.get(id);
    return active?.outputBuffer || [];
  }

  private buildClaudeArgs(session: Session): string[] {
    const args: string[] = [];

    // Output format for streaming
    args.push("--output-format", "stream-json");

    // Model selection
    args.push("--model", session.config.model);

    // Thinking mode
    if (session.config.thinkingMode === "extended") {
      const budget = session.config.thinkingBudget?.actualTokens || 16384;
      args.push("--thinking-budget", budget.toString());
    }

    // Auto-approve mode
    if (session.config.autoApprove) {
      args.push("--dangerously-skip-permissions");
    }

    // MCP servers config would be handled via config file

    return args;
  }

  private handleOutput(
    sessionId: string,
    type: "stdout" | "stderr",
    content: string
  ): void {
    const active = this.sessions.get(sessionId);
    if (!active) return;

    active.outputBuffer.push(content);
    active.session.process.lastActivity = new Date();

    // Parse and track usage from output
    const usageMatch = content.match(/tokens:\s*(\d+)/i);
    if (usageMatch) {
      const tokens = parseInt(usageMatch[1], 10);
      active.session.usage.tokensUsed += tokens;
      active.session.usage.requestCount++;

      this.io.to(`session:${sessionId}`).emit("session:usage", {
        sessionId,
        tokensUsed: active.session.usage.tokensUsed,
        requestCount: active.session.usage.requestCount,
      });
    }

    this.io.to(`session:${sessionId}`).emit("session:output", {
      sessionId,
      type,
      content,
      timestamp: Date.now(),
    });
  }

  private handleProcessExit(sessionId: string, code: number | null): void {
    const active = this.sessions.get(sessionId);
    if (!active) return;

    active.session.status = code === 0 ? "idle" : "error";
    active.process = null;

    this.io.to(`session:${sessionId}`).emit("session:status", {
      sessionId,
      status: active.session.status,
      exitCode: code,
    });
  }

  private handleProcessError(sessionId: string, error: Error): void {
    const active = this.sessions.get(sessionId);
    if (!active) return;

    active.session.status = "error";

    this.io.to(`session:${sessionId}`).emit("session:error", {
      sessionId,
      error: error.message,
    });
  }
}
