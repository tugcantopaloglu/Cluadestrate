import { exec, execSync } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getConfigPath } from "./config";

const execAsync = promisify(exec);

const SERVICE_NAME = "cluadestrate-agent";
const SERVICE_DISPLAY_NAME = "Cluadestrate MCP Host Agent";
const SERVICE_DESCRIPTION = "MCP Host Agent for Cluadestrate - manages MCP servers and connects to central orchestrator";

export async function installService(): Promise<void> {
  const platform = process.platform;

  console.log(`Installing ${SERVICE_DISPLAY_NAME} as a system service...`);

  switch (platform) {
    case "win32":
      await installWindowsService();
      break;
    case "linux":
      await installLinuxService();
      break;
    case "darwin":
      await installMacOSService();
      break;
    default:
      console.error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }
}

export async function uninstallService(): Promise<void> {
  const platform = process.platform;

  console.log(`Uninstalling ${SERVICE_DISPLAY_NAME}...`);

  switch (platform) {
    case "win32":
      await uninstallWindowsService();
      break;
    case "linux":
      await uninstallLinuxService();
      break;
    case "darwin":
      await uninstallMacOSService();
      break;
    default:
      console.error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }
}

export async function checkServiceStatus(): Promise<void> {
  const platform = process.platform;

  switch (platform) {
    case "win32":
      await checkWindowsServiceStatus();
      break;
    case "linux":
      await checkLinuxServiceStatus();
      break;
    case "darwin":
      await checkMacOSServiceStatus();
      break;
    default:
      console.error(`Unsupported platform: ${platform}`);
  }
}

// ============== Windows Service ==============

async function installWindowsService(): Promise<void> {
  const execPath = process.execPath;
  const configPath = getConfigPath();
  const logPath = path.join(path.dirname(configPath), "logs", "agent.log");

  // Create NSSM-style service using sc.exe and wrapper batch file
  const installDir = path.dirname(execPath);
  const wrapperPath = path.join(installDir, "start-service.bat");

  // Create wrapper batch file
  const batchContent = `@echo off
cd /d "${installDir}"
"${execPath}" start --config "${configPath}"
`;

  fs.writeFileSync(wrapperPath, batchContent);

  // Create service using sc.exe
  try {
    // Check if service already exists
    try {
      execSync(`sc query ${SERVICE_NAME}`, { stdio: "pipe" });
      console.log("Service already exists. Stopping and removing...");
      execSync(`sc stop ${SERVICE_NAME}`, { stdio: "pipe" });
      await new Promise((r) => setTimeout(r, 2000));
      execSync(`sc delete ${SERVICE_NAME}`, { stdio: "pipe" });
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      // Service doesn't exist, continue
    }

    // Create service
    execSync(
      `sc create ${SERVICE_NAME} binPath= "${wrapperPath}" DisplayName= "${SERVICE_DISPLAY_NAME}" start= auto`,
      { stdio: "inherit" }
    );

    // Set description
    execSync(`sc description ${SERVICE_NAME} "${SERVICE_DESCRIPTION}"`, { stdio: "pipe" });

    // Configure failure recovery
    execSync(`sc failure ${SERVICE_NAME} reset= 86400 actions= restart/5000/restart/10000/restart/30000`, {
      stdio: "pipe",
    });

    console.log("\nService installed successfully!");
    console.log(`\nTo start the service, run:`);
    console.log(`  sc start ${SERVICE_NAME}`);
    console.log(`\nOr use Windows Services (services.msc)`);
  } catch (error) {
    console.error(`Failed to install service: ${(error as Error).message}`);
    console.log("\nTry running this command as Administrator.");
    process.exit(1);
  }
}

async function uninstallWindowsService(): Promise<void> {
  try {
    // Stop the service
    try {
      execSync(`sc stop ${SERVICE_NAME}`, { stdio: "pipe" });
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      // Service might not be running
    }

    // Delete the service
    execSync(`sc delete ${SERVICE_NAME}`, { stdio: "inherit" });

    console.log("Service uninstalled successfully!");
  } catch (error) {
    console.error(`Failed to uninstall service: ${(error as Error).message}`);
    console.log("\nTry running this command as Administrator.");
    process.exit(1);
  }
}

async function checkWindowsServiceStatus(): Promise<void> {
  try {
    const { stdout } = await execAsync(`sc query ${SERVICE_NAME}`);
    console.log(stdout);
  } catch (error) {
    console.log(`Service ${SERVICE_NAME} is not installed.`);
  }
}

// ============== Linux Service (systemd) ==============

