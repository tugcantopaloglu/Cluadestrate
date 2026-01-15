import { Hono } from "hono";
import { KnowledgeManager } from "../services/KnowledgeManager";
import type { CreateKnowledgeInput } from "../types/knowledge";

export function createKnowledgeRoutes(knowledgeManager: KnowledgeManager) {
  const app = new Hono();

  // List all knowledge items
  app.get("/", (c) => {
    const items = knowledgeManager.list();
    return c.json(items);
  });

  // Get knowledge stats
  app.get("/stats", (c) => {
    const stats = knowledgeManager.getStats();
    return c.json(stats);
  });

  // Search knowledge
  app.get("/search", (c) => {
    const query = c.req.query("q") || "";
    if (!query) {
      return c.json({ error: "Search query is required" }, 400);
    }
    const results = knowledgeManager.search(query);
    return c.json(results);
  });

  // Get knowledge for a session
  app.get("/session/:sessionId", (c) => {
    const { sessionId } = c.req.param();
    const items = knowledgeManager.getForSession(sessionId);
    return c.json(items);
  });

  // Generate CLAUDE.md for a session
  app.get("/session/:sessionId/claude-md", (c) => {
    const { sessionId } = c.req.param();
    const content = knowledgeManager.generateClaudeMd(sessionId);
    return c.text(content);
  });

  // Get a specific knowledge item
  app.get("/:id", (c) => {
    const { id } = c.req.param();
    const item = knowledgeManager.get(id);
    if (!item) {
      return c.json({ error: "Knowledge item not found" }, 404);
    }
    return c.json(item);
  });

  // Create a knowledge item
  app.post("/", async (c) => {
    try {
      const body = await c.req.json<CreateKnowledgeInput>();
      const item = knowledgeManager.create(body);
      return c.json(item, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create knowledge item" }, 400);
    }
  });

  // Import from file
  app.post("/import", async (c) => {
    try {
      const body = await c.req.json<{ filePath: string }>();
      const item = await knowledgeManager.importFromFile(body.filePath);
      return c.json(item, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to import file" }, 400);
    }
  });

  // Update a knowledge item
  app.patch("/:id", async (c) => {
    const { id } = c.req.param();
    try {
      const body = await c.req.json();
      const item = knowledgeManager.update(id, body);
      if (!item) {
        return c.json({ error: "Knowledge item not found" }, 404);
      }
      return c.json(item);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update knowledge item" }, 400);
    }
  });

  // Delete a knowledge item
  app.delete("/:id", (c) => {
    const { id } = c.req.param();
    const deleted = knowledgeManager.delete(id);
    if (!deleted) {
      return c.json({ error: "Knowledge item not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Sync with file
  app.post("/:id/sync", async (c) => {
    const { id } = c.req.param();
    try {
      const item = await knowledgeManager.syncWithFile(id);
      if (!item) {
        return c.json({ error: "Knowledge item not found or has no file path" }, 404);
      }
      return c.json(item);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to sync file" }, 400);
    }
  });

  // Add to session
  app.post("/:id/sessions/:sessionId", (c) => {
    const { id, sessionId } = c.req.param();
    const item = knowledgeManager.addToSession(id, sessionId);
    if (!item) {
      return c.json({ error: "Knowledge item not found" }, 404);
    }
    return c.json(item);
  });

  // Remove from session
  app.delete("/:id/sessions/:sessionId", (c) => {
    const { id, sessionId } = c.req.param();
    const item = knowledgeManager.removeFromSession(id, sessionId);
    if (!item) {
      return c.json({ error: "Knowledge item not found" }, 404);
    }
    return c.json(item);
  });

  return app;
}
