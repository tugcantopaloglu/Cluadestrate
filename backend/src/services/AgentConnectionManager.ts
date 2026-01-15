import { EventEmitter } from "events";
import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { MCPHostAgentManager } from "./MCPHostAgentManager";

interface AgentConnection {
  socket: Socket;
  hostId: string;
  hostName: string;
  platform: string;
  version: string;
  capabilities: string[];
  connectedAt: Date;
  lastHeartbeat: Date;
}

interface AuthPayload {
  hostName: string;
  platform: string;
  version: string;
  capabilities: string[];
  authToken: string;
}

interface HeartbeatPayload {
  hostId: string;
  resources: {
    cpuPercent: number;
    memoryPercent: number;
    memoryUsed: number;
    memoryTotal: number;
    diskPercent: number;
    diskUsed: number;
    diskTotal: number;
    uptime: number;
    loadAverage: number[];
    networkRx: number;
    networkTx: number;
  };
  mcpServers: {
    name: string;
    status: string;
    pid?: number;
    startedAt?: string;
    error?: string;
  }[];
}

export class AgentConnectionManager extends EventEmitter {
  private io: Server;
  private mcpHostManager: MCPHostAgentManager;
  private connections: Map<string, AgentConnection> = new Map();
  private validTokens: Set<string> = new Set();
  private heartbeatCheckInterval: NodeJS.Timer | null = null;

  constructor(io: Server, mcpHostManager: MCPHostAgentManager) {
    super();
    this.io = io;
    this.mcpHostManager = mcpHostManager;

    // Load valid tokens from environment or generate default
    const envTokens = process.env.AGENT_AUTH_TOKENS?.split(",") || [];
    envTokens.forEach((t) => this.validTokens.add(t.trim()));

    // Add a default token for development
    if (this.validTokens.size === 0) {
      this.validTokens.add("dev-agent-token");
    }

    this.setupSocketHandlers();
    this.startHeartbeatCheck();
  }

  private setupSocketHandlers(): void {
    // Handle agent namespace
    const agentNamespace = this.io.of("/agent");

    agentNamespace.on("connection", (socket: Socket) => {
      console.log(`Agent connection attempt: ${socket.id}`);

      // Handle authentication
      socket.on("auth", (payload: AuthPayload) => {
        this.handleAuth(socket, payload);
      });

      // Handle heartbeat
      socket.on("heartbeat", (payload: HeartbeatPayload) => {
        this.handleHeartbeat(socket, payload);
      });

      // Handle MCP servers update
      socket.on("mcp_servers_update", (payload: { hostId: string; servers: any[] }) => {
        this.handleMCPServersUpdate(socket, payload);
      });

      // Handle command response
      socket.on("command_response", (payload: { commandId: string; success: boolean; result?: any; error?: string }) => {
        this.handleCommandResponse(socket, payload);
      });

      // Handle disconnection
      socket.on("disconnect", (reason: string) => {
        this.handleDisconnect(socket, reason);
      });
    });
  }

  private handleAuth(socket: Socket, payload: AuthPayload): void {
    console.log(`Agent auth attempt: ${payload.hostName} (${payload.platform})`);

    // Validate token
    if (!this.validTokens.has(payload.authToken)) {
      console.log(`Agent auth failed: invalid token`);
      socket.emit("auth_response", {
        type: "auth_response",
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        payload: {
          success: false,
          error: "Invalid authentication token",
        },
      });
      socket.disconnect(true);
      return;
    }

    // Register host with MCPHostAgentManager
    const host = this.mcpHostManager.registerHost({
      hostName: payload.hostName,
      platform: payload.platform as "windows" | "macos" | "linux",
      version: payload.version,
      capabilities: payload.capabilities as any[],
      network: {
        ipAddress: socket.handshake.address || "unknown",
        port: 0,
        protocol: "websocket",
      },
      security: {
        tlsEnabled: false,
        authMethod: "token",
        authorizedClients: [],
      },
    });

    // Store connection
    const connection: AgentConnection = {
      socket,
      hostId: host.id,
      hostName: payload.hostName,
      platform: payload.platform,
      version: payload.version,
      capabilities: payload.capabilities,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    };

    this.connections.set(host.id, connection);

    // Join host-specific room
    socket.join(`host:${host.id}`);

    console.log(`Agent authenticated: ${payload.hostName} (ID: ${host.id})`);

    // Send success response
    socket.emit("auth_response", {
      type: "auth_response",
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload: {
        success: true,
        hostId: host.id,
      },
    });

    this.emit("agent:connected", host);
  }

