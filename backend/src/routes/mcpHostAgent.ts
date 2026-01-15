import { Hono } from "hono";
import { MCPHostAgentManager } from "../services/MCPHostAgentManager";
import { AgentConnectionManager } from "../services/AgentConnectionManager";

export function createMCPHostAgentRoutes(
  mcpHostAgentManager: MCPHostAgentManager,
  agentConnectionManager?: AgentConnectionManager
) {
  const router = new Hono();

  // Stats
  router.get("/stats", (c) => {
    return c.json(mcpHostAgentManager.getStats());
  });

  // Discovery
  router.get("/discovery/config", (c) => {
    return c.json(mcpHostAgentManager.getDiscoveryConfig());
  });

  router.patch("/discovery/config", async (c) => {
    const updates = await c.req.json();
    const config = mcpHostAgentManager.updateDiscoveryConfig(updates);
    return c.json(config);
  });

  router.post("/discovery/start", (c) => {
    mcpHostAgentManager.startDiscovery();
    return c.json({ success: true });
  });

  router.post("/discovery/stop", (c) => {
    mcpHostAgentManager.stopDiscovery();
    return c.json({ success: true });
  });

  router.get("/discovery/hosts", (c) => {
    return c.json(mcpHostAgentManager.listDiscoveredHosts());
  });

  router.post("/discovery/hosts/:id/connect", async (c) => {
    const { id } = c.req.param();
    const host = await mcpHostAgentManager.connectDiscoveredHost(id);
    if (!host) {
      return c.json({ error: "Discovered host not found" }, 404);
    }
    return c.json(host);
  });

  // Host Management
  router.get("/hosts", (c) => {
    return c.json(mcpHostAgentManager.listHosts());
  });

  router.get("/hosts/online", (c) => {
    return c.json(mcpHostAgentManager.getOnlineHosts());
  });

  router.get("/hosts/:id", (c) => {
    const { id } = c.req.param();
    const host = mcpHostAgentManager.getHost(id);
    if (!host) {
      return c.json({ error: "Host not found" }, 404);
    }
    return c.json(host);
  });

  router.post("/hosts", async (c) => {
    const data = await c.req.json();
    const host = mcpHostAgentManager.registerHost(data);
    return c.json(host, 201);
  });

  router.post("/hosts/:id/connect", async (c) => {
    const { id } = c.req.param();
    const success = await mcpHostAgentManager.connectToHost(id);
    return c.json({ success });
  });

  router.post("/hosts/:id/disconnect", (c) => {
    const { id } = c.req.param();
    const success = mcpHostAgentManager.disconnectHost(id);
    return c.json({ success });
  });

  router.delete("/hosts/:id", (c) => {
    const { id } = c.req.param();
    const success = mcpHostAgentManager.removeHost(id);
    if (!success) {
      return c.json({ error: "Host not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Heartbeat (called by agents)
  router.post("/hosts/:id/heartbeat", async (c) => {
    const { id } = c.req.param();
    const { resources } = await c.req.json();
    mcpHostAgentManager.updateHostHeartbeat(id, resources);
    return c.json({ success: true });
  });

  // Update MCP servers list (called by agents)
  router.put("/hosts/:id/mcp-servers", async (c) => {
    const { id } = c.req.param();
    const { servers } = await c.req.json();
    mcpHostAgentManager.updateHostMCPServers(id, servers);
    return c.json({ success: true });
  });

  // MCP Server Control
  router.post("/hosts/:hostId/mcp/:serverId/start", async (c) => {
    const { hostId, serverId } = c.req.param();

    // Try to send command via WebSocket first if agent is connected
    if (agentConnectionManager?.isAgentConnected(hostId)) {
      const { commandId, sent } = agentConnectionManager.sendCommand(hostId, "start_mcp", { serverName: serverId });
      if (sent) {
        return c.json({ success: true, commandId, method: "websocket" });
      }
    }

    // Fallback to direct API call
    const success = await mcpHostAgentManager.startMCPServer(hostId, serverId);
    return c.json({ success, method: "api" });
  });

  router.post("/hosts/:hostId/mcp/:serverId/stop", async (c) => {
    const { hostId, serverId } = c.req.param();

    // Try to send command via WebSocket first if agent is connected
    if (agentConnectionManager?.isAgentConnected(hostId)) {
      const { commandId, sent } = agentConnectionManager.sendCommand(hostId, "stop_mcp", { serverName: serverId });
      if (sent) {
        return c.json({ success: true, commandId, method: "websocket" });
      }
    }

    // Fallback to direct API call
    const success = await mcpHostAgentManager.stopMCPServer(hostId, serverId);
    return c.json({ success, method: "api" });
  });

  router.post("/hosts/:hostId/mcp/:serverId/restart", async (c) => {
    const { hostId, serverId } = c.req.param();

    // Try to send command via WebSocket first if agent is connected
    if (agentConnectionManager?.isAgentConnected(hostId)) {
      const { commandId, sent } = agentConnectionManager.sendCommand(hostId, "restart_mcp", { serverName: serverId });
      if (sent) {
        return c.json({ success: true, commandId, method: "websocket" });
      }
    }

    // Fallback to direct API call
    const success = await mcpHostAgentManager.restartMCPServer(hostId, serverId);
    return c.json({ success, method: "api" });
  });

  // Commands
  router.get("/commands", (c) => {
    const hostId = c.req.query("hostId");
    return c.json(mcpHostAgentManager.listCommands(hostId));
  });

  router.get("/commands/:id", (c) => {
    const { id } = c.req.param();
    const command = mcpHostAgentManager.getCommand(id);
    if (!command) {
      return c.json({ error: "Command not found" }, 404);
    }
    return c.json(command);
  });

  // Screenshot
  router.post("/hosts/:hostId/screenshot", async (c) => {
    const { hostId } = c.req.param();

    // Try to send command via WebSocket first if agent is connected
    if (agentConnectionManager?.isAgentConnected(hostId)) {
      const { commandId, sent } = agentConnectionManager.sendCommand(hostId, "screenshot", {});
      if (sent) {
        return c.json({ success: true, commandId, method: "websocket" });
      }
    }

    const result = await mcpHostAgentManager.captureScreenshot(hostId);
    if (!result) {
      return c.json({ error: "Failed to capture screenshot" }, 500);
    }
    return c.json({ filename: result, method: "api" });
  });

  // Update
  router.post("/hosts/:hostId/update", async (c) => {
    const { hostId } = c.req.param();

    // Try to send command via WebSocket first if agent is connected
    if (agentConnectionManager?.isAgentConnected(hostId)) {
      const { commandId, sent } = agentConnectionManager.sendCommand(hostId, "update", {});
      if (sent) {
        return c.json({ success: true, commandId, method: "websocket" });
      }
    }

    const success = await mcpHostAgentManager.triggerUpdate(hostId);
    return c.json({ success, method: "api" });
  });

  // Get connected agents via WebSocket
  router.get("/agents", (c) => {
    if (!agentConnectionManager) {
      return c.json([]);
    }
    return c.json(agentConnectionManager.getConnectedAgents());
  });

  // Send command to agent
  router.post("/hosts/:hostId/command", async (c) => {
    const { hostId } = c.req.param();
    const { commandType, params } = await c.req.json();

    if (!agentConnectionManager?.isAgentConnected(hostId)) {
      return c.json({ error: "Agent not connected via WebSocket" }, 400);
    }

    const { commandId, sent } = agentConnectionManager.sendCommand(hostId, commandType, params);
    return c.json({ success: sent, commandId });
  });

  // Installation Scripts
  router.post("/install-script", async (c) => {
    const config = await c.req.json();
    const script = mcpHostAgentManager.generateInstallScript(config);
    return c.text(script);
  });

  return router;
}
