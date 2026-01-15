import { Hono } from "hono";
import { ChainManager } from "../services/ChainManager";
import type { CreateChainInput } from "../types/chain";

export function createChainRoutes(chainManager: ChainManager) {
  const app = new Hono();

  // List all chains
  app.get("/", (c) => {
    const chains = chainManager.list();
    return c.json(chains);
  });

  // Get chain stats
  app.get("/stats", (c) => {
    const stats = chainManager.getStats();
    return c.json(stats);
  });

  // Get a specific chain
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const chain = chainManager.get(id);
    if (!chain) {
      return c.json({ error: "Chain not found" }, 404);
    }
    return c.json(chain);
  });

  // Create a chain
  app.post("/", async (c) => {
    try {
      const body = await c.req.json<CreateChainInput>();
      const chain = chainManager.create(body);
      return c.json(chain, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create chain" }, 400);
    }
  });

  // Update a chain
  app.patch("/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json();
      const chain = chainManager.update(id, body);
      if (!chain) {
        return c.json({ error: "Chain not found" }, 404);
      }
      return c.json(chain);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update chain" }, 400);
    }
  });

  // Delete a chain
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = chainManager.delete(id);
    if (!deleted) {
      return c.json({ error: "Chain not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Run a chain
  app.post("/:id/run", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = await chainManager.run(id, body.initialInput);
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to run chain" }, 400);
    }
  });

  // Stop a chain
  app.post("/:id/stop", (c) => {
    const { id } = c.req.param();
    const stopped = chainManager.stop(id);
    if (!stopped) {
      return c.json({ error: "Chain not running or not found" }, 400);
    }
    return c.json({ success: true });
  });

  return app;
}
