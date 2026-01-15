import { Hono } from "hono";
import { AlertManager } from "../services/AlertManager";
import type { CreateAlertRuleInput } from "../types/alert";

export function createAlertRoutes(alertManager: AlertManager) {
  const app = new Hono();

  // Get alert stats
  app.get("/stats", (c) => {
    const stats = alertManager.getStats();
    return c.json(stats);
  });

  // List alerts
  app.get("/", (c) => {
    const includeAcknowledged = c.req.query("includeAcknowledged") !== "false";
    const alerts = alertManager.listAlerts(includeAcknowledged);
    return c.json(alerts);
  });

  // Get active (unacknowledged) alerts
  app.get("/active", (c) => {
    const alerts = alertManager.listAlerts(false);
    return c.json(alerts);
  });

  // Get a specific alert
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const alert = alertManager.getAlert(id);
    if (!alert) {
      return c.json({ error: "Alert not found" }, 404);
    }
    return c.json(alert);
  });

  // Acknowledge an alert
  app.post("/:id/acknowledge", (c) => {
    const { id } = c.req.param();
    const alert = alertManager.acknowledgeAlert(id);
    if (!alert) {
      return c.json({ error: "Alert not found" }, 404);
    }
    return c.json(alert);
  });

  // Acknowledge all alerts
  app.post("/acknowledge-all", (c) => {
    const count = alertManager.acknowledgeAll();
    return c.json({ acknowledged: count });
  });

  // Delete an alert
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = alertManager.deleteAlert(id);
    if (!deleted) {
      return c.json({ error: "Alert not found" }, 404);
    }
    return c.json({ success: true });
  });

  // --- Rules ---

  // List rules
  app.get("/rules", (c) => {
    const rules = alertManager.listRules();
    return c.json(rules);
  });

  // Get a specific rule
  app.get("/rules/:id", (c) => {
    const { id } = c.req.param();
    const rule = alertManager.getRule(id);
    if (!rule) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json(rule);
  });

  // Create a rule
  app.post("/rules", async (c) => {
    try {
      const body = await c.req.json<CreateAlertRuleInput>();
      const rule = alertManager.createRule(body);
      return c.json(rule, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create rule" }, 400);
    }
  });

  // Update a rule
  app.patch("/rules/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json();
      const rule = alertManager.updateRule(id, body);
      if (!rule) {
        return c.json({ error: "Rule not found" }, 404);
      }
      return c.json(rule);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update rule" }, 400);
    }
  });

  // Toggle a rule
  app.post("/rules/:id/toggle", (c) => {
    const { id } = c.req.param();
    const rule = alertManager.toggleRule(id);
    if (!rule) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json(rule);
  });

  // Delete a rule
  app.delete("/rules/:id", (c) => {
    const { id } = c.req.param();
    const deleted = alertManager.deleteRule(id);
    if (!deleted) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Force check rules (for testing)
  app.post("/check", (c) => {
    alertManager.forceCheck();
    return c.json({ success: true });
  });

  return app;
}