async function installLinuxService(): Promise<void> {
  const execPath = process.execPath;
  const configPath = getConfigPath();

  // Check if running as root
  if (process.getuid && process.getuid() !== 0) {
    console.error("Please run this command with sudo.");
    process.exit(1);
  }

  // Create systemd service file
  const serviceContent = `[Unit]
Description=${SERVICE_DESCRIPTION}
After=network.target

[Service]
Type=simple
ExecStart=${execPath} start --config ${configPath}
Restart=always
RestartSec=10
User=root
Environment=NODE_ENV=production

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/var/log/cluadestrate /etc/cluadestrate

[Install]
WantedBy=multi-user.target
`;

  const servicePath = `/etc/systemd/system/${SERVICE_NAME}.service`;

  try {
    // Create directories
    const dirs = ["/var/log/cluadestrate", "/etc/cluadestrate/agent"];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Write service file
    fs.writeFileSync(servicePath, serviceContent);

    // Reload systemd
    execSync("systemctl daemon-reload", { stdio: "inherit" });

    // Enable service
    execSync(`systemctl enable ${SERVICE_NAME}`, { stdio: "inherit" });

    console.log("\nService installed successfully!");
    console.log(`\nTo start the service, run:`);
    console.log(`  sudo systemctl start ${SERVICE_NAME}`);
    console.log(`\nTo check status:`);
    console.log(`  sudo systemctl status ${SERVICE_NAME}`);
    console.log(`\nTo view logs:`);
    console.log(`  sudo journalctl -u ${SERVICE_NAME} -f`);
  } catch (error) {
    console.error(`Failed to install service: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function uninstallLinuxService(): Promise<void> {
  if (process.getuid && process.getuid() !== 0) {
    console.error("Please run this command with sudo.");
    process.exit(1);
  }

  const servicePath = `/etc/systemd/system/${SERVICE_NAME}.service`;

  try {
    // Stop the service
    try {
      execSync(`systemctl stop ${SERVICE_NAME}`, { stdio: "pipe" });
    } catch (e) {
      // Service might not be running
    }

    // Disable the service
    try {
      execSync(`systemctl disable ${SERVICE_NAME}`, { stdio: "pipe" });
    } catch (e) {
      // Service might not be enabled
    }

    // Remove service file
    if (fs.existsSync(servicePath)) {
      fs.unlinkSync(servicePath);
    }

    // Reload systemd
    execSync("systemctl daemon-reload", { stdio: "inherit" });

    console.log("Service uninstalled successfully!");
  } catch (error) {
    console.error(`Failed to uninstall service: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function checkLinuxServiceStatus(): Promise<void> {
  try {
    const { stdout } = await execAsync(`systemctl status ${SERVICE_NAME}`);
    console.log(stdout);
  } catch (error: any) {
    if (error.stdout) {
      console.log(error.stdout);
    } else {
      console.log(`Service ${SERVICE_NAME} is not installed.`);
    }
  }
}

// ============== macOS Service (launchd) ==============

async function installMacOSService(): Promise<void> {
  const execPath = process.execPath;
  const configPath = getConfigPath();
  const plistPath = `/Library/LaunchDaemons/com.cluadestrate.agent.plist`;

  // Check if running as root
  if (process.getuid && process.getuid() !== 0) {
    console.error("Please run this command with sudo.");
    process.exit(1);
  }

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cluadestrate.agent</string>

    <key>ProgramArguments</key>
    <array>
        <string>${execPath}</string>
        <string>start</string>
        <string>--config</string>
        <string>${configPath}</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/var/log/cluadestrate/agent.log</string>

    <key>StandardErrorPath</key>
    <string>/var/log/cluadestrate/agent.error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
`;

  try {
    // Create log directory
    const logDir = "/var/log/cluadestrate";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create config directory
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write plist file
    fs.writeFileSync(plistPath, plistContent);

    // Load the service
    execSync(`launchctl load ${plistPath}`, { stdio: "inherit" });

    console.log("\nService installed successfully!");
    console.log(`\nThe service will start automatically.`);
    console.log(`\nTo check status:`);
    console.log(`  sudo launchctl list | grep cluadestrate`);
    console.log(`\nTo view logs:`);
    console.log(`  tail -f /var/log/cluadestrate/agent.log`);
  } catch (error) {
    console.error(`Failed to install service: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function uninstallMacOSService(): Promise<void> {
  if (process.getuid && process.getuid() !== 0) {
    console.error("Please run this command with sudo.");
    process.exit(1);
  }

  const plistPath = `/Library/LaunchDaemons/com.cluadestrate.agent.plist`;

  try {
    // Unload the service
    try {
      execSync(`launchctl unload ${plistPath}`, { stdio: "pipe" });
    } catch (e) {
      // Service might not be loaded
    }

    // Remove plist file
    if (fs.existsSync(plistPath)) {
      fs.unlinkSync(plistPath);
    }

    console.log("Service uninstalled successfully!");
  } catch (error) {
    console.error(`Failed to uninstall service: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function checkMacOSServiceStatus(): Promise<void> {
  try {
    const { stdout } = await execAsync("launchctl list | grep cluadestrate");
    console.log("Service is loaded:");
    console.log(stdout);
  } catch (error) {
    console.log(`Service ${SERVICE_NAME} is not installed.`);
  }
}
