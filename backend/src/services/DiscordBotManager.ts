import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import {
  DiscordBotConfig,
  DiscordGuild,
  DiscordChannelBinding,
  DiscordNotificationChannel,
  DiscordSlashCommand,
  DiscordInteraction,
  DiscordEmbed,
  BotStats,
} from "../types/bots";

export class DiscordBotManager extends EventEmitter {
  private config: DiscordBotConfig = {
    enabled: false,
    botToken: "",
    applicationId: "",
    publicKey: "",
    status: "offline",
    connectedGuilds: [],
  };

  private channelBindings: Map<string, DiscordChannelBinding> = new Map();
  private notificationChannels: Map<string, DiscordNotificationChannel> = new Map();
  private stats = {
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    errors: 0,
    lastActivity: undefined as Date | undefined,
  };

  private commands: DiscordSlashCommand[] = [
    {
      name: "session",
      description: "Manage Claude sessions",
      options: [
        { name: "action", description: "Action to perform", type: 3, required: true, choices: [
          { name: "create", value: "create" },
          { name: "list", value: "list" },
          { name: "status", value: "status" },
          { name: "stop", value: "stop" },
        ]},
        { name: "input", description: "Session name, ID, or prompt", type: 3, required: false },
      ],
    },
    {
      name: "task",
      description: "Manage tasks",
      options: [
        { name: "action", description: "Action to perform", type: 3, required: true, choices: [
          { name: "create", value: "create" },
          { name: "list", value: "list" },
          { name: "assign", value: "assign" },
        ]},
        { name: "input", description: "Task details", type: 3, required: false },
      ],
    },
    {
      name: "workflow",
      description: "Run workflows",
      options: [
        { name: "action", description: "Action to perform", type: 3, required: true, choices: [
          { name: "run", value: "run" },
          { name: "status", value: "status" },
        ]},
        { name: "name", description: "Workflow name or ID", type: 3, required: false },
      ],
    },
    {
      name: "usage",
      description: "Show usage statistics",
      options: [],
    },
    {
      name: "help",
      description: "Show help information",
      options: [],
    },
  ];

  constructor() {
    super();
  }

  // Configuration
  getConfig(): Omit<DiscordBotConfig, "botToken" | "publicKey"> & { hasToken: boolean } {
    return {
      enabled: this.config.enabled,
      applicationId: this.config.applicationId,
      status: this.config.status,
      connectedGuilds: this.config.connectedGuilds,
      error: this.config.error,
      hasToken: !!this.config.botToken,
    };
  }

  async updateConfig(updates: {
    enabled?: boolean;
    botToken?: string;
    applicationId?: string;
    publicKey?: string;
  }): Promise<void> {
    if (updates.enabled !== undefined) this.config.enabled = updates.enabled;
    if (updates.botToken) this.config.botToken = updates.botToken;
    if (updates.applicationId) this.config.applicationId = updates.applicationId;
    if (updates.publicKey) this.config.publicKey = updates.publicKey;

    if (this.config.enabled && this.config.botToken) {
      await this.connect();
    } else {
      this.config.status = "offline";
    }

    this.emit("config:updated", this.getConfig());
  }

