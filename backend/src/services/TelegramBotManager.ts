import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import {
  TelegramBotConfig,
  TelegramChat,
  TelegramCommand,
  TelegramMessage,
  TelegramUpdate,
  TelegramKeyboard,
  BotStats,
} from "../types/bots";

export class TelegramBotManager extends EventEmitter {
  private config: TelegramBotConfig = {
    enabled: false,
    botToken: "",
    status: "offline",
    authorizedChats: [],
  };

  private stats = {
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    errors: 0,
    lastActivity: undefined as Date | undefined,
  };

  private commands: TelegramCommand[] = [
    { command: "start", description: "Initialize the bot" },
    { command: "status", description: "Show active sessions" },
    { command: "ask", description: "Start quick Claude session" },
    { command: "session", description: "Get session details" },
    { command: "stop", description: "Stop a session" },
    { command: "usage", description: "Show usage statistics" },
    { command: "help", description: "Show available commands" },
  ];

  private pollingInterval: NodeJS.Timer | null = null;
  private lastUpdateId = 0;

  constructor() {
    super();
  }

  // Configuration
  getConfig(): Omit<TelegramBotConfig, "botToken"> & { hasToken: boolean } {
    return {
      enabled: this.config.enabled,
      botUsername: this.config.botUsername,
      status: this.config.status,
      authorizedChats: this.config.authorizedChats,
      webhookUrl: this.config.webhookUrl,
      error: this.config.error,
      hasToken: !!this.config.botToken,
    };
  }

  async updateConfig(updates: {
    enabled?: boolean;
    botToken?: string;
    webhookUrl?: string;
  }): Promise<void> {
    if (updates.enabled !== undefined) this.config.enabled = updates.enabled;
    if (updates.botToken) this.config.botToken = updates.botToken;
    if (updates.webhookUrl) this.config.webhookUrl = updates.webhookUrl;

    if (this.config.enabled && this.config.botToken) {
      await this.connect();
    } else {
      this.stopPolling();
      this.config.status = "offline";
    }

    this.emit("config:updated", this.getConfig());
  }

