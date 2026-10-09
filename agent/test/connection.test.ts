import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { Server } from "socket.io";
import { io } from "socket.io-client";
import { AgentConnectionManager } from "../../backend/src/services/AgentConnectionManager";
import { WebSocketClient } from "../src/websocket-client";
import { AgentConfig, ResourceInfo } from "../src/types";

const waitFor = (emitter: Parameters<typeof once>[0], event: string) =>
  once(emitter, event, { signal: AbortSignal.timeout(5000) });

test("agent connects, sends structured resources, and binds replies to authenticated sockets", async (t) => {
  const previousTokens = process.env.AGENT_AUTH_TOKENS;
  const token = randomUUID();
  process.env.AGENT_AUTH_TOKENS = token;
  const server = createServer();
  const socketServer = new Server(server);
  const hosts = new Map<string, { id: string; hostName: string }>();
  const updates: string[] = [];
  const hostManager = {
    registerHost: (payload: { hostName: string }) => {
      const host = { id: randomUUID(), ...payload };
      hosts.set(host.id, host);
      return host;
    },
    updateHostHeartbeat: (hostId: string) => updates.push(hostId),
    updateHostMCPServers: (hostId: string) => updates.push(hostId),
    disconnectHost: () => {},
  };
  const manager = new AgentConnectionManager(socketServer, hostManager as never);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const url = `http://127.0.0.1:${port}`;
  const resources: ResourceInfo = {
    cpuPercent: 17, memoryPercent: 24, memoryUsed: 1, memoryTotal: 4,
    diskPercent: 30, diskUsed: 3, diskTotal: 10, uptime: 99,
    loadAverage: [1, 2, 3], networkRx: 4, networkTx: 5,
  };
  const config = {
    hostName: "isolated-test-agent",
    server: { url: url.replace("http:", "ws:"), authToken: token, reconnectInterval: 50, heartbeatInterval: 10000 },
    agent: { capabilities: ["mcp_hosting"] },
  } as AgentConfig;
  const client = new WebSocketClient(config, () => resources, () => [{ name: "fixture", status: "stopped" }]);
  const attacker = io(`${url}/agent`, { autoConnect: false, transports: ["websocket"] });
  t.after(async () => {
    client.disconnect();
    attacker.disconnect();
    manager.shutdown();
    await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    if (previousTokens === undefined) delete process.env.AGENT_AUTH_TOKENS;
    else process.env.AGENT_AUTH_TOKENS = previousTokens;
  });

  const authenticated = waitFor(client, "authenticated");
  const heartbeat = waitFor(manager, "agent:heartbeat");
  await client.connect();
  const [hostId] = await authenticated;
  const [data] = await heartbeat;
  assert.deepEqual(data, { hostId, resources });
  assert.equal(client.getHostId(), hostId);
  assert.equal(manager.isAgentConnected(hostId), true);

  const attackerConnected = waitFor(attacker, "connect");
  attacker.connect();
  await attackerConnected;
  const responseEvents: unknown[] = [];
  manager.on("command:response", (response) => responseEvents.push(response));
  const command = waitFor(client, "command");
  const pending = manager.sendCommand(hostId, "get_logs");
  assert.equal(pending.sent, true);
  const [received] = await command;
  assert.equal(received.commandId, pending.commandId);
  attacker.emit("command_response", { commandId: pending.commandId, success: true });
  attacker.emit("mcp_servers_update", { hostId, servers: [] });
  attacker.emit("heartbeat", { hostId, resources, mcpServers: [] });
  await delay(50);
  assert.equal(responseEvents.length, 0);
  assert.equal(updates.length, 2);

  const response = waitFor(manager, "command:response");
  client.sendCommandResponse(pending.commandId, true, { fixture: true });
  assert.deepEqual((await response)[0], { commandId: pending.commandId, success: true, result: { fixture: true } });
  client.sendCommandResponse(pending.commandId, true);
  await delay(50);
  assert.equal(responseEvents.length, 1);

  const rawSocket = [...socketServer.of("/agent").sockets.values()].find((socket) => socket.id !== attacker.id)!;
  const attackerAuthenticated = waitFor(attacker, "auth_response");
  attacker.emit("auth", { hostName: "attacker", platform: "linux", version: "1", capabilities: [], authToken: token });
  await attackerAuthenticated;
  const updateCount = updates.length;
  const nextCommand = waitFor(client, "command");
  const nextPending = manager.sendCommand(hostId, "get_logs");
  await nextCommand;
  attacker.emit("command_response", { commandId: nextPending.commandId, success: true });
  attacker.emit("mcp_servers_update", { hostId, servers: [] });
  attacker.emit("heartbeat", { hostId, resources, mcpServers: [] });
  await delay(50);
  assert.equal(updates.length, updateCount);
  assert.equal(responseEvents.length, 1);
  const nextResponse = waitFor(manager, "command:response");
  client.sendCommandResponse(nextPending.commandId, true);
  assert.equal((await nextResponse)[0].commandId, nextPending.commandId);
  const reconnect = waitFor(client, "authenticated");
  rawSocket.disconnect(true);
  const [newHostId] = await reconnect;
  assert.notEqual(newHostId, hostId);
  assert.equal(manager.isAgentConnected(hostId), false);
});

test("empty configuration rejects the old development token and malformed auth", async (t) => {
  const previousTokens = process.env.AGENT_AUTH_TOKENS;
  process.env.AGENT_AUTH_TOKENS = " , ";
  const server = createServer();
  const socketServer = new Server(server);
  const manager = new AgentConnectionManager(socketServer, { registerHost: () => assert.fail("Must not register") } as never);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  t.after(async () => {
    manager.shutdown();
    await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    if (previousTokens === undefined) delete process.env.AGENT_AUTH_TOKENS;
    else process.env.AGENT_AUTH_TOKENS = previousTokens;
  });
  for (const payload of [null, { hostName: "test", platform: "linux", version: "1", capabilities: [], authToken: "dev-agent-token" }, { hostName: "test", platform: "linux", version: "1", capabilities: [], authToken: "" }]) {
    const client = io(`http://127.0.0.1:${port}/agent`, { autoConnect: false, transports: ["websocket"] });
    const connected = waitFor(client, "connect");
    client.connect();
    await connected;
    const response = waitFor(client, "auth_response");
    client.emit("auth", payload);
    assert.equal((await response)[0].payload.success, false);
    client.disconnect();
  }
});
