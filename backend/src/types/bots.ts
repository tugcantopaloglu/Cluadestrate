// Integration Bots Types

// Slack Bot
export interface SlackBotConfig {
  enabled: boolean;
  botToken: string;
  appToken: string;
  signingSecret: string;
  status: "online" | "offline" | "error";
  workspaceId?: string;
  workspaceName?: string;
  error?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
}

export interface SlackNotificationConfig {
  event: string;
  channelId: string;
  enabled: boolean;
}

export interface SlackCommand {
  command: string;
  description: string;
  usage: string;
  handler: string;
}

export interface SlackMessage {
  channelId: string;
  threadTs?: string;
  text: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

// Discord Bot
export interface DiscordBotConfig {
  enabled: boolean;
  botToken: string;
  applicationId: string;
  publicKey: string;
  status: "online" | "offline" | "error";
  connectedGuilds: DiscordGuild[];
  error?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  joinedAt: Date;
  permissions: string[];
}

export interface DiscordChannelBinding {
  id: string;
  guildId: string;
  channelId: string;
  channelName: string;
  sessionId?: string;
  sessionName?: string;
  streamOutput: boolean;
  acceptInput: boolean;
}

export interface DiscordNotificationChannel {
  id: string;
  guildId: string;
  channelId: string;
  channelName: string;
  eventTypes: string[];
}

export interface DiscordSlashCommand {
  name: string;
  description: string;
  options: DiscordCommandOption[];
}

export interface DiscordCommandOption {
  name: string;
  description: string;
  type: number; // Discord option types
  required: boolean;
  choices?: { name: string; value: string }[];
}

export interface DiscordInteraction {
  id: string;
  type: number;
  guildId: string;
  channelId: string;
  userId: string;
  commandName?: string;
  options?: Record<string, unknown>;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; iconUrl?: string };
  timestamp?: string;
  thumbnail?: { url: string };
}

// Telegram Bot
export interface TelegramBotConfig {
  enabled: boolean;
  botToken: string;
  botUsername?: string;
  status: "online" | "offline" | "error";
  authorizedChats: TelegramChat[];
  webhookUrl?: string;
  error?: string;
}

export interface TelegramChat {
  chatId: string;
  name: string;
  type: "private" | "group" | "supergroup" | "channel";
  username?: string;
  memberCount?: number;
  authorizedAt: Date;
}

export interface TelegramCommand {
  command: string;
  description: string;
}

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyToMessageId?: number;
  keyboard?: TelegramKeyboard;
}

export interface TelegramKeyboard {
  inline?: TelegramInlineButton[][];
  reply?: TelegramReplyButton[][];
  removeKeyboard?: boolean;
}

export interface TelegramInlineButton {
  text: string;
  callbackData?: string;
  url?: string;
}

export interface TelegramReplyButton {
  text: string;
}

export interface TelegramUpdate {
  updateId: number;
  message?: {
    messageId: number;
    chat: { id: number; type: string };
    from: { id: number; username?: string };
    text?: string;
    photo?: { fileId: string }[];
  };
  callbackQuery?: {
    id: string;
    data: string;
    message: { messageId: number; chat: { id: number } };
  };
}

// Bot Stats
export interface BotStats {
  platform: "slack" | "discord" | "telegram";
  enabled: boolean;
  status: string;
  messagesReceived: number;
  messagesSent: number;
  commandsExecuted: number;
  errors: number;
  lastActivity?: Date;
}
