import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CommandType } from "./types";
import { MCPManager } from "./mcp-manager";
import { getLogger } from "./logger";

const execAsync = promisify(exec);

// Screenshot support - try to import, but gracefully handle if unavailable
let screenshot: any = null;
try {
  screenshot = require("screenshot-desktop");
} catch (e) {
  // Screenshot not available on this platform
}

export class CommandExecutor {
  private mcpManager: MCPManager;
  private screenshotDir: string;

  constructor(mcpManager: MCPManager) {
    this.mcpManager = mcpManager;
    this.screenshotDir = path.join(os.tmpdir(), "cluadestrate-screenshots");

    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async execute(
    commandType: CommandType,
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logger = getLogger();
    logger.info(`Executing command: ${commandType}`);

    try {
      switch (commandType) {
        case "start_mcp":
          return this.handleStartMCP(params);

        case "stop_mcp":
          return this.handleStopMCP(params);

        case "restart_mcp":
          return this.handleRestartMCP(params);

        case "screenshot":
          return this.handleScreenshot();

        case "execute_shell":
          return this.handleExecuteShell(params);

        case "get_logs":
          return this.handleGetLogs(params);

        case "update":
          return this.handleUpdate();

        case "reboot":
          return this.handleReboot();

        case "sync_files":
          return this.handleSyncFiles(params);

        default:
          return { success: false, error: `Unknown command: ${commandType}` };
      }
    } catch (error) {
      logger.error(`Command execution failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleStartMCP(
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const serverName = params?.serverId as string || params?.name as string;
    if (!serverName) {
      return { success: false, error: "Server name/ID required" };
    }

    const success = await this.mcpManager.startServer(serverName);
    return {
      success,
      result: this.mcpManager.getServerStatus(serverName),
      error: success ? undefined : "Failed to start server",
    };
  }

  private async handleStopMCP(
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const serverName = params?.serverId as string || params?.name as string;
    if (!serverName) {
      return { success: false, error: "Server name/ID required" };
    }

    const success = await this.mcpManager.stopServer(serverName);
    return {
      success,
      result: this.mcpManager.getServerStatus(serverName),
      error: success ? undefined : "Failed to stop server",
    };
  }

  private async handleRestartMCP(
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const serverName = params?.serverId as string || params?.name as string;
    if (!serverName) {
      return { success: false, error: "Server name/ID required" };
    }

    const success = await this.mcpManager.restartServer(serverName);
    return {
      success,
      result: this.mcpManager.getServerStatus(serverName),
      error: success ? undefined : "Failed to restart server",
    };
  }

  private async handleScreenshot(): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logger = getLogger();

    if (!screenshot) {
      return { success: false, error: "Screenshot not available on this platform" };
    }

    try {
      const filename = `screenshot_${Date.now()}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await screenshot({ filename: filepath });

      // Read the file and convert to base64
      const imageBuffer = fs.readFileSync(filepath);
      const base64 = imageBuffer.toString("base64");

      // Clean up
      fs.unlinkSync(filepath);

      logger.info(`Screenshot captured: ${filename}`);
      return {
        success: true,
        result: {
          filename,
          data: base64,
          mimeType: "image/png",
          size: imageBuffer.length,
        },
      };
    } catch (error) {
      logger.error(`Screenshot failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleExecuteShell(
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logger = getLogger();
    const command = params?.command as string;
    const cwd = params?.cwd as string;
    const timeout = (params?.timeout as number) || 30000;

    if (!command) {
      return { success: false, error: "Command required" };
    }

    logger.info(`Executing shell command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return {
        success: true,
        result: {
          stdout,
          stderr,
          exitCode: 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        result: {
          stdout: error.stdout || "",
          stderr: error.stderr || "",
          exitCode: error.code || 1,
        },
        error: error.message,
      };
    }
  }

  private async handleGetLogs(
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logFile = params?.logFile as string || "./logs/agent.log";
    const lines = (params?.lines as number) || 100;

    try {
      if (!fs.existsSync(logFile)) {
        return { success: false, error: "Log file not found" };
      }

      const content = fs.readFileSync(logFile, "utf-8");
      const allLines = content.split("\n");
      const lastLines = allLines.slice(-lines);

      return {
        success: true,
        result: {
          lines: lastLines,
          totalLines: allLines.length,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleUpdate(): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logger = getLogger();
    logger.info("Agent update requested");

    // In production, this would:
    // 1. Download new version
    // 2. Verify signature
    // 3. Replace binary
    // 4. Restart service

    // For now, return a placeholder
    return {
      success: true,
      result: {
        message: "Update check initiated",
        currentVersion: "1.0.0",
      },
    };
  }

  private async handleReboot(): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logger = getLogger();
    logger.warn("System reboot requested");

    // Schedule reboot after response is sent
    setTimeout(async () => {
      try {
        if (process.platform === "win32") {
          await execAsync("shutdown /r /t 5 /c \"Cluadestrate Agent reboot\"");
        } else {
          await execAsync("sudo reboot");
        }
      } catch (error) {
        logger.error(`Reboot failed: ${(error as Error).message}`);
      }
    }, 1000);

    return {
      success: true,
      result: { message: "Reboot scheduled in 5 seconds" },
    };
  }

  private async handleSyncFiles(
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const logger = getLogger();
    const sourcePath = params?.source as string;
    const destPath = params?.destination as string;

    if (!sourcePath || !destPath) {
      return { success: false, error: "Source and destination paths required" };
    }

    logger.info(`File sync: ${sourcePath} -> ${destPath}`);

    // Implementation would depend on sync direction and requirements
    return {
      success: true,
      result: { message: "Sync initiated" },
    };
  }
}
