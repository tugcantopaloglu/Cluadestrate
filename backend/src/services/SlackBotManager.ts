import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import {
  SlackBotConfig,
  SlackChannel,
  SlackNotificationConfig,
  SlackCommand,
  SlackMessage,
  BotStats,
} from "../types/bots";

export class SlackBotManager extends EventEmitter {
  private config: SlackBotConfig = {
    enabled: false,
    botToken: "",
    appToken: "",
    signingSecret: "",
    status: "offline",
  };

  private channels: Map<string, SlackChannel> = new Map();
  private notifications: SlackNotificationConfig[] = [];
  private stats = {
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    errors: 0,
    lastActivity: undefined as Date | undefined,
  };

  private commands: SlackCommand[] = [
    { command: "/claude", description: "Start a new Claude session", usage: "/claude <task>", handler: "createSession" },
    { command: "/claude-status", description: "Show status of all sessions", usage: "/claude-status", handler: "listSessions" },
    { command: "/claude-stop", description: "Stop a running session", usage: "/claude-stop <id>", handler: "stopSession" },
    { command: "/claude-list", description: "List recent sessions", usage: "/claude-list", handler: "listSessions" },
  ];

  constructor() {
    super();
  }

  // Configuration
  getConfig(): Omit<SlackBotConfig, "botToken" | "appToken" | "signingSecret"> & { hasToken: boolean } {
    return {
      enabled: this.config.enabled,
      status: this.config.status,
      workspaceId: this.config.workspaceId,
      workspaceName: this.config.workspaceName,
      error: this.config.error,
      hasToken: !!this.config.botToken,
    };
  }

  async updateConfig(updates: {
    enabled?: boolean;
    botToken?: string;
    appToken?: string;
    signingSecret?: string;
  }): Promise<void> {
    if (updates.enabled !== undefined) this.config.enabled = updates.enabled;
    if (updates.botToken) this.config.botToken = updates.botToken;
    if (updates.appToken) this.config.appToken = updates.appToken;
    if (updates.signingSecret) this.config.signingSecret = updates.signingSecret;

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
      // In production, would use @slack/bolt or @slack/web-api
      const response = await fetch("https://slack.com/api/auth.test", {
        headers: { Authorization: `Bearer ${this.config.botToken}` },
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        if (data.ok) {
          this.config.status = "online";
          this.config.workspaceId = data.team_id;
          this.config.workspaceName = data.team;
          this.config.error = undefined;
          await this.fetchChannels();
          this.emit("connected", { workspace: data.team });
          return true;
        }
      }
      throw new Error("Failed to authenticate with Slack");
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

  // Channels
  private async fetchChannels(): Promise<void> {
    try {
      const response = await fetch("https://slack.com/api/conversations.list", {
        headers: { Authorization: `Bearer ${this.config.botToken}` },
      });
      const data = await response.json();

      if (data.ok && data.channels) {
        this.channels.clear();
        for (const ch of data.channels) {
          this.channels.set(ch.id, {
            id: ch.id,
            name: ch.name,
            isPrivate: ch.is_private,
            memberCount: ch.num_members || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch Slack channels:", error);
    }
  }

  listChannels(): SlackChannel[] {
    return Array.from(this.channels.values());
  }

  // Messages
  async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.config.enabled || this.config.status !== "online") {
      return false;
    }

    try {
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: message.channelId,
          text: message.text,
          thread_ts: message.threadTs,
          blocks: message.blocks,
          attachments: message.attachments,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();
        this.emit("message:sent", message);
        return true;
      }
      throw new Error(data.error);
    } catch (error) {
      this.stats.errors++;
      this.emit("error", { error: (error as Error).message });
      return false;
    }
  }

  // Reply in thread
  async replyInThread(channelId: string, threadTs: string, text: string): Promise<boolean> {
    return this.sendMessage({ channelId, threadTs, text });
  }

  // Handle incoming events
  async handleEvent(event: {
    type: string;
    channel?: string;
    user?: string;
    text?: string;
    ts?: string;
    thread_ts?: string;
  }): Promise<void> {
    this.stats.messagesReceived++;
    this.stats.lastActivity = new Date();

    this.emit("event:received", event);

    // Handle mentions
    if (event.type === "app_mention" && event.text) {
      this.emit("mention", {
        channel: event.channel,
        user: event.user,
        text: event.text,
        threadTs: event.thread_ts || event.ts,
      });
    }

    // Handle messages in bound channels
    if (event.type === "message" && event.channel) {
      this.emit("message:received", {
        channel: event.channel,
        user: event.user,
        text: event.text,
        threadTs: event.thread_ts || event.ts,
      });
    }
  }

  // Handle slash commands
  async handleCommand(command: {
    command: string;
    text: string;
    userId: string;
    channelId: string;
    responseUrl: string;
  }): Promise<{ text: string; response_type?: string }> {
    this.stats.commandsExecuted++;
    this.stats.lastActivity = new Date();

    const cmd = this.commands.find((c) => c.command === command.command);
    if (!cmd) {
      return { text: `Unknown command: ${command.command}` };
    }

    this.emit("command:executed", { command: command.command, text: command.text });

    // Handle commands
    switch (cmd.handler) {
      case "createSession":
        this.emit("command:create-session", {
          prompt: command.text,
          channelId: command.channelId,
          userId: command.userId,
        });
        return { text: `Starting Claude session: "${command.text}"...`, response_type: "in_channel" };

      case "listSessions":
        this.emit("command:list-sessions", { channelId: command.channelId });
        return { text: "Fetching active sessions..." };

      case "stopSession":
        const sessionId = command.text.trim();
        this.emit("command:stop-session", { sessionId, channelId: command.channelId });
        return { text: `Stopping session: ${sessionId}...` };

      default:
        return { text: "Command not implemented" };
    }
  }

  // Verify Slack requests
  verifyRequest(timestamp: string, body: string, signature: string): boolean {
    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = "v0=" + crypto
      .createHmac("sha256", this.config.signingSecret)
      .update(sigBasestring)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
  }

  // Notifications
  addNotification(config: SlackNotificationConfig): void {
    this.notifications.push(config);
    this.emit("notification:added", config);
  }

  removeNotification(event: string, channelId: string): void {
    const index = this.notifications.findIndex(
      (n) => n.event === event && n.channelId === channelId
    );
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.emit("notification:removed", { event, channelId });
    }
  }

  listNotifications(): SlackNotificationConfig[] {
    return [...this.notifications];
  }

  async sendNotification(event: string, message: string, data?: Record<string, unknown>): Promise<void> {
    const configs = this.notifications.filter((n) => n.enabled && n.event === event);
    for (const config of configs) {
      await this.sendMessage({
        channelId: config.channelId,
        text: message,
        blocks: data ? this.createNotificationBlocks(event, message, data) : undefined,
      });
    }
  }

  private createNotificationBlocks(event: string, message: string, data: Record<string, unknown>): unknown[] {
    return [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${event}*\n${message}` },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `📅 ${new Date().toISOString()}` },
        ],
      },
    ];
  }

  // Commands
  listCommands(): SlackCommand[] {
    return [...this.commands];
  }

  // Stats
  getStats(): BotStats {
    return {
      platform: "slack",
      enabled: this.config.enabled,
      status: this.config.status,
      ...this.stats,
    };
  }
}
