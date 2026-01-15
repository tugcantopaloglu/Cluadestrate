import { Hono } from "hono";
import { AutoUpdateManager } from "../services/AutoUpdateManager";

export function createAutoUpdateRoutes(autoUpdateManager: AutoUpdateManager) {
  const router = new Hono();

  // Get stats
  router.get("/stats", (c) => {
    return c.json(autoUpdateManager.getStats());
  });

  // Get settings
  router.get("/settings", (c) => {
    return c.json(autoUpdateManager.getSettings());
  });

  // Update settings
  router.patch("/settings", async (c) => {
    const updates = await c.req.json();
    const settings = autoUpdateManager.updateSettings(updates);
    return c.json(settings);
  });

  // Check for updates
  router.post("/check", async (c) => {
    const update = await autoUpdateManager.checkForUpdates();
    if (!update) {
      return c.json({ message: "No updates available" });
    }
    return c.json(update);
  });

  // Get latest version info
  router.get("/latest", (c) => {
    const latest = autoUpdateManager.getLatestVersion();
    if (!latest) {
      return c.json({ message: "No update information available" }, 404);
    }
    return c.json(latest);
  });

  // List host versions
  router.get("/hosts", (c) => {
    return c.json(autoUpdateManager.listHostVersions());
  });

  // Get specific host version
  router.get("/hosts/:hostId", (c) => {
    const { hostId } = c.req.param();
    const host = autoUpdateManager.getHostVersion(hostId);
    if (!host) {
      return c.json({ error: "Host not found" }, 404);
    }
    return c.json(host);
  });

  // Register host
  router.post("/hosts", async (c) => {
    const data = await c.req.json();
    const host = autoUpdateManager.registerHost(data);
    return c.json(host, 201);
  });

  // Unregister host
  router.delete("/hosts/:hostId", (c) => {
    const { hostId } = c.req.param();
    const success = autoUpdateManager.unregisterHost(hostId);
    if (!success) {
      return c.json({ error: "Host not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Update specific hosts
  router.post("/update", async (c) => {
    const { hostIds } = await c.req.json();
    try {
      const operation = await autoUpdateManager.updateHosts(hostIds);
      return c.json(operation);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Update all hosts
  router.post("/update-all", async (c) => {
    try {
      const operation = await autoUpdateManager.updateAllHosts();
      return c.json(operation);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Rollback host
  router.post("/hosts/:hostId/rollback", async (c) => {
    const { hostId } = c.req.param();
    try {
      const result = await autoUpdateManager.rollbackHost(hostId);
      return c.json(result);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // List operations
  router.get("/operations", (c) => {
    return c.json(autoUpdateManager.listOperations());
  });

  // Get operation
  router.get("/operations/:id", (c) => {
    const { id } = c.req.param();
    const operation = autoUpdateManager.getOperation(id);
    if (!operation) {
      return c.json({ error: "Operation not found" }, 404);
    }
    return c.json(operation);
  });

  // Get update history
  router.get("/history", (c) => {
    return c.json(autoUpdateManager.getHistory());
  });

  return router;
}
