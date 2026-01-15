#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import { loadConfig, saveConfig, getConfigPath } from "./config";
import { initLogger, getLogger } from "./logger";
import { Agent } from "./agent";
import { AgentConfig } from "./types";

const VERSION = "1.0.0";

const program = new Command();

program
  .name("cluadestrate-agent")
  .description("MCP Host Agent for Cluadestrate")
  .version(VERSION);

program
  .command("start")
  .description("Start the MCP Host Agent")
  .option("-c, --config <path>", "Path to configuration file")
  .option("-s, --server <url>", "Server WebSocket URL")
  .option("-t, --token <token>", "Authentication token")
  .option("-n, --name <name>", "Host name")
  .option("-d, --daemon", "Run as daemon (detached)")
  .action(async (options) => {
    try {
      // Load configuration
      const config = loadConfig(options.config);

      // Override with command line options
      if (options.server) {
        config.server.url = options.server;
      }
      if (options.token) {
        config.server.authToken = options.token;
      }
      if (options.name) {
        config.hostName = options.name;
      }

      // Initialize logger
      initLogger(config.logging);
      const logger = getLogger();

      logger.info("=".repeat(60));
      logger.info("  Cluadestrate MCP Host Agent");
      logger.info(`  Version: ${VERSION}`);
      logger.info("=".repeat(60));

      // Create and start agent
      const agent = new Agent(config);

      // Handle shutdown gracefully
      const shutdown = async () => {
        logger.info("Shutdown signal received");
        await agent.stop();
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
      process.on("SIGHUP", shutdown);

      // Handle uncaught errors
      process.on("uncaughtException", (error) => {
        logger.error(`Uncaught exception: ${error.message}`);
        logger.error(error.stack || "");
      });

      process.on("unhandledRejection", (reason) => {
        logger.error(`Unhandled rejection: ${reason}`);
      });

      await agent.start();

      // Keep the process running
      logger.info("Agent is running. Press Ctrl+C to stop.");

    } catch (error) {
      console.error(`Failed to start agent: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize configuration file")
  .option("-p, --path <path>", "Configuration file path")
  .option("-s, --server <url>", "Server WebSocket URL")
  .option("-t, --token <token>", "Authentication token")
  .action((options) => {
    const configPath = options.path || getConfigPath();
    const config: AgentConfig = {
      hostName: require("os").hostname(),
      server: {
        url: options.server || "ws://localhost:3001",
        authToken: options.token || "",
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
        ignoredPatterns: ["node_modules", ".git"],
      },
      logging: {
        level: "info",
        file: path.join(path.dirname(configPath), "logs", "agent.log"),
        maxSize: "10m",
        maxFiles: 5,
      },
      security: {
        tlsEnabled: false,
        certPath: "",
        keyPath: "",
      },
    };

    saveConfig(config, configPath);
    console.log(`Configuration file created: ${configPath}`);
    console.log("\nEdit this file to configure your MCP servers and authentication token.");
  });

program
  .command("status")
  .description("Check agent status")
  .option("-c, --config <path>", "Path to configuration file")
  .action(async (options) => {
    const config = loadConfig(options.config);

    console.log("\nAgent Configuration:");
    console.log(`  Host Name: ${config.hostName}`);
    console.log(`  Server URL: ${config.server.url}`);
    console.log(`  MCP Servers: ${config.mcpServers.length}`);

    for (const server of config.mcpServers) {
      console.log(`    - ${server.name}: ${server.command} (autoStart: ${server.autoStart})`);
    }
  });

program
  .command("install")
  .description("Install as system service")
  .action(async () => {
    const { installService } = await import("./service-install");
    await installService();
  });

program
  .command("uninstall")
  .description("Uninstall system service")
  .action(async () => {
    const { uninstallService } = await import("./service-install");
    await uninstallService();
  });

program
  .command("service-status")
  .description("Check service status")
  .action(async () => {
    const { checkServiceStatus } = await import("./service-install");
    await checkServiceStatus();
  });

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
