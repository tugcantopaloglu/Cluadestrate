import { Hono } from "hono";
import { EmailManager } from "../services/EmailManager";

export function createEmailRoutes(emailManager: EmailManager) {
  const router = new Hono();

  // Stats
  router.get("/stats", (c) => {
    return c.json(emailManager.getStats());
  });

  // Config
  router.get("/config", (c) => {
    return c.json(emailManager.getConfig());
  });

  router.patch("/config", async (c) => {
    const updates = await c.req.json();
    await emailManager.updateConfig(updates);
    return c.json(emailManager.getConfig());
  });

  router.post("/test", async (c) => {
    const success = await emailManager.testConnection();
    return c.json({ success });
  });

  // Templates
  router.get("/templates", (c) => {
    const category = c.req.query("category");
    return c.json(emailManager.listTemplates(category as any));
  });

  router.get("/templates/:id", (c) => {
    const { id } = c.req.param();
    const template = emailManager.getTemplate(id);
    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json(template);
  });

  router.post("/templates", async (c) => {
    const data = await c.req.json();
    const template = emailManager.createTemplate(data);
    return c.json(template, 201);
  });

  router.patch("/templates/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const template = emailManager.updateTemplate(id, updates);
    if (!template) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json(template);
  });

  router.delete("/templates/:id", (c) => {
    const { id } = c.req.param();
    const success = emailManager.deleteTemplate(id);
    if (!success) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Recipients
  router.get("/recipients", (c) => {
    return c.json(emailManager.listRecipients());
  });

  router.get("/recipients/:id", (c) => {
    const { id } = c.req.param();
    const recipient = emailManager.getRecipient(id);
    if (!recipient) {
      return c.json({ error: "Recipient not found" }, 404);
    }
    return c.json(recipient);
  });

  router.post("/recipients", async (c) => {
    const data = await c.req.json();
    const recipient = emailManager.addRecipient(data);
    return c.json(recipient, 201);
  });

  router.patch("/recipients/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const recipient = emailManager.updateRecipient(id, updates);
    if (!recipient) {
      return c.json({ error: "Recipient not found" }, 404);
    }
    return c.json(recipient);
  });

  router.delete("/recipients/:id", (c) => {
    const { id } = c.req.param();
    const success = emailManager.removeRecipient(id);
    if (!success) {
      return c.json({ error: "Recipient not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Send Email
  router.post("/send", async (c) => {
    const data = await c.req.json();
    try {
      const message = await emailManager.sendEmail(data);
      return c.json(message);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  router.post("/send/template/:templateId", async (c) => {
    const { templateId } = c.req.param();
    const { to, variables } = await c.req.json();
    try {
      const message = await emailManager.sendFromTemplate(templateId, to, variables);
      return c.json(message);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Messages
  router.get("/messages", (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    return c.json(emailManager.listMessages(limit));
  });

  router.get("/messages/:id", (c) => {
    const { id } = c.req.param();
    const message = emailManager.getMessage(id);
    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }
    return c.json(message);
  });

  return router;
}
