import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { MCPServerConfig, MCPServerStatus } from "./types";
import { getLogger } from "./logger";

interface ManagedServer {
  config: MCPServerConfig;
  process: ChildProcess | null;
  status: MCPServerStatus["status"];
  startedAt?: Date;
  error?: string;
  restartCount: number;
  lastRestartAttempt?: Date;
}

export class MCPManager extends EventEmitter {
  private servers: Map<string, ManagedServer> = new Map();
  private maxRestarts = 5;
  private restartDelay = 5000;

  constructor() {
    super();
  }

  async initialize(configs: MCPServerConfig[]): Promise<void> {
    const logger = getLogger();
    logger.info(`Initializing MCP Manager with ${configs.length} servers`);

    for (const config of configs) {
      this.servers.set(config.name, {
        config,
        process: null,
        status: "stopped",
        restartCount: 0,
      });

      if (config.autoStart) {
        await this.startServer(config.name);
      }
    }
  }

  async startServer(name: string): Promise<boolean> {
    const logger = getLogger();
    const server = this.servers.get(name);

    if (!server) {
      logger.error(`Server not found: ${name}`);
      return false;
    }

    if (server.status === "running") {
      logger.warn(`Server already running: ${name}`);
      return true;
    }

    logger.info(`Starting MCP server: ${name}`);
    server.status = "starting";
    this.emitUpdate();

    try {
      const { config } = server;

      // Merge environment variables
      const env = {
        ...process.env,
        ...config.env,
      };

      // Spawn the process
      const proc = spawn(config.command, config.args, {
        env,
        stdio: ["pipe", "pipe", "pipe"],
        shell: process.platform === "win32",
      });

      server.process = proc;
      server.startedAt = new Date();
      server.status = "running";
      server.error = undefined;

      // Handle stdout
      proc.stdout?.on("data", (data) => {
        logger.debug(`[${name}] stdout: ${data.toString().trim()}`);
      });

      // Handle stderr
      proc.stderr?.on("data", (data) => {
        logger.debug(`[${name}] stderr: ${data.toString().trim()}`);
      });

      // Handle exit
      proc.on("exit", (code, signal) => {
        logger.info(`[${name}] Process exited with code ${code}, signal ${signal}`);
        server.process = null;

        if (server.status === "running") {
          // Unexpected exit, try to restart
          server.status = "error";
          server.error = `Process exited unexpectedly (code: ${code})`;
          this.emitUpdate();
          this.scheduleRestart(name);
        } else {
          server.status = "stopped";
          this.emitUpdate();
        }
      });

      proc.on("error", (error) => {
        logger.error(`[${name}] Process error: ${error.message}`);
        server.status = "error";
        server.error = error.message;
        server.process = null;
        this.emitUpdate();
        this.scheduleRestart(name);
      });

      this.emitUpdate();
      logger.info(`MCP server started: ${name} (PID: ${proc.pid})`);
      return true;
    } catch (error) {
      logger.error(`Failed to start MCP server ${name}: ${(error as Error).message}`);
      server.status = "error";
      server.error = (error as Error).message;
      this.emitUpdate();
      return false;
    }
  }

  async stopServer(name: string): Promise<boolean> {
    const logger = getLogger();
    const server = this.servers.get(name);

    if (!server) {
      logger.error(`Server not found: ${name}`);
      return false;
    }

    if (server.status === "stopped") {
      logger.warn(`Server already stopped: ${name}`);
      return true;
    }

    logger.info(`Stopping MCP server: ${name}`);
    server.status = "stopped"; // Mark as stopped to prevent restart
    server.restartCount = 0; // Reset restart counter

    if (server.process) {
      return new Promise((resolve) => {
        const proc = server.process!;

        // Set up timeout for force kill
        const timeout = setTimeout(() => {
          logger.warn(`Force killing MCP server: ${name}`);
          proc.kill("SIGKILL");
        }, 5000);

        proc.once("exit", () => {
          clearTimeout(timeout);
          server.process = null;
          this.emitUpdate();
          logger.info(`MCP server stopped: ${name}`);
          resolve(true);
        });

        // Try graceful shutdown first
        if (process.platform === "win32") {
          proc.kill();
        } else {
          proc.kill("SIGTERM");
        }
      });
    }

    this.emitUpdate();
    return true;
  }

  async restartServer(name: string): Promise<boolean> {
    await this.stopServer(name);
    // Reset restart count for manual restart
    const server = this.servers.get(name);
    if (server) {
      server.restartCount = 0;
    }
    return this.startServer(name);
  }

  private scheduleRestart(name: string): void {
    const logger = getLogger();
    const server = this.servers.get(name);

    if (!server) return;

    // Check if we've exceeded max restarts
    if (server.restartCount >= this.maxRestarts) {
      const timeSinceLastRestart = server.lastRestartAttempt
        ? Date.now() - server.lastRestartAttempt.getTime()
        : Infinity;

      // Reset restart count after 1 hour
      if (timeSinceLastRestart > 3600000) {
        server.restartCount = 0;
      } else {
        logger.error(`Max restart attempts reached for ${name}. Manual intervention required.`);
        return;
      }
    }

    server.restartCount++;
    server.lastRestartAttempt = new Date();

    const delay = this.restartDelay * server.restartCount; // Exponential backoff
    logger.info(`Scheduling restart for ${name} in ${delay}ms (attempt ${server.restartCount})`);

    setTimeout(() => {
      if (server.status === "error" || server.status === "stopped") {
        this.startServer(name);
      }
    }, delay);
  }

  addServer(config: MCPServerConfig): void {
    const logger = getLogger();
    logger.info(`Adding MCP server: ${config.name}`);

    this.servers.set(config.name, {
      config,
      process: null,
      status: "stopped",
      restartCount: 0,
    });

    if (config.autoStart) {
      this.startServer(config.name);
    }

    this.emitUpdate();
  }

  removeServer(name: string): boolean {
    const logger = getLogger();
    const server = this.servers.get(name);

    if (!server) return false;

    if (server.process) {
      this.stopServer(name);
    }

    this.servers.delete(name);
    logger.info(`Removed MCP server: ${name}`);
    this.emitUpdate();
    return true;
  }

  getServerStatus(name: string): MCPServerStatus | undefined {
    const server = this.servers.get(name);
    if (!server) return undefined;

    return {
      name,
      status: server.status,
      pid: server.process?.pid,
      startedAt: server.startedAt?.toISOString(),
      error: server.error,
    };
  }

  getAllServersStatus(): MCPServerStatus[] {
    return Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      status: server.status,
      pid: server.process?.pid,
      startedAt: server.startedAt?.toISOString(),
      error: server.error,
    }));
  }

  private emitUpdate(): void {
    this.emit("update", this.getAllServersStatus());
  }

  async shutdown(): Promise<void> {
    const logger = getLogger();
    logger.info("Shutting down all MCP servers...");

    const stopPromises = Array.from(this.servers.keys()).map((name) => this.stopServer(name));
    await Promise.all(stopPromises);

    logger.info("All MCP servers stopped");
  }
}
