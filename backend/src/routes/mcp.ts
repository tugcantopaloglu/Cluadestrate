import { Hono } from "hono";
import type { CreateMCPServerRequest } from "../types";

let mcpManager: any = null;

const getMCPManager = async () => {
  if (!mcpManager) {
    const module = await import("../index");
    mcpManager = module.mcpManager;
  }
  return mcpManager;
};

export const mcpRouter = new Hono();

// List all MCP servers
mcpRouter.get("/", async (c) => {
  const manager = await getMCPManager();
  const servers = await manager.getServers();
  return c.json(servers);
});

// Get single MCP server
mcpRouter.get("/:id", async (c) => {
  const manager = await getMCPManager();
  const id = c.req.param("id");
  const server = await manager.getServer(id);

  if (!server) {
    return c.json({ error: "MCP server not found" }, 404);
  }

  return c.json(server);
});

// Create MCP server
mcpRouter.post("/", async (c) => {
  const manager = await getMCPManager();
  const body = await c.req.json<CreateMCPServerRequest>();

  if (!body.name || !body.config) {
    return c.json({ error: "name and config are required" }, 400);
  }

  const server = await manager.createServer(body);
  return c.json(server, 201);
});

// Delete MCP server
mcpRouter.delete("/:id", async (c) => {
  const manager = await getMCPManager();
  const id = c.req.param("id");
  const deleted = await manager.deleteServer(id);

  if (!deleted) {
    return c.json({ error: "MCP server not found" }, 404);
  }

  return c.json({ success: true });
});

// Start MCP server
mcpRouter.post("/:id/start", async (c) => {
  const manager = await getMCPManager();
  const id = c.req.param("id");
  const started = await manager.startServer(id);

  if (!started) {
    return c.json({ error: "Could not start MCP server" }, 400);
  }

  return c.json({ success: true });
});

// Stop MCP server
mcpRouter.post("/:id/stop", async (c) => {
  const manager = await getMCPManager();
  const id = c.req.param("id");
  const stopped = await manager.stopServer(id);

  if (!stopped) {
    return c.json({ error: "Could not stop MCP server" }, 400);
  }

  return c.json({ success: true });
});

// Restart MCP server
mcpRouter.post("/:id/restart", async (c) => {
  const manager = await getMCPManager();
  const id = c.req.param("id");
  const restarted = await manager.restartServer(id);

  if (!restarted) {
    return c.json({ error: "Could not restart MCP server" }, 400);
  }

  return c.json({ success: true });
});

// Get MCP server logs
mcpRouter.get("/:id/logs", async (c) => {
  const manager = await getMCPManager();
  const id = c.req.param("id");
  const limit = parseInt(c.req.query("limit") || "100", 10);

  const logs = manager.getLogs(id, limit);
  return c.json({ logs });
});
