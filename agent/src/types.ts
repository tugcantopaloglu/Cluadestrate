// Agent Configuration Types

export interface AgentConfig {
  hostName: string;
  server: ServerConfig;
  agent: AgentSettings;
  mcpServers: MCPServerConfig[];
  fileSync: FileSyncConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
}

export interface ServerConfig {
  url: string;
  authToken: string;
  reconnectInterval: number;
  heartbeatInterval: number;
}

export interface AgentSettings {
  port: number;
  autoStart: boolean;
  capabilities: AgentCapability[];
}

export type AgentCapability =
  | "mcp_hosting"
  | "file_sync"
  | "screenshot"
  | "terminal"
  | "auto_update"
  | "process_management";

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  autoStart: boolean;
  env: Record<string, string>;
}

export interface FileSyncConfig {
  enabled: boolean;
  watchPaths: string[];
  ignoredPatterns: string[];
}

export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  file: string;
  maxSize: string;
  maxFiles: number;
}

export interface SecurityConfig {
  tlsEnabled: boolean;
  certPath: string;
  keyPath: string;
}

// Message Types for WebSocket Communication

export type MessageType =
  | "auth"
  | "auth_response"
  | "heartbeat"
  | "heartbeat_ack"
  | "command"
  | "command_response"
  | "mcp_servers_update"
  | "resource_update"
  | "file_sync_event"
  | "log"
  | "error";

export interface BaseMessage {
  type: MessageType;
  id: string;
  timestamp: string;
}

export interface AuthMessage extends BaseMessage {
  type: "auth";
  payload: {
    hostName: string;
    platform: string;
    version: string;
    capabilities: AgentCapability[];
    authToken: string;
  };
}

export interface AuthResponseMessage extends BaseMessage {
  type: "auth_response";
  payload: {
    success: boolean;
    hostId?: string;
    error?: string;
  };
}

export interface HeartbeatMessage extends BaseMessage {
  type: "heartbeat";
  payload: {
    hostId: string;
    resources: ResourceInfo;
    mcpServers: MCPServerStatus[];
  };
}

export interface CommandMessage extends BaseMessage {
  type: "command";
  payload: {
    commandId: string;
    commandType: CommandType;
    params?: Record<string, unknown>;
  };
}

export interface CommandResponseMessage extends BaseMessage {
  type: "command_response";
  payload: {
    commandId: string;
    success: boolean;
    result?: unknown;
    error?: string;
  };
}

export type CommandType =
  | "start_mcp"
  | "stop_mcp"
  | "restart_mcp"
  | "screenshot"
  | "sync_files"
  | "update"
  | "reboot"
  | "execute_shell"
  | "get_logs";

// Resource Types

export interface ResourceInfo {
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
}

export interface MCPServerStatus {
  name: string;
  status: "running" | "stopped" | "error" | "starting";
  pid?: number;
  port?: number;
  startedAt?: string;
  error?: string;
}

// Events

export interface AgentEvents {
  connected: () => void;
  disconnected: (reason: string) => void;
  authenticated: (hostId: string) => void;
  authFailed: (error: string) => void;
  command: (command: CommandMessage["payload"]) => void;
  error: (error: Error) => void;
}
