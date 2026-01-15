// MCP Host Agent Types

export interface MCPHostAgent {
  id: string;
  hostId: string;
  hostName: string;
  platform: "windows" | "macos" | "linux";
  status: "online" | "offline" | "connecting" | "error";
  version: string;
  capabilities: MCPHostCapability[];
  network: {
    ipAddress: string;
    port: number;
    protocol: "tcp" | "websocket" | "tailscale";
    tailscaleId?: string;
    latency?: number;
  };
  security: {
    tlsEnabled: boolean;
    authMethod: "token" | "certificate" | "none";
    authorizedClients: string[];
  };
  resources: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
  };
  mcpServers: HostMCPServer[];
  lastSeen: Date;
  connectedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MCPHostCapability =
  | "file_sync"
  | "screenshot"
  | "terminal"
  | "auto_update"
  | "mcp_hosting"
  | "process_management";

export interface HostMCPServer {
  id: string;
  name: string;
  status: "running" | "stopped" | "error";
  command: string;
  args: string[];
  env: Record<string, string>;
  port?: number;
}

export interface MCPHostAgentConfig {
  hostName: string;
  listenPort: number;
  protocol: "tcp" | "websocket" | "tailscale";
  tlsEnabled: boolean;
  tlsCertPath?: string;
  tlsKeyPath?: string;
  authToken?: string;
  autoStart: boolean;
  mcpServers: HostMCPServerConfig[];
  allowedCapabilities: MCPHostCapability[];
  heartbeatInterval: number;
  reconnectDelay: number;
}

export interface HostMCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  autoStart: boolean;
}

// Network Discovery Types
export interface NetworkDiscoveryConfig {
  enabled: boolean;
  discoveryMethod: "mdns" | "tailscale" | "manual";
  mdnsServiceType: string;
  scanInterval: number;
  autoConnect: boolean;
}

export interface DiscoveredHost {
  id: string;
  name: string;
  address: string;
  port: number;
  platform: string;
  version: string;
  discoveredAt: Date;
  discoveryMethod: "mdns" | "tailscale" | "manual";
  connected: boolean;
}

// Installation Scripts
export interface InstallScriptConfig {
  platform: "windows" | "macos" | "linux";
  orchestrateUrl: string;
  authToken: string;
  mcpServers: HostMCPServerConfig[];
  autoStart: boolean;
}

// Agent Commands
export interface AgentCommand {
  id: string;
  hostId: string;
  type: "start_mcp" | "stop_mcp" | "restart_mcp" | "screenshot" | "sync_files" | "update" | "reboot";
  params?: Record<string, unknown>;
  status: "pending" | "sent" | "executing" | "completed" | "failed";
  result?: unknown;
  error?: string;
  sentAt?: Date;
  completedAt?: Date;
}

export interface AgentStats {
  totalHosts: number;
  onlineHosts: number;
  offlineHosts: number;
  totalMCPServers: number;
  runningMCPServers: number;
  discoveredHosts: number;
  averageLatency: number;
}
