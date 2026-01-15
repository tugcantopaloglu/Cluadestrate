import { Hono } from "hono";
import { AutomationManager } from "../services/AutomationManager";
import type { CreateAutomationInput } from "../types/automation";

export function createAutomationRoutes(automationManager: AutomationManager) {
  const app = new Hono();

  // List all automations
  app.get("/", (c) => {
    const automations = automationManager.list();
    return c.json(automations);
  });

  // Get automation stats
  app.get("/stats", (c) => {
    const stats = automationManager.getStats();
    return c.json(stats);
  });

  // Get a specific automation
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const automation = automationManager.get(id);
    if (!automation) {
      return c.json({ error: "Automation not found" }, 404);
    }
    return c.json(automation);
  });

  // Get automation logs
  app.get("/:id/logs", (c) => {
    const { id } = c.req.param();
    const limit = parseInt(c.req.query("limit") || "50");
    const logs = automationManager.getLogs(id, limit);
    return c.json(logs);
  });

  // Create an automation
  app.post("/", async (c) => {
    try {
      const body = await c.req.json<CreateAutomationInput>();
      const automation = automationManager.create(body);
      return c.json(automation, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create automation" }, 400);
    }
  });

  // Update an automation
  app.patch("/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json();
      const automation = automationManager.update(id, body);
      if (!automation) {
        return c.json({ error: "Automation not found" }, 404);
      }
      return c.json(automation);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update automation" }, 400);
    }
  });

  // Delete an automation
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = automationManager.delete(id);
    if (!deleted) {
      return c.json({ error: "Automation not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Activate an automation
  app.post("/:id/activate", async (c) => {
    const { id } = c.req.param();
    const automation = await automationManager.activate(id);
    if (!automation) {
      return c.json({ error: "Automation not found" }, 404);
    }
    return c.json(automation);
  });

  // Pause an automation
  app.post("/:id/pause", async (c) => {
    const { id } = c.req.param();
    const automation = await automationManager.pause(id);
    if (!automation) {
      return c.json({ error: "Automation not found" }, 404);
    }
    return c.json(automation);
  });

  // Run an automation manually
  app.post("/:id/run", async (c) => {
    const { id } = c.req.param();
    try {
      const log = await automationManager.run(id);
      return c.json(log);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to run automation" }, 400);
    }
  });

  // Webhook handler
  app.post("/webhook/:path", async (c) => {
    const { path } = c.req.param();
    try {
      const payload = await c.req.json().catch(() => ({}));
      const log = await automationManager.handleWebhook(path, payload);
      if (!log) {
        return c.json({ error: "No automation found for this webhook" }, 404);
      }
      return c.json(log);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Webhook handler failed" }, 400);
    }
  });

  return app;
}
