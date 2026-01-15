import { spawn, ChildProcess } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import type {
  MCPServer,
  MCPServerStatus,
  CreateMCPServerRequest,
  LogEntry,
} from "../types";

interface ActiveMCP {
  server: MCPServer;
  process: ChildProcess | null;
}

export class MCPManager {
  private servers: Map<string, ActiveMCP> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async createServer(request: CreateMCPServerRequest): Promise<MCPServer> {
    const id = uuidv4();
    const now = new Date();

    const server: MCPServer = {
      id,
      name: request.name,
      status: "stopped",
      config: request.config,
      assignedTo: request.assignedTo || "all",
      process: {
        logs: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    this.servers.set(id, {
      server,
      process: null,
    });

    this.io.emit("mcp:created", server);
    return server;
  }

  async getServers(): Promise<MCPServer[]> {
    return Array.from(this.servers.values()).map((s) => s.server);
  }

  async getServer(id: string): Promise<MCPServer | null> {
    const active = this.servers.get(id);
    return active?.server || null;
  }

  async deleteServer(id: string): Promise<boolean> {
    const active = this.servers.get(id);
    if (!active) return false;

    if (active.process) {
      await this.stopServer(id);
    }

    this.servers.delete(id);
    this.io.emit("mcp:deleted", { id });
    return true;
  }

  async startServer(id: string): Promise<boolean> {
    const active = this.servers.get(id);
    if (!active) return false;

    if (active.server.status === "running") {
      return false;
    }

    const { command, args, env } = active.server.config;

    try {
      active.server.status = "starting";
      this.io.emit("mcp:status", { id, status: "starting" });

      const mcpProcess = spawn(command, args, {
        shell: true,
        env: { ...process.env, ...env },
      });

      active.process = mcpProcess;
      active.server.process.pid = mcpProcess.pid;
      active.server.process.startedAt = new Date();

      mcpProcess.stdout?.on("data", (data: Buffer) => {
        this.addLog(id, "info", data.toString());
      });

      mcpProcess.stderr?.on("data", (data: Buffer) => {
        this.addLog(id, "error", data.toString());
      });

      mcpProcess.on("close", (code) => {
        active.server.status = code === 0 ? "stopped" : "error";
        active.process = null;
        this.io.emit("mcp:status", { id, status: active.server.status });
      });

      mcpProcess.on("error", (error) => {
        active.server.status = "error";
        this.addLog(id, "error", error.message);
        this.io.emit("mcp:status", { id, status: "error" });
      });

      // Wait a bit to confirm it started
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (active.process && !active.process.killed) {
        active.server.status = "running";
        this.io.emit("mcp:status", { id, status: "running" });
        return true;
      }

      return false;
    } catch (error) {
      active.server.status = "error";
      this.addLog(id, "error", (error as Error).message);
      this.io.emit("mcp:status", { id, status: "error" });
      return false;
    }
  }

  async stopServer(id: string): Promise<boolean> {
    const active = this.servers.get(id);
    if (!active || !active.process) return false;

    try {
      active.process.kill("SIGTERM");

      setTimeout(() => {
        if (active.process && !active.process.killed) {
          active.process.kill("SIGKILL");
        }
      }, 5000);

      active.server.status = "stopped";
      this.io.emit("mcp:status", { id, status: "stopped" });
      return true;
    } catch (error) {
      return false;
    }
  }

  async restartServer(id: string): Promise<boolean> {
    await this.stopServer(id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.startServer(id);
  }

  getLogs(id: string, limit: number = 100): LogEntry[] {
    const active = this.servers.get(id);
    if (!active) return [];
    return active.server.process.logs.slice(-limit);
  }

  private addLog(
    id: string,
    level: LogEntry["level"],
    message: string
  ): void {
    const active = this.servers.get(id);
    if (!active) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message: message.trim(),
    };

    active.server.process.logs.push(entry);

    // Keep logs limited
    if (active.server.process.logs.length > 1000) {
      active.server.process.logs = active.server.process.logs.slice(-500);
    }

    this.io.emit("mcp:log", { id, entry });
  }
}
