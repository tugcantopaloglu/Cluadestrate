import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { AgentConfig } from "./types";

const DEFAULT_CONFIG: AgentConfig = {
  hostName: require("os").hostname(),
  server: {
    url: "ws://localhost:3001",
    authToken: "",
    reconnectInterval: 5000,
    heartbeatInterval: 10000,
  },
  agent: {
    port: 3002,
    autoStart: true,
    capabilities: ["mcp_hosting", "file_sync", "screenshot", "terminal", "process_management"],
  },
  mcpServers: [],
  fileSync: {
    enabled: false,
    watchPaths: [],
    ignoredPatterns: ["node_modules", ".git", "*.log"],
  },
  logging: {
    level: "info",
    file: "./logs/agent.log",
    maxSize: "10m",
    maxFiles: 5,
  },
  security: {
    tlsEnabled: false,
    certPath: "",
    keyPath: "",
  },
};

export function loadConfig(configPath?: string): AgentConfig {
  const possiblePaths = [
    configPath,
    "./config.yaml",
    "./config.yml",
    path.join(process.cwd(), "config.yaml"),
    path.join(process.cwd(), "config.yml"),
    // Windows paths
    path.join(process.env.PROGRAMDATA || "", "Cluadestrate", "agent", "config.yaml"),
    // Linux/Mac paths
    "/etc/cluadestrate/agent/config.yaml",
    path.join(process.env.HOME || "", ".cluadestrate", "agent", "config.yaml"),
  ].filter(Boolean) as string[];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, "utf-8");
        const parsed = yaml.parse(content);
        console.log(`Loaded config from: ${p}`);
        return mergeConfig(DEFAULT_CONFIG, parsed);
      } catch (error) {
        console.error(`Error loading config from ${p}:`, error);
      }
    }
  }

  console.log("No config file found, using defaults");
  return DEFAULT_CONFIG;
}

export function saveConfig(config: AgentConfig, configPath: string): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, yaml.stringify(config), "utf-8");
}

function mergeConfig(defaults: AgentConfig, overrides: Partial<AgentConfig>): AgentConfig {
  return {
    hostName: overrides.hostName || defaults.hostName,
    server: { ...defaults.server, ...overrides.server },
    agent: { ...defaults.agent, ...overrides.agent },
    mcpServers: overrides.mcpServers || defaults.mcpServers,
    fileSync: { ...defaults.fileSync, ...overrides.fileSync },
    logging: { ...defaults.logging, ...overrides.logging },
    security: { ...defaults.security, ...overrides.security },
  };
}

export function getConfigPath(): string {
  const platform = process.platform;

  if (platform === "win32") {
    return path.join(process.env.PROGRAMDATA || "C:\\ProgramData", "Cluadestrate", "agent", "config.yaml");
  } else if (platform === "darwin") {
    return path.join("/Library/Application Support", "Cluadestrate", "agent", "config.yaml");
  } else {
    return "/etc/cluadestrate/agent/config.yaml";
  }
}