  // Connection
  async connect(): Promise<boolean> {
    try {
      // Verify bot token
      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${this.config.botToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.config.status = "online";
        this.config.error = undefined;

        // Register slash commands
        await this.registerCommands();

        // Fetch guilds
        await this.fetchGuilds();

        this.emit("connected", { username: data.username });
        return true;
      }
      throw new Error("Failed to authenticate with Discord");
    } catch (error) {
      this.config.status = "error";
      this.config.error = (error as Error).message;
      this.emit("error", { error: this.config.error });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.config.status = "offline";
    this.emit("disconnected");
  }

  // Guilds
  private async fetchGuilds(): Promise<void> {
    try {
      const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bot ${this.config.botToken}` },
      });
      const guilds = await response.json();

      this.config.connectedGuilds = guilds.map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        memberCount: 0, // Would need additional API call
        joinedAt: new Date(),
        permissions: [],
      }));
    } catch (error) {
      console.error("Failed to fetch Discord guilds:", error);
    }
  }

  listGuilds(): DiscordGuild[] {
    return [...this.config.connectedGuilds];
  }

  // Commands
  private async registerCommands(): Promise<void> {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/applications/${this.config.applicationId}/commands`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${this.config.botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.commands),
        }
      );

      if (!response.ok) {
        console.error("Failed to register Discord commands:", await response.text());
      }
    } catch (error) {
      console.error("Failed to register Discord commands:", error);
    }
  }

  listCommands(): DiscordSlashCommand[] {
    return [...this.commands];
  }

  // Handle interactions
  async handleInteraction(interaction: DiscordInteraction): Promise<{
    type: number;
    data?: { content?: string; embeds?: DiscordEmbed[]; flags?: number };
  }> {
    this.stats.commandsExecuted++;
    this.stats.lastActivity = new Date();

    this.emit("interaction:received", interaction);

    // Type 2 = APPLICATION_COMMAND
    if (interaction.type === 2 && interaction.commandName) {
      return this.handleCommand(interaction);
    }

    // Type 3 = MESSAGE_COMPONENT (button clicks, etc.)
    if (interaction.type === 3) {
      return this.handleComponent(interaction);
    }

    // Default acknowledgment
    return { type: 1 }; // PONG
  }

  private async handleCommand(interaction: DiscordInteraction): Promise<{
    type: number;
    data: { content?: string; embeds?: DiscordEmbed[]; flags?: number };
  }> {
    const { commandName, options, guildId, channelId, userId } = interaction;

    switch (commandName) {
      case "session":
        const sessionAction = options?.action as string;
        const sessionInput = options?.input as string;
        return this.handleSessionCommand(sessionAction, sessionInput, guildId, channelId);

      case "task":
        const taskAction = options?.action as string;
        const taskInput = options?.input as string;
        return this.handleTaskCommand(taskAction, taskInput, guildId, channelId);

      case "workflow":
        const workflowAction = options?.action as string;
        const workflowName = options?.name as string;
        return this.handleWorkflowCommand(workflowAction, workflowName, guildId, channelId);

      case "usage":
        return this.handleUsageCommand();

      case "help":
        return this.handleHelpCommand();

      default:
        return { type: 4, data: { content: "Unknown command", flags: 64 } };
    }
  }

  private handleSessionCommand(action: string, input: string, guildId: string, channelId: string): {
    type: number;
    data: { content?: string; embeds?: DiscordEmbed[] };
  } {
    this.emit(`command:session:${action}`, { input, guildId, channelId });

    switch (action) {
      case "create":
        return {
          type: 4,
          data: {
            embeds: [{
              title: "🚀 Creating Session",
              description: `Starting Claude session: "${input || "New Session"}"`,
              color: 0x5865F2,
            }],
          },
        };
      case "list":
        return {
          type: 4,
          data: {
            embeds: [{
              title: "📋 Active Sessions",
              description: "Fetching sessions...",
              color: 0x5865F2,
            }],
          },
        };
      case "status":
        return {
          type: 4,
          data: {
            embeds: [{
              title: "📊 Session Status",
              description: input ? `Checking status of session: ${input}` : "Fetching status...",
              color: 0x5865F2,
            }],
          },
        };
      case "stop":
        return {
          type: 4,
          data: {
            embeds: [{
              title: "⏹️ Stopping Session",
              description: `Stopping session: ${input}`,
              color: 0xED4245,
            }],
          },
        };
      default:
        return { type: 4, data: { content: "Unknown action" } };
    }
  }

  private handleTaskCommand(action: string, input: string, guildId: string, channelId: string): {
    type: number;
    data: { content?: string; embeds?: DiscordEmbed[] };
  } {
    this.emit(`command:task:${action}`, { input, guildId, channelId });

    return {
      type: 4,
      data: {
        embeds: [{
          title: `📝 Task ${action}`,
          description: `Processing task action: ${action}${input ? ` - ${input}` : ""}`,
          color: 0x57F287,
        }],
      },
    };
  }

  private handleWorkflowCommand(action: string, name: string, guildId: string, channelId: string): {
    type: number;
    data: { content?: string; embeds?: DiscordEmbed[] };
  } {
    this.emit(`command:workflow:${action}`, { name, guildId, channelId });

    return {
      type: 4,
      data: {
        embeds: [{
          title: `🔄 Workflow ${action}`,
          description: name ? `Processing workflow: ${name}` : "Fetching workflows...",
          color: 0xFEE75C,
        }],
      },
    };
  }

  private handleUsageCommand(): { type: number; data: { embeds: DiscordEmbed[] } } {
    this.emit("command:usage");
    return {
      type: 4,
      data: {
        embeds: [{
          title: "📈 Usage Statistics",
          description: "Fetching usage data...",
          color: 0xEB459E,
          fields: [
            { name: "Tokens Today", value: "Loading...", inline: true },
            { name: "Sessions", value: "Loading...", inline: true },
            { name: "Cost", value: "Loading...", inline: true },
          ],
        }],
      },
    };
  }

  private handleHelpCommand(): { type: number; data: { embeds: DiscordEmbed[] } } {
    return {
      type: 4,
      data: {
        embeds: [{
          title: "🎭 Orchestrate Commands",
          color: 0x5865F2,
          fields: [
            { name: "/session create <prompt>", value: "Start a new Claude session", inline: false },
            { name: "/session list", value: "List active sessions", inline: false },
            { name: "/session status <id>", value: "Get session status", inline: false },
            { name: "/session stop <id>", value: "Stop a session", inline: false },
            { name: "/task create <title>", value: "Create a new task", inline: false },
            { name: "/workflow run <name>", value: "Run a workflow", inline: false },
            { name: "/usage", value: "Show usage statistics", inline: false },
          ],
        }],
      },
    };
  }

  private handleComponent(interaction: DiscordInteraction): { type: number; data: { content: string } } {
    this.emit("component:clicked", interaction);
    return { type: 4, data: { content: "Processing..." } };
  }

  // Messages
  async sendMessage(channelId: string, content: string | DiscordEmbed[]): Promise<boolean> {
    if (!this.config.enabled || this.config.status !== "online") return false;

    try {
      const body = typeof content === "string"
        ? { content }
        : { embeds: content };

      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${this.config.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();
        this.emit("message:sent", { channelId });
        return true;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      this.stats.errors++;
      this.emit("error", { error: (error as Error).message });
      return false;
    }
  }

  // Channel bindings
  addChannelBinding(binding: Omit<DiscordChannelBinding, "id">): DiscordChannelBinding {
    const id = randomUUID();
    const fullBinding = { ...binding, id };
    this.channelBindings.set(id, fullBinding);
    this.emit("binding:added", fullBinding);
    return fullBinding;
  }

  removeChannelBinding(id: string): boolean {
    const result = this.channelBindings.delete(id);
    if (result) this.emit("binding:removed", { id });
    return result;
  }

  listChannelBindings(): DiscordChannelBinding[] {
    return Array.from(this.channelBindings.values());
  }

  // Notification channels
  addNotificationChannel(channel: Omit<DiscordNotificationChannel, "id">): DiscordNotificationChannel {
    const id = randomUUID();
    const fullChannel = { ...channel, id };
    this.notificationChannels.set(id, fullChannel);
    this.emit("notification-channel:added", fullChannel);
    return fullChannel;
  }

  removeNotificationChannel(id: string): boolean {
    const result = this.notificationChannels.delete(id);
    if (result) this.emit("notification-channel:removed", { id });
    return result;
  }

  listNotificationChannels(): DiscordNotificationChannel[] {
    return Array.from(this.notificationChannels.values());
  }

  async sendNotification(eventType: string, embed: DiscordEmbed): Promise<void> {
    const channels = Array.from(this.notificationChannels.values())
      .filter((ch) => ch.eventTypes.includes(eventType));

    for (const channel of channels) {
      await this.sendMessage(channel.channelId, [embed]);
    }
  }

  // Verify Discord requests
  verifyRequest(timestamp: string, body: string, signature: string): boolean {
    const message = timestamp + body;
    const isValid = crypto.verify(
      null,
      Buffer.from(message),
      {
        key: Buffer.from(this.config.publicKey, "hex"),
        padding: crypto.constants.RSA_NO_PADDING,
      },
      Buffer.from(signature, "hex")
    );
    return isValid;
  }

  // Stats
  getStats(): BotStats {
    return {
      platform: "discord",
      enabled: this.config.enabled,
      status: this.config.status,
      ...this.stats,
    };
  }
}
