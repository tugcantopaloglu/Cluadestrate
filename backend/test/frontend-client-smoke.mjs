import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

test("frontend API helpers exchange real CRUD payloads with the compiled backend", async (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "cluadestrate-client-"));
  const reserve = createServer();
  await new Promise((resolve) => reserve.listen(0, "127.0.0.1", resolve));
  const port = reserve.address().port;
  await new Promise((resolve) => reserve.close(resolve));
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [fileURLToPath(new URL("../dist/index.js", import.meta.url))], {
    cwd: fixture,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), DATA_DIR: join(fixture, "data"), AGENT_AUTH_TOKENS: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  const previousUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = url;
  t.after(async () => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previousUrl;
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    rmSync(fixture, { recursive: true, force: true });
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) assert.fail(`Backend exited during startup: ${output}`);
    try { if ((await fetch(`${url}/health`)).ok) { ready = true; break; } } catch {}
    await delay(100);
  }
  assert.equal(ready, true, output);
  const source = readFileSync(new URL("../../frontend/src/lib/api.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledPath = join(fixture, "frontend-api.mjs");
  writeFileSync(compiledPath, compiled);
  const client = await import(pathToFileURL(compiledPath).href);
  const session = await client.sessionsApi.create({ name: "Client fixture", workingDirectory: fixture });
  assert.equal((await client.sessionsApi.get(session.id)).status, "idle");
  const task = await client.tasksApi.create({ title: "Task fixture", description: "Local test", priority: "medium" });
  await client.tasksApi.move(task.id, "review");
  assert.equal((await client.tasksApi.getBoard()).review[0].id, task.id);
  const knowledge = await client.knowledgeApi.create({ title: "Synthetic knowledge", description: "Local", type: "document", content: "Unique fixture text", tags: ["fixture"] });
  assert.equal((await client.knowledgeApi.search("Unique fixture"))[0].item.id, knowledge.id);
  const workflow = await client.workflowsApi.create({ name: "Canvas fixture", description: "Local", steps: [] });
  const canvas = await client.workflowBuilderApi.createCanvas(workflow.id);
  await assert.rejects(client.workflowBuilderApi.exportToSteps(canvas.id), /no reachable steps/);
  const node = await client.workflowBuilderApi.addNode(canvas.id, "session", { x: 250, y: 200 });
  assert.equal((await client.workflowBuilderApi.validate(await client.workflowBuilderApi.getCanvas(canvas.id))).valid, false);
  await assert.rejects(client.workflowBuilderApi.exportToSteps(canvas.id), /Workflow is invalid/);
  await client.workflowBuilderApi.updateNode(canvas.id, node.id, { data: { ...node.data, label: "Fixture node", config: { ...node.data.config, prompt: "Local metadata fixture" } } });
  await client.workflowBuilderApi.addEdge(canvas.id, "start-1", node.id);
  await client.workflowBuilderApi.addEdge(canvas.id, node.id, "end-1");
  const savedCanvas = await client.workflowBuilderApi.getCanvas(canvas.id);
  assert.equal(savedCanvas.nodes.find((item) => item.id === node.id).data.label, "Fixture node");
  assert.equal((await client.workflowBuilderApi.validate(savedCanvas)).valid, true);
  assert.equal((await client.workflowBuilderApi.listCanvases())[0].id, canvas.id);
  assert.equal((await client.workflowBuilderApi.getStats()).totalEdges, 2);
  assert.ok((await client.workflowBuilderApi.exportToSteps(canvas.id)).steps.length > 0);
  const supervisor = await client.supervisorsApi.create({ name: "Supervisor fixture", model: "claude-sonnet-4", strategy: "sequential", systemPrompt: "Local metadata only", workers: [] });
  const worker = await client.supervisorsApi.addWorker(supervisor.id, { name: "Worker fixture", role: "coder", model: "claude-sonnet-4", systemPrompt: "Local metadata", capabilities: [], enabled: true, priority: 0 });
  assert.equal((await client.supervisorsApi.get(supervisor.id)).workers[0].id, worker.id);
  assert.deepEqual(await client.supervisorsApi.listExecutions(supervisor.id), []);
  const folder = await client.fileSyncApi.addFolder({ hostId: "local", hostName: "Folder fixture", remotePath: "workspace" });
  assert.equal((await client.fileSyncApi.getFolder(folder.id)).remotePath, "workspace");
  assert.deepEqual(await client.fileSyncApi.getConflicts(), []);
  assert.deepEqual(await client.fileSyncApi.listOperations(), []);
  await assert.rejects(client.fileSyncApi.updateConfig({ maxVersionHistory: -1 }), /Version history limit/);
  const template = await client.emailApi.createTemplate({ name: "Template fixture", subject: "Subject", htmlContent: "", textContent: "Body", variables: [], category: "session" });
  assert.equal((await client.emailApi.getTemplate(template.id)).textContent, "Body");
  assert.equal((await client.emailApi.getConfig()).configured, false);
  assert.equal((await client.botsApi.getStats()).slack.status, "offline");
  assert.deepEqual(await client.mcpHostsApi.listCommands(), []);
  assert.equal((await client.autoUpdateApi.getStats()).lastCheck, null);
  const webhook = await client.n8nApi.addWebhook({ eventType: "session:completed", webhookUrl: "http://127.0.0.1:9/fixture" });
  await client.n8nApi.toggleWebhook(webhook.id);
  assert.equal((await client.n8nApi.listWebhooks())[0].enabled, false);
  await client.n8nApi.removeWebhook(webhook.id);
  const exported = await (await fetch(`${url}/api/usage/export?days=3`)).json();
  assert.ok(exported.period.startDate < exported.period.endDate);
  assert.equal((await fetch(`${url}/api/usage/export?format=csv&details=true`)).status, 200);
  await client.workflowBuilderApi.deleteCanvas(canvas.id);
  assert.deepEqual(await client.workflowBuilderApi.listCanvases(), []);
});
