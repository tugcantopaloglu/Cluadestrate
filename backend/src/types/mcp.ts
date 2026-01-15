export type MCPServerStatus = "running" | "stopped" | "error" | "starting";

export interface MCPServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface MCPServerProcess {
  pid?: number;
  startedAt?: Date;
  logs: LogEntry[];
}

export interface MCPServer {
  id: string;
  name: string;
  status: MCPServerStatus;
  config: MCPServerConfig;
  assignedTo: "all" | string[];
  process: MCPServerProcess;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemoteHostConnection {
  type: "local" | "manual" | "tailscale" | "cloud";
  address: string;
  port: number;
  authToken: string;
}

export interface RemoteHost {
  id: string;
  hostname: string;
  displayName: string;
  platform: "windows" | "macos" | "linux";
  connection: RemoteHostConnection;
  status: "online" | "offline" | "connecting" | "error";
  latency: number;
  lastSeen: Date;
  mcpServers: RemoteMCPServer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RemoteMCPServerRequirements {
  minRAM?: string;
  gpu?: boolean;
  software?: string[];
}

export interface RemoteMCPServer {
  id: string;
  hostId: string;
  name: string;
  displayName: string;
  description: string;
  status: "running" | "stopped" | "error" | "starting";
  assignedSessions: string[];
  requirements?: RemoteMCPServerRequirements;
}

export interface MCPRoute {
  sessionId: string;
  mcpName: string;
  location: "local" | "remote";
  hostId?: string;
  priority: number;
}

export interface CreateMCPServerRequest {
  name: string;
  config: MCPServerConfig;
  assignedTo?: "all" | string[];
}

export interface AddRemoteHostRequest {
  hostname: string;
  displayName: string;
  connection: RemoteHostConnection;
}
