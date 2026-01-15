import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as dgram from "dgram";
import {
  MCPHostAgent,
  MCPHostCapability,
  HostMCPServer,
  MCPHostAgentConfig,
  NetworkDiscoveryConfig,
  DiscoveredHost,
  InstallScriptConfig,
  AgentCommand,
  AgentStats,
} from "../types/mcpHostAgent";

export class MCPHostAgentManager extends EventEmitter {
  private hosts: Map<string, MCPHostAgent> = new Map();
  private discoveredHosts: Map<string, DiscoveredHost> = new Map();
  private commands: Map<string, AgentCommand> = new Map();
  private discoverySocket: dgram.Socket | null = null;
  private heartbeatInterval: NodeJS.Timer | null = null;

  private discoveryConfig: NetworkDiscoveryConfig = {
    enabled: true,
    discoveryMethod: "mdns",
    mdnsServiceType: "_orchestrate._tcp.local",
    scanInterval: 30000,
    autoConnect: true,
  };

  constructor() {
    super();
    this.startHeartbeat();
  }

  // Host Management
  registerHost(data: {
    hostName: string;
    platform: "windows" | "macos" | "linux";
    version: string;
    capabilities: MCPHostCapability[];
    network: MCPHostAgent["network"];
    security: MCPHostAgent["security"];
  }): MCPHostAgent {
    const id = randomUUID();

    const host: MCPHostAgent = {
      id,
      hostId: id,
      hostName: data.hostName,
      platform: data.platform,
      status: "connecting",
      version: data.version,
      capabilities: data.capabilities,
      network: data.network,
      security: data.security,
      resources: { cpuPercent: 0, memoryPercent: 0, diskPercent: 0 },
      mcpServers: [],
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.hosts.set(id, host);
    this.emit("host:registered", host);

    // Try to connect
    this.connectToHost(id);

    return host;
  }

  async connectToHost(hostId: string): Promise<boolean> {
    const host = this.hosts.get(hostId);
    if (!host) return false;

    host.status = "connecting";
    this.hosts.set(hostId, host);
    this.emit("host:connecting", { hostId });

    try {
      // Simulate connection (in production, would establish actual connection)
      await new Promise((r) => setTimeout(r, 1000));

      host.status = "online";
      host.connectedAt = new Date();
      host.lastSeen = new Date();
      host.error = undefined;
      this.hosts.set(hostId, host);

      this.emit("host:connected", host);
      return true;
    } catch (error) {
      host.status = "error";
      host.error = (error as Error).message;
      this.hosts.set(hostId, host);

      this.emit("host:connection-failed", { hostId, error: host.error });
      return false;
    }
  }

  disconnectHost(hostId: string): boolean {
    const host = this.hosts.get(hostId);
    if (!host) return false;

    host.status = "offline";
    host.connectedAt = undefined;
    this.hosts.set(hostId, host);

    this.emit("host:disconnected", { hostId });
    return true;
  }

  removeHost(hostId: string): boolean {
    const host = this.hosts.get(hostId);
    if (!host) return false;

    this.disconnectHost(hostId);
    this.hosts.delete(hostId);

    this.emit("host:removed", { hostId });
    return true;
  }

  getHost(id: string): MCPHostAgent | undefined {
    return this.hosts.get(id);
  }

  listHosts(): MCPHostAgent[] {
    return Array.from(this.hosts.values());
  }

  getOnlineHosts(): MCPHostAgent[] {
    return Array.from(this.hosts.values()).filter((h) => h.status === "online");
  }

  // Heartbeat
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHostHealth();
    }, 10000);
  }

  private async checkHostHealth(): Promise<void> {
    for (const [hostId, host] of this.hosts) {
      if (host.status !== "online") continue;

      const timeSinceLastSeen = Date.now() - host.lastSeen.getTime();
      if (timeSinceLastSeen > 30000) {
        host.status = "offline";
        this.hosts.set(hostId, host);
        this.emit("host:offline", { hostId });
      }
    }
  }

  updateHostHeartbeat(hostId: string, resources?: MCPHostAgent["resources"]): void {
    const host = this.hosts.get(hostId);
    if (!host) return;

    host.lastSeen = new Date();
    if (resources) {
      host.resources = resources;
    }
    if (host.status === "offline") {
      host.status = "online";
      this.emit("host:online", { hostId });
    }
    this.hosts.set(hostId, host);
  }

  // MCP Server Management on Hosts
  async startMCPServer(hostId: string, serverId: string): Promise<boolean> {
    return this.sendCommand(hostId, "start_mcp", { serverId });
  }

  async stopMCPServer(hostId: string, serverId: string): Promise<boolean> {
    return this.sendCommand(hostId, "stop_mcp", { serverId });
  }

  async restartMCPServer(hostId: string, serverId: string): Promise<boolean> {
    return this.sendCommand(hostId, "restart_mcp", { serverId });
  }

  updateHostMCPServers(hostId: string, servers: HostMCPServer[]): void {
    const host = this.hosts.get(hostId);
    if (!host) return;

    host.mcpServers = servers;
    host.updatedAt = new Date();
    this.hosts.set(hostId, host);

    this.emit("host:mcp-servers-updated", { hostId, servers });
  }

  // Commands
  private async sendCommand(hostId: string, type: AgentCommand["type"], params?: Record<string, unknown>): Promise<boolean> {
    const host = this.hosts.get(hostId);
    if (!host || host.status !== "online") return false;

    const command: AgentCommand = {
      id: randomUUID(),
      hostId,
      type,
      params,
      status: "pending",
    };

    this.commands.set(command.id, command);
    this.emit("command:created", command);

    try {
      command.status = "sent";
      command.sentAt = new Date();
      this.commands.set(command.id, command);

      // Simulate command execution
      await new Promise((r) => setTimeout(r, 500));

      command.status = "completed";
      command.completedAt = new Date();
      this.commands.set(command.id, command);

      this.emit("command:completed", command);
      return true;
    } catch (error) {
      command.status = "failed";
      command.error = (error as Error).message;
      command.completedAt = new Date();
      this.commands.set(command.id, command);

      this.emit("command:failed", command);
      return false;
    }
  }

  async captureScreenshot(hostId: string): Promise<string | null> {
    const success = await this.sendCommand(hostId, "screenshot");
    if (success) {
      return `screenshot_${hostId}_${Date.now()}.png`;
    }
    return null;
  }

  async triggerUpdate(hostId: string): Promise<boolean> {
    return this.sendCommand(hostId, "update");
  }

  getCommand(id: string): AgentCommand | undefined {
    return this.commands.get(id);
  }

  listCommands(hostId?: string): AgentCommand[] {
    const all = Array.from(this.commands.values());
    if (hostId) {
      return all.filter((c) => c.hostId === hostId);
    }
    return all;
  }

  // Network Discovery
  getDiscoveryConfig(): NetworkDiscoveryConfig {
    return { ...this.discoveryConfig };
  }

  updateDiscoveryConfig(updates: Partial<NetworkDiscoveryConfig>): NetworkDiscoveryConfig {
    this.discoveryConfig = { ...this.discoveryConfig, ...updates };

    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.startDiscovery();
      } else {
        this.stopDiscovery();
      }
    }

    this.emit("discovery:config-updated", this.discoveryConfig);
    return this.discoveryConfig;
  }

  startDiscovery(): void {
    if (!this.discoveryConfig.enabled) return;

    switch (this.discoveryConfig.discoveryMethod) {
      case "mdns":
        this.startMDNSDiscovery();
        break;
      case "tailscale":
        this.startTailscaleDiscovery();
        break;
    }
  }

  private startMDNSDiscovery(): void {
    // mDNS discovery simulation
    // In production, would use multicast DNS
    this.emit("discovery:started", { method: "mdns" });

    // Simulate discovering hosts
    setTimeout(() => {
      this.addDiscoveredHost({
        name: "dev-laptop",
        address: "192.168.1.100",
        port: 3002,
        platform: "windows",
        version: "1.0.0",
        discoveryMethod: "mdns",
      });
    }, 2000);
  }

  private startTailscaleDiscovery(): void {
    // Tailscale discovery simulation
    this.emit("discovery:started", { method: "tailscale" });

    // Would query Tailscale API for devices
  }

  stopDiscovery(): void {
    if (this.discoverySocket) {
      this.discoverySocket.close();
      this.discoverySocket = null;
    }
    this.emit("discovery:stopped");
  }

  private addDiscoveredHost(data: Omit<DiscoveredHost, "id" | "discoveredAt" | "connected">): void {
    const id = randomUUID();
    const host: DiscoveredHost = {
      id,
      ...data,
      discoveredAt: new Date(),
      connected: false,
    };

    this.discoveredHosts.set(id, host);
    this.emit("discovery:host-found", host);

    // Auto-connect if enabled
    if (this.discoveryConfig.autoConnect) {
      this.connectDiscoveredHost(id);
    }
  }

  async connectDiscoveredHost(discoveredId: string): Promise<MCPHostAgent | null> {
    const discovered = this.discoveredHosts.get(discoveredId);
    if (!discovered) return null;

    const host = this.registerHost({
      hostName: discovered.name,
      platform: discovered.platform as MCPHostAgent["platform"],
      version: discovered.version,
      capabilities: ["mcp_hosting", "file_sync", "screenshot"],
      network: {
        ipAddress: discovered.address,
        port: discovered.port,
        protocol: discovered.discoveryMethod === "tailscale" ? "tailscale" : "tcp",
      },
      security: {
        tlsEnabled: false,
        authMethod: "token",
        authorizedClients: [],
      },
    });

    discovered.connected = true;
    this.discoveredHosts.set(discoveredId, discovered);

    return host;
  }

  listDiscoveredHosts(): DiscoveredHost[] {
    return Array.from(this.discoveredHosts.values());
  }

  // Installation Script Generation
  generateInstallScript(config: InstallScriptConfig): string {
    switch (config.platform) {
      case "windows":
        return this.generateWindowsScript(config);
      case "macos":
        return this.generateMacOSScript(config);
      case "linux":
        return this.generateLinuxScript(config);
    }
  }

  private generateWindowsScript(config: InstallScriptConfig): string {
    return `# Orchestrate MCP Host Agent Installation Script (Windows)
# Run this script in PowerShell as Administrator

$ErrorActionPreference = "Stop"

Write-Host "Installing Orchestrate MCP Host Agent..."

# Configuration
$ORCHESTRATE_URL = "${config.orchestrateUrl}"
$AUTH_TOKEN = "${config.authToken}"
$INSTALL_PATH = "$env:ProgramFiles\\Orchestrate\\MCPHostAgent"

# Create installation directory
New-Item -ItemType Directory -Force -Path $INSTALL_PATH | Out-Null

# Download agent
Write-Host "Downloading agent..."
$agentUrl = "$ORCHESTRATE_URL/downloads/mcp-host-agent-windows.exe"
Invoke-WebRequest -Uri $agentUrl -OutFile "$INSTALL_PATH\\mcp-host-agent.exe"

# Create config file
$config = @"
hostName: "$env:COMPUTERNAME"
orchestrateUrl: "$ORCHESTRATE_URL"
authToken: "$AUTH_TOKEN"
listenPort: 3002
protocol: websocket
tlsEnabled: false
autoStart: ${config.autoStart}
heartbeatInterval: 10000
mcpServers:
${config.mcpServers.map((s) => `  - name: "${s.name}"
    command: "${s.command}"
    args: ${JSON.stringify(s.args)}
    autoStart: ${s.autoStart}`).join("\n")}
"@

$config | Out-File -FilePath "$INSTALL_PATH\\config.yaml" -Encoding UTF8

# Install as Windows Service
Write-Host "Installing as Windows Service..."
& "$INSTALL_PATH\\mcp-host-agent.exe" install

# Start the service
if (${config.autoStart}) {
    Start-Service -Name "OrchestrateAgent"
    Write-Host "Service started successfully!"
}

Write-Host "Installation complete!"
Write-Host "Agent will connect to: $ORCHESTRATE_URL"
`;
  }

  private generateMacOSScript(config: InstallScriptConfig): string {
    return `#!/bin/bash
# Orchestrate MCP Host Agent Installation Script (macOS)
# Run with: sudo bash install-agent.sh

set -e

echo "Installing Orchestrate MCP Host Agent..."

# Configuration
ORCHESTRATE_URL="${config.orchestrateUrl}"
AUTH_TOKEN="${config.authToken}"
INSTALL_PATH="/usr/local/orchestrate"

# Create installation directory
sudo mkdir -p $INSTALL_PATH

# Download agent
echo "Downloading agent..."
curl -L "$ORCHESTRATE_URL/downloads/mcp-host-agent-macos" -o "$INSTALL_PATH/mcp-host-agent"
chmod +x "$INSTALL_PATH/mcp-host-agent"

# Create config file
cat > "$INSTALL_PATH/config.yaml" << EOF
hostName: "$(hostname)"
orchestrateUrl: "$ORCHESTRATE_URL"
authToken: "$AUTH_TOKEN"
listenPort: 3002
protocol: websocket
tlsEnabled: false
autoStart: ${config.autoStart}
heartbeatInterval: 10000
mcpServers:
${config.mcpServers.map((s) => `  - name: "${s.name}"
    command: "${s.command}"
    args: ${JSON.stringify(s.args)}
    autoStart: ${s.autoStart}`).join("\n")}
EOF

# Create launchd plist
cat > /Library/LaunchDaemons/com.orchestrate.agent.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.orchestrate.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_PATH/mcp-host-agent</string>
        <string>--config</string>
        <string>$INSTALL_PATH/config.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <${config.autoStart}/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Load the service
launchctl load /Library/LaunchDaemons/com.orchestrate.agent.plist

echo "Installation complete!"
echo "Agent will connect to: $ORCHESTRATE_URL"
`;
  }

  private generateLinuxScript(config: InstallScriptConfig): string {
    return `#!/bin/bash
# Orchestrate MCP Host Agent Installation Script (Linux)
# Run with: sudo bash install-agent.sh

set -e

echo "Installing Orchestrate MCP Host Agent..."

# Configuration
ORCHESTRATE_URL="${config.orchestrateUrl}"
AUTH_TOKEN="${config.authToken}"
INSTALL_PATH="/opt/orchestrate"

# Create installation directory
sudo mkdir -p $INSTALL_PATH

# Download agent
echo "Downloading agent..."
curl -L "$ORCHESTRATE_URL/downloads/mcp-host-agent-linux" -o "$INSTALL_PATH/mcp-host-agent"
chmod +x "$INSTALL_PATH/mcp-host-agent"

# Create config file
cat > "$INSTALL_PATH/config.yaml" << EOF
hostName: "$(hostname)"
orchestrateUrl: "$ORCHESTRATE_URL"
authToken: "$AUTH_TOKEN"
listenPort: 3002
protocol: websocket
tlsEnabled: false
autoStart: ${config.autoStart}
heartbeatInterval: 10000
mcpServers:
${config.mcpServers.map((s) => `  - name: "${s.name}"
    command: "${s.command}"
    args: ${JSON.stringify(s.args)}
    autoStart: ${s.autoStart}`).join("\n")}
EOF

# Create systemd service
cat > /etc/systemd/system/orchestrate-agent.service << EOF
[Unit]
Description=Orchestrate MCP Host Agent
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_PATH/mcp-host-agent --config $INSTALL_PATH/config.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable orchestrate-agent
${config.autoStart ? "systemctl start orchestrate-agent" : "# Service not auto-started"}

echo "Installation complete!"
echo "Agent will connect to: $ORCHESTRATE_URL"
`;
  }

  // Stats
  getStats(): AgentStats {
    const hosts = Array.from(this.hosts.values());
    const online = hosts.filter((h) => h.status === "online");

    let totalMCP = 0;
    let runningMCP = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const host of hosts) {
      totalMCP += host.mcpServers.length;
      runningMCP += host.mcpServers.filter((s) => s.status === "running").length;
      if (host.network.latency) {
        totalLatency += host.network.latency;
        latencyCount++;
      }
    }

    return {
      totalHosts: hosts.length,
      onlineHosts: online.length,
      offlineHosts: hosts.length - online.length,
      totalMCPServers: totalMCP,
      runningMCPServers: runningMCP,
      discoveredHosts: this.discoveredHosts.size,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
    };
  }
}
