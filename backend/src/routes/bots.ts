import { Hono } from "hono";
import { SlackBotManager } from "../services/SlackBotManager";
import { DiscordBotManager } from "../services/DiscordBotManager";
import { TelegramBotManager } from "../services/TelegramBotManager";

export function createBotRoutes(
  slackBot: SlackBotManager,
  discordBot: DiscordBotManager,
  telegramBot: TelegramBotManager
) {
  const router = new Hono();

  // Get all bot stats
  router.get("/stats", (c) => {
    return c.json({
      slack: slackBot.getStats(),
      discord: discordBot.getStats(),
      telegram: telegramBot.getStats(),
    });
  });

  // ========== SLACK ==========
  router.get("/slack/config", (c) => c.json(slackBot.getConfig()));

  router.patch("/slack/config", async (c) => {
    const updates = await c.req.json();
    await slackBot.updateConfig(updates);
    return c.json(slackBot.getConfig());
  });

  router.post("/slack/connect", async (c) => {
    const success = await slackBot.connect();
    return c.json({ success, status: slackBot.getConfig().status });
  });

  router.post("/slack/disconnect", async (c) => {
    await slackBot.disconnect();
    return c.json({ success: true });
  });

  router.get("/slack/channels", (c) => c.json(slackBot.listChannels()));

  router.get("/slack/commands", (c) => c.json(slackBot.listCommands()));

  router.get("/slack/notifications", (c) => c.json(slackBot.listNotifications()));

  router.post("/slack/notifications", async (c) => {
    const config = await c.req.json();
    slackBot.addNotification(config);
    return c.json({ success: true });
  });

  router.delete("/slack/notifications/:event/:channelId", (c) => {
    const { event, channelId } = c.req.param();
    slackBot.removeNotification(event, channelId);
    return c.json({ success: true });
  });

  router.post("/slack/send", async (c) => {
    const message = await c.req.json();
    const success = await slackBot.sendMessage(message);
    return c.json({ success });
  });

  // Slack event webhook
  router.post("/slack/events", async (c) => {
    const timestamp = c.req.header("X-Slack-Request-Timestamp") || "";
    const signature = c.req.header("X-Slack-Signature") || "";
    const body = await c.req.text();

    // Verify request
    if (!slackBot.verifyRequest(timestamp, body, signature)) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    const payload = JSON.parse(body);

    // URL verification challenge
    if (payload.type === "url_verification") {
      return c.json({ challenge: payload.challenge });
    }

    // Handle event
    if (payload.event) {
      await slackBot.handleEvent(payload.event);
    }

    return c.json({ success: true });
  });

  // Slack slash command
  router.post("/slack/command", async (c) => {
    const formData = await c.req.parseBody();
    const response = await slackBot.handleCommand({
      command: formData.command as string,
      text: formData.text as string,
      userId: formData.user_id as string,
      channelId: formData.channel_id as string,
      responseUrl: formData.response_url as string,
    });
    return c.json(response);
  });

  // ========== DISCORD ==========
  router.get("/discord/config", (c) => c.json(discordBot.getConfig()));

  router.patch("/discord/config", async (c) => {
    const updates = await c.req.json();
    await discordBot.updateConfig(updates);
    return c.json(discordBot.getConfig());
  });

  router.post("/discord/connect", async (c) => {
    const success = await discordBot.connect();
    return c.json({ success, status: discordBot.getConfig().status });
  });

  router.post("/discord/disconnect", async (c) => {
    await discordBot.disconnect();
    return c.json({ success: true });
  });

  router.get("/discord/guilds", (c) => c.json(discordBot.listGuilds()));

  router.get("/discord/commands", (c) => c.json(discordBot.listCommands()));

  router.get("/discord/bindings", (c) => c.json(discordBot.listChannelBindings()));

  router.post("/discord/bindings", async (c) => {
    const binding = await c.req.json();
    const result = discordBot.addChannelBinding(binding);
    return c.json(result, 201);
  });

  router.delete("/discord/bindings/:id", (c) => {
    const { id } = c.req.param();
    const success = discordBot.removeChannelBinding(id);
    return c.json({ success });
  });

  router.get("/discord/notifications", (c) => c.json(discordBot.listNotificationChannels()));

  router.post("/discord/notifications", async (c) => {
    const channel = await c.req.json();
    const result = discordBot.addNotificationChannel(channel);
    return c.json(result, 201);
  });

  router.delete("/discord/notifications/:id", (c) => {
    const { id } = c.req.param();
    const success = discordBot.removeNotificationChannel(id);
    return c.json({ success });
  });

  router.post("/discord/send/:channelId", async (c) => {
    const { channelId } = c.req.param();
    const { content } = await c.req.json();
    const success = await discordBot.sendMessage(channelId, content);
    return c.json({ success });
  });

  // Discord interaction webhook
  router.post("/discord/interactions", async (c) => {
    const interaction = await c.req.json();
    const response = await discordBot.handleInteraction(interaction);
    return c.json(response);
  });

  // ========== TELEGRAM ==========
  router.get("/telegram/config", (c) => c.json(telegramBot.getConfig()));

  router.patch("/telegram/config", async (c) => {
    const updates = await c.req.json();
    await telegramBot.updateConfig(updates);
    return c.json(telegramBot.getConfig());
  });

  router.post("/telegram/connect", async (c) => {
    const success = await telegramBot.connect();
    return c.json({ success, status: telegramBot.getConfig().status });
  });

  router.post("/telegram/disconnect", async (c) => {
    await telegramBot.disconnect();
    return c.json({ success: true });
  });

  router.get("/telegram/commands", (c) => c.json(telegramBot.listCommands()));

  router.get("/telegram/chats", (c) => c.json(telegramBot.listAuthorizedChats()));

  router.post("/telegram/chats", async (c) => {
    const chat = await c.req.json();
    telegramBot.authorizeChat(chat);
    return c.json({ success: true });
  });

  router.delete("/telegram/chats/:chatId", (c) => {
    const { chatId } = c.req.param();
    const success = telegramBot.deauthorizeChat(chatId);
    return c.json({ success });
  });

  router.post("/telegram/send", async (c) => {
    const message = await c.req.json();
    const success = await telegramBot.sendMessage(message);
    return c.json({ success });
  });

  router.post("/telegram/photo", async (c) => {
    const { chatId, photoUrl, caption } = await c.req.json();
    const success = await telegramBot.sendPhoto(chatId, photoUrl, caption);
    return c.json({ success });
  });

  // Telegram webhook
  router.post("/telegram/webhook", async (c) => {
    const update = await c.req.json();
    await telegramBot.handleUpdate(update);
    return c.json({ success: true });
  });

  return router;
}
