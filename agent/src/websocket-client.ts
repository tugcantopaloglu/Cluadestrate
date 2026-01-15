import WebSocket from "ws";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import {
  AgentConfig,
  BaseMessage,
  AuthMessage,
  AuthResponseMessage,
  HeartbeatMessage,
  CommandMessage,
  CommandResponseMessage,
  ResourceInfo,
  MCPServerStatus,
} from "./types";
import { getLogger } from "./logger";

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: AgentConfig;
  private hostId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;
  private version = "1.0.0";

  constructor(config: AgentConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;
    const logger = getLogger();

    try {
      logger.info(`Connecting to server: ${this.config.server.url}`);

      this.ws = new WebSocket(this.config.server.url, {
        headers: {
          "X-Agent-Type": "mcp-host-agent",
          "X-Agent-Version": this.version,
        },
      });

      this.ws.on("open", () => {
        this.isConnecting = false;
        logger.info("WebSocket connected");
        this.emit("connected");
        this.authenticate();
      });

      this.ws.on("message", (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on("close", (code, reason) => {
        this.isConnecting = false;
        this.stopHeartbeat();
        logger.warn(`WebSocket closed: ${code} - ${reason}`);
        this.emit("disconnected", reason.toString());

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });

      this.ws.on("error", (error) => {
        this.isConnecting = false;
        logger.error(`WebSocket error: ${error.message}`);
        this.emit("error", error);
      });
    } catch (error) {
      this.isConnecting = false;
      logger.error(`Connection failed: ${(error as Error).message}`);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Agent shutdown");
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.shouldReconnect) return;

    const logger = getLogger();
    logger.info(`Reconnecting in ${this.config.server.reconnectInterval}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.config.server.reconnectInterval);
  }

  private authenticate(): void {
    const logger = getLogger();
    logger.info("Authenticating with server...");

    const authMessage: AuthMessage = {
      type: "auth",
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        hostName: this.config.hostName,
        platform: process.platform,
        version: this.version,
        capabilities: this.config.agent.capabilities,
        authToken: this.config.server.authToken,
      },
    };

    this.send(authMessage);
  }

  private handleMessage(data: string): void {
    const logger = getLogger();

    try {
      const message = JSON.parse(data) as BaseMessage;

      switch (message.type) {
        case "auth_response":
          this.handleAuthResponse(message as AuthResponseMessage);
          break;

        case "heartbeat_ack":
          // Server acknowledged heartbeat
          break;

        case "command":
          this.handleCommand(message as CommandMessage);
          break;

        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Failed to parse message: ${(error as Error).message}`);
    }
  }

  private handleAuthResponse(message: AuthResponseMessage): void {
    const logger = getLogger();

    if (message.payload.success && message.payload.hostId) {
      this.hostId = message.payload.hostId;
      logger.info(`Authenticated successfully. Host ID: ${this.hostId}`);
      this.emit("authenticated", this.hostId);
      this.startHeartbeat();
    } else {
      logger.error(`Authentication failed: ${message.payload.error}`);
      this.emit("authFailed", message.payload.error || "Unknown error");
      this.disconnect();
    }
  }

  private handleCommand(message: CommandMessage): void {
    const logger = getLogger();
    logger.info(`Received command: ${message.payload.commandType} (${message.payload.commandId})`);
    this.emit("command", message.payload);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.server.heartbeatInterval);

    // Send first heartbeat immediately
    this.sendHeartbeat();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat(): void {
    if (!this.hostId) return;

    // Get current resources and MCP status from agent
    const resources = this.emit("getResources") as unknown as ResourceInfo;
    const mcpServers = this.emit("getMCPServers") as unknown as MCPServerStatus[];

    const heartbeat: HeartbeatMessage = {
      type: "heartbeat",
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        hostId: this.hostId,
        resources: resources || {
          cpuPercent: 0,
          memoryPercent: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          diskPercent: 0,
          diskUsed: 0,
          diskTotal: 0,
          uptime: 0,
          loadAverage: [0, 0, 0],
          networkRx: 0,
          networkTx: 0,
        },
        mcpServers: mcpServers || [],
      },
    };

    this.send(heartbeat);
  }

  sendCommandResponse(commandId: string, success: boolean, result?: unknown, error?: string): void {
    const response: CommandResponseMessage = {
      type: "command_response",
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        commandId,
        success,
        result,
        error,
      },
    };

    this.send(response);
  }

  sendMCPServersUpdate(servers: MCPServerStatus[]): void {
    if (!this.hostId) return;

    this.send({
      type: "mcp_servers_update",
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        hostId: this.hostId,
        servers,
      },
    });
  }

  private send(message: BaseMessage | Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getHostId(): string | null {
    return this.hostId;
  }
}
