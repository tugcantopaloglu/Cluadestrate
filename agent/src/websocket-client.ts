import { io, Socket } from "socket.io-client";
import { EventEmitter } from "events";
import { AgentConfig, AuthResponseMessage, CommandMessage, ResourceInfo, MCPServerStatus } from "./types";
import { getLogger } from "./logger";

export class WebSocketClient extends EventEmitter {
  private ws: Socket | null = null;
  private hostId: string | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private config: AgentConfig,
    private getResources: () => ResourceInfo | null = () => null,
    private getMCPServers: () => MCPServerStatus[] = () => [],
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this.ws) return;
    const url = new URL(this.config.server.url);
    if (url.protocol === "ws:") url.protocol = "http:";
    if (url.protocol === "wss:") url.protocol = "https:";
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported server URL protocol");
    url.pathname = `${url.pathname.replace(/\/$/, "")}/agent`;

    const socket = io(url.toString(), {
      autoConnect: false,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: this.config.server.reconnectInterval,
      reconnectionDelayMax: this.config.server.reconnectInterval,
    });
    this.ws = socket;

    socket.on("connect", () => {
      this.emit("connected");
      socket.emit("auth", {
        hostName: this.config.hostName,
        platform: process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux",
        version: "1.0.0",
        capabilities: this.config.agent.capabilities,
        authToken: this.config.server.authToken,
      });
    });
    socket.on("auth_response", (message: AuthResponseMessage) => {
      if (message?.payload?.success && message.payload.hostId) {
        this.hostId = message.payload.hostId;
        this.emit("authenticated", this.hostId);
        this.startHeartbeat();
      } else {
        this.emit("authFailed", message?.payload?.error || "Authentication failed");
        this.disconnect();
      }
    });
    socket.on("command", (message: CommandMessage) => {
      if (this.hostId && message?.payload) this.emit("command", message.payload);
    });
    socket.on("disconnect", (reason) => {
      this.hostId = null;
      this.stopHeartbeat();
      this.emit("disconnected", reason);
      if (reason === "io server disconnect" && this.ws === socket) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          if (this.ws === socket) socket.connect();
        }, this.config.server.reconnectInterval);
      }
    });
    socket.on("connect_error", (error) => {
      getLogger().error(`Agent connection failed: ${error.message}`);
      this.emit("error", error);
    });
    socket.connect();
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.hostId = null;
    this.ws?.disconnect();
    this.ws = null;
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.config.server.heartbeatInterval);
    this.sendHeartbeat();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private sendHeartbeat(): void {
    if (!this.hostId) return;
    this.ws?.emit("heartbeat", {
      hostId: this.hostId,
      resources: this.getResources() || {
        cpuPercent: 0, memoryPercent: 0, memoryUsed: 0, memoryTotal: 0,
        diskPercent: 0, diskUsed: 0, diskTotal: 0, uptime: 0,
        loadAverage: [0, 0, 0], networkRx: 0, networkTx: 0,
      },
      mcpServers: this.getMCPServers(),
    });
  }

  sendCommandResponse(commandId: string, success: boolean, result?: unknown, error?: string): void {
    if (this.hostId) this.ws?.emit("command_response", { commandId, success, result, error });
  }

  sendMCPServersUpdate(servers: MCPServerStatus[]): void {
    if (this.hostId) this.ws?.emit("mcp_servers_update", { hostId: this.hostId, servers });
  }

  isConnected(): boolean {
    return this.ws?.connected || false;
  }

  getHostId(): string | null {
    return this.hostId;
  }
}
