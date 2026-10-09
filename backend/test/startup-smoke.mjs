import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

test("compiled backend serves HTTP and Socket.IO behind the loopback policy", async (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "cluadestrate-startup-"));
  const reserve = createServer();
  await new Promise((resolve) => reserve.listen(0, "127.0.0.1", resolve));
  const port = reserve.address().port;
  await new Promise((resolve) => reserve.close(resolve));
  writeFileSync(join(fixture, ".env"), `PORT=${port}\nHOST=127.0.0.1\nAGENT_AUTH_TOKENS=\n`);
  const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));
  const child = spawn(process.execPath, ["--env-file-if-exists=.env", entry], {
    cwd: fixture,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", DATA_DIR: join(fixture, "data"), AGENT_AUTH_TOKENS: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    rmSync(fixture, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) assert.fail(`Backend exited during startup: ${output}`);
    try {
      if ((await fetch(`${url}/health`)).ok) { ready = true; break; }
    } catch {}
    await delay(100);
  }
  assert.equal(ready, true, `Backend did not start: ${output}`);
  for (const endpoint of ["/api/sessions", "/api/mcp", "/api/rules", "/api/usage", "/api/integrations/definitions"]) {
    assert.equal((await fetch(`${url}${endpoint}`)).status, 200, endpoint);
  }
  const created = await fetch(`${url}/api/sessions`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "fixture", workingDirectory: fixture }),
  });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).status, "idle");
  assert.equal((await fetch(`${url}/health`, { headers: { origin: "https://attacker.example" } })).status, 403);
  const rejectedHost = await new Promise((resolve, reject) => {
    const probe = request(`${url}/health`, { headers: { host: "attacker.example" } }, (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode));
    });
    probe.on("error", reject);
    probe.end();
  });
  assert.equal(rejectedHost, 403);
  assert.equal((await fetch(`${url}/socket.io/?EIO=4&transport=polling`, { headers: { origin: "https://attacker.example" } })).status, 403);
  assert.equal((await fetch(`${url}/socket.io/?EIO=4&transport=polling`, { headers: { origin: "http://localhost:3000" } })).status, 200);
  const oversized = await fetch(`${url}/api/sessions`, {
    method: "POST", headers: { "content-type": "application/json" }, body: "x".repeat(25 * 1024 * 1024 + 1),
  });
  assert.equal(oversized.status, 413);
});
