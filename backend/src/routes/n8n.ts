import { Hono } from "hono";
import { N8nManager } from "../services/N8nManager";

export function createN8nRoutes(n8nManager: N8nManager) {
  const router = new Hono();

  // Get stats
  router.get("/stats", (c) => {
    return c.json(n8nManager.getStats());
  });

  // Get config (safe version without secrets)
  router.get("/config", (c) => {
    return c.json(n8nManager.getConfig());
  });

  // Update config
  router.patch("/config", async (c) => {
    const updates = await c.req.json();
    await n8nManager.updateConfig(updates);
    return c.json(n8nManager.getConfig());
  });

  // Test connection
  router.post("/test", async (c) => {
    const success = await n8nManager.testConnection();
    return c.json({ success, status: n8nManager.getConfig().status });
  });

  // List outgoing webhooks
  router.get("/webhooks", (c) => {
    return c.json(n8nManager.listOutgoingWebhooks());
  });

  // Add outgoing webhook
  router.post("/webhooks", async (c) => {
    const data = await c.req.json();
    const webhook = n8nManager.addOutgoingWebhook(data);
    return c.json(webhook, 201);
  });

  // Toggle webhook
  router.post("/webhooks/:id/toggle", (c) => {
    const { id } = c.req.param();
    const webhook = n8nManager.toggleOutgoingWebhook(id);
    if (!webhook) {
      return c.json({ error: "Webhook not found" }, 404);
    }
    return c.json(webhook);
  });

  // Remove webhook
  router.delete("/webhooks/:id", (c) => {
    const { id } = c.req.param();
    const success = n8nManager.removeOutgoingWebhook(id);
    if (!success) {
      return c.json({ error: "Webhook not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Incoming API endpoints from n8n

  // Create session
  router.post("/api/sessions/create", async (c) => {
    const request = await c.req.json();
    const response = await n8nManager.handleCreateSession(request);
    return c.json(response);
  });

  // Send input to session
  router.post("/api/sessions/:sessionId/input", async (c) => {
    const { sessionId } = c.req.param();
    const request = await c.req.json();
    const response = await n8nManager.handleSessionInput(sessionId, request);
    return c.json(response);
  });

  // Get session status
  router.get("/api/sessions/:sessionId/status", (c) => {
    const { sessionId } = c.req.param();
    // This would integrate with SessionManager
    return c.json({
      success: true,
      data: { sessionId, status: "running" },
      requestId: crypto.randomUUID(),
    });
  });

  // Create task
  router.post("/api/tasks/create", async (c) => {
    const request = await c.req.json();
    const response = await n8nManager.handleCreateTask(request);
    return c.json(response);
  });

  // Trigger workflow
  router.post("/api/workflows/trigger", async (c) => {
    const request = await c.req.json();
    const response = await n8nManager.handleTriggerWorkflow(request);
    return c.json(response);
  });

  // Webhook receiver (for n8n to call)
  router.post("/webhook", async (c) => {
    const signature = c.req.header("X-N8N-Signature");
    const payload = await c.req.json();

    if (signature && !n8nManager.verifySignature(payload, signature)) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    // Process incoming webhook from n8n
    n8nManager.emit("webhook:received", payload);

    return c.json({ success: true, message: "Webhook received" });
  });

  return router;
}
