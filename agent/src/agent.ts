import { EventEmitter } from "events";
import { AgentConfig, ResourceInfo, MCPServerStatus, CommandMessage } from "./types";
import { WebSocketClient } from "./websocket-client";
import { MCPManager } from "./mcp-manager";
import { ResourceMonitor } from "./resource-monitor";
import { CommandExecutor } from "./command-executor";
import { getLogger } from "./logger";

export class Agent extends EventEmitter {
  private config: AgentConfig;
  private wsClient: WebSocketClient;
  private mcpManager: MCPManager;
  private resourceMonitor: ResourceMonitor;
  private commandExecutor: CommandExecutor;
  private resourceUpdateInterval: NodeJS.Timeout | null = null;
  private currentResources: ResourceInfo | null = null;

  constructor(config: AgentConfig) {
    super();
    this.config = config;

    // Initialize components
    this.mcpManager = new MCPManager();
    this.resourceMonitor = new ResourceMonitor();
    this.commandExecutor = new CommandExecutor(this.mcpManager);
    this.wsClient = new WebSocketClient(config);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    const logger = getLogger();

    // WebSocket events
    this.wsClient.on("connected", () => {
      logger.info("Connected to central server");
      this.emit("connected");
    });

    this.wsClient.on("disconnected", (reason: string) => {
      logger.warn(`Disconnected from server: ${reason}`);
      this.emit("disconnected", reason);
    });

    this.wsClient.on("authenticated", (hostId: string) => {
      logger.info(`Authenticated with host ID: ${hostId}`);
      this.emit("authenticated", hostId);
      this.startResourceUpdates();
    });

    this.wsClient.on("authFailed", (error: string) => {
      logger.error(`Authentication failed: ${error}`);
      this.emit("authFailed", error);
    });

    this.wsClient.on("command", async (command: CommandMessage["payload"]) => {
      await this.handleCommand(command);
    });

    this.wsClient.on("error", (error: Error) => {
      logger.error(`WebSocket error: ${error.message}`);
      this.emit("error", error);
    });

    // Handle resource requests from WebSocket client
    this.wsClient.on("getResources", () => {
      return this.currentResources;
    });

    this.wsClient.on("getMCPServers", () => {
      return this.mcpManager.getAllServersStatus();
    });

    // MCP Manager events
    this.mcpManager.on("update", (servers: MCPServerStatus[]) => {
      this.wsClient.sendMCPServersUpdate(servers);
    });
  }

  async start(): Promise<void> {
    const logger = getLogger();
    logger.info("Starting Cluadestrate Agent...");
    logger.info(`Host Name: ${this.config.hostName}`);
    logger.info(`Server URL: ${this.config.server.url}`);

    // Get system info
    const systemInfo = await this.resourceMonitor.getSystemInfo();
    logger.info(`Platform: ${systemInfo.platform} (${systemInfo.arch})`);
    logger.info(`OS: ${systemInfo.osVersion}`);
    logger.info(`CPU: ${systemInfo.cpuModel} (${systemInfo.cpuCores} cores)`);

    // Initialize MCP servers
    await this.mcpManager.initialize(this.config.mcpServers);

    // Connect to central server
    await this.wsClient.connect();

    logger.info("Agent started successfully");
  }

  async stop(): Promise<void> {
    const logger = getLogger();
    logger.info("Stopping agent...");

    this.stopResourceUpdates();

    // Stop MCP servers
    await this.mcpManager.shutdown();

    // Disconnect from server
    this.wsClient.disconnect();

    logger.info("Agent stopped");
  }

  private async handleCommand(command: CommandMessage["payload"]): Promise<void> {
    const logger = getLogger();
    logger.info(`Processing command: ${command.commandType} (${command.commandId})`);

    const result = await this.commandExecutor.execute(command.commandType, command.params);

    this.wsClient.sendCommandResponse(
      command.commandId,
      result.success,
      result.result,
      result.error
    );
  }

  private startResourceUpdates(): void {
    if (this.resourceUpdateInterval) return;

    // Update resources immediately
    this.updateResources();

    // Then update every 5 seconds
    this.resourceUpdateInterval = setInterval(() => {
      this.updateResources();
    }, 5000);
  }

  private stopResourceUpdates(): void {
    if (this.resourceUpdateInterval) {
      clearInterval(this.resourceUpdateInterval);
      this.resourceUpdateInterval = null;
    }
  }

  private async updateResources(): Promise<void> {
    try {
      this.currentResources = await this.resourceMonitor.getResources();
    } catch (error) {
      getLogger().error(`Failed to update resources: ${(error as Error).message}`);
    }
  }

  isConnected(): boolean {
    return this.wsClient.isConnected();
  }

  getHostId(): string | null {
    return this.wsClient.getHostId();
  }

  getMCPServersStatus(): MCPServerStatus[] {
    return this.mcpManager.getAllServersStatus();
  }
}
