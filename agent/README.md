# Cluadestrate MCP Host Agent

A standalone agent that runs on remote machines (Windows, Linux, Raspberry Pi, macOS) to host MCP servers and connect to the central Cluadestrate orchestrator.

## Features

- **Cross-Platform**: Runs on Windows, Linux (x64, ARM64), and macOS
- **MCP Server Management**: Start, stop, restart MCP servers remotely
- **Resource Monitoring**: CPU, memory, disk, network usage
- **Screenshot Capture**: Remote screenshot capability
- **Auto-Reconnection**: Automatically reconnects to the central server
- **System Service**: Install as Windows Service, systemd service, or launchd daemon
- **Secure Communication**: WebSocket with optional TLS

## Quick Start

### 1. Download

Download the appropriate binary for your platform from the releases page, or build from source.

### 2. Initialize Configuration

```bash
# Create config file
./cluadestrate-agent init --server ws://your-server:3001 --token your-auth-token
```

### 3. Edit Configuration

Edit the generated `config.yaml` to add your MCP servers:

```yaml
hostName: "my-raspberry-pi"

server:
  url: "ws://192.168.1.100:3001"
  authToken: "your-secret-token"

mcpServers:
  - name: "filesystem"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/pi/workspace"]
    autoStart: true
```

### 4. Run

```bash
# Start the agent
./cluadestrate-agent start

# Or run as a service (requires admin/root)
sudo ./cluadestrate-agent install
```

## Building from Source

### Prerequisites

- Node.js 18 or later
- npm

### Build Steps

```bash
# Install dependencies
npm install

# Build for current platform
npm run build

# Build for all platforms
npm run build:all

# Or use the build scripts:
# Windows:
scripts\build-windows.bat

# Linux/macOS:
./scripts/build-linux.sh
```

### Build Outputs

After building, executables will be in `dist/bin/`:

- `cluadestrate-agent-win-x64.exe` - Windows x64
- `cluadestrate-agent-linux-x64` - Linux x64
- `cluadestrate-agent-linux-arm64` - Linux ARM64 (Raspberry Pi)
- `cluadestrate-agent-macos-x64` - macOS Intel
- `cluadestrate-agent-macos-arm64` - macOS Apple Silicon

## Installation as System Service

### Windows (as Administrator)

```powershell
# Install
.\cluadestrate-agent.exe install

# Check status
sc query cluadestrate-agent

# Start
sc start cluadestrate-agent

# Stop
sc stop cluadestrate-agent

# Uninstall
.\cluadestrate-agent.exe uninstall
```

### Linux (with sudo)

```bash
# Install
sudo ./cluadestrate-agent install

# Check status
sudo systemctl status cluadestrate-agent

# Start
sudo systemctl start cluadestrate-agent

# View logs
sudo journalctl -u cluadestrate-agent -f

# Uninstall
sudo ./cluadestrate-agent uninstall
```

### macOS (with sudo)

```bash
# Install
sudo ./cluadestrate-agent install

# Check status
sudo launchctl list | grep cluadestrate

# View logs
tail -f /var/log/cluadestrate/agent.log

# Uninstall
sudo ./cluadestrate-agent uninstall
```

## Raspberry Pi Setup

1. Download the ARM64 binary:
   ```bash
   wget https://your-server/downloads/cluadestrate-agent-linux-arm64 -O cluadestrate-agent
   chmod +x cluadestrate-agent
   ```

2. Initialize configuration:
   ```bash
   ./cluadestrate-agent init --server ws://your-central-server:3001 --token your-token
   ```

3. Install as service:
   ```bash
   sudo ./cluadestrate-agent install
   sudo systemctl start cluadestrate-agent
   ```

4. The agent will now:
   - Connect to your central Cluadestrate server
   - Appear in the MCP Hosts page in the GUI
   - Allow remote management of MCP servers on the Pi

## Configuration Reference

```yaml
# Host identification
hostName: "my-computer"

# Connection to central server
server:
  url: "ws://localhost:3001"
  authToken: "your-auth-token"
  reconnectInterval: 5000      # ms between reconnection attempts
  heartbeatInterval: 10000     # ms between heartbeats

# Agent capabilities
agent:
  port: 3002                   # Local port for agent API
  autoStart: true
  capabilities:
    - mcp_hosting              # Host MCP servers
    - file_sync                # File synchronization
    - screenshot               # Screenshot capture
    - terminal                 # Remote terminal
    - auto_update              # Auto-update support
    - process_management       # Process management

# MCP Servers
mcpServers:
  - name: "filesystem"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    autoStart: true
    env:
      KEY: "value"

# Logging
logging:
  level: "info"                # debug, info, warn, error
  file: "./logs/agent.log"
  maxSize: "10m"
  maxFiles: 5
```

## Troubleshooting

### Agent won't connect

1. Check the server URL is correct and accessible
2. Verify the auth token matches what's configured on the server
3. Check firewall rules allow WebSocket connections
4. View logs: `./cluadestrate-agent start` (logs to console)

### MCP server won't start

1. Ensure the command is available in PATH
2. Check the args are correct
3. View agent logs for error messages
4. Try running the command manually first

### Service won't install

- **Windows**: Run as Administrator
- **Linux/macOS**: Run with sudo
- Check existing service isn't running

## License

MIT