  private handleHeartbeat(socket: Socket, payload: HeartbeatPayload): void {
    const connection = this.getConnectionBySocketId(socket.id);
    if (!connection) return;

    connection.lastHeartbeat = new Date();

    // Update host manager with resource info
    this.mcpHostManager.updateHostHeartbeat(payload.hostId, {
      cpuPercent: payload.resources.cpuPercent,
      memoryPercent: payload.resources.memoryPercent,
      diskPercent: payload.resources.diskPercent,
    });

    // Update MCP servers if provided
    if (payload.mcpServers) {
      this.mcpHostManager.updateHostMCPServers(
        payload.hostId,
        payload.mcpServers.map((s) => ({
          id: s.name,
          name: s.name,
          status: s.status as any,
          command: "",
          args: [],
          env: {},
          port: undefined,
        }))
      );
    }

    // Acknowledge heartbeat
    socket.emit("heartbeat_ack", {
      type: "heartbeat_ack",
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    });

    this.emit("agent:heartbeat", { hostId: payload.hostId, resources: payload.resources });
  }

  private handleMCPServersUpdate(socket: Socket, payload: { hostId: string; servers: any[] }): void {
    this.mcpHostManager.updateHostMCPServers(
      payload.hostId,
      payload.servers.map((s) => ({
        id: s.name,
        name: s.name,
        status: s.status,
        command: "",
        args: [],
        env: {},
        port: s.port,
      }))
    );

    this.emit("agent:mcp_update", payload);
  }

  private handleCommandResponse(
    socket: Socket,
    payload: { commandId: string; success: boolean; result?: any; error?: string }
  ): void {
    this.emit("command:response", payload);
  }

  private handleDisconnect(socket: Socket, reason: string): void {
    const connection = this.getConnectionBySocketId(socket.id);
    if (!connection) return;

    console.log(`Agent disconnected: ${connection.hostName} (${reason})`);

    // Update host status
    this.mcpHostManager.disconnectHost(connection.hostId);

    // Remove connection
    this.connections.delete(connection.hostId);

    this.emit("agent:disconnected", { hostId: connection.hostId, reason });
  }

  private startHeartbeatCheck(): void {
    this.heartbeatCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [hostId, connection] of this.connections) {
        const timeSinceLastHeartbeat = now - connection.lastHeartbeat.getTime();
        if (timeSinceLastHeartbeat > timeout) {
          console.log(`Agent heartbeat timeout: ${connection.hostName}`);
          connection.socket.disconnect(true);
        }
      }
    }, 10000);
  }

  private getConnectionBySocketId(socketId: string): AgentConnection | undefined {
    for (const connection of this.connections.values()) {
      if (connection.socket.id === socketId) {
        return connection;
      }
    }
    return undefined;
  }

  // Send command to agent
  sendCommand(
    hostId: string,
    commandType: string,
    params?: Record<string, unknown>
  ): { commandId: string; sent: boolean } {
    const connection = this.connections.get(hostId);
    const commandId = randomUUID();

    if (!connection) {
      return { commandId, sent: false };
    }

    connection.socket.emit("command", {
      type: "command",
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload: {
        commandId,
        commandType,
        params,
      },
    });

    return { commandId, sent: true };
  }

  // Get connected agents
  getConnectedAgents(): { hostId: string; hostName: string; platform: string; connectedAt: Date }[] {
    return Array.from(this.connections.values()).map((c) => ({
      hostId: c.hostId,
      hostName: c.hostName,
      platform: c.platform,
      connectedAt: c.connectedAt,
    }));
  }

  // Check if agent is connected
  isAgentConnected(hostId: string): boolean {
    return this.connections.has(hostId);
  }

  // Add valid token
  addToken(token: string): void {
    this.validTokens.add(token);
  }

  // Remove token
  removeToken(token: string): void {
    this.validTokens.delete(token);
  }

  // Stop heartbeat check on shutdown
  shutdown(): void {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
    }

    // Disconnect all agents
    for (const connection of this.connections.values()) {
      connection.socket.disconnect(true);
    }

    this.connections.clear();
  }
}
