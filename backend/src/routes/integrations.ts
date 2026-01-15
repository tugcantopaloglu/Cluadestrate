import { Hono } from "hono";
import { IntegrationManager } from "../services/IntegrationManager";
import type { ConnectIntegrationInput } from "../types/integration";

export function createIntegrationRoutes(integrationManager: IntegrationManager) {
  const app = new Hono();

  // Get integration stats
  app.get("/stats", (c) => {
    const stats = integrationManager.getStats();
    return c.json(stats);
  });

  // List all available integrations with status
  app.get("/", (c) => {
    const integrations = integrationManager.getIntegrationsWithStatus();
    return c.json(integrations);
  });

  // List connected integrations only
  app.get("/connected", (c) => {
    const integrations = integrationManager.list();
    return c.json(integrations);
  });

  // Get integration definitions (available integrations)
  app.get("/definitions", (c) => {
    const definitions = integrationManager.getDefinitions();
    return c.json(definitions);
  });

  // Get a specific integration definition
  app.get("/definitions/:id", (c) => {
    const { id } = c.req.param();
    const definition = integrationManager.getDefinition(id);
    if (!definition) {
      return c.json({ error: "Integration definition not found" }, 404);
    }
    return c.json(definition);
  });

  // Get a specific connected integration
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const integration = integrationManager.get(id);
    if (!integration) {
      return c.json({ error: "Integration not found" }, 404);
    }
    // Don't return sensitive config values
    return c.json({
      ...integration,
      config: Object.keys(integration.config).reduce((acc, key) => {
        acc[key] = "***";
        return acc;
      }, {} as Record<string, string>),
    });
  });

  // Connect an integration
  app.post("/connect", async (c) => {
    try {
      const body = await c.req.json<ConnectIntegrationInput>();
      const integration = await integrationManager.connect(body);
      return c.json({
        ...integration,
        config: Object.keys(integration.config).reduce((acc, key) => {
          acc[key] = "***";
          return acc;
        }, {} as Record<string, string>),
      }, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to connect integration" }, 400);
    }
  });

  // Test an integration connection
  app.post("/test", async (c) => {
    try {
      const body = await c.req.json<ConnectIntegrationInput>();
      const result = await integrationManager.testConnection(body.integrationId, body.config);
      return c.json(result);
    } catch (error) {
      return c.json({ success: false, error: error instanceof Error ? error.message : "Test failed" });
    }
  });

  // Disconnect an integration
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const disconnected = integrationManager.disconnect(id);
    if (!disconnected) {
      return c.json({ error: "Integration not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Sync an integration
  app.post("/:id/sync", async (c) => {
    const { id } = c.req.param();
    try {
      const integration = await integrationManager.sync(id);
      if (!integration) {
        return c.json({ error: "Integration not found" }, 404);
      }
      return c.json({
        ...integration,
        config: Object.keys(integration.config).reduce((acc, key) => {
          acc[key] = "***";
          return acc;
        }, {} as Record<string, string>),
      });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Sync failed" }, 400);
    }
  });

  return app;
}