  // Connection
  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`);
      const data = await response.json();

      if (data.ok) {
        this.config.status = "online";
        this.config.botUsername = data.result.username;
        this.config.error = undefined;

        // Set commands
        await this.setCommands();

        // Start polling or set webhook
        if (this.config.webhookUrl) {
          await this.setWebhook(this.config.webhookUrl);
        } else {
          this.startPolling();
        }

        this.emit("connected", { username: this.config.botUsername });
        return true;
      }
      throw new Error(data.description || "Failed to connect");
    } catch (error) {
      this.config.status = "error";
      this.config.error = (error as Error).message;
      this.emit("error", { error: this.config.error });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    if (this.config.webhookUrl) {
      await this.deleteWebhook();
    }
    this.config.status = "offline";
    this.emit("disconnected");
  }

  // Webhook
  private async setWebhook(url: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );
      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error("Failed to set Telegram webhook:", error);
      return false;
    }
  }

  private async deleteWebhook(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/deleteWebhook`
      );
      const data = await response.json();
      return data.ok;
    } catch (error) {
      return false;
    }
  }

  // Polling
  private startPolling(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${this.config.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=10`
        );
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            this.lastUpdateId = update.update_id;
            await this.handleUpdate(update);
          }
        }
      } catch (error) {
        this.stats.errors++;
      }
    }, 1000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Commands
  private async setCommands(): Promise<void> {
    try {
      await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/setMyCommands`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commands: this.commands }),
        }
      );
    } catch (error) {
      console.error("Failed to set Telegram commands:", error);
    }
  }

  listCommands(): TelegramCommand[] {
    return [...this.commands];
  }

  // Handle updates
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    this.stats.messagesReceived++;
    this.stats.lastActivity = new Date();

    this.emit("update:received", update);

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id.toString();

      // Check if chat is authorized
      if (!this.isAuthorized(chatId)) {
        // Auto-authorize private chats with admins
        if (message.chat.type === "private") {
          this.authorizeChat({
            chatId,
            name: message.from?.username || "Unknown",
            type: "private",
            username: message.from?.username,
            authorizedAt: new Date(),
          });
        } else {
          return;
        }
      }

      // Handle commands
      if (message.text?.startsWith("/")) {
        await this.handleCommand(chatId, message.text, message.messageId);
      }
      // Handle photos
      else if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1]; // Largest size
        this.emit("photo:received", {
          chatId,
          fileId: photo.fileId,
          messageId: message.messageId,
        });
      }
      // Handle regular messages
      else if (message.text) {
        this.emit("message:received", {
          chatId,
          text: message.text,
          messageId: message.messageId,
        });
      }
    }

    // Handle callback queries (button clicks)
    if (update.callbackQuery) {
      const query = update.callbackQuery;
      await this.handleCallbackQuery(
        query.id,
        query.data,
        query.message.chat.id.toString(),
        query.message.messageId
      );
    }
  }

  private async handleCommand(chatId: string, text: string, messageId: number): Promise<void> {
    this.stats.commandsExecuted++;

    const [command, ...args] = text.split(" ");
    const cmd = command.replace("/", "").split("@")[0]; // Remove bot username if present

    this.emit("command:executed", { command: cmd, args, chatId });

    switch (cmd) {
      case "start":
        await this.sendMessage({
          chatId,
          text: "👋 Welcome to Orchestrate!\n\nI'm your Claude Code assistant. Use /help to see available commands.",
          keyboard: {
            inline: [[
              { text: "📊 Status", callbackData: "status" },
              { text: "📈 Usage", callbackData: "usage" },
            ]],
          },
        });
        break;

      case "help":
        await this.sendMessage({
          chatId,
          text: this.formatHelpMessage(),
          parseMode: "HTML",
        });
        break;

      case "status":
        this.emit("command:status", { chatId });
        await this.sendMessage({
          chatId,
          text: "🔄 Fetching session status...",
        });
        break;

      case "ask":
        const prompt = args.join(" ");
        if (!prompt) {
          await this.sendMessage({
            chatId,
            text: "❓ Please provide a question.\nUsage: /ask <your question>",
          });
        } else {
          this.emit("command:ask", { chatId, prompt });
          await this.sendMessage({
            chatId,
            text: `🤔 Processing: "${prompt}"...`,
          });
        }
        break;

      case "session":
        const sessionId = args[0];
        if (!sessionId) {
          await this.sendMessage({
            chatId,
            text: "❓ Please provide a session ID.\nUsage: /session <id>",
          });
        } else {
          this.emit("command:session", { chatId, sessionId });
          await this.sendMessage({
            chatId,
            text: `📋 Fetching session: ${sessionId}...`,
          });
        }
        break;

      case "stop":
        const stopId = args[0];
        if (!stopId) {
          await this.sendMessage({
            chatId,
            text: "❓ Please provide a session ID.\nUsage: /stop <id>",
          });
        } else {
          this.emit("command:stop", { chatId, sessionId: stopId });
          await this.sendMessage({
            chatId,
            text: `⏹️ Stopping session: ${stopId}...`,
          });
        }
        break;

      case "usage":
        this.emit("command:usage", { chatId });
        await this.sendMessage({
          chatId,
          text: "📈 Fetching usage statistics...",
        });
        break;

      default:
        await this.sendMessage({
          chatId,
          text: "❓ Unknown command. Use /help to see available commands.",
        });
    }
  }

  private async handleCallbackQuery(
    queryId: string,
    data: string,
    chatId: string,
    messageId: number
  ): Promise<void> {
    // Answer the callback query
    await fetch(
      `https://api.telegram.org/bot${this.config.botToken}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: queryId }),
      }
    );

    this.emit("callback:received", { data, chatId, messageId });

    switch (data) {
      case "status":
        this.emit("command:status", { chatId });
        break;
      case "usage":
        this.emit("command:usage", { chatId });
        break;
    }
  }

  private formatHelpMessage(): string {
    return `<b>🎭 Orchestrate Bot Commands</b>

/start - Initialize the bot
/status - Show active sessions
/ask &lt;question&gt; - Start quick Claude session
/session &lt;id&gt; - Get session details
/stop &lt;id&gt; - Stop a session
/usage - Show usage statistics
/help - Show this help message

You can also send images for Claude to analyze!`;
  }

  // Messages
  async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.config.enabled || this.config.status !== "online") return false;

    try {
      const body: Record<string, unknown> = {
        chat_id: message.chatId,
        text: message.text,
        parse_mode: message.parseMode,
        reply_to_message_id: message.replyToMessageId,
      };

      if (message.keyboard) {
        if (message.keyboard.inline) {
          body.reply_markup = {
            inline_keyboard: message.keyboard.inline.map((row) =>
              row.map((btn) => ({
                text: btn.text,
                callback_data: btn.callbackData,
                url: btn.url,
              }))
            ),
          };
        } else if (message.keyboard.reply) {
          body.reply_markup = {
            keyboard: message.keyboard.reply.map((row) =>
              row.map((btn) => ({ text: btn.text }))
            ),
          };
        } else if (message.keyboard.removeKeyboard) {
          body.reply_markup = { remove_keyboard: true };
        }
      }

      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      if (data.ok) {
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();
        this.emit("message:sent", { chatId: message.chatId });
        return true;
      }
      throw new Error(data.description);
    } catch (error) {
      this.stats.errors++;
      this.emit("error", { error: (error as Error).message });
      return false;
    }
  }

  // Send photo
  async sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<boolean> {
    if (!this.config.enabled || this.config.status !== "online") return false;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/sendPhoto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: photoUrl,
            caption,
          }),
        }
      );

      const data = await response.json();
      return data.ok;
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  }

  // Authorization
  isAuthorized(chatId: string): boolean {
    return this.config.authorizedChats.some((c) => c.chatId === chatId);
  }

  authorizeChat(chat: TelegramChat): void {
    if (!this.isAuthorized(chat.chatId)) {
      this.config.authorizedChats.push(chat);
      this.emit("chat:authorized", chat);
    }
  }

  deauthorizeChat(chatId: string): boolean {
    const index = this.config.authorizedChats.findIndex((c) => c.chatId === chatId);
    if (index !== -1) {
      this.config.authorizedChats.splice(index, 1);
      this.emit("chat:deauthorized", { chatId });
      return true;
    }
    return false;
  }

  listAuthorizedChats(): TelegramChat[] {
    return [...this.config.authorizedChats];
  }

  // Stats
  getStats(): BotStats {
    return {
      platform: "telegram",
      enabled: this.config.enabled,
      status: this.config.status,
      ...this.stats,
    };
  }
}
